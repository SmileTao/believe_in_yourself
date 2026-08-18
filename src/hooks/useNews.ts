import { useCallback, useEffect, useState } from 'react';
import type { NewsItem } from '@shared/types';

/** AI 资讯：拉取列表 / 头条轮播 / 手动刷新 */
export function useNews(limit = 30) {
  const [headlines, setHeadlines] = useState<NewsItem[]>([]);
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [h, l] = await Promise.all([
        window.api.news.todayHeadlines(5),
        window.api.news.list(limit)
      ]);
      setHeadlines(h);
      setItems(l);
    } catch (err) {
      console.error('[news] 加载失败', err);
      setError('资讯加载失败');
    }
  }, [limit]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await window.api.news.refresh();
      await load();
    } catch (err) {
      console.error('[news] 刷新失败', err);
      setError('刷新失败，请检查网络');
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  return { headlines, items, loading, error, refresh };
}
