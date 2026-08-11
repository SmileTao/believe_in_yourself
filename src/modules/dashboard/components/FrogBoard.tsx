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

/** 三只青蛙：每天最重要的 3 件事 */
export default function FrogBoard({ frogs, loading, onAdd, onToggle, onRemove }: FrogBoardProps) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const title = input.trim();
    if (!title) return;
    onAdd(title);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const doneCount = frogs.filter((f) => f.done === 1).length;

  return (
    <div className="frog-board card">
      <div className="board-header">
        <h3>今日三只青蛙</h3>
        <span className="counter">
          {doneCount}/{frogs.length}
        </span>
      </div>
      <p className="muted hint">挑出今天最想吞掉的 3 只"青蛙"，先难后易。</p>

      <div className="frog-input">
        <input
          type="text"
          value={input}
          placeholder="添加今日要事，回车确认…"
          maxLength={60}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="add-btn" onClick={handleAdd} disabled={!input.trim()}>
          <Plus size={16} />
        </button>
      </div>

      <ul className="frog-list">
        {loading && <li className="empty muted">加载中…</li>}
        {!loading && frogs.length === 0 && (
          <li className="empty muted">还没有青蛙，添加第一件要事吧 🐸</li>
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
