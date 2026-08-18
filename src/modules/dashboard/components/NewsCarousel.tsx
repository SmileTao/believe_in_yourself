import { useEffect, useState } from 'react';
import { Radio, ChevronLeft, ChevronRight } from 'lucide-react';
import type { NewsItem } from '@shared/types';
import './NewsCarousel.less';

const INTERVAL = 5000;

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
  headlines: NewsItem[];
}

/** 今日 AI 头条轮播：每日资讯总结性展示 */
export default function NewsCarousel({ headlines }: Props) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || headlines.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % headlines.length), INTERVAL);
    return () => clearInterval(t);
  }, [paused, headlines.length]);

  if (headlines.length === 0) {
    return (
      <div className="news-carousel glass-card empty">
        <Radio size={16} />
        <span>正在获取今日 AI 资讯…</span>
      </div>
    );
  }

  const go = (d: number) => setIdx((i) => (i + d + headlines.length) % headlines.length);
  const item = headlines[idx];

  return (
    <div
      className="news-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="carousel-glow" aria-hidden />
      <div className="carousel-head">
        <span className="carousel-badge">
          <Radio size={13} />
          今日 AI 大事
        </span>
        <span className="carousel-count">
          {idx + 1} / {headlines.length}
        </span>
      </div>

      <button className="carousel-body" onClick={() => window.api.news.openLink(item.link)}>
        <h2 className="carousel-title">{item.title}</h2>
        {item.summary && <p className="carousel-summary">{item.summary}</p>}
        <span className="carousel-meta">
          {item.source} · {relTime(item.published_at)} · 点击阅读原文
        </span>
      </button>

      <div className="carousel-controls">
        <button className="ctrl-btn" onClick={() => go(-1)} aria-label="上一条">
          <ChevronLeft size={14} />
        </button>
        <div className="carousel-dots">
          {headlines.map((h, i) => (
            <button
              key={h.id}
              className={`dot ${i === idx ? 'active' : ''}`}
              onClick={() => setIdx(i)}
              aria-label={`第 ${i + 1} 条`}
            />
          ))}
        </div>
        <button className="ctrl-btn" onClick={() => go(1)} aria-label="下一条">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
