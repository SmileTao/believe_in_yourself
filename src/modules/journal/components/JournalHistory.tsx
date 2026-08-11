import type { JournalEntry } from '@shared/contracts';
import './JournalHistory.less';

interface JournalHistoryProps {
  entries: JournalEntry[];
}

const MOOD_EMOJIS: Record<number, string> = {
  1: '😣', 2: '😕', 3: '😐', 4: '🙂', 5: '😊'
};

function formatDay(dayKey: string): string {
  const d = new Date(dayKey);
  const m = d.getMonth() + 1;
  const dd = d.getDate();
  const w = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
  return `${m}月${dd}日 周${w}`;
}

/** 历史日记列表 */
export default function JournalHistory({ entries }: JournalHistoryProps) {
  if (entries.length === 0) {
    return (
      <div className="journal-history card">
        <h3>历史日记</h3>
        <p className="empty muted">还没有历史记录，从今天开始写下第一篇吧 📝</p>
      </div>
    );
  }

  return (
    <div className="journal-history card">
      <h3>历史日记</h3>
      <ul className="history-list">
        {entries.map((e) => (
          <li key={e.id} className="history-item">
            <div className="item-date">
              <span className="date">{formatDay(e.day_key)}</span>
              {e.mood && <span className="mood">{MOOD_EMOJIS[e.mood] ?? ''}</span>}
            </div>
            <div className="item-content">
              {e.sentence1 && <p className="line s1">{e.sentence1}</p>}
              {e.sentence2 && <p className="line s2 muted">{e.sentence2}</p>}
              {e.sentence3 && <p className="line s3">{e.sentence3}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
