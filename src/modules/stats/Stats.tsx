import OverviewCards from './components/OverviewCards';
import HeatmapChart from './components/HeatmapChart';
import WpmChart from './components/WpmChart';
import { useStats } from '../../hooks/useStats';
import { getPlanIcon } from '../../utils/icons';
import { Flame } from 'lucide-react';
import './Stats.less';

/** 统计模块页面 */
export default function Stats() {
  const { plans, streaks, rates7d, rates30d, heatmap, wpmSeries, loading } = useStats();
  const year = new Date().getFullYear();

  if (loading) {
    return <div className="stats-page"><p className="muted">加载中…</p></div>;
  }

  return (
    <div className="stats-page">
      <h2 className="page-title">统计概览</h2>

      <OverviewCards plans={plans} streaks={streaks} rates30d={rates30d} />

      <HeatmapChart data={heatmap} year={year} />

      <WpmChart data={wpmSeries} />

      {/* 各计划详情 */}
      <section className="plan-stats">
        <h3 className="section-title">计划详情</h3>
        <div className="plan-stat-list">
          {plans.map((plan) => {
            const Icon = getPlanIcon(plan.icon);
            const streak = streaks[plan.id];
            const r7 = rates7d[plan.id];
            const r30 = rates30d[plan.id];
            return (
              <div key={plan.id} className="plan-stat-row card lift">
                <div className="ps-icon">
                  <Icon size={18} />
                </div>
                <div className="ps-name">{plan.name}</div>
                <div className="ps-metric">
                  <Flame size={13} />
                  <span>{streak?.current_streak ?? 0}天</span>
                  <small className="muted">最长{streak?.longest_streak ?? 0}</small>
                </div>
                <div className="ps-rate">
                  <div className="rate-bar">
                    <div className="rate-fill" style={{ width: `${(r7?.rate ?? 0) * 100}%` }} />
                  </div>
                  <span className="rate-label">
                    7天 {Math.round((r7?.rate ?? 0) * 100)}%
                  </span>
                </div>
                <div className="ps-rate">
                  <div className="rate-bar">
                    <div className="rate-fill alt" style={{ width: `${(r30?.rate ?? 0) * 100}%` }} />
                  </div>
                  <span className="rate-label">
                    30天 {Math.round((r30?.rate ?? 0) * 100)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
