import { randomUUID } from 'node:crypto';
import { getDb } from '../connection';
import type { Database as DB } from 'better-sqlite3';

/** 生成 UUID（业务表统一主键） */
export const uuid = (): string => randomUUID();

/** 当前时间戳字符串 */
export const nowTS = (): string => new Date().toISOString();

/** 取已打开的数据库单例 */
export function db(): DB {
  return getDb();
}

/**
 * 构造 UPDATE 语句：把 patch 的键拼成 col1=@col1,col2=@col2，
 * 自动追加 updated_at。返回 { sql, values }。
 */
export function buildUpdate(table: string, id: string, patch: Record<string, unknown>): {
  sql: string;
  values: Record<string, unknown>;
} {
  const keys = Object.keys(patch).filter((k) => k !== 'id');
  const setClause = keys.map((k) => `${k} = @${k}`).join(', ');
  const values: Record<string, unknown> = { ...patch, id };
  const sql = `UPDATE ${table} SET ${setClause} WHERE id = @id`;
  return { sql, values };
}
