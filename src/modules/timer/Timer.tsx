import PomodoroTimer from './components/PomodoroTimer';
import FocusOverlay from './components/FocusOverlay';
import { usePomodoro } from '../../hooks/usePomodoro';
import { usePlans } from '../../hooks/usePlans';
import { getPlanIcon } from '../../utils/icons';
import './Timer.less';

/** 番茄钟模块页面 */
export default function Timer() {
  const pomo = usePomodoro();
  const { plans } = usePlans();

  const selectedPlan = plans.find((p) => p.id === pomo.planId) ?? null;

  return (
    <div className="timer-page">
      <div className="timer-layout">
        {/* 左：番茄钟主面板 */}
        <div className="timer-main card">
          <PomodoroTimer
            mode={pomo.mode}
            remaining={pomo.remaining}
            total={pomo.total}
            running={pomo.running}
            focusCount={pomo.focusCount}
            onSwitchMode={pomo.switchMode}
            onStart={pomo.start}
            onPause={pomo.pause}
            onReset={pomo.reset}
            onSkip={pomo.skip}
            onFullScreen={pomo.toggleFullScreen}
          />
        </div>

        {/* 右：关联计划 + 说明 */}
        <div className="timer-side">
          <div className="card plan-link">
            <h3>关联计划</h3>
            <p className="muted hint">专注时长将自动计入所选计划。</p>
            <div className="plan-options">
              <button
                className={`plan-opt ${pomo.planId === null ? 'active' : ''}`}
                onClick={() => pomo.setPlan(null)}
              >
                不关联
              </button>
              {plans.map((p) => {
                const Icon = getPlanIcon(p.icon);
                return (
                  <button
                    key={p.id}
                    className={`plan-opt ${pomo.planId === p.id ? 'active' : ''}`}
                    onClick={() => pomo.setPlan(p.id)}
                  >
                    <Icon size={15} />
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card tips">
            <h3>专注小贴士</h3>
            <ul>
              <li>25 分钟专注 + 5 分钟休息，效率最佳。</li>
              <li>专注时远离手机，只做当前这一件事。</li>
              <li>走神了也没关系，轻轻把注意力拉回来。</li>
              <li>每完成 4 次专注，给自己一次长休息。</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 全屏专注覆盖层 */}
      {pomo.fullScreen && (
        <FocusOverlay
          mode={pomo.mode}
          remaining={pomo.remaining}
          total={pomo.total}
          running={pomo.running}
          planName={selectedPlan?.name ?? null}
          onStart={pomo.start}
          onPause={pomo.pause}
          onExit={pomo.exitFullScreen}
        />
      )}
    </div>
  );
}
