// 实体类型从 types 统一再导出，使 contracts 成为单一导入入口
export type {
  BaseEntity,
  CheckinType,
  Plan,
  Checkin,
  Frog,
  PomodoroSession,
  JournalEntry,
  WeeklySummary,
  SkillNode,
  Achievement,
  Setting,
  StreakInfo,
  HeatmapCell,
  CompletionRate,
  WpmPoint
} from '@shared/types';

import type {
  Plan,
  Checkin,
  Frog,
  PomodoroSession,
  JournalEntry,
  WeeklySummary,
  SkillNode,
  Achievement,
  StreakInfo,
  HeatmapCell,
  CompletionRate,
  WpmPoint
} from '@shared/types';

/**
 * Repository 接口层：定义在 shared/contracts，
 * 由主进程(electron/db/repositories)实现，渲染层只依赖接口。
 * 渲染层禁止直接访问 better-sqlite3，须经 preload IPC。
 */

export interface PlanRepository {
  list(): Plan[];
  getById(id: string): Plan | undefined;
  create(input: Omit<Plan, keyof BaseEntityFields>): Plan;
  update(id: string, patch: Partial<Plan>): Plan | undefined;
  softDelete(id: string): void;
}

export interface CheckinRepository {
  getByPlanAndDay(planId: string, dayKey: string): Checkin | undefined;
  listByDateRange(startKey: string, endKey: string): Checkin[];
  getByPlan(planId: string): Checkin[];
  check(input: {
    planId: string;
    dayKey: string;
    done?: 0 | 1;
    value?: number | null;
    durationMinutes?: number;
    note?: string | null;
    attachmentPath?: string | null;
    attachmentType?: 'screenshot' | 'video' | null;
    attachmentName?: string | null;
  }): Checkin;
  uncheck(planId: string, dayKey: string): void;
  getStreak(planId: string): StreakInfo;
  getHeatmap(year: number): HeatmapCell[];
  getCompletionRate(planId: string, range: '7d' | '30d'): CompletionRate;
  getWpmSeries(planId: string, days: number): WpmPoint[];
}

export interface FrogRepository {
  listByDay(dayKey: string): Frog[];
  create(input: { dayKey: string; title: string; planId?: string | null }): Frog;
  toggle(id: string, done: 0 | 1): void;
  softDelete(id: string): void;
}

export interface PomodoroRepository {
  start(input: { planId?: string | null; mode: 'focus' | 'break' }): PomodoroSession;
  finish(id: string, durationMinutes: number): PomodoroSession | undefined;
  /** 查询某天已完成的专注次数（ended_at 非空且 mode='focus'） */
  getFocusCountByDay(dayKey: string): number;
}

export interface JournalRepository {
  getByDay(dayKey: string): JournalEntry | undefined;
  getRecent(limit: number): JournalEntry[];
  upsert(input: Partial<JournalEntry> & { dayKey: string }): JournalEntry;
}

export interface WeeklySummaryRepository {
  getByWeek(weekStart: string): WeeklySummary | undefined;
  upsert(input: { weekStart: string; content: string }): WeeklySummary;
}

export interface SkillRepository {
  list(): SkillNode[];
  getByCode(code: string): SkillNode | undefined;
  updateStatus(code: string, status: SkillNode['status'], note?: string): SkillNode | undefined;
  update(code: string, patch: Partial<SkillNode>): SkillNode | undefined;
}

export interface AchievementRepository {
  list(): Achievement[];
  unlock(code: string): Achievement | undefined;
}

export interface SettingRepository {
  get<T = string>(key: string, fallback?: T): T;
  set(key: string, value: string): void;
  getAll(): Record<string, string>;
}

/** 数据库/应用信息（用于渲染层连通性展示） */
export interface DbInfo {
  name: string;
  path: string;
  version: number;
  tableCount: number;
  rowCount: { table: string; count: number }[];
}

