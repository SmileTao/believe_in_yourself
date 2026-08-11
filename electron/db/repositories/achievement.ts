import type { AchievementRepository, Achievement } from '@shared/contracts';
import { db } from './base';

export const achievementRepository: AchievementRepository = {
  list() {
    return db()
      .prepare(`SELECT * FROM achievements WHERE deleted_at IS NULL ORDER BY created_at ASC`)
      .all() as Achievement[];
  },

  unlock(code) {
    db()
      .prepare(`UPDATE achievements SET unlocked_at = datetime('now') WHERE code = ?`)
      .run(code);
    return db()
      .prepare(`SELECT * FROM achievements WHERE code = ?`)
      .get(code) as Achievement | undefined;
  }
};
