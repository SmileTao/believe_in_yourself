import { useCallback, useEffect, useState } from 'react';
import type { Achievement, Plan, StreakInfo, SkillNode } from '@shared/contracts';

interface AchievementsData {
  achievements: Achievement[];
  intention: string;
  plans: Plan[];
  streaks: Record<string, StreakInfo>;
  skills: SkillNode[];
  loading: boolean;
}

/** 成就 + 初心板 hook，包含自动检测解锁 */
export function useAchievements() {
  const [data, setData] = useState<AchievementsData>({
    achievements: [],
    intention: '',
    plans: [],
    streaks: {},
    skills: [],
    loading: true
  });

  const refresh = useCallback(async () => {
    const [achievements, plans, skills] = await Promise.all([
      window.api.achievement.list(),
      window.api.plan.list(),
      window.api.skill.list()
    ]);

    // 各计划 streak
    const streaks: Record<string, StreakInfo> = {};
    for (const p of plans) {
      streaks[p.id] = await window.api.checkin.getStreak(p.id);
    }

    // 初心板
    const intention = await window.api.setting.get('intention_board', '');

    setData({
      achievements,
      intention,
      plans,
      streaks,
      skills,
      loading: false
    });

    // 自动检测解锁
    await autoCheck(plans, streaks, skills);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** 保存初心板 */
  const saveIntention = useCallback(async (text: string) => {
    await window.api.setting.set('intention_board', text);
    setData((prev) => ({ ...prev, intention: text }));
  }, []);

  return { ...data, saveIntention };
}

/** 自动检测成就解锁条件 */
async function autoCheck(
  plans: Plan[],
  streaks: Record<string, StreakInfo>,
  skills: SkillNode[]
) {
  // 找到最长 streak
  const longestStreak = Math.max(0, ...plans.map((p) => streaks[p.id]?.longest_streak ?? 0));
  // 技能树完成度
  const doneSkills = skills.filter((s) => s.status === 'done').length;
  const totalSkills = skills.length;
  const skillRate = totalSkills === 0 ? 0 : doneSkills / totalSkills;

  // streak 成就
  if (longestStreak >= 7) await window.api.achievement.unlock('streak_7');
  if (longestStreak >= 30) await window.api.achievement.unlock('streak_30');
  if (longestStreak >= 100) await window.api.achievement.unlock('streak_100');
  // 技能树过半
  if (skillRate >= 0.5) await window.api.achievement.unlock('skill_half');
  // 初心：有计划就算
  if (plans.length > 0) await window.api.achievement.unlock('first_heart');
}
