import type { SkillNode, SkillRepository } from '@shared/contracts';
import { db, buildUpdate } from './base';

export const skillRepository: SkillRepository = {
  list() {
    return db()
      .prepare(`SELECT * FROM skill_nodes WHERE deleted_at IS NULL ORDER BY level ASC, sort_order ASC`)
      .all() as SkillNode[];
  },

  getByCode(code) {
    return db()
      .prepare(`SELECT * FROM skill_nodes WHERE code = ? AND deleted_at IS NULL`)
      .get(code) as SkillNode | undefined;
  },

  updateStatus(code, status, note) {
    if (note !== undefined) {
      db()
        .prepare(`UPDATE skill_nodes SET status = ?, note = ? WHERE code = ?`)
        .run(status, note, code);
    } else {
      db()
        .prepare(`UPDATE skill_nodes SET status = ? WHERE code = ?`)
        .run(status, code);
    }
    return this.getByCode(code);
  },

  update(code, patch) {
    const { sql, values } = buildUpdate('skill_nodes', 'code-placeholder', patch);
    // buildUpdate 以 id 为主键，这里改用 code
    const keys = Object.keys(patch).filter((k) => k !== 'id');
    const setClause = keys.map((k) => `${k} = @${k}`).join(', ');
    const sqlByCode = `UPDATE skill_nodes SET ${setClause} WHERE code = @code`;
    const values2: Record<string, unknown> = { ...patch, code };
    void sql;
    void values;
    db().prepare(sqlByCode).run(values2);
    return this.getByCode(code);
  }
};
