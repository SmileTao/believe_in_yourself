import { db, uuid, nowTS } from './base';
import type { NewsItem } from '@shared/types';

/**
 * AI 资讯仓储：news_items 表的读写。
 * link 唯一，重复抓取使用 INSERT OR IGNORE 去重。
 */
export class NewsRepository {
  upsertMany(items: Array<Omit<NewsItem, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>>): number {
    const stmt = db().prepare(`
      INSERT OR IGNORE INTO news_items (id, title, link, source, summary, published_at, fetched_at)
      VALUES (@id, @title, @link, @source, @summary, @published_at, @fetched_at)
    `);
    let inserted = 0;
    const tx = db().transaction((rows: typeof items) => {
      for (const row of rows) {
        const res = stmt.run({ id: uuid(), ...row });
        if (res.changes > 0) inserted += 1;
      }
    });
    tx(items);
    return inserted;
  }

  list(limit = 50): NewsItem[] {
    return db()
      .prepare(
        `SELECT * FROM news_items WHERE deleted_at IS NULL
         ORDER BY published_at DESC LIMIT ?`
      )
      .all(limit) as NewsItem[];
  }

  /** 今日（含最近 48h 兜底）头条，用于轮播 */
  todayHeadlines(limit = 5): NewsItem[] {
    const since = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
    const rows = db()
      .prepare(
        `SELECT * FROM news_items WHERE deleted_at IS NULL AND published_at >= ?
         ORDER BY published_at DESC LIMIT ?`
      )
      .all(since, limit) as NewsItem[];
    if (rows.length > 0) return rows;
    // 兜底：库里最新的几条
    return this.list(limit);
  }

  lastFetchedAt(): string | null {
    const row = db()
      .prepare(`SELECT MAX(fetched_at) AS at FROM news_items`)
      .get() as { at: string | null } | undefined;
    return row?.at ?? null;
  }

  /** 清理 30 天前的旧资讯 */
  pruneOld(): void {
    db()
      .prepare(
        `DELETE FROM news_items WHERE published_at < ?`
      )
      .run(new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString());
  }

  /** 清理标题不含中文的非中文资讯 */
  pruneNonChinese(): void {
    const rows = db().prepare(`SELECT id, title FROM news_items`).all() as Array<{
      id: string;
      title: string;
    }>;
    const del = db().prepare(`DELETE FROM news_items WHERE id = ?`);
    const tx = db().transaction((ids: string[]) => {
      for (const id of ids) del.run(id);
    });
    tx(rows.filter((r) => !/[\u4e00-\u9fff]/.test(r.title)).map((r) => r.id));
  }

  /** 清理与 AI 无关的旧资讯（关键词与 newsService 保持一致） */
  pruneNonAI(): void {
    const keywords = [
      'ai', '人工智能', '大模型', '大语言模型', '生成式', 'gpt', 'chatgpt', 'openai',
      'claude', 'gemini', 'deepseek', 'grok', 'llm', 'agi', 'aigc', 'agent', '智能体',
      'copilot', '机器学习', '深度学习', '神经网络', '强化学习', '通义', '文心', '豆包',
      'kimi', '智谱', '混元', '盘古', '讯飞星火', 'sora', '文生视频', '文生图',
      '多模态', '具身智能', '算力', '英伟达', 'nvidia'
    ];
    const rows = db()
      .prepare(`SELECT id, title, summary, source FROM news_items`)
      .all() as Array<{ id: string; title: string; summary: string | null; source: string }>;
    // AI 垂直源全量保留,仅清洗综合源
    const aiOnlySources = ['机器之心', '量子位', 'AIbase'];
    const del = db().prepare(`DELETE FROM news_items WHERE id = ?`);
    const tx = db().transaction((ids: string[]) => {
      for (const id of ids) del.run(id);
    });
    tx(
      rows
        .filter((r) => {
          if (aiOnlySources.includes(r.source)) return false;
          const text = `${r.title} ${r.summary ?? ''}`.toLowerCase();
          return !keywords.some((k) => text.includes(k));
        })
        .map((r) => r.id)
    );
  }
}

export const newsRepository = new NewsRepository();
export { nowTS };
