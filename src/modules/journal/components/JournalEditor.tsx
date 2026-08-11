import { useState, useEffect } from 'react';
import { Save, Check } from 'lucide-react';
import type { JournalEntry } from '@shared/contracts';
import './JournalEditor.less';

interface JournalEditorProps {
  entry: JournalEntry | undefined;
  saving: boolean;
  onSave: (input: {
    sentence1: string;
    sentence2: string;
    sentence3: string;
    mood: number | null;
  }) => void;
}

const QUESTIONS = [
  { key: 'sentence1', label: '今天做了什么值得肯定的？', placeholder: '哪怕是很小的一步，也值得记录…' },
  { key: 'sentence2', label: '哪里可以做得更好？', placeholder: '不带批判地看看自己，温柔的反思…' },
  { key: 'sentence3', label: '明天最想做的一件事？', placeholder: '明天的第一步行动是…' }
] as const;

const MOODS = [
  { value: 1, emoji: '😣', label: '低谷' },
  { value: 2, emoji: '😕', label: '一般' },
  { value: 3, emoji: '😐', label: '平稳' },
  { value: 4, emoji: '🙂', label: '不错' },
  { value: 5, emoji: '😊', label: '充实' }
];

/** 每日三句话日记编辑器 */
export default function JournalEditor({ entry, saving, onSave }: JournalEditorProps) {
  const [s1, setS1] = useState('');
  const [s2, setS2] = useState('');
  const [s3, setS3] = useState('');
  const [mood, setMood] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setS1(entry?.sentence1 ?? '');
    setS2(entry?.sentence2 ?? '');
    setS3(entry?.sentence3 ?? '');
    setMood(entry?.mood ?? null);
    setSaved(false);
  }, [entry]);

  const handleSave = () => {
    onSave({ sentence1: s1, sentence2: s2, sentence3: s3, mood });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const hasContent = s1.trim() || s2.trim() || s3.trim();

  return (
    <div className="journal-editor card">
      <div className="editor-header">
        <h3>今日复盘</h3>
        <span className="date-hint">三句话，轻轻收束这一天</span>
      </div>

      {/* 心情选择 */}
      <div className="mood-row">
        <span className="mood-label">今天心情</span>
        <div className="mood-options">
          {MOODS.map((m) => (
            <button
              key={m.value}
              className={`mood-chip ${mood === m.value ? 'selected' : ''}`}
              onClick={() => setMood(mood === m.value ? null : m.value)}
              title={m.label}
            >
              <span className="mood-emoji">{m.emoji}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 三句话 */}
      <div className="sentences">
        {QUESTIONS.map((q, i) => {
          const value = i === 0 ? s1 : i === 1 ? s2 : s3;
          const setter = i === 0 ? setS1 : i === 1 ? setS2 : setS3;
          return (
            <div key={q.key} className="sentence-item">
              <label>
                <span className="q-num">{i + 1}</span>
                {q.label}
              </label>
              <textarea
                value={value}
                placeholder={q.placeholder}
                maxLength={200}
                rows={2}
                onChange={(e) => setter(e.target.value)}
              />
            </div>
          );
        })}
      </div>

      {/* 保存按钮 */}
      <div className="save-row">
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={!hasContent || saving}
        >
          {saved ? (
            <>
              <Check size={16} /> 已保存
            </>
          ) : saving ? (
            '保存中…'
          ) : (
            <>
              <Save size={16} /> 保存日记
            </>
          )}
        </button>
      </div>
    </div>
  );
}
