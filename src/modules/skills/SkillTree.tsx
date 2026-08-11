import { useState } from 'react';
import { Lock, BookOpen, PlayCircle, CheckCircle2, ExternalLink, Clock, X, RotateCcw } from 'lucide-react';
import type { SkillNode } from '@shared/contracts';
import { SKILL_TREE } from '@shared/constants';
import './SkillTree.less';

interface SkillTreeProps {
  nodes: SkillNode[];
  onUpdateStatus: (code: string, status: SkillNode['status'], note?: string) => Promise<void>;
}

const STATUS_CONFIG = {
  locked: { icon: Lock, label: '待解锁', color: 'muted' },
  available: { icon: PlayCircle, label: '可开始', color: 'accent' },
  doing: { icon: BookOpen, label: '进行中', color: 'warning' },
  done: { icon: CheckCircle2, label: '已完成', color: 'success' }
} as const;

const LEVEL_NAMES = [
  '', '基础', 'LLM 接入', 'Prompt 工程', 'RAG',
  'Agent 框架', '进阶', '工程化', '实战'
];

/** AI Agent 技能树：8层35节点，垂直分层布局 */
export default function SkillTree({ nodes, onUpdateStatus }: SkillTreeProps) {
  const [selected, setSelected] = useState<SkillNode | null>(null);
  const [reflectNode, setReflectNode] = useState<SkillNode | null>(null);
  const [reflection, setReflection] = useState('');
  const [reflecting, setReflecting] = useState(false);

  // 节点按 code 索引
  const nodeMap = new Map(nodes.map((n) => [n.code, n]));

  // 统计完成度
  const doneCount = nodes.filter((n) => n.status === 'done').length;
  const totalCount = nodes.length;
  const progress = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  const handleClick = async (node: SkillNode) => {
    if (node.status === 'locked') return;
    if (node.status === 'available') {
      // 先切到 doing，再立即弹出感悟框（一步完成）
      await onUpdateStatus(node.code, 'doing');
      setReflectNode({ ...node, status: 'doing' });
      setReflection(node.note ?? '');
      return;
    }
    if (node.status === 'doing') {
      // 弹出感悟框
      setReflectNode(node);
      setReflection(node.note ?? '');
      return;
    }
    // done → 打开详情
    setSelected(node);
  };

  const handleConfirmReflection = async () => {
    if (!reflectNode || !reflection.trim()) return;
    setReflecting(true);
    await onUpdateStatus(reflectNode.code, 'done', reflection.trim());
    setReflecting(false);
    setReflectNode(null);
    setReflection('');
  };

  /** 取消感悟：如果是刚从 available 切来的 doing（没有 note），回退到 available */
  const handleCancelReflection = async () => {
    if (reflecting) return;
    if (reflectNode && reflectNode.status === 'doing' && !reflectNode.note) {
      await onUpdateStatus(reflectNode.code, 'available');
    }
    setReflectNode(null);
    setReflection('');
  };

  /** 撤销已完成节点 → 回退到 doing */
  const handleRevertDone = async (node: SkillNode) => {
    await onUpdateStatus(node.code, 'doing');
    setSelected(null);
  };

  const cycleStatus = async (node: SkillNode) => {
    // 从 done 切回 doing（撤销完成）
    if (node.status === 'done') await onUpdateStatus(node.code, 'doing');
    // 从 doing 到 done，需要感悟弹窗
    else if (node.status === 'doing') {
      setReflectNode(node);
      setReflection(node.note ?? '');
    }
  };

  return (
    <div className="skill-tree">
      {/* 总进度 */}
      <div className="tree-progress card">
        <div className="progress-info">
          <h3>技能树完成度</h3>
          <span className="progress-num">
            {doneCount} / {totalCount} · {progress}%
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* 逐层展示 */}
      <div className="tree-layers">
        {SKILL_TREE.map((layer) => {
          const layerNodes = layer.nodes
            .map((n) => nodeMap.get(n.code))
            .filter((n): n is SkillNode => n !== undefined);
          const layerDone = layerNodes.filter((n) => n.status === 'done').length;
          const layerTotal = layerNodes.length;

          return (
            <div key={layer.level} className="tree-layer">
              <div className="layer-label">
                <span className="layer-badge">L{layer.level}</span>
                <span className="layer-name">{LEVEL_NAMES[layer.level]}</span>
                <span className="layer-count">
                  {layerDone}/{layerTotal}
                </span>
              </div>
              <div className="layer-nodes">
                {layerNodes.map((node) => {
                  const cfg = STATUS_CONFIG[node.status];
                  const Icon = cfg.icon;
                  return (
                    <button
                      key={node.code}
                      className={`skill-node ${node.status}`}
                      onClick={() => handleClick(node)}
                      title={node.description ?? node.name}
                    >
                      <Icon size={16} className={node.status === 'doing' ? 'spin' : ''} />
                      <span className="node-name">{node.name}</span>
                      {node.actual_hours != null && (
                        <span className="node-hours">
                          <Clock size={11} />
                          {node.actual_hours}h
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 节点详情弹窗 */}
      {selected && (
        <div className="node-detail-overlay" onClick={() => setSelected(null)}>
          <div className="node-detail card" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelected(null)}>
              <X size={18} />
            </button>
            <div className="detail-head">
              <span className="detail-code">{selected.code}</span>
              <h3>{selected.name}</h3>
              <span className={`detail-status ${selected.status}`}>
                {STATUS_CONFIG[selected.status].label}
              </span>
            </div>
            {selected.description && <p className="detail-desc">{selected.description}</p>}
            {selected.note && (
              <div className="detail-section">
                <small className="muted">学习笔记</small>
                <p>{selected.note}</p>
              </div>
            )}
            <div className="detail-meta">
              {selected.est_hours != null && (
                <span className="meta-chip">
                  预计 {selected.est_hours}h
                </span>
              )}
              {selected.actual_hours != null && (
                <span className="meta-chip">
                  实际 {selected.actual_hours}h
                </span>
              )}
              {selected.resource_url && (
                <a
                  href={selected.resource_url}
                  className="meta-link"
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={13} />
                  资源链接
                </a>
              )}
            </div>
            <div className="detail-actions">
              {selected.status === 'done' && (
                <button
                  className="revert-btn"
                  onClick={() => handleRevertDone(selected)}
                >
                  <RotateCcw size={14} />
                  撤销完成
                </button>
              )}
              <button
                className="action-btn"
                onClick={() => cycleStatus(selected)}
              >
                {selected.status === 'done' ? '标记为进行中' : '标记为完成'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 感悟弹窗：点亮节点前必须写总结 */}
      {reflectNode && (
        <div className="node-detail-overlay" onClick={handleCancelReflection}>
          <div className="node-detail card reflect-dialog" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={handleCancelReflection} disabled={reflecting}>
              <X size={18} />
            </button>
            <div className="reflect-head">
              <span className="detail-code">{reflectNode.code}</span>
              <h3>点亮「{reflectNode.name}」</h3>
              <p className="reflect-hint muted">
                写下你学到了什么、有什么感悟。这一步是为了证明你真正学过了。
              </p>
            </div>
            <textarea
              className="reflect-input"
              value={reflection}
              placeholder="我学到了…这个概念的核心是…我的理解是…"
              maxLength={500}
              rows={6}
              onChange={(e) => setReflection(e.target.value)}
              autoFocus
              disabled={reflecting}
            />
            <div className="reflect-footer">
              <span className="char-count muted">{reflection.length}/500</span>
              <div className="reflect-actions">
                <button
                  className="reflect-cancel-btn"
                  onClick={handleCancelReflection}
                  disabled={reflecting}
                >
                  取消
                </button>
                <button
                  className="action-btn"
                  onClick={handleConfirmReflection}
                  disabled={!reflection.trim() || reflecting}
                >
                  {reflecting ? '保存中…' : '确认点亮 ✓'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
