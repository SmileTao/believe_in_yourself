import { create } from 'zustand';
import type { DbInfo } from '@shared/contracts';

/** 全局应用状态（UI 偏好另存 localStorage） */
interface AppState {
  /** 当前激活的模块 */
  activeModule: string;
  setActiveModule: (m: string) => void;

  /** 数据库连通信息（Phase 1 验证用） */
  dbInfo: DbInfo | null;
  dbReady: boolean;
  setDbInfo: (info: DbInfo | null) => void;
  setDbReady: (ready: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeModule: 'dashboard',
  setActiveModule: (m) => set({ activeModule: m }),

  dbInfo: null,
  dbReady: false,
  setDbInfo: (info) => set({ dbInfo: info }),
  setDbReady: (ready) => set({ dbReady: ready })
}));

/** UI 偏好持久化（localStorage），后续设置项扩展 */
interface UIPrefs {
  reminderEnabled: boolean;
  pomodoroFocus: number;
  pomodoroBreak: number;
  resetHour: number;
  setPref: <K extends keyof Omit<UIPrefs, 'setPref'>>(
    key: K,
    value: UIPrefs[K]
  ) => void;
}

const PREFS_KEY = 'shibie.uiPrefs';

function loadPrefs(): Omit<UIPrefs, 'setPref'> {
  const fallback = { reminderEnabled: true, pomodoroFocus: 25, pomodoroBreak: 5, resetHour: 4 };
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function savePrefs(p: Omit<UIPrefs, 'setPref'>): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(p));
}

export const usePrefs = create<UIPrefs>((set, get) => ({
  ...loadPrefs(),
  setPref: (key, value) => {
    const next = { ...get(), [key]: value } as Omit<UIPrefs, 'setPref'>;
    savePrefs(next);
    set({ [key]: value } as Partial<UIPrefs>);
  }
}));
