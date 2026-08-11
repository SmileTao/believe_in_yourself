import { useMemo } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Maximize2 } from 'lucide-react';
import type { PomodoroMode } from '../../../hooks/usePomodoro';
import { formatTime, MODE_LABEL } from '../../../hooks/usePomodoro';
import './PomodoroTimer.less';

interface PomodoroTimerProps {
  mode: PomodoroMode;
  remaining: number;
  total: number;
  running: boolean;
  focusCount: number;
  onSwitchMode: (mode: PomodoroMode) => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
  onFullScreen: () => void;
}

const MODE_TABS: { key: PomodoroMode; label: string }[] = [
  { key: 'focus', label: '专注' },
  { key: 'shortBreak', label: '短休息' },
  { key: 'longBreak', label: '长休息' }
];

/** 番茄钟主面板：大圆环倒计时 + 模式切换 + 控制按钮 */
export default function PomodoroTimer({
  mode,
  remaining,
  total,
  running,
  focusCount,
  onSwitchMode,
  onStart,
  onPause,
  onReset,
  onSkip,
  onFullScreen
}: PomodoroTimerProps) {
  const size = 280;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = total === 0 ? 0 : 1 - remaining / total;
  const offset = useMemo(
    () => circumference * (1 - progress),
    [circumference, progress]
  );

  const isBreak = mode !== 'focus';

  return (
    <div className={`pomodoro-timer ${isBreak ? 'break-mode' : 'focus-mode'}`}>
      {/* 模式切换 */}
      <div className="mode-tabs">
        {MODE_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`mode-tab ${mode === tab.key ? 'active' : ''}`}
            onClick={() => onSwitchMode(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 圆环倒计时 */}
      <div className="ring-wrap" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <linearGradient id="pomoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              {isBreak ? (
                <>
                  <stop offset="0%" stopColor="#FACC15" />
                  <stop offset="100%" stopColor="#FDE047" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#22C55E" />
                  <stop offset="100%" stopColor="#4ADE80" />
                </>
              )}
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#ECFDF5"
            strokeWidth={stroke}
          />
          <circle
            className="pomo-arc"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#pomoGrad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <div className="time-display">
          <span className="time-text">{formatTime(remaining)}</span>
          <span className="mode-label">{MODE_LABEL[mode]}</span>
        </div>
      </div>

      {/* 完成轮次指示 */}
      <div className="rounds">
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className={`dot ${i < focusCount % 4 ? 'filled' : ''}`} />
        ))}
        <span className="rounds-text">今日已完成 {focusCount} 次专注</span>
      </div>

      {/* 控制按钮 */}
      <div className="controls">
        <button className="ctrl-btn" onClick={onReset} title="重置">
          <RotateCcw size={18} />
        </button>

        {running ? (
          <button className="ctrl-btn primary" onClick={onPause}>
            <Pause size={22} />
          </button>
        ) : (
          <button className="ctrl-btn primary" onClick={onStart}>
            <Play size={22} />
          </button>
        )}

        <button className="ctrl-btn" onClick={onSkip} title="跳过">
          <SkipForward size={18} />
        </button>
      </div>

      {/* 全屏专注入口 */}
      <button className="fullscreen-btn" onClick={onFullScreen}>
        <Maximize2 size={15} />
        全屏专注
      </button>
    </div>
  );
}
