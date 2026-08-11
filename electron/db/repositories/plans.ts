import type { Plan, PlanRepository } from '@shared/contracts';
import { uuid, db, buildUpdate } from './base';

export const planRepository: PlanRepository = {
  list() {
    return db()
      .prepare(`SELECT * FROM plans WHERE deleted_at IS NULL ORDER BY sort_order ASC`)
      .all() as Plan[];
  },

  getById(id) {
    return db()
      .prepare(`SELECT * FROM plans WHERE id = ? AND deleted_at IS NULL`)
      .get(id) as Plan | undefined;
  },

  create(input) {
    const id = uuid();
    db()
      .prepare(
        `INSERT INTO plans (id, name, icon, goal, min_action, checkin_type, metric_label, sort_order, require_evidence)
         VALUES (@id, @name, @icon, @goal, @min_action, @checkin_type, @metric_label, @sort_order, @require_evidence)`
      )
      .run({ id, ...input });
    return this.getById(id)!;
  },

  update(id, patch) {
    const { sql, values } = buildUpdate('plans', id, patch);
    db().prepare(sql).run(values);
    return this.getById(id);
  },

  softDelete(id) {
    db()
      .prepare(`UPDATE plans SET deleted_at = datetime('now') WHERE id = ?`)
      .run(id);
  }
};
