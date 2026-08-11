import JournalEditor from './components/JournalEditor';
import JournalHistory from './components/JournalHistory';
import { useJournal } from '../../hooks/useJournal';
import { CalendarDays, TrendingUp } from 'lucide-react';
import './Journal.less';

/** 复盘日记模块页面 */
export default function Journal() {
  const { today, recent, loading, saving, save, weeklySummary } = useJournal();
  const summary = weeklySummary();

  return (
    <div className="journal-page">
      <h2 className="page-title">复盘日记</h2>
      <p className="page-subtitle muted">每天三句话，温柔地看见自己的成长。</p>

      <div className="journal-layout">
        {/* 左：编辑器 + 周汇总 */}
        <div className="journal-main">
          <JournalEditor entry={today} saving={saving} onSave={save} />

          {/* 本周汇总卡片 */}
          <div className="weekly-summary card">
            <div className="ws-header">
              <CalendarDays size={18} />
              <h3>本周汇总</h3>
            </div>
            <div className="ws-stats">
              <div className="ws-stat">
                <TrendingUp size={15} />
                <span>{summary.count} 篇日记</span>
              </div>
              <div className="ws-stat">
                <span>平均心情 {summary.avgMood}</span>
              </div>
            </div>
            <pre className="ws-text">{summary.text}</pre>
          </div>
        </div>

        {/* 右：历史日记 */}
        <div className="journal-side">
          {loading ? <p className="muted">加载中…</p> : <JournalHistory entries={recent} />}
        </div>
      </div>
    </div>
  );
}
