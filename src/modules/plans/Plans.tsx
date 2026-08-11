import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, X, Check, GripVertical } from 'lucide-react';
import type { Plan, CheckinType } from '@shared/contracts';
import { usePlans } from '../../hooks/usePlans';
import { PLAN_ICONS, getPlanIcon } from '../../utils/icons';
import './Plans.less';

/** 计划管理模块页面 */
export default function Plans() {
  const { plans, loading, refresh } = usePlans();
  const [editing, setEditing] = useState<Plan | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleEdit = (plan: Plan) => {
    setEditing(plan);
    setShowForm(true);
  };

  const handleRemove = async (plan: Plan) => {
    if (!confirm(`确定要删除「${plan.name}」吗？\n打卡记录会保留但不再显示。`)) return;
    await window.api.plan.remove(plan.id);
    refresh();
  };

  if (loading) return <div className="plans-page"><p className="muted">加载中…</p></div>;

  return (
    <div className="plans-page">
      <div className="page-head">
        <h2>计划管理</h2>
        <button className="add-btn" onClick={handleAdd}>
          <Plus size={16} /> 新建计划
        </button>
      </div>

      <div className="plan-list">
        {plans.map((plan) => {
          const Icon = getPlanIcon(plan.icon);
          return (
            <div key={plan.id} className="plan-row card lift">
              <div className="drag-handle">
                <GripVertical size={16} />
              </div>
              <span className="plan-icon" style={{ background: 'var(--c)', color: 'var(--c)' }}>
                <Icon size={20} />
              </span>
              <div className="plan-detail">
                <div className="plan-name">{plan.name}</div>
                <div className="plan-meta">
                  <span className="meta-tag">{plan.checkin_type === 'boolean' ? '一键打卡' : `数值·${plan.metric_label ?? ''}`}</span>
                  <span className="meta-goal muted">{plan.goal}</span>
                </div>
                <div className="plan-min muted">最小行动：{plan.min_action}</div>
              </div>
              <div className="plan-actions">
                <button className="action-btn edit" onClick={() => handleEdit(plan)}>
                  <Edit3 size={15} />
                </button>
                <button className="action-btn del" onClick={() => handleRemove(plan)}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <PlanForm
          plan={editing}
          sortOrder={plans.length}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}

interface PlanFormProps {
  plan: Plan | null;
  sortOrder: number;
  onClose: () => void;
  onSaved: () => void;
}

function PlanForm({ plan, sortOrder, onClose, onSaved }: PlanFormProps) {
  const [name, setName] = useState(plan?.name ?? '');
  const [icon, setIcon] = useState(plan?.icon ?? 'Target');
  const [goal, setGoal] = useState(plan?.goal ?? '');
  const [minAction, setMinAction] = useState(plan?.min_action ?? '');
  const [checkinType, setCheckinType] = useState<CheckinType>(plan?.checkin_type ?? 'boolean');
  const [metricLabel, setMetricLabel] = useState(plan?.metric_label ?? '');
  const [requireEvidence, setRequireEvidence] = useState<boolean>(plan?.require_evidence === 1);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const input = {
      name: name.trim(),
      icon,
      goal: goal.trim() || '坚持就是胜利',
      min_action: minAction.trim() || '做一点就好',
      checkin_type: checkinType,
      metric_label: checkinType === 'numeric' ? (metricLabel.trim() || '数值') : null,
      sort_order: plan?.sort_order ?? sortOrder,
      require_evidence: (requireEvidence ? 1 : 0) as 0 | 1
    };
    if (plan) {
      await window.api.plan.update(plan.id, input);
    } else {
      await window.api.plan.create(input);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="plan-form-overlay" onClick={onClose}>
      <div className="plan-form card" onClick={(e) => e.stopPropagation()}>
        <div className="form-header">
          <h3>{plan ? '编辑计划' : '新建计划'}</h3>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="form-body">
          {/* 图标选择 */}
          <div className="form-field">
            <label>图标</label>
            <div className="icon-picker">
              {PLAN_ICONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.name}
                    className={`icon-opt ${icon === opt.name ? 'selected' : ''}`}
                    onClick={() => setIcon(opt.name)}
                    title={opt.label}
                  >
                    <Icon size={18} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* 计划名称 */}
          <div className="form-field">
            <label>计划名称</label>
            <input
              type="text"
              value={name}
              placeholder="如：英语、打字、AI Agent 开发"
              maxLength={20}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* 目标 */}
          <div className="form-field">
            <label>目标</label>
            <input
              type="text"
              value={goal}
              placeholder="你的长期目标是什么？"
              maxLength={50}
              onChange={(e) => setGoal(e.target.value)}
            />
          </div>

          {/* 最小行动 */}
          <div className="form-field">
            <label>最小行动</label>
            <input
              type="text"
              value={minAction}
              placeholder="哪怕只做一点点也算完成"
              maxLength={30}
              onChange={(e) => setMinAction(e.target.value)}
            />
            <small className="muted">例：做 1 道题、读 1 页书、写 1 行代码</small>
          </div>

          {/* 打卡类型 */}
          <div className="form-field">
            <label>打卡类型</label>
            <div className="type-tabs">
              <button
                className={`type-tab ${checkinType === 'boolean' ? 'active' : ''}`}
                onClick={() => setCheckinType('boolean')}
              >
                一键打卡
              </button>
              <button
                className={`type-tab ${checkinType === 'numeric' ? 'active' : ''}`}
                onClick={() => setCheckinType('numeric')}
              >
                数值记录
              </button>
            </div>
            {checkinType === 'numeric' && (
              <input
                type="text"
                value={metricLabel}
                placeholder="指标名，如 WPM、分钟、题数"
                maxLength={10}
                onChange={(e) => setMetricLabel(e.target.value)}
                className="metric-input"
              />
            )}
          </div>

          {/* 学习证据开关 */}
          <div className="form-field">
            <label>需要学习证据</label>
            <div className="evidence-toggle-row">
              <button
                type="button"
                className={`evidence-toggle ${requireEvidence ? 'on' : ''}`}
                onClick={() => setRequireEvidence(!requireEvidence)}
              >
                <span className="toggle-knob" />
              </button>
              <small className="muted">
                开启后，打卡时需上传截图或视频作为学习记录
              </small>
            </div>
          </div>
        </div>

        <div className="form-footer">
          <button className="cancel-btn" onClick={onClose}>取消</button>
          <button className="submit-btn" onClick={handleSubmit} disabled={!name.trim() || saving}>
            <Check size={15} />
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