/** 主进程向渲染层暴露的统一 API（contextBridge） */
export interface ShibieApi {
  /** 数据库连通性 / 基础信息 */
  dbInfo(): Promise<DbInfo>;
  ping(): Promise<{ ok: boolean; at: string }>;
  /** 系统通知（番茄钟结束提醒） */
  notify(title: string, body: string): Promise<void>;
  /** 全屏切换（全屏专注模式） */
  setFullScreen(on: boolean): Promise<void>;
  /** 导出数据（SQLite + JSON） */
  exportData(): Promise<{ ok: boolean; path?: string }>;
  /** 导入数据（覆盖 SQLite） */
  importData(): Promise<{ ok: boolean; error?: string }>;
  /** 选择学习证据文件（截图/视频），复制到应用目录 */
  selectAttachment(opts: {
    planId: string;
    dayKey: string;
  }): Promise<{
    ok: boolean;
    canceled?: boolean;
    error?: string;
    attachmentPath?: string;
    attachmentType?: 'screenshot' | 'video';
    attachmentName?: string;
  }>;
  /** 获取附件的 att:// URL */
  getAttachmentUrl(relPath: string): Promise<string>;
  plan: {
    list: () => Promise<Plan[]>;
    create: (input: PlanInput) => Promise<Plan>;
    update: (id: string, patch: Partial<Plan>) => Promise<Plan | undefined>;
    remove: (id: string) => Promise<void>;
  };
  checkin: {
    getByPlanAndDay: (planId: string, dayKey: string) => Promise<Checkin | undefined>;
    getByPlan: (planId: string) => Promise<Checkin[]>;
    check: (input: CheckInput) => Promise<Checkin>;
    uncheck: (planId: string, dayKey: string) => Promise<void>;
    getStreak: (planId: string) => Promise<StreakInfo>;
    getHeatmap: (year: number) => Promise<HeatmapCell[]>;
    getCompletionRate: (planId: string, range: '7d' | '30d') => Promise<CompletionRate>;
    getWpmSeries: (planId: string, days: number) => Promise<WpmPoint[]>;
  };
  skill: {
    list: () => Promise<SkillNode[]>;
    updateStatus: (code: string, status: SkillNode['status'], note?: string) => Promise<SkillNode | undefined>;
    update: (code: string, patch: Partial<SkillNode>) => Promise<SkillNode | undefined>;
  };
  frog: {
    listByDay: (dayKey: string) => Promise<Frog[]>;
    create: (input: FrogInput) => Promise<Frog>;
    toggle: (id: string, done: 0 | 1) => Promise<void>;
    remove: (id: string) => Promise<void>;
  };
  pomodoro: {
    start: (input: PomodoroInput) => Promise<PomodoroSession>;
    finish: (id: string, durationMinutes: number) => Promise<PomodoroSession | undefined>;
  };
  journal: {
    getByDay: (dayKey: string) => Promise<JournalEntry | undefined>;
    getRecent: (limit: number) => Promise<JournalEntry[]>;
    upsert: (input: JournalInput) => Promise<JournalEntry>;
  };
  setting: {
    get: <T = string>(key: string, fallback?: T) => Promise<T>;
    set: (key: string, value: string) => Promise<void>;
    getAll: () => Promise<Record<string, string>>;
  };
  achievement: {
    list: () => Promise<Achievement[]>;
    unlock: (code: string) => Promise<Achievement | undefined>;
  };
}

/* ---------------- 输入类型 ---------------- */

type BaseEntityFields = {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type PlanInput = Pick<
  Plan,
  'name' | 'icon' | 'goal' | 'min_action' | 'checkin_type' | 'metric_label' | 'sort_order' | 'require_evidence'
>;

export type CheckInput = {
  planId: string;
  dayKey: string;
  done?: 0 | 1;
  value?: number | null;
  durationMinutes?: number;
  note?: string | null;
  attachmentPath?: string | null;
  attachmentType?: 'screenshot' | 'video' | null;
  attachmentName?: string | null;
};

export type FrogInput = { dayKey: string; title: string; planId?: string | null };
export type PomodoroInput = { planId?: string | null; mode: 'focus' | 'break' };
export type JournalInput = Partial<JournalEntry> & { dayKey: string };
