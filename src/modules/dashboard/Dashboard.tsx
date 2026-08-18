import SloganHeader from './components/SloganHeader';
import RingProgress from './components/RingProgress';
import FrogBoard from './components/FrogBoard';
import QuickCheckin from './components/QuickCheckin';
import { usePlans } from '../../hooks/usePlans';
import { useFrogs } from '../../hooks/useFrogs';
import { useTodayCheckins } from '../../hooks/useTodayCheckins';
import './Dashboard.less';

/** 今日驾驶舱 */
export default function Dashboard() {
  const { plans } = usePlans();
  const { frogs, loading: frogsLoading, addFrog, toggleFrog, removeFrog } = useFrogs();
  const {
    records,
    streaks,
    doneCount,
    check,
    checkNumeric,
    checkWithEvidence,
    uncheck
  } = useTodayCheckins(plans);

  return (
    <div className="dashboard">
      <SloganHeader />

      <div className="dashboard-grid">
        {/* 左：环形进度 */}
        <section className="ring-panel card">
          <h3 className="panel-title">今日完成</h3>
          <div className="ring-wrap">
            <RingProgress done={doneCount} total={plans.length} size={180} />
          </div>
          <p className="ring-tip muted">
            {doneCount === plans.length && plans.length > 0
              ? '今日计划全部完成，真棒 🎉'
              : '每完成一项，离蜕变更近一步'}
          </p>
        </section>

        {/* 右：今日三件要事 */}
        <FrogBoard
          frogs={frogs}
          loading={frogsLoading}
          onAdd={addFrog}
          onToggle={toggleFrog}
          onRemove={removeFrog}
        />
      </div>

      {/* 三计划快速打卡 */}
      <section className="checkin-section">
        <h3 className="section-title">快速打卡</h3>
        <QuickCheckin
          plans={plans}
          records={records}
          streaks={streaks}
          onCheck={check}
          onUncheck={uncheck}
          onCheckNumeric={checkNumeric}
          onCheckWithEvidence={checkWithEvidence}
        />
      </section>
    </div>
  );
}
