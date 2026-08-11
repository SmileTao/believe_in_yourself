import BadgeWall, { IntentionBoard } from './BadgeWall';
import { useAchievements } from '../../hooks/useAchievements';
import './Achievements.less';

/** 成就模块页面 */
export default function Achievements() {
  const { achievements, intention, loading, saveIntention } = useAchievements();

  if (loading) {
    return <div className="achievements-page"><p className="muted">加载中…</p></div>;
  }

  return (
    <div className="achievements-page">
      <h2 className="page-title">成就 & 初心</h2>
      <p className="page-subtitle muted">每一枚勋章，都是你坚持的证明。</p>

      <BadgeWall achievements={achievements} />

      <IntentionBoard intention={intention} onSave={saveIntention} />
    </div>
  );
}
