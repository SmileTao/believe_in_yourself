import { useState } from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
import type { Frog } from '@shared/contracts';
import './FrogBoard.less';

interface FrogBoardProps {
  frogs: Frog[];
  loading: boolean;
  onAdd: (title: string) => void;
  onToggle: (id: string, done: 0 | 1) => void;
  onRemove: (id: string) => void;
}

/** 今日要事：每天最重要的 3 件事 */
export default function FrogBoard({ frogs, loading, onAdd, onToggle, onRemove }: FrogBoardProps) {
  const [input, setInput] = useState('');
  // 中文输入法组合中:此时回车是"确认候选词",不应提交
  const [composing, setComposing] = useState(false);

  const handleAdd = () => {
    const title = input.trim();
    if (!title) return;
    onAdd(title);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !composing && !e.nativeEvent.isComposing) handleAdd();
  };

  const doneCount = frogs.filter((f) => f.done === 1).length;

  return (
    <div className="frog-board card">
      <div className="board-header">
        <h3>今日三件要事</h3>
        <span className="counter">
          {doneCount}/{frogs.length}
        </span>
      </div>
      <p className="muted hint">写下今天最重要的三件事，先难后易，逐个击破。</p>

      <div className="frog-input">
        <input
          type="text"
          value={input}
          placeholder="添加今日要事，回车确认…"
          maxLength={60}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
        />
        <button className="add-btn" onClick={handleAdd} disabled={!input.trim()}>
          <Plus size={16} />
        </button>
      </div>

      <ul className="frog-list">
        {loading && <li className="empty muted">加载中…</li>}
        {!loading && frogs.length === 0 && (
          <li className="empty muted">还没有要事，添加第一件吧 ✨</li>
        )}
        {frogs.map((f) => (
          <li key={f.id} className={`frog-item ${f.done === 1 ? 'done' : ''}`}>
            <button className="check-circle" onClick={() => onToggle(f.id, f.done === 1 ? 0 : 1)}>
              {f.done === 1 && <Check size={14} />}
            </button>
            <span className="frog-title">{f.title}</span>
            <button className="del-btn" onClick={() => onRemove(f.id)}>
              <Trash2 size={14} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
