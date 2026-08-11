import type { SettingRepository } from '@shared/contracts';
import { db } from './base';

export const settingRepository: SettingRepository = {
  get<T = string>(key: string, fallback?: T): T {
    const row = db().prepare(`SELECT value FROM settings WHERE key = ?`).get(key) as
      | { value: string }
      | undefined;
    if (row === undefined) return fallback as T;
    const raw = row.value;
    // 尝试解析数字/布尔/JSON，失败则原样返回
    if (raw === 'true') return true as unknown as T;
    if (raw === 'false') return false as unknown as T;
    if (raw !== '' && !Number.isNaN(Number(raw))) return Number(raw) as unknown as T;
    return raw as unknown as T;
  },

  set(key, value) {
    db()
      .prepare(
        `INSERT INTO settings (key, value, updated_at) VALUES (@key, @value, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = @value, updated_at = datetime('now')`
      )
      .run({ key, value });
  },

  getAll() {
    const rows = db().prepare(`SELECT key, value FROM settings`).all() as {
      key: string;
      value: string;
    }[];
    const out: Record<string, string> = {};
    for (const r of rows) out[r.key] = r.value;
    return out;
  }
};
