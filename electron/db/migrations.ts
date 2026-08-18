/**
 * 版本化 Migration 定义（仅主进程使用）。
 * 每条 migration 用事务执行；connection.ts 维护 schema_version。
 */

export interface Migration {
  version: number;
  description: string;
  sql: string;
}

const COMMON_TRIGGER = (table: string) => `
CREATE TRIGGER IF NOT EXISTS trg_${table}_updated
AFTER UPDATE ON ${table}
FOR EACH ROW
BEGIN
  UPDATE ${table} SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
`;

export const migrations: Migration[] = [
  {
    version: 1,
    description: 'init: plans / checkins / frogs / pomodoro / journal / skill / achievements / settings',
    sql: `
-- 计划
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'CheckCircle',
  goal TEXT NOT NULL DEFAULT '',
  min_action TEXT NOT NULL DEFAULT '',
  checkin_type TEXT NOT NULL DEFAULT 'boolean',
  metric_label TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);
${COMMON_TRIGGER('plans')}

-- 打卡记录（plan_id + day_key 唯一）
CREATE TABLE IF NOT EXISTS checkins (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  day_key TEXT NOT NULL,
  done INTEGER NOT NULL DEFAULT 1,
  value REAL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_checkins_plan_day ON checkins(plan_id, day_key) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_checkins_day ON checkins(day_key);
${COMMON_TRIGGER('checkins')}

-- 今日要事
CREATE TABLE IF NOT EXISTS frogs (
  id TEXT PRIMARY KEY,
  day_key TEXT NOT NULL,
  title TEXT NOT NULL,
  plan_id TEXT,
  done INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);
CREATE INDEX IF NOT EXISTS idx_frogs_day ON frogs(day_key);
${COMMON_TRIGGER('frogs')}

-- 番茄钟会话
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id TEXT PRIMARY KEY,
  plan_id TEXT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  mode TEXT NOT NULL DEFAULT 'focus',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT,
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);
${COMMON_TRIGGER('pomodoro_sessions')}

-- 复盘日记
CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  day_key TEXT NOT NULL UNIQUE,
  sentence1 TEXT,
  sentence2 TEXT,
  sentence3 TEXT,
  mood INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);
${COMMON_TRIGGER('journal_entries')}

-- 每周汇总
CREATE TABLE IF NOT EXISTS weekly_summaries (
  id TEXT PRIMARY KEY,
  week_start TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);
${COMMON_TRIGGER('weekly_summaries')}

-- AI Agent 技能树节点
CREATE TABLE IF NOT EXISTS skill_nodes (
  id TEXT PRIMARY KEY,
  level INTEGER NOT NULL,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  parent_code TEXT,
  status TEXT NOT NULL DEFAULT 'locked',
  note TEXT,
  resource_url TEXT,
  est_hours REAL,
  actual_hours REAL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_skill_level ON skill_nodes(level);
${COMMON_TRIGGER('skill_nodes')}

-- 成就勋章
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  unlocked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);
${COMMON_TRIGGER('achievements')}

-- 设置（键值存储）
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
    `
  },
  {
    version: 2,
    description: 'add require_evidence to plans, attachment fields to checkins',
    sql: `
ALTER TABLE plans ADD COLUMN require_evidence INTEGER NOT NULL DEFAULT 0;

ALTER TABLE checkins ADD COLUMN attachment_path TEXT;
ALTER TABLE checkins ADD COLUMN attachment_type TEXT;
ALTER TABLE checkins ADD COLUMN attachment_name TEXT;
    `
  },
  {
    version: 3,
    description: 'add news_items table for AI news feed',
    sql: `
CREATE TABLE IF NOT EXISTS news_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  link TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL,
  summary TEXT,
  published_at TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_news_published ON news_items(published_at DESC);
    `
  }
];
