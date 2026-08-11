import { useCallback, useEffect, useState } from 'react';
import type {
  Plan,
  StreakInfo,
  HeatmapCell,
  CompletionRate,
  WpmPoint,
  SkillNode
} from '@shared/contracts';

/** 全量统计聚合 */
interface StatsData {
  plans: Plan[];
  streaks: Record<string, StreakInfo>;
  rates7d: Record<string, CompletionRate>;
  rates30d: Record<string, CompletionRate>;
  heatmap: HeatmapCell[];
  wpmSeries: WpmPoint[];
  skills: SkillNode[];
  loading: boolean;
}

export function useStats() {
  const [data, setData] = useState<StatsData>({
    plans: [],
    streaks: {},
    rates7d: {},
    rates30d: {},
    heatmap: [],
    wpmSeries: [],
    skills: [],
    loading: true
  });

  const refresh = useCallback(async () => {
    const year = new Date().getFullYear();
    const plans = await window.api.plan.list();
    const skills = await window.api.skill.list();
    const heatmap = await window.api.checkin.getHeatmap(year);

    const [streakArr, r7Arr, r30Arr] = await Promise.all([
      Promise.all(plans.map((p) => window.api.checkin.getStreak(p.id))),
      Promise.all(plans.map((p) => window.api.checkin.getCompletionRate(p.id, '7d'))),
      Promise.all(plans.map((p) => window.api.checkin.getCompletionRate(p.id, '30d')))
    ]);

    const streaks: Record<string, StreakInfo> = {};
    const rates7d: Record<string, CompletionRate> = {};
    const rates30d: Record<string, CompletionRate> = {};
    plans.forEach((p, i) => {
      streaks[p.id] = streakArr[i];
      rates7d[p.id] = r7Arr[i];
      rates30d[p.id] = r30Arr[i];
    });

    // 打字计划 WPM 折线
    const typingPlan = plans.find((p) => p.checkin_type === 'numeric');
    const wpmSeries = typingPlan
      ? await window.api.checkin.getWpmSeries(typingPlan.id, 30)
      : [];

    setData({
      plans,
      streaks,
      rates7d,
      rates30d,
      heatmap,
      wpmSeries,
      skills,
      loading: false
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return data;
}
