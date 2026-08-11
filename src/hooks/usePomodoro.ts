import { useCallback, useEffect, useRef, useState } from 'react';
import { usePrefs } from '../store';
import { APP_NAME_ZH } from '@shared/constants';

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

interface PomodoroState {
  mode: PomodoroMode;
  /** 剩余秒数 */
  remaining: number;
  /** 总秒数（当前模式） */
  total: number;
  running: boolean;
  /** 本轮已完成的专注次数 */
  focusCount: number;
  /** 关联的计划 ID */
  planId: string | null;
  /** 是否全屏专注 */
  fullScreen: boolean;
}

/** 各模式时长（秒），从 prefs 读取 */
function getDurations() {
  const { pomodoroFocus, pomodoroBreak } = usePrefs.getState();
  return {
    focus: pomodoroFocus * 60,
    shortBreak: pomodoroBreak * 60,
    longBreak: 15 * 60
  };
}

const LONG_BREAK_EVERY = 4; // 每 4 次专注后长休息

/** 格式化 mm:ss */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const MODE_LABEL: Record<PomodoroMode, string> = {
  focus: '专注中',
  shortBreak: '短休息',
  longBreak: '长休息'
};

export { MODE_LABEL };

export function usePomodoro() {
  const { pomodoroFocus, pomodoroBreak } = usePrefs();
  const [state, setState] = useState<PomodoroState>(() => {
    const d = getDurations();
    return {
      mode: 'focus',
      remaining: d.focus,
      total: d.focus,
      running: false,
      focusCount: 0,
      planId: null,
      fullScreen: false
    };
  });

  // DB 会话 ID（计时结束写入）
  const sessionId = useRef<string | null>(null);
  // 避免回调闭包过期
  const stateRef = useRef(state);
  stateRef.current = state;

  /** 切换模式并重置计时 */
  const switchMode = useCallback((mode: PomodoroMode) => {
    const d = getDurations();
    setState((prev) => ({
      ...prev,
      mode,
      remaining: d[mode],
      total: d[mode],
      running: false
    }));
  }, []);

  /** 倒计时 tick */
  useEffect(() => {
    if (!state.running) return;
    const timer = window.setInterval(() => {
      setState((prev) => {
        if (prev.remaining <= 1) {
          // 计时结束
          return { ...prev, remaining: 0, running: false };
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [state.running]);

  /** 计时结束时自动处理：写入 DB + 通知 + 切下一阶段 */
  useEffect(() => {
    if (state.remaining !== 0 || state.running) return;
    handleComplete();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.remaining, state.running]);

  const handleComplete = useCallback(async () => {
    const current = stateRef.current;
    const minutes = Math.round(current.total / 60);

    // 写入 DB
    if (current.mode === 'focus' && sessionId.current) {
      await window.api.pomodoro.finish(sessionId.current, minutes);
      sessionId.current = null;
      // 计入计划时长
      if (current.planId) {
        await window.api.checkin.check({
          planId: current.planId,
          dayKey: new Date().toISOString().slice(0, 10),
          durationMinutes: minutes
        });
      }
    }

    // 通知
    const isFocus = current.mode === 'focus';
    await window.api.notify(
      `${APP_NAME_ZH} · ${isFocus ? '专注完成' : '休息结束'}`,
      isFocus
        ? '辛苦了，起来活动一下吧 🌱'
        : '准备好了吗？继续下一段专注 💪'
    );

    // 自动切下一阶段
    if (current.mode === 'focus') {
      const newCount = current.focusCount + 1;
      const nextMode: PomodoroMode =
        newCount % LONG_BREAK_EVERY === 0 ? 'longBreak' : 'shortBreak';
      setState((prev) => ({
        ...prev,
        focusCount: newCount,
        mode: nextMode,
        remaining: getDurations()[nextMode],
        total: getDurations()[nextMode],
        running: false
      }));
    } else {
      switchMode('focus');
    }
  }, [switchMode]);

  /** 开始/恢复 */
  const start = useCallback(async () => {
    if (state.running) return;
    // 开始新的专注会话时记录到 DB
    if (state.mode === 'focus' && !sessionId.current) {
      const session = await window.api.pomodoro.start({
        planId: state.planId,
        mode: 'focus'
      });
      sessionId.current = session.id;
    }
    setState((prev) => ({ ...prev, running: true }));
  }, [state.running, state.mode, state.planId]);

  /** 暂停 */
  const pause = useCallback(() => {
    setState((prev) => ({ ...prev, running: false }));
  }, []);

  /** 重置当前模式计时 */
  const reset = useCallback(() => {
    setState((prev) => ({
      ...prev,
      remaining: prev.total,
      running: false
    }));
  }, []);

  /** 跳过当前阶段 */
  const skip = useCallback(() => {
    setState((prev) => ({ ...prev, remaining: 0, running: false }));
  }, []);

  /** 设置关联计划 */
  const setPlan = useCallback((planId: string | null) => {
    setState((prev) => ({ ...prev, planId }));
  }, []);

  /** 全屏专注切换 */
  const toggleFullScreen = useCallback(async () => {
    const next = !state.fullScreen;
    await window.api.setFullScreen(next);
    setState((prev) => ({ ...prev, fullScreen: next }));
  }, [state.fullScreen]);

  /** 退出全屏 */
  const exitFullScreen = useCallback(async () => {
    if (state.fullScreen) {
      await window.api.setFullScreen(false);
      setState((prev) => ({ ...prev, fullScreen: false }));
    }
  }, [state.fullScreen]);

  // 时长偏好变化时，若未运行则更新当前模式时长
  useEffect(() => {
    if (!state.running) {
      const d = getDurations();
      setState((prev) => ({
        ...prev,
        remaining: d[prev.mode],
        total: d[prev.mode]
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pomodoroFocus, pomodoroBreak]);

  return {
    ...state,
    start,
    pause,
    reset,
    skip,
    switchMode,
    setPlan,
    toggleFullScreen,
    exitFullScreen
  };
}
