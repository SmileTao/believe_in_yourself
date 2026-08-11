import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Upload, Image, Video, Check, X, AlertCircle } from 'lucide-react';
import './EvidenceDialog.less';

interface AttachmentInfo {
  attachmentPath: string;
  attachmentType: 'screenshot' | 'video';
  attachmentName: string;
}

interface EvidenceDialogProps {
  planName: string;
  dayKey: string;
  planId: string;
  existingAttachment?: AttachmentInfo | null;
  onClose: () => void;
  onConfirm: (attachment: AttachmentInfo | null) => void;
}

/** 学习证据上传弹窗：截图或视频二选一 */
export default function EvidenceDialog({
  planName,
  dayKey,
  planId,
  existingAttachment,
  onClose,
  onConfirm
}: EvidenceDialogProps) {
  const [attachment, setAttachment] = useState<AttachmentInfo | null>(existingAttachment ?? null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelectFile = async () => {
    setError('');
    setLoading(true);
    const result = await window.api.selectAttachment({ planId, dayKey });
    setLoading(false);

    if (result.canceled) return;
    if (!result.ok) {
      setError(result.error ?? '选择文件失败');
      return;
    }
    setAttachment({
      attachmentPath: result.attachmentPath!,
      attachmentType: result.attachmentType!,
      attachmentName: result.attachmentName!
    });
  };

  const handleConfirm = () => {
    if (!attachment) return;
    onConfirm(attachment);
  };

  const attUrl = attachment ? `att://${attachment.attachmentPath}` : null;

  return createPortal(
    <div className="evidence-overlay" onClick={onClose}>
      <div className="evidence-dialog card" onClick={(e) => e.stopPropagation()}>
        <div className="ev-header">
          <h3>上传学习证据</h3>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <p className="ev-plan-name muted">
          {planName} · {dayKey}
        </p>
        <p className="ev-hint">
          上传一张截图或一段视频，证明你今天完成了。不校验内容，只做记录。
        </p>

        {/* 已选文件 / 预览区 */}
        {attachment && attUrl ? (
          <div className="ev-preview">
            {attachment.attachmentType === 'screenshot' ? (
              <img src={attUrl} alt="学习截图" className="preview-img" />
            ) : (
              <video src={attUrl} controls className="preview-video" />
            )}
            <div className="preview-info">
              <span className="file-type">
                {attachment.attachmentType === 'screenshot' ? (
                  <><Image size={14} /> 截图</>
                ) : (
                  <><Video size={14} /> 视频</>
                )}
              </span>
              <span className="file-name muted">{attachment.attachmentName}</span>
              <button className="reselect-btn" onClick={handleSelectFile}>
                重新选择
              </button>
            </div>
          </div>
        ) : (
          <button className="ev-upload-zone" onClick={handleSelectFile} disabled={loading}>
            {loading ? (
              <span className="muted">正在选择…</span>
            ) : (
              <>
                <Upload size={32} />
                <span>点击选择截图或视频</span>
                <small className="muted">截图 ≤ 10MB · 视频 ≤ 500MB</small>
              </>
            )}
          </button>
        )}

        {error && (
          <p className="ev-error">
            <AlertCircle size={14} />
            {error}
          </p>
        )}

        {/* 底部操作 */}
        <div className="ev-footer">
          <button className="ev-btn cancel" onClick={onClose}>取消</button>
          <button
            className="ev-btn confirm"
            onClick={handleConfirm}
            disabled={!attachment || loading}
          >
            <Check size={15} />
            确认打卡
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
