import { useState } from 'react';
import { Lock, Check, Heart, Edit3, Save, X } from 'lucide-react';
import type { Achievement } from '@shared/contracts';
import './BadgeWall.less';

interface BadgeWallProps {
  achievements: Achievement[];
}

/** 成就图标映射 */
const BADGE_ICONS: Record<string, string> = {
  streak_7: '🔥',
  streak_30: '🌙',
  streak_100: '💯',
  hours_100: '⏳',
  skill_half: '🌳',
  first_heart: '🌱'
};

/** 勋章墙 */
export default function BadgeWall({ achievements }: BadgeWallProps) {
  const unlockedCount = achievements.filter((a) => a.unlocked_at).length;

  return (
    <div className="badge-wall card">
      <div className="bw-header">
        <h3>成就勋章</h3>
        <span className="counter">
          {unlockedCount} / {achievements.length}
        </span>
      </div>
      <div className="badge-grid">
        {achievements.map((a) => {
          const unlocked = Boolean(a.unlocked_at);
          return (
            <div key={a.code} className={`badge ${unlocked ? 'unlocked' : 'locked'}`}>
              <div className="badge-icon">
                {unlocked ? (
                  <span className="emoji">{BADGE_ICONS[a.code] ?? '⭐'}</span>
                ) : (
                  <Lock size={22} />
                )}
              </div>
              <div className="badge-info">
                <strong>{a.title}</strong>
                <span className="desc">{a.description}</span>
                {unlocked && a.unlocked_at && (
                  <span className="date">
                    <Check size={11} />
                    {new Date(a.unlocked_at).toLocaleDateString('zh-CN')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface IntentionBoardProps {
  intention: string;
  onSave: (text: string) => void;
}

/** 初心板：写下出发的理由 */
export function IntentionBoard({ intention, onSave }: IntentionBoardProps) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(intention);

  const handleSave = () => {
    onSave(text.trim());
    setEditing(false);
  };

  return (
    <div className="intention-board card">
      <div className="ib-header">
        <Heart size={18} className="heart-icon" />
        <h3>初心板</h3>
      </div>
      <p className="ib-hint muted">写下你出发的理由，迷茫时回来看看。</p>

      {editing ? (
        <div className="ib-edit">
          <textarea
            value={text}
            placeholder="我为什么要开始这段旅程？我想成为什么样的自己？"
            maxLength={300}
            rows={4}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          <div className="ib-actions">
            <button className="ib-btn save" onClick={handleSave}>
              <Save size={14} /> 保存
            </button>
            <button
              className="ib-btn cancel"
              onClick={() => {
                setText(intention);
                setEditing(false);
              }}
            >
              <X size={14} /> 取消
            </button>
          </div>
        </div>
      ) : (
        <div className="ib-display" onClick={() => setEditing(true)}>
          {intention ? (
            <p className="ib-text">"{intention}"</p>
          ) : (
            <p className="ib-placeholder muted">点击这里，写下你的初心…</p>
          )}
          <button className="ib-edit-btn">
            <Edit3 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
