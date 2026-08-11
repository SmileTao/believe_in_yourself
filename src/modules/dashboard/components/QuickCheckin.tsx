import { useRef, useState } from 'react';
import { Check, Flame, X, Paperclip } from 'lucide-react';
import type { Plan, Checkin, StreakInfo } from '@shared/contracts';
import { getPlanIcon } from '../../../utils/icons';
import { todayKey } from '@shared/utils/date';
import EvidenceDialog from '../../shared/EvidenceDialog';
import './QuickCheckin.less';

interface QuickCheckinProps {
  plans: Plan[];
  records: Record<string, Checkin | undefined>;
  streaks: Record<string, StreakInfo | undefined>;
  onCheck: (planId: string) => void;
  onUncheck: (planId: string) => void;
  onCheckNumeric: (planId: string, value: number) => void;
  onCheckWithEvidence: (
    planId: string,
    attachment: {
      attachmentPath: string;
      attachmentType: 'screenshot' | 'video';
      attachmentName: string;
    }
  ) => void;
}

/** 三大计划快速打卡面板 */
export default function QuickCheckin({
  plans,
  records,
  streaks,
  onCheck,
  onUncheck,
  onCheckNumeric,
  onCheckWithEvidence
}: QuickCheckinProps) {
  return (
    <div className="quick-checkin">
      {plans.map((plan) => {
        const record = records[plan.id];
        const done = record?.done === 1;
        const streak = streaks[plan.id];
        return (
          <PlanCard
            key={plan.id}
            plan={plan}
            done={done}
            streak={streak?.current_streak ?? 0}
            longestStreak={streak?.longest_streak ?? 0}
            value={record?.value ?? null}
            hasAttachment={Boolean(record?.attachment_path)}
            onCheck={() => onCheck(plan.id)}
            onUncheck={() => onUncheck(plan.id)}
            onCheckNumeric={(v) => onCheckNumeric(plan.id, v)}
            onCheckWithEvidence={(att) => onCheckWithEvidence(plan.id, att)}
          />
        );
      })}
    </div>
  );
}

interface PlanCardProps {
  plan: Plan;
  done: boolean;
  streak: number;
  longestStreak: number;
  value: number | null;
  hasAttachment: boolean;
  onCheck: () => void;
  onUncheck: () => void;
  onCheckNumeric: (v: number) => void;
  onCheckWithEvidence: (att: {
    attachmentPath: string;
    attachmentType: 'screenshot' | 'video';
    attachmentName: string;
  }) => void;
}

function PlanCard({
  plan,
  done,
  streak,
  longestStreak,
  value,
  hasAttachment,
  onCheck,
  onUncheck,
  onCheckNumeric,
  onCheckWithEvidence
}: PlanCardProps) {
  const [pulsing, setPulsing] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [numValue, setNumValue] = useState('');
  const timerRef = useRef<number | null>(null);

  const Icon = getPlanIcon(plan.icon);
  const isNumeric = plan.checkin_type === 'numeric';
  const needEvidence = plan.require_evidence === 1;

  const handleCheck = () => {
    if (isNumeric) {
      if (needEvidence && !done) {
        setShowEvidence(true);
        return;
      }
      setShowInput(true);
      return;
    }
    if (done) {
      onUncheck();
      return;
    }
    if (needEvidence) {
      setShowEvidence(true);
      return;
    }
    triggerPulse();
    onCheck();
  };

  const triggerPulse = () => {
    setPulsing(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setPulsing(false), 700);
  };

  const handleSubmitNumeric = () => {
    const v = Number(numValue);
    if (Number.isNaN(v) || v <= 0) return;
    triggerPulse();
    onCheckNumeric(v);
    setNumValue('');
    setShowInput(false);
  };

  const handleEvidenceConfirm = (att: {
    attachmentPath: string;
    attachmentType: 'screenshot' | 'video';
    attachmentName: string;
  } | null) => {
    setShowEvidence(false);
    if (!att) return;
    triggerPulse();
    if (isNumeric) {
      // 先弹数值输入
      onCheckWithEvidence(att);
      setShowInput(true);
    } else {
      onCheckWithEvidence(att);
    }
  };

  return (
    <div className={`plan-card lift ${done ? 'done' : ''} ${pulsing ? 'pulse-warm' : ''}`}>
      <div className="plan-head">
        <span className="plan-icon">
          <Icon size={20} />
        </span>
        <div className="plan-info">
          <strong>{plan.name}</strong>
          <small className="muted">{plan.min_action}</small>
        </div>
      </div>

      <div className="plan-stats">
        {isNumeric && value !== null && (
          <span className="stat-chip metric">
            {value} {plan.metric_label}
          </span>
        )}
        <span className="stat-chip streak" title={`历史最长 ${longestStreak} 天`}>
          <Flame size={13} />
          {streak} 天
        </span>
        {hasAttachment && (
          <span className="stat-chip attachment" title="已上传学习证据">
            <Paperclip size={12} />
            证据
          </span>
        )}
      </div>

      {showInput && isNumeric && (
        <div className="num-input">
          <input
            type="number"
            autoFocus
            value={numValue}
            placeholder={`输入${plan.metric_label ?? '数值'}`}
            onChange={(e) => setNumValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitNumeric()}
          />
          <button className="confirm-btn" onClick={handleSubmitNumeric}>
            <Check size={14} />
          </button>
          <button
            className="cancel-btn"
            onClick={() => {
              setShowInput(false);
              setNumValue('');
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {!showInput && (
        <button className={`check-btn ${done ? 'checked' : ''}`} onClick={handleCheck}>
          {done ? (
            <>
              <Check size={16} /> 已完成
            </>
          ) : isNumeric ? (
            '记录数据'
          ) : (
            '一键打卡'
          )}
        </button>
      )}

      {done && !showInput && (
        <button className="undo-btn" onClick={onUncheck}>
          撤销
        </button>
      )}

      {showEvidence && (
        <EvidenceDialog
          planName={plan.name}
          dayKey={todayKey()}
          planId={plan.id}
          onClose={() => setShowEvidence(false)}
          onConfirm={handleEvidenceConfirm}
        />
      )}
    </div>
  );
}
