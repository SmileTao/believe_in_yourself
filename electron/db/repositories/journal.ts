import type { JournalRepository, JournalEntry } from '@shared/contracts';
import { uuid, db } from './base';

export const journalRepository: JournalRepository = {
  getByDay(dayKey) {
    return db()
      .prepare(`SELECT * FROM journal_entries WHERE day_key = ? AND deleted_at IS NULL`)
      .get(dayKey) as JournalEntry | undefined;
  },

  getRecent(limit) {
    return db()
      .prepare(
        `SELECT * FROM journal_entries
         WHERE deleted_at IS NULL AND (sentence1 IS NOT NULL OR sentence2 IS NOT NULL OR sentence3 IS NOT NULL)
         ORDER BY day_key DESC LIMIT ?`
      )
      .all(limit) as JournalEntry[];
  },

  upsert(input) {
    const existing = this.getByDay(input.dayKey);
    if (existing) {
      const patch: Record<string, unknown> = {};
      for (const k of ['sentence1', 'sentence2', 'sentence3', 'mood']) {
        if (input[k as keyof typeof input] !== undefined) {
          patch[k] = input[k as keyof typeof input];
        }
      }
      const keys = Object.keys(patch);
      if (keys.length) {
        const setClause = keys.map((k) => `${k} = @${k}`).join(', ');
        db()
          .prepare(`UPDATE journal_entries SET ${setClause} WHERE id = @id`)
          .run({ ...patch, id: existing.id });
      }
      return this.getByDay(input.dayKey)!;
    }
    const id = uuid();
    db()
      .prepare(
        `INSERT INTO journal_entries (id, day_key, sentence1, sentence2, sentence3, mood)
         VALUES (@id, @dayKey, @s1, @s2, @s3, @mood)`
      )
      .run({
        id,
        day_key: input.dayKey,
        s1: input.sentence1 ?? null,
        s2: input.sentence2 ?? null,
        s3: input.sentence3 ?? null,
        mood: input.mood ?? null
      });
    return this.getByDay(input.dayKey)!;
  }
};
