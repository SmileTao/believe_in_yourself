import { RESET_HOUR } from '@shared/constants';

/**
 * 凌晨 4 点重置工具。
 * 一天以凌晨 4:00 为分界：00:00–03:59 仍算"昨天"。
 * day_key 统一为本地日期的 YYYY-MM-DD。
 */

/** 把日期格式化为 YYYY-MM-DD（基于本地时区） */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 根据凌晨4点重置规则，计算某时刻所属"自然日(自定义)"的 day_key */
export function getDayKey(input: Date | string | number = new Date()): string {
  const d = input instanceof Date ? new Date(input) : new Date(input);
  // 早于凌晨 4 点：归属前一天
  if (d.getHours() < RESET_HOUR) {
    d.setDate(d.getDate() - 1);
  }
  return toDateKey(d);
}

/** 获取当前 day_key */
export function todayKey(): string {
  return getDayKey(new Date());
}

/** 解析 day_key 为 Date（该日凌晨 4:00） */
export function dayKeyToDate(dayKey: string): Date {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Date(y, m - 1, d, RESET_HOUR, 0, 0, 0);
}

/** 给定 day_key，偏移 n 天，返回新的 day_key */
export function addDays(dayKey: string, n: number): string {
  const base = dayKeyToDate(dayKey);
  base.setDate(base.getDate() + n);
  return toDateKey(base);
}

/** 两个 day_key 之间的天数差（b - a） */
export function diffDays(aKey: string, bKey: string): number {
  const a = dayKeyToDate(aKey);
  const b = dayKeyToDate(bKey);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** 返回最近 n 天的 day_key 数组（含今天，从旧到新） */
export function recentDays(n: number, endKey: string = todayKey()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(addDays(endKey, -i));
  return out;
}

/** 计算某 day_key 所在周的周一 day_key（周一为一周起点） */
export function mondayOfWeek(dayKey: string): string {
  const d = dayKeyToDate(dayKey);
  const weekday = d.getDay() === 0 ? 7 : d.getDay(); // 周日归为 7
  return addDays(dayKey, -(weekday - 1));
}

/** 友好的中文日期展示：2026年8月10日 周一 */
const WEEK_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
export function formatPrettyChinese(dayKey: string = todayKey()): string {
  const d = dayKeyToDate(dayKey);
  const wk = WEEK_ZH[d.getDay()];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${wk}`;
}
