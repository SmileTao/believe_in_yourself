import Database from 'better-sqlite3';
import { app } from 'electron';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { migrations } from './migrations';
import type { Database as DB } from 'better-sqlite3';
import type { DbInfo } from '@shared/contracts';

/**
 * SQLite 连接管理（仅主进程）。
 * 渲染层经 preload IPC 访问，禁止 nodeIntegration。
 * 路径一律 path.join，禁硬编码分隔符。
 */

const DB_FILENAME = 'shibie.db';

let dbInstance: DB | null = null;

/** 获取数据库文件绝对路径 */
export function getDbPath(): string {
  return join(app.getPath('userData'), DB_FILENAME);
}

/** 打开/获取数据库单例，并自动执行 migration */
export function getDb(): DB {
  if (dbInstance) return dbInstance;

  const dbPath = getDbPath();
  // 确保 userData 目录存在（首次运行/沙箱受限场景）
  mkdirSync(app.getPath('userData'), { recursive: true });
  dbInstance = new Database(dbPath);
  dbInstance.pragma('journal_mode = WAL');
  dbInstance.pragma('foreign_keys = ON');

  runMigrations(dbInstance);
  return dbInstance;
}

/** 关闭数据库（应用退出时调用） */
export function closeDb(): void {
  try {
    dbInstance?.close();
  } catch {
    /* ignore */
  }
  dbInstance = null;
}

/** 版本化执行 migration，记录于 schema_version */
function runMigrations(db: DB): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      description TEXT,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const current = (
    db.prepare('SELECT MAX(version) AS v FROM schema_version').get() as { v: number | null }
  ).v;

  const appliedVersion = current ?? 0;

  for (const m of migrations) {
    if (m.version <= appliedVersion) continue;
    const tx = db.transaction(() => {
      db.exec(m.sql);
      db.prepare('INSERT INTO schema_version (version, description) VALUES (?, ?)').run(
        m.version,
        m.description
      );
    });
    tx();
  }
}

/** 收集 DB 基础信息（连通性展示用） */
export function collectDbInfo(): DbInfo {
  const db = getDb();
  const tables = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'trg_%' ORDER BY name`
    )
    .all() as { name: string }[];

  const rowCount = tables.map((t) => ({
    table: t.name,
    count: (
      db.prepare(`SELECT COUNT(*) AS c FROM "${t.name}"`).get() as { c: number }
    ).c
  }));

  const version = (
    db.prepare('SELECT MAX(version) AS v FROM schema_version').get() as { v: number | null }
  ).v ?? 0;

  return {
    name: 'shibie.db',
    path: getDbPath(),
    version,
    tableCount: tables.length,
    rowCount
  };
}
