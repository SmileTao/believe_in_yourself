import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { Plan, Checkin, StreakInfo } from '@shared/contracts';
import { usePlans } from '../../hooks/usePlans';
import { getPlanIcon } from '../../utils/icons';
import { Flame, CalendarCheck, ChevronLeft, ChevronRight, Paperclip, X } from 'lucide-react';
import './Habits.less';

/** 打卡模块页面 */
export default function Habits() {
  const { plans, loading } = usePlans();
  const [activePlanId, setActivePlanId] = useState<string | null>(null);

  // 默认选中第一个计划
  useEffect(() => {
    if (!activePlanId && plans.length > 0) {
      setActivePlanId(plans[0].id);
    }
  }, [plans, activePlanId]);

  if (loading) return <div className="habits-page"><p className="muted">加载中…</p></div>;

  const activePlan = plans.find((p) => p.id === activePlanId);

  return (
    <div className="habits-page">
      <h2 className="page-title">打卡日历</h2>

      {/* 计划切换标签 */}
      <div className="plan-tabs">
        {plans.map((plan) => {
          const Icon = getPlanIcon(plan.icon);
          return (
            <button
              key={plan.id}
              className={`plan-tab ${plan.id === activePlanId ? 'active' : ''}`}
              onClick={() => setActivePlanId(plan.id)}
            >
              <Icon size={16} />
              {plan.name}
            </button>
          );
        })}
      </div>

      {activePlan && <PlanCalendar plan={activePlan} />}
    </div>
  );
}

interface PlanCalendarProps {
  plan: Plan;
}

/** 单计划月历打卡视图 */
function PlanCalendar({ plan }: PlanCalendarProps) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [checkins, setCheckins] = useState<Record<string, Checkin>>({});
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Checkin | null>(null);

  const loadData = useCallback(async () => {
    const [allCheckins, streakInfo] = await Promise.all([
      window.api.checkin.getByPlan(plan.id),
      window.api.checkin.getStreak(plan.id)
    ]);
    const map: Record<string, Checkin> = {};
    allCheckins.forEach((c) => { map[c.day_key] = c; });
    setCheckins(map);
    setStreak(streakInfo);
    setLoading(false);
  }, [plan.id]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  /** 生成当月日历网格 */
  const days = generateMonthGrid(cursor.year, cursor.month);
  const today = new Date().toISOString().slice(0, 10);
  const weekdays = ['一', '二', '三', '四', '五', '六', '日'];

  const handleToggleDay = async (dayKey: string) => {
    const existing = checkins[dayKey];
    if (existing?.done === 1) {
      // 如果有附件，先展示附件而不是直接取消
      if (existing.attachment_path) {
        setViewing(existing);
        return;
      }
      await window.api.checkin.uncheck(plan.id, dayKey);
      loadData();
    } else {
      // 需要证据的计划，先上传
      if (plan.require_evidence === 1) {
        const result = await window.api.selectAttachment({ planId: plan.id, dayKey });
        if (result.canceled) return;
        if (!result.ok) {
          alert(result.error ?? '上传失败');
          return;
        }
        await window.api.checkin.check({
          planId: plan.id,
          dayKey,
          done: 1,
          attachmentPath: result.attachmentPath,
          attachmentType: result.attachmentType,
          attachmentName: result.attachmentName
        });
      } else {
        await window.api.checkin.check({ planId: plan.id, dayKey, done: 1 });
      }
      loadData();
    }
  };

  const monthLabel = `${cursor.year}年${cursor.month + 1}月`;

  const prevMonth = () => {
    setCursor((c) => {
      const m = c.month - 1;
      return m < 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: m };
    });
  };
  const nextMonth = () => {
    setCursor((c) => {
      const m = c.month + 1;
      return m > 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: m };
    });
  };

  return (
    <div className="plan-calendar card">
      {/* streak 概览 */}
      <div className="cal-overview">
        <div className="ov-item">
          <Flame size={16} className="accent" />
          <span>当前连续 <b>{streak?.current_streak ?? 0}</b> 天</span>
        </div>
        <div className="ov-item">
          <CalendarCheck size={16} className="success" />
          <span>历史最长 <b>{streak?.longest_streak ?? 0}</b> 天</span>
        </div>
      </div>

      {/* 月份导航 */}
      <div className="month-nav">
        <button className="nav-btn" onClick={prevMonth}><ChevronLeft size={18} /></button>
        <span className="month-label">{monthLabel}</span>
        <button className="nav-btn" onClick={nextMonth}><ChevronRight size={18} /></button>
      </div>

      {/* 日历网格 */}
      {loading ? (
        <p className="muted">加载中…</p>
      ) : (
        <div className="cal-grid">
          {weekdays.map((w) => (
            <div key={w} className="cal-weekday">{w}</div>
          ))}
          {days.map((day) => {
            if (!day) return <div key={`empty-${Math.random()}`} className="cal-cell empty" />;
            const checkin = checkins[day.key];
            const done = checkin?.done === 1;
            const isFuture = day.key > today;
            const isToday = day.key === today;
            return (
              <button
                key={day.key}
                className={`cal-cell ${done ? 'done' : ''} ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''}`}
                onClick={() => !isFuture && handleToggleDay(day.key)}
                title={isFuture ? '未来日期' : done ? '点击取消' : '点击补卡/打卡'}
              >
                <span className="cell-num">{day.day}</span>
                {done && <span className="cell-check" />}
                {done && plan.checkin_type === 'numeric' && checkin?.value != null && (
                  <span className="cell-val">{checkin.value}</span>
                )}
                {done && checkin?.attachment_path && (
                  <span className="cell-att" title="有学习证据">
                    <Paperclip size={9} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <p className="cal-hint muted">
        {plan.require_evidence === 1
          ? '此计划需上传截图/视频作为学习证据。点击日期上传或查看证据 📎'
          : '点击日期可补卡或取消打卡。断卡不归零，昨天没做也可以补上 🌱'}
      </p>

      {/* 附件查看器 */}
      {viewing && viewing.attachment_path && createPortal(
        <div className="att-viewer-overlay" onClick={() => setViewing(null)}>
          <div className="att-viewer" onClick={(e) => e.stopPropagation()}>
            <button className="viewer-close" onClick={() => setViewing(null)}>
              <X size={20} />
            </button>
            <div className="viewer-date">{viewing.day_key}</div>
            {viewing.attachment_type === 'screenshot' ? (
              <img src={`att://${viewing.attachment_path}`} alt="学习截图" />
            ) : (
              <video src={`att://${viewing.attachment_path}`} controls autoPlay />
            )}
            {viewing.attachment_name && (
              <p className="viewer-name muted">{viewing.attachment_name}</p>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/** 生成当月日历网格（周一为起始），返回 null 占位 + {key, day} */
function generateMonthGrid(year: number, month: number): ({ key: string; day: number } | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstWeekday = (firstDay.getDay() + 6) % 7; // 周一=0
  const daysInMonth = lastDay.getDate();

  const cells: ({ key: string; day: number } | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ key, day: d });
  }
  return cells;
}
