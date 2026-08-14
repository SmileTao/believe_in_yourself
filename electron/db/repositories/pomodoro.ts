import type { PomodoroRepository, PomodoroSession } from '@shared/contracts';
import { uuid, db, nowTS } from './base';

export const pomodoroRepository: PomodoroRepository = {
  start(input) {
    const id = uuid();
    const startedAt = nowTS();
    db()
      .prepare(
        `INSERT INTO pomodoro_sessions (id, plan_id, started_at, mode)
         VALUES (@id, @planId, @startedAt, @mode)`
      )
      .run({ id, planId: input.planId ?? null, startedAt, mode: input.mode });
    return db().prepare(`SELECT * FROM pomodoro_sessions WHERE id = ?`).get(id) as PomodoroSession;
  },

  finish(id, durationMinutes) {
    db()
      .prepare(`UPDATE pomodoro_sessions SET ended_at = ?, duration_minutes = ? WHERE id = ?`)
      .run(nowTS(), durationMinutes, id);
    return db()
      .prepare(`SELECT * FROM pomodoro_sessions WHERE id = ?`)
      .get(id) as PomodoroSession | undefined;
  },

  getFocusCountByDay(dayKey: string) {
    const row = db()
      .prepare(
        `SELECT COUNT(*) as cnt FROM pomodoro_sessions
         WHERE mode = 'focus' AND ended_at IS NOT NULL
           AND date(started_at) = ?`
      )
      .get(dayKey) as { cnt: number } | undefined;
    return row?.cnt ?? 0;
  }
};
