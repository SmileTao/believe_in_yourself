import { useCallback, useEffect, useState } from 'react';
import type { JournalEntry } from '@shared/contracts';
import { todayKey } from '@shared/utils/date';

/** 复盘日记 hook */
export function useJournal() {
  const [today, setToday] = useState<JournalEntry | undefined>();
  const [recent, setRecent] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const [t, r] = await Promise.all([
      window.api.journal.getByDay(todayKey()),
      window.api.journal.getRecent(30)
    ]);
    setToday(t);
    setRecent(r);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** 保存今日日记 */
  const save = useCallback(
    async (input: {
      sentence1: string;
      sentence2: string;
      sentence3: string;
      mood: number | null;
    }) => {
      setSaving(true);
      await window.api.journal.upsert({
        dayKey: todayKey(),
        sentence1: input.sentence1 || null,
        sentence2: input.sentence2 || null,
        sentence3: input.sentence3 || null,
        mood: input.mood
      });
      setSaving(false);
      await refresh();
    },
    [refresh]
  );

  /** 自动生成本周汇总 */
  const weeklySummary = useCallback(() => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((day + 6) % 7));
    const weekStart = monday.toISOString().slice(0, 10);

    const weekEntries = recent.filter((e) => e.day_key >= weekStart);
    const count = weekEntries.length;
    const avgMood =
      count > 0
        ? (weekEntries.reduce((s, e) => s + (e.mood ?? 0), 0) / count).toFixed(1)
        : '—';

    const highlights = weekEntries
      .map((e) => e.sentence1)
      .filter((s): s is string => Boolean(s))
      .slice(0, 5);

    return {
      weekStart,
      count,
      avgMood,
      text: `本周写了 ${count} 篇日记，平均心情 ${avgMood}。\n${highlights.map((h) => '· ' + h).join('\n')}`
    };
  }, [recent]);

  return { today, recent, loading, saving, save, weeklySummary };
}
