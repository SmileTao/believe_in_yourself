import { useEffect } from 'react';
import { Play, Pause, X } from 'lucide-react';
import type { PomodoroMode } from '../../../hooks/usePomodoro';
import { formatTime, MODE_LABEL } from '../../../hooks/usePomodoro';
import { APP_SLOGAN } from '@shared/constants';
import './FocusOverlay.less';

interface FocusOverlayProps {
  mode: PomodoroMode;
  remaining: number;
  total: number;
  running: boolean;
  planName: string | null;
  onStart: () => void;
  onPause: () => void;
  onExit: () => void;
}

/** 全屏专注覆盖层：极简 UI，ESC 退出 */
export default function FocusOverlay({
  mode,
  remaining,
  total,
  running,
  planName,
  onStart,
  onPause,
  onExit
}: FocusOverlayProps) {
  // ESC 退出全屏
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onExit]);

  const isBreak = mode !== 'focus';
  const progress = total === 0 ? 0 : 1 - remaining / total;

  return (
    <div className={`focus-overlay ${isBreak ? 'break' : 'focus'}`}>
      {/* 退出按钮 */}
      <button className="exit-btn" onClick={onExit} title="退出全屏 (Esc)">
        <X size={20} />
      </button>

      {/* 顶部 Slogan */}
      <p className="overlay-slogan">{APP_SLOGAN}</p>

      {/* 中央大字倒计时 */}
      <div className="overlay-center">
        <div className="overlay-time">{formatTime(remaining)}</div>
        <div className="overlay-mode">{MODE_LABEL[mode]}</div>
        {planName && <div className="overlay-plan">当前任务：{planName}</div>}
      </div>

      {/* 进度条 */}
      <div className="overlay-progress-bar">
        <div className="bar-fill" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* 控制按钮 */}
      <button className="overlay-ctrl" onClick={running ? onPause : onStart}>
        {running ? <Pause size={26} /> : <Play size={26} />}
        <span>{running ? '暂停' : '开始'}</span>
      </button>

      <p className="overlay-hint">按 Esc 退出全屏</p>
    </div>
  );
}
