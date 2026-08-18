import { useState } from 'react';
import { Bell, Clock, RotateCcw, Download, Upload, AlertTriangle, Check } from 'lucide-react';
import { usePrefs } from '../../store';
import './Settings.less';

/** 设置模块页面 */
export default function Settings() {
  const { reminderEnabled, pomodoroFocus, pomodoroBreak, resetHour, setPref } = usePrefs();
  const [exportMsg, setExportMsg] = useState('');
  const [importMsg, setImportMsg] = useState('');

  const handleExport = async () => {
    setExportMsg('');
    const result = await window.api.exportData();
    if (result.ok) {
      setExportMsg(`已导出到：${result.path}`);
    }
  };

  const handleImport = async () => {
    setImportMsg('');
    if (!confirm('导入数据将覆盖当前所有数据，确定继续吗？\n建议先导出备份。')) return;
    const result = await window.api.importData();
    if (result.ok) {
      setImportMsg('导入成功！正在刷新…');
      setTimeout(() => window.location.reload(), 1500);
    } else {
      setImportMsg(result.error ?? '导入失败');
    }
  };

  return (
    <div className="settings-page">
      <h2 className="page-title">设置</h2>

      {/* 通知设置 */}
      <div className="settings-section card">
        <div className="section-head">
          <Bell size={18} />
          <h3>提醒</h3>
        </div>
        <div className="setting-row">
          <div className="setting-label">
            <span>打卡提醒</span>
            <small className="muted">每日未打卡时弹出系统通知</small>
          </div>
          <ToggleSwitch
            checked={reminderEnabled}
            onChange={(v) => setPref('reminderEnabled', v)}
          />
        </div>
      </div>

      {/* 番茄钟设置 */}
      <div className="settings-section card">
        <div className="section-head">
          <Clock size={18} />
          <h3>番茄钟</h3>
        </div>
        <div className="setting-row">
          <div className="setting-label">
            <span>专注时长</span>
            <small className="muted">每次专注的分钟数</small>
          </div>
          <NumberStepper
            value={pomodoroFocus}
            min={5}
            max={60}
            step={5}
            unit="分钟"
            onChange={(v) => setPref('pomodoroFocus', v)}
          />
        </div>
        <div className="setting-row">
          <div className="setting-label">
            <span>休息时长</span>
            <small className="muted">专注后的短休分钟数</small>
          </div>
          <NumberStepper
            value={pomodoroBreak}
            min={1}
            max={30}
            step={1}
            unit="分钟"
            onChange={(v) => setPref('pomodoroBreak', v)}
          />
        </div>
      </div>

      {/* 每日重置时间 */}
      <div className="settings-section card">
        <div className="section-head">
          <RotateCcw size={18} />
          <h3>每日重置</h3>
        </div>
        <div className="setting-row">
          <div className="setting-label">
            <span>重置时间点</span>
            <small className="muted">凌晨几点视为"新的一天"开始</small>
          </div>
          <NumberStepper
            value={resetHour}
            min={0}
            max={23}
            step={1}
            unit=":00"
            onChange={(v) => setPref('resetHour', v)}
          />
        </div>
      </div>

      {/* 数据管理 */}
      <div className="settings-section card">
        <div className="section-head">
          <Download size={18} />
          <h3>数据管理</h3>
        </div>
        <div className="data-actions">
          <button className="data-btn export" onClick={handleExport}>
            <Download size={16} />
            导出数据
          </button>
          <button className="data-btn import" onClick={handleImport}>
            <Upload size={16} />
            导入数据
          </button>
        </div>
        {exportMsg && (
          <p className="action-msg success">
            <Check size={14} />
            {exportMsg}
          </p>
        )}
        {importMsg && (
          <p className="action-msg warn">
            <AlertTriangle size={14} />
            {importMsg}
          </p>
        )}
        <p className="data-hint muted">
          导出 = SQLite 数据库文件 + JSON 设置快照。导入会覆盖当前所有数据。
        </p>
      </div>

      {/* 关于 */}
      <div className="settings-section card about">
        <h3>关于</h3>
        <p className="muted">士别三日 · shibie v0.1.0</p>
        <p className="muted">士别三日，刮目相看。</p>
        <p className="muted">数据全部存储在本地，你的坚持只属于你自己。</p>
      </div>
    </div>
  );
}

/** 开关组件 */
function ToggleSwitch({
  checked,
  onChange
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      className={`toggle-switch ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-knob" />
    </button>
  );
}

/** 数字步进器 */
function NumberStepper({
  value,
  min,
  max,
  step,
  unit,
  onChange
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));

  return (
    <div className="num-stepper">
      <button className="step-btn" onClick={dec} disabled={value <= min}>−</button>
      <span className="step-value">{value}{unit}</span>
      <button className="step-btn" onClick={inc} disabled={value >= max}>+</button>
    </div>
  );
}
