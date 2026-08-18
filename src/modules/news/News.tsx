import { Newspaper } from 'lucide-react';
import { useNews } from '../../hooks/useNews';
import NewsCarousel from '../dashboard/components/NewsCarousel';
import NewsList from '../dashboard/components/NewsList';
import './News.less';

/** AI 资讯页:顶部头条轮播 + 完整资讯列表 */
export default function News() {
  const { headlines, items, loading, error, refresh } = useNews(60);

  return (
    <div className="news-page">
      <div className="page-head">
        <h2 className="page-title">
          <Newspaper size={20} />
          AI 资讯
        </h2>
        <p className="muted">每天获取最新 AI 行业大事,点击条目跳转原文</p>
      </div>

      <NewsCarousel headlines={headlines} />
      <NewsList items={items} loading={loading} error={error} onRefresh={refresh} />
    </div>
  );
}
