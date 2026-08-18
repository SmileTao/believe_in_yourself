import { net } from 'electron';
import { XMLParser } from 'fast-xml-parser';
import { newsRepository } from '../db/repositories/news';
import { nowTS } from '../db/repositories/base';
import type { NewsItem } from '@shared/types';

/**
 * AI 资讯服务：抓取内置 RSS 源 → 解析 → 去重入库。
 * 单个源失败静默跳过，不影响其他源。
 */

interface RawFeedItem {
  title: string;
  link: string;
  summary: string | null;
  publishedAt: string;
  source: string;
}

/** 内置 RSS 源（多源聚合;general 源需通过 AI 关键词筛选） */
export const NEWS_FEEDS: Array<{ name: string; url: string; aiOnly?: boolean }> = [
  { name: '机器之心', url: 'https://www.jiqizhixin.com/rss', aiOnly: true },
  { name: '量子位', url: 'https://www.qbitai.com/feed', aiOnly: true },
  { name: 'AIbase', url: 'https://www.aibase.com/rss', aiOnly: true },
  { name: '36氪', url: 'https://36kr.com/feed' },
  { name: '虎嗅', url: 'https://www.huxiu.com/rss/0.xml' },
  { name: 'IT之家', url: 'https://www.ithome.com/rss' }
];

/** 标题是否包含中文（过滤混入的英文源内容） */
const containsCJK = (s: string): boolean => /[\u4e00-\u9fff]/.test(s);

/** AI 相关关键词（general 源用标题+摘要匹配筛选） */
const AI_KEYWORDS = [
  'AI', '人工智能', '大模型', '大语言模型', '生成式',
  'GPT', 'ChatGPT', 'OpenAI', 'Claude', 'Gemini', 'DeepSeek', 'Grok',
  'LLM', 'AGI', 'AIGC', 'Agent', '智能体', 'Copilot',
  '机器学习', '深度学习', '神经网络', '强化学习',
  '通义', '文心', '豆包', 'Kimi', '智谱', '混元', '盘古', '讯飞星火',
  'Sora', '文生视频', '文生图', '多模态', '具身智能', '算力', '英伟达', 'NVIDIA'
];

/** 是否为 AI 相关资讯（不区分大小写） */
const isAIRelated = (title: string, summary: string | null): boolean => {
  const text = `${title} ${summary ?? ''}`.toLowerCase();
  return AI_KEYWORDS.some((k) => text.includes(k.toLowerCase()));
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_'
});

const stripHtml = (s: unknown): string | null => {
  if (typeof s !== 'string') return null;
  const text = s
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, '')
    .trim();
  return text ? text.slice(0, 200) : null;
};

const toISO = (raw: unknown): string => {
  if (typeof raw === 'string' || typeof raw === 'number') {
    const d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return nowTS();
};

/** 从 RSS 2.0 / Atom / RDF 结构中尽力抽取条目 */
function extractItems(xml: string, source: string): RawFeedItem[] {
  let doc: Record<string, unknown>;
  try {
    doc = parser.parse(xml) as Record<string, unknown>;
  } catch {
    return [];
  }

  const entries: unknown[] =
    (doc.rss as any)?.channel?.item ??
    (doc as any).channel?.item ?? // RDF
    (doc.feed as any)?.entry ?? // Atom
    [];

  const list = Array.isArray(entries) ? entries : entries ? [entries] : [];
  const out: RawFeedItem[] = [];

  for (const e of list) {
    const item = e as Record<string, any>;
    const title = typeof item.title === 'string' ? item.title.trim() : String(item.title?.['#text'] ?? '').trim();
    const link =
      (typeof item.link === 'string' ? item.link : undefined) ??
      item.link?.find?.((l: any) => l?.['@_rel'] === 'alternate')?.['@_href'] ??
      item.link?.['@_href'] ??
      (typeof item.guid === 'string' ? item.guid : item.guid?.['#text']);
    if (!title || typeof link !== 'string' || !/^https?:\/\//.test(link)) continue;
    if (!containsCJK(title)) continue; // 仅保留中文资讯
    out.push({
      title,
      link,
      source,
      summary: stripHtml(item.summary ?? item.description ?? item.content),
      publishedAt: toISO(item.pubDate ?? item.published ?? item.updated ?? item['dc:date'])
    });
  }
  return out;
}

async function fetchOne(feed: { name: string; url: string; aiOnly?: boolean }): Promise<RawFeedItem[]> {
  try {
    const res = await net.fetch(feed.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ShibieNews/1.0' },
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) return [];
    const xml = await res.text();
    let items = extractItems(xml, feed.name);
    // 综合源需要通过 AI 关键词筛选;AI 垂直源全量保留
    if (!feed.aiOnly) {
      items = items.filter((it) => isAIRelated(it.title, it.summary));
    }
    return items;
  } catch (err) {
    console.warn(`[news] 抓取失败 ${feed.name}:`, err);
    return [];
  }
}

export interface RefreshResult {
  ok: boolean;
  inserted: number;
  total: number;
  fetchedAt: string;
}

/** 抓取全部源并入库（去重），返回插入条数 */
export async function refreshNews(): Promise<RefreshResult> {
  const results = await Promise.all(NEWS_FEEDS.map(fetchOne));
  // 每源最多保留最新 10 条,避免单一数据源刷屏,保证多源均衡
  const flat = results.flatMap((items) =>
    [...items].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 10)
  );
  // 按 link 去重（跨源重复）
  const seen = new Set<string>();
  const unique = flat.filter((it) => {
    if (seen.has(it.link)) return false;
    seen.add(it.link);
    return true;
  });

  const inserted = newsRepository.upsertMany(
    unique.map((it) => ({
      title: it.title,
      link: it.link,
      source: it.source,
      summary: it.summary,
      published_at: it.publishedAt,
      fetched_at: nowTS()
    }))
  );
  newsRepository.pruneOld();
  newsRepository.pruneNonChinese();
  newsRepository.pruneNonAI();
  return { ok: true, inserted, total: unique.length, fetchedAt: nowTS() };
}

export function listNews(limit: number): NewsItem[] {
  return newsRepository.list(limit);
}

export function todayHeadlines(limit: number): NewsItem[] {
  return newsRepository.todayHeadlines(limit);
}

export function lastFetchedAt(): string | null {
  return newsRepository.lastFetchedAt();
}

/** 启动时及每 6 小时自动拉取 */
export function scheduleNewsRefresh(): void {
  const SIX_HOURS = 6 * 3600 * 1000;
  refreshNews().catch((err) => console.warn('[news] 启动抓取失败', err));
  setInterval(() => {
    refreshNews().catch((err) => console.warn('[news] 定时抓取失败', err));
  }, SIX_HOURS);
}
