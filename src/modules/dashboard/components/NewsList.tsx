import { ExternalLink, Newspaper, RefreshCw } from 'lucide-react';
import type { NewsItem } from '@shared/types';
import './NewsList.less';

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.floor(hours / 24)} 天前`;
}

interface Props {
  items: NewsItem[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

/** AI 资讯列表：点击跳转原文 */
export default function NewsList({ items, loading, error, onRefresh }: Props) {
  return (
    <section className="news-list card">
      <div className="news-list-head">
        <h3 className="section-title">
          <Newspaper size={16} />
          AI 资讯
        </h3>
        <button className="refresh-btn" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={13} className={loading ? 'spinning' : ''} />
          {loading ? '抓取中…' : '刷新'}
        </button>
      </div>

      {error && <p className="news-error">{error}</p>}

      {items.length === 0 && !loading && (
        <p className="news-empty muted">暂无资讯，点击「刷新」抓取最新 AI 行业动态</p>
      )}

      <ul className="news-items">
        {items.map((n) => (
          <li key={n.id}>
            <button className="news-item" onClick={() => window.api.news.openLink(n.link)}>
              <span className="news-source">{n.source}</span>
              <div className="news-main">
                <span className="news-title">{n.title}</span>
                {n.summary && <span className="news-summary">{n.summary}</span>}
              </div>
              <span className="news-time">{relTime(n.published_at)}</span>
              <ExternalLink size={12} className="news-link-icon" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
