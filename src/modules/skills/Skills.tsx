import SkillTree from './SkillTree';
import { useSkills } from '../../hooks/useSkills';
import { Network } from 'lucide-react';

/** AI Agent 技能树模块页面 */
export default function Skills() {
  const { nodes, loading, updateStatus } = useSkills();

  return (
    <div className="skills-page">
      <div className="page-head">
        <div className="head-icon">
          <Network size={22} />
        </div>
        <div>
          <h2>AI Agent 学习路线</h2>
          <p className="muted">8 层 35 节点，逐层通关，从基础到实战。</p>
        </div>
      </div>

      {loading ? (
        <p className="muted">加载中…</p>
      ) : (
        <SkillTree nodes={nodes} onUpdateStatus={updateStatus} />
      )}
    </div>
  );
}
