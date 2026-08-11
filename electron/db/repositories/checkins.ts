import type {
  Checkin,
  CheckinRepository,
  StreakInfo,
  HeatmapCell,
  CompletionRate,
  WpmPoint
} from '@shared/contracts';
import { todayKey, addDays, recentDays } from '@shared/utils/date';
import { uuid, db } from './base';

export const checkinRepository: CheckinRepository = {
  getByPlanAndDay(planId, dayKey) {
    return db()
      .prepare(`SELECT * FROM checkins WHERE plan_id = ? AND day_key = ? AND deleted_at IS NULL`)
      .get(planId, dayKey) as Checkin | undefined;
  },

  listByDateRange(startKey, endKey) {
    return db()
      .prepare(
        `SELECT * FROM checkins
         WHERE day_key BETWEEN ? AND ? AND deleted_at IS NULL
         ORDER BY day_key ASC`
      )
      .all(startKey, endKey) as Checkin[];
  },

  getByPlan(planId) {
    return db()
      .prepare(
        `SELECT * FROM checkins
         WHERE plan_id = ? AND deleted_at IS NULL ORDER BY day_key ASC`
      )
      .all(planId) as Checkin[];
  },

  check(input) {
    const existing = this.getByPlanAndDay(input.planId, input.dayKey);
    if (existing) {
      const done = input.done ?? 1;
      const value = input.value ?? existing.value;
      // 时长累加（番茄钟计入）
      const duration = existing.duration_minutes + (input.durationMinutes ?? 0);
      const note = input.note ?? existing.note;
      const attPath = input.attachmentPath ?? existing.attachment_path;
      const attType = input.attachmentType ?? existing.attachment_type;
      const attName = input.attachmentName ?? existing.attachment_name;
      db()
      .prepare(
          `UPDATE checkins SET done = @done, value = @value, duration_minutes = @dur, note = @note,
           attachment_path = @attPath, attachment_type = @attType, attachment_name = @attName
           WHERE id = @id`
        )
        .run({ done, value, dur: duration, note, attPath, attType, attName, id: existing.id });
      return this.getByPlanAndDay(input.planId, input.dayKey)!;
    }
    const id = uuid();
    db()
      .prepare(
        `INSERT INTO checkins (id, plan_id, day_key, done, value, duration_minutes, note,
           attachment_path, attachment_type, attachment_name)
         VALUES (@id, @planId, @dayKey, @done, @value, @dur, @note, @attPath, @attType, @attName)`
      )
      .run({
        id,
        planId: input.planId,
        dayKey: input.dayKey,
        done: input.done ?? 1,
        value: input.value ?? null,
        dur: input.durationMinutes ?? 0,
        note: input.note ?? null,
        attPath: input.attachmentPath ?? null,
        attType: input.attachmentType ?? null,
        attName: input.attachmentName ?? null
      });
    return this.getByPlanAndDay(input.planId, input.dayKey)!;
  },

  uncheck(planId, dayKey) {
    db()
      .prepare(`UPDATE checkins SET deleted_at = datetime('now') WHERE plan_id = ? AND day_key = ?`)
      .run(planId, dayKey);
  },

  getStreak(planId): StreakInfo {
    const rows = db()
      .prepare(
        `SELECT DISTINCT day_key FROM checkins
         WHERE plan_id = ? AND done = 1 AND deleted_at IS NULL ORDER BY day_key ASC`
      )
      .all(planId) as { day_key: string }[];
    const days = rows.map((r) => r.day_key);

    let longest = 0;
    let run = 0;
    let prev = '';
    for (const d of days) {
      run = prev && addDays(prev, 1) === d ? run + 1 : 1;
      longest = Math.max(longest, run);
      prev = d;
    }

    // current streak：从今天向前数连续命中；今天还没打卡则从昨天起算（断卡不归零的"今日宽限"）
    let current = 0;
    let cursor = todayKey();
    if (!days.includes(cursor)) cursor = addDays(cursor, -1);
    while (days.includes(cursor)) {
      current += 1;
      cursor = addDays(cursor, -1);
    }

    return { plan_id: planId, current_streak: current, longest_streak: longest };
  },

  getHeatmap(year): HeatmapCell[] {
    const plans = db()
      .prepare(`SELECT COUNT(*) AS c FROM plans WHERE deleted_at IS NULL`)
      .get() as { c: number };
    const total = plans.c;
    const rows = db()
      .prepare(
        `SELECT day_key, COUNT(DISTINCT plan_id) AS done_count FROM checkins
         WHERE done = 1 AND deleted_at IS NULL AND substr(day_key,1,4) = ?
         GROUP BY day_key`
      )
      .all(String(year)) as { day_key: string; done_count: number }[];
    return rows.map((r) => ({
      day_key: r.day_key,
      done_count: r.done_count,
      total_count: total
    }));
  },

  getCompletionRate(planId, range): CompletionRate {
    const n = range === '7d' ? 7 : 30;
    const days = recentDays(n);
    const placeholders = days.map(() => '?').join(',');
    const rows = db()
      .prepare(
        `SELECT day_key FROM checkins
         WHERE plan_id = ? AND done = 1 AND deleted_at IS NULL
         AND day_key IN (${placeholders})`
      )
      .all(planId, ...days) as { day_key: string }[];
    const done = rows.length;
    return {
      plan_id: planId,
      range,
      done,
      total: n,
      rate: Math.round((done / n) * 100) / 100
    };
  },

  getWpmSeries(planId, days): WpmPoint[] {
    const range = recentDays(days);
    const placeholders = range.map(() => '?').join(',');
    const rows = db()
      .prepare(
        `SELECT day_key, value FROM checkins
         WHERE plan_id = ? AND value IS NOT NULL AND deleted_at IS NULL
         AND day_key IN (${placeholders}) ORDER BY day_key ASC`
      )
      .all(planId, ...range) as { day_key: string; value: number }[];
    if (rows.length === 0) return [];
    const best = Math.max(...rows.map((r) => r.value));
    return rows.map((r) => ({
      day_key: r.day_key,
      wpm: r.value,
      best: r.value === best
    }));
  }
};
