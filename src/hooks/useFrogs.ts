import { useCallback, useEffect, useState } from 'react';
import type { Frog } from '@shared/contracts';
import { todayKey } from '@shared/utils/date';

/** 当日三件要事 */
export function useFrogs() {
  const [frogs, setFrogs] = useState<Frog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const list = await window.api.frog.listByDay(todayKey());
    setFrogs(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addFrog = useCallback(
    async (title: string, planId?: string | null) => {
      await window.api.frog.create({ dayKey: todayKey(), title, planId: planId ?? null });
      await refresh();
    },
    [refresh]
  );

  const toggleFrog = useCallback(
    async (id: string, done: 0 | 1) => {
      await window.api.frog.toggle(id, done);
      setFrogs((prev) => prev.map((f) => (f.id === id ? { ...f, done } : f)));
    },
    []
  );

  const removeFrog = useCallback(
    async (id: string) => {
      await window.api.frog.remove(id);
      setFrogs((prev) => prev.filter((f) => f.id !== id));
    },
    []
  );

  return { frogs, loading, addFrog, toggleFrog, removeFrog };
}
