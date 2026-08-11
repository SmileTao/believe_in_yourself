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
      .run({ id, plan_id: input.planId ?? null, started_at: startedAt, mode: input.mode });
    return db().prepare(`SELECT * FROM pomodoro_sessions WHERE id = ?`).get(id) as PomodoroSession;
  },

  finish(id, durationMinutes) {
    db()
      .prepare(`UPDATE pomodoro_sessions SET ended_at = ?, duration_minutes = ? WHERE id = ?`)
      .run(nowTS(), durationMinutes, id);
    return db()
      .prepare(`SELECT * FROM pomodoro_sessions WHERE id = ?`)
      .get(id) as PomodoroSession | undefined;
  }
};
