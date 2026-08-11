import { useCallback, useEffect, useState } from 'react';
import type { SkillNode } from '@shared/contracts';

/** 技能树数据 hook */
export function useSkills() {
  const [nodes, setNodes] = useState<SkillNode[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const list = await window.api.skill.list();
    setNodes(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateStatus = useCallback(
    async (code: string, status: SkillNode['status'], note?: string) => {
      await window.api.skill.updateStatus(code, status, note);
      setNodes((prev) =>
        prev.map((n) => (n.code === code ? { ...n, status, note: note ?? n.note } : n))
      );
    },
    []
  );

  return { nodes, loading, updateStatus };
}
