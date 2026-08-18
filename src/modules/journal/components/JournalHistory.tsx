import { useMemo, useState } from 'react';
import { CalendarDays, BookOpen, X } from 'lucide-react';
import type { JournalEntry } from '@shared/contracts';
import { getMood } from '../../../shared/moods';
import { todayKey } from '@shared/utils/date';
import './JournalHistory.less';

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

function formatDay(dayKey: string): string {
  const d = new Date(dayKey);
  return `${d.getMonth() + 1}月${d.getDate()}日 周${WEEKDAYS[(d.getDay() + 6) % 7]}`;
}

/** 历史日记：心情日历,点击日期弹出气泡展示当天日记 */
export default function JournalHistory({ entries }: JournalHistoryProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, JournalEntry>();
    for (const e of entries) map.set(e.day_key, e);
    return map;
  }, [entries]);

  // 当月网格（周一起始）
  const grid = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7; // 周一为 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ key: string; day: number | null }> = [];
    for (let i = 0; i < offset; i++) cells.push({ key: `pad-${i}`, day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      cells.push({ key: `${year}-${mm}-${dd}`, day: d });
    }
    return cells;
  }, []);

  const selected = selectedDay ? byDay.get(selectedDay) : undefined;
  const selectedMood = getMood(selected?.mood);
  const today = todayKey();

  return (
    <div className="journal-history card">
      <div className="jh-header">
        <CalendarDays size={17} />
        <h3>心情日历</h3>
        <span className="jh-sub muted">每天的心情一眼可见，点击日期查看当天日记</span>
      </div>

      <div className="jh-calendar-wrap">
        <div className="jh-grid">
          {WEEKDAYS.map((w) => (
            <div key={w} className="jh-weekday">
              {w}
            </div>
          ))}
          {grid.map((c, idx) => {
            if (c.day == null) return <div key={c.key} className="jh-cell empty" />;
            const entry = byDay.get(c.key);
            const mood = getMood(entry?.mood);
            const isToday = c.key === today;
            const isSelected = c.key === selectedDay;
            const MoodIcon = mood?.icon;
            return (
              <div key={c.key} className={`jh-cell-wrap col-${idx % 7}`}>
                <button
                  className={`jh-cell ${entry ? 'has-entry' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                  style={
                    mood
                      ? {
                          background: `${mood.color}22`,
                          borderColor: `${mood.color}55`
                        }
                      : undefined
                  }
                  onClick={() => setSelectedDay(entry ? (isSelected ? null : c.key) : null)}
                  title={entry && mood ? `${formatDay(c.key)} · ${mood.label}` : formatDay(c.key)}
                  disabled={!entry}
                >
                  <span className="cell-day">{c.day}</span>
                  {MoodIcon && (
                    <MoodIcon
                      size={26}
                      strokeWidth={1.6}
                      className="cell-mood"
                      style={{ color: mood?.color }}
                    />
                  )}
                </button>

                {/* 对话气泡：相对当前日期格子定位 */}
                {isSelected && selected && (
                  <div className="jh-bubble" key={selected.day_key}>
                    <div className="bubble-card">
                      <button className="bubble-close" onClick={() => setSelectedDay(null)}>
                        <X size={13} />
                      </button>
                      <div className="bubble-head">
                        <BookOpen size={14} />
                        <span className="bubble-date">{formatDay(selected.day_key)}</span>
                        {selectedMood && (
                          <span className="bubble-mood" style={{ color: selectedMood.color }}>
                            <selectedMood.icon size={14} />
                            {selectedMood.label}
                          </span>
                        )}
                      </div>
                      <div className="bubble-body">
                        {selected.sentence1 && <p className="line s1">{selected.sentence1}</p>}
                        {selected.sentence2 && <p className="line s2">{selected.sentence2}</p>}
                        {selected.sentence3 && <p className="line s3">{selected.sentence3}</p>}
                      </div>
                    </div>
                    <span className="bubble-tail" aria-hidden />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface JournalHistoryProps {
  entries: JournalEntry[];
}
