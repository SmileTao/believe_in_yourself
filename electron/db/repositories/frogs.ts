import type { Frog, FrogRepository } from '@shared/contracts';
import { uuid, db } from './base';

export const frogRepository: FrogRepository = {
  listByDay(dayKey) {
    return db()
      .prepare(
        `SELECT * FROM frogs WHERE day_key = ? AND deleted_at IS NULL ORDER BY sort_order ASC`
      )
      .all(dayKey) as Frog[];
  },

  create(input) {
    const id = uuid();
    const sortOrder = (
      db()
        .prepare(`SELECT COALESCE(MAX(sort_order), -1) + 1 AS s FROM frogs WHERE day_key = ?`)
        .get(input.dayKey) as { s: number }
    ).s;
    db()
      .prepare(
        `INSERT INTO frogs (id, day_key, title, plan_id, sort_order)
         VALUES (@id, @dayKey, @title, @planId, @sortOrder)`
      )
      .run({
        id,
        dayKey: input.dayKey,
        title: input.title,
        planId: input.planId ?? null,
        sortOrder
      });
    return db().prepare(`SELECT * FROM frogs WHERE id = ?`).get(id) as Frog;
  },

  toggle(id, done) {
    db().prepare(`UPDATE frogs SET done = ? WHERE id = ?`).run(done, id);
  },

  softDelete(id) {
    db().prepare(`UPDATE frogs SET deleted_at = datetime('now') WHERE id = ?`).run(id);
  }
};
