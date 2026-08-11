import { useCallback, useEffect, useState } from 'react';
import type { Plan, Checkin, StreakInfo } from '@shared/contracts';
import { todayKey } from '@shared/utils/date';

interface CheckinState {
  /** planId -> 今日打卡记录 */
  records: Record<string, Checkin | undefined>;
  /** planId -> streak 信息 */
  streaks: Record<string, StreakInfo>;
}

/** 今日打卡状态与操作 */
export function useTodayCheckins(plans: Plan[]) {
  const [state, setState] = useState<CheckinState>({ records: {}, streaks: {} });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (plans.length === 0) return;
    const day = todayKey();
    const [recordsArr, streaksArr] = await Promise.all([
      Promise.all(plans.map((p) => window.api.checkin.getByPlanAndDay(p.id, day))),
      Promise.all(plans.map((p) => window.api.checkin.getStreak(p.id)))
    ]);
    const records: Record<string, Checkin | undefined> = {};
    const streaks: Record<string, StreakInfo> = {};
    plans.forEach((p, i) => {
      records[p.id] = recordsArr[i];
      streaks[p.id] = streaksArr[i];
    });
    setState({ records, streaks });
    setLoading(false);
  }, [plans]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** 一键打卡（布尔计划） */
  const check = useCallback(
    async (planId: string) => {
      await window.api.checkin.check({ planId, dayKey: todayKey(), done: 1 });
      await refresh();
    },
    [refresh]
  );

  /** 数值打卡（如 WPM） */
  const checkNumeric = useCallback(
    async (planId: string, value: number) => {
      await window.api.checkin.check({ planId, dayKey: todayKey(), done: 1, value });
      await refresh();
    },
    [refresh]
  );

  /** 带证据打卡（截图/视频） */
  const checkWithEvidence = useCallback(
    async (
      planId: string,
      attachment: {
        attachmentPath: string;
        attachmentType: 'screenshot' | 'video';
        attachmentName: string;
      }
    ) => {
      await window.api.checkin.check({
        planId,
        dayKey: todayKey(),
        done: 1,
        attachmentPath: attachment.attachmentPath,
        attachmentType: attachment.attachmentType,
        attachmentName: attachment.attachmentName
      });
      await refresh();
    },
    [refresh]
  );

  /** 取消打卡（补卡的反操作） */
  const uncheck = useCallback(
    async (planId: string) => {
      await window.api.checkin.uncheck(planId, todayKey());
      await refresh();
    },
    [refresh]
  );

  /** 补卡（指定某天打卡） */
  const makeUp = useCallback(
    async (planId: string, dayKey: string) => {
      await window.api.checkin.check({ planId, dayKey, done: 1 });
      await refresh();
    },
    [refresh]
  );

  /** 已完成计划数 */
  const doneCount = plans.filter((p) => state.records[p.id]?.done === 1).length;

  return {
    records: state.records,
    streaks: state.streaks,
    loading,
    doneCount,
    check,
    checkNumeric,
    checkWithEvidence,
    uncheck,
    makeUp
  };
}
