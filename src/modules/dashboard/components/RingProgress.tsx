import { useMemo } from 'react';
import './RingProgress.less';

interface RingProgressProps {
  /** 已完成数 */
  done: number;
  /** 总数 */
  total: number;
  size?: number;
}

/** 环形进度（SVG 实现，暖色渐变） */
export default function RingProgress({ done, total, size = 160 }: RingProgressProps) {
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const rate = total === 0 ? 0 : done / total;

  // 用 useMemo 避免每次渲染重新算导致动画重置
  const offset = useMemo(
    () => circumference * (1 - rate),
    [circumference, rate]
  );

  const allDone = done > 0 && done === total;

  return (
    <div className="ring-progress" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B47" />
            <stop offset="100%" stopColor="#FF9A56" />
          </linearGradient>
        </defs>
        {/* 背景轨道 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#FFF1E8"
          strokeWidth={stroke}
        />
        {/* 进度弧 */}
        <circle
          className="ring-arc"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className={`ring-center ${allDone ? 'celebrate' : ''}`}>
        <span className="ring-num">
          {done}<small>/{total}</small>
        </span>
        <span className="ring-label">{allDone ? '今日圆满 ✨' : '今日打卡'}</span>
      </div>
    </div>
  );
}
