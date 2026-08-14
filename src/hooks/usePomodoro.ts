import { create } from 'zustand';
import { usePrefs } from '../store';
import { APP_NAME_ZH } from '@shared/constants';

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

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

// ─── 模块级可变状态（组件卸载后依然存活） ───

/** 截止时间戳（ms），时间戳驱动计时不受后台节流影响 */
let endAt: number | null = null;
/** DB 会话 ID */
let sessionId: string | null = null;
/** setInterval ID */
let timerId: ReturnType<typeof setInterval> | null = null;
/** 防止 handleComplete 重入 */
let completing = false;

function clearTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

// ─── Zustand Store ───

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

  switchMode: (mode: PomodoroMode) => void;
  start: () => Promise<void>;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  setPlan: (planId: string | null) => void;
  toggleFullScreen: () => Promise<void>;
  exitFullScreen: () => Promise<void>;
}

function initDurations() {
  const d = getDurations();
  return { remaining: d.focus, total: d.focus };
}

/** 计时结束时处理：写入 DB + 通知 + 切下一阶段 */
async function handleComplete() {
  if (completing) return;
  completing = true;

  const s = usePomodoroStore.getState();
  const minutes = Math.round(s.total / 60);

  // 写入 DB
  if (s.mode === 'focus' && sessionId) {
    await window.api.pomodoro.finish(sessionId, minutes);
    sessionId = null;
    if (s.planId) {
      await window.api.checkin.check({
        planId: s.planId,
        dayKey: new Date().toISOString().slice(0, 10),
        durationMinutes: minutes
      });
    }
  }

  // 通知
  const isFocus = s.mode === 'focus';
  await window.api.notify(
    `${APP_NAME_ZH} · ${isFocus ? '专注完成' : '休息结束'}`,
    isFocus
      ? '辛苦了，起来活动一下吧 🌱'
      : '准备好了吗？继续下一段专注 💪'
  );

  // 切下一阶段
  endAt = null;
  if (isFocus) {
    const newCount = s.focusCount + 1;
    const nextMode: PomodoroMode =
      newCount % LONG_BREAK_EVERY === 0 ? 'longBreak' : 'shortBreak';
    const d = getDurations();
    usePomodoroStore.setState({
      focusCount: newCount,
      mode: nextMode,
      remaining: d[nextMode],
      total: d[nextMode],
      running: false
    });
  } else {
    const d = getDurations();
    usePomodoroStore.setState({
      mode: 'focus',
      remaining: d.focus,
      total: d.focus,
      running: false
    });
  }

  completing = false;
}

/** tick — 基于时间戳计算，不受 setInterval 节流影响 */
function tick() {
  if (endAt === null) return;
  const remainingSec = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
  const s = usePomodoroStore.getState();

  if (remainingSec <= 0) {
    endAt = null;
    clearTimer();
    usePomodoroStore.setState({ remaining: 0, running: false });
    handleComplete();
  } else if (s.remaining !== remainingSec) {
    usePomodoroStore.setState({ remaining: remainingSec });
  }
}

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  mode: 'focus',
  ...initDurations(),
  running: false,
  focusCount: 0,
  planId: null,
  fullScreen: false,

  switchMode: (mode) => {
    endAt = null;
    clearTimer();
    const d = getDurations();
    set({ mode, remaining: d[mode], total: d[mode], running: false });
  },

  start: async () => {
    const s = get();
    if (s.running) return;
    // 开始新的专注会话时记录到 DB
    if (s.mode === 'focus' && !sessionId) {
      const session = await window.api.pomodoro.start({
        planId: s.planId,
        mode: 'focus'
      });
      sessionId = session.id;
    }
    // 设置截止时间戳并启动 tick
    endAt = Date.now() + s.remaining * 1000;
    set({ running: true });
    clearTimer();
    timerId = setInterval(tick, 500);
    tick(); // 立即执行一次
  },

  pause: () => {
    if (endAt !== null) {
      const remainingSec = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      endAt = null;
      set({ remaining: remainingSec, running: false });
    } else {
      set({ running: false });
    }
    clearTimer();
  },

  reset: () => {
    endAt = null;
    clearTimer();
    set((prev) => ({ remaining: prev.total, running: false }));
  },

  skip: () => {
    endAt = null;
    clearTimer();
    set({ remaining: 0, running: false });
    handleComplete();
  },

  setPlan: (planId) => set({ planId }),

  toggleFullScreen: async () => {
    const next = !get().fullScreen;
    await window.api.setFullScreen(next);
    set({ fullScreen: next });
  },

  exitFullScreen: async () => {
    if (get().fullScreen) {
      await window.api.setFullScreen(false);
      set({ fullScreen: false });
    }
  }
}));

// ─── 全局副作用（只注册一次，不随组件生命周期销毁） ───

/** 窗口重新可见时立即校准 */
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const s = usePomodoroStore.getState();
    if (s.running && endAt !== null) {
      const remainingSec = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      if (remainingSec <= 0) {
        endAt = null;
        clearTimer();
        usePomodoroStore.setState({ remaining: 0, running: false });
        handleComplete();
      } else {
        usePomodoroStore.setState({ remaining: remainingSec });
      }
    }
  });
}

/** 时长偏好变化时，若未运行则更新当前模式时长 */
usePrefs.subscribe((state, prevState) => {
  if (
    state.pomodoroFocus === prevState.pomodoroFocus &&
    state.pomodoroBreak === prevState.pomodoroBreak
  )
    return;
  const s = usePomodoroStore.getState();
  if (!s.running) {
    const d = getDurations();
    usePomodoroStore.setState({
      remaining: d[s.mode],
      total: d[s.mode]
    });
  }
});

/** 从 DB 加载今日已完成专注次数（app 启动后执行一次） */
if (typeof window !== 'undefined' && window.api?.pomodoro?.getFocusCountByDay) {
  const todayKey = new Date().toISOString().slice(0, 10);
  window.api.pomodoro.getFocusCountByDay(todayKey).then((count: number) => {
    usePomodoroStore.setState({ focusCount: count });
  });
}

/** React Hook — 供组件使用，API 保持不变 */
export function usePomodoro() {
  return usePomodoroStore();
}
