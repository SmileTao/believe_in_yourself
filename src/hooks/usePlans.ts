import { useCallback, useEffect, useState } from 'react';
import type { Plan } from '@shared/contracts';

/** 计划列表 */
export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const list = await window.api.plan.list();
    setPlans(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { plans, loading, refresh };
}
