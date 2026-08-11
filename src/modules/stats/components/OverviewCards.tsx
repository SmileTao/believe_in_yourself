import { useMemo } from 'react';
import { Flame, Clock, TrendingUp, Target } from 'lucide-react';
import type { Plan, StreakInfo, CompletionRate } from '@shared/contracts';
import { getPlanIcon } from '../../../utils/icons';
import './OverviewCards.less';

interface OverviewCardsProps {
  plans: Plan[];
  streaks: Record<string, StreakInfo>;
  rates30d: Record<string, CompletionRate>;
}

/** 概览卡片：最长连续、累计专注、平均完成率、计划数 */
export default function OverviewCards({ plans, streaks, rates30d }: OverviewCardsProps) {
  const stats = useMemo(() => {
    // 最长 streak
    const longestStreak = Math.max(0, ...plans.map((p) => streaks[p.id]?.longest_streak ?? 0));
    // 30天平均完成率
    const avgRate =
      plans.length === 0
        ? 0
        : Math.round(
            (plans.reduce((sum, p) => sum + (rates30d[p.id]?.rate ?? 0), 0) / plans.length) * 100
          ) / 100;
    // 30天总打卡数
    const totalDone30d = plans.reduce((sum, p) => sum + (rates30d[p.id]?.done ?? 0), 0);

    return { longestStreak, avgRate, totalDone30d, planCount: plans.length };
  }, [plans, streaks, rates30d]);

  return (
    <div className="overview-cards">
      <StatCard
        icon={<Flame size={20} />}
        label="历史最长连续"
        value={`${stats.longestStreak}`}
        unit="天"
        color="accent"
      />
      <StatCard
        icon={<Target size={20} />}
        label="30天完成率"
        value={`${Math.round(stats.avgRate * 100)}`}
        unit="%"
        color="success"
      />
      <StatCard
        icon={<TrendingUp size={20} />}
        label="30天打卡"
        value={`${stats.totalDone30d}`}
        unit="次"
        color="primary"
      />
      <StatCard
        icon={<Clock size={20} />}
        label="坚持计划"
        value={`${stats.planCount}`}
        unit="个"
        color="warning"
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  unit,
  color
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  color: 'accent' | 'success' | 'primary' | 'warning';
}) {
  return (
    <div className={`stat-card card lift ${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <span className="stat-label">{label}</span>
        <div className="stat-value">
          {value}
          <small>{unit}</small>
        </div>
      </div>
    </div>
  );
}
