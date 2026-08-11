/**
 * 独立种子脚本：npm run seed（tsx 运行）。
 * 直接以 better-sqlite3 打开与主进程相同的 userData/shibie.db，
 * 运行 migration + seedAll。可重复执行（幂等）。
 *
 * 注意：主进程首次启动也会自动 seed，本脚本主要用于开发期重置/补数据。
 */
import Database from 'better-sqlite3';
import { homedir, platform } from 'node:os';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { migrations } from './migrations';
import { seedAll } from './repositories';

function userDataDir(): string {
  const home = homedir();
  switch (platform()) {
    case 'darwin':
      return join(home, 'Library', 'Application Support', 'shibie');
    case 'win32':
      return join(process.env.APPDATA ?? join(home, 'AppData', 'Roaming'), 'shibie');
    default:
      return join(process.env.XDG_CONFIG_HOME ?? join(home, '.config'), 'shibie');
  }
}

function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      description TEXT,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  const current = (
    db.prepare('SELECT MAX(version) AS v FROM schema_version').get() as { v: number | null }
  ).v ?? 0;
  for (const m of migrations) {
    if (m.version <= current) continue;
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

function main(): void {
  const dir = userDataDir();
  mkdirSync(dir, { recursive: true });
  const dbPath = join(dir, 'shibie.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  runMigrations(db);
  const seeded = seedAll(db);
  // eslint-disable-next-line no-console
  console.log('[shibie seed] DB:', dbPath);
  // eslint-disable-next-line no-console
  console.log('[shibie seed] 新增 -> 计划:', seeded.plans, '| 技能节点:', seeded.skills, '| 成就:', seeded.achievements);
  db.close();
}

main();
