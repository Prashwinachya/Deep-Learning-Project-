import React from 'react';
import { Loader2, AlertTriangle, VideoOff, SearchX } from 'lucide-react';

interface EmptyStateProps {
  type: 'empty' | 'analyzing' | 'no_vehicles' | 'error';
  title?: string;
  description?: string;
  progress?: number;
  onRetry?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type,
  title,
  description,
  progress,
  onRetry,
}) => {
  let defaultTitle = '';
  let defaultDesc = '';
  let icon = null;
  let circleBg = 'rgba(0, 242, 254, 0.08)';
  let borderColor = 'rgba(0, 242, 254, 0.25)';
  let iconColor = 'var(--cyan-primary)';

  switch (type) {
    case 'empty':
      defaultTitle = 'No Video Selected';
      defaultDesc = 'Upload a video or connect a camera to begin detection.';
      icon = <VideoOff size={28} />;
      break;
    case 'analyzing':
      defaultTitle = 'AI Model Analyzing Video...';
      defaultDesc = 'Processing frames and computing bounding box coordinates with YOLOv11x inference engine.';
      icon = <Loader2 size={30} className="animate-spin" style={{ animation: 'spin 1.5s linear infinite' }} />;
      break;
    case 'no_vehicles':
      defaultTitle = 'No Vehicles Detected';
      defaultDesc = 'No vehicles detected in the current frame. Adjust the confidence threshold or camera angle.';
      icon = <SearchX size={28} />;
      break;
    case 'error':
      defaultTitle = 'Inference Error';
      defaultDesc = 'Unable to process the video. Please verify the video codec or try another input stream.';
      circleBg = 'rgba(244, 63, 94, 0.12)';
      borderColor = 'rgba(244, 63, 94, 0.3)';
      iconColor = 'var(--color-danger)';
      icon = <AlertTriangle size={28} />;
      break;
  }

  return (
    <div className="state-container">
      <div 
        className="state-icon-circle"
        style={{ background: circleBg, border: `1px solid ${borderColor}`, color: iconColor }}
      >
        {icon}
      </div>

      <div className="state-title">{title || defaultTitle}</div>
      <div className="state-desc">{description || defaultDesc}</div>

      {type === 'analyzing' && typeof progress === 'number' && (
        <div style={{ width: 260, marginTop: 8 }}>
          <div className="progress-track">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--cyan-primary)', marginTop: 6 }}>
            ANALYSIS IN PROGRESS: {progress}%
          </div>
        </div>
      )}

      {type === 'error' && onRetry && (
        <button className="btn btn-cyber" onClick={onRetry} style={{ marginTop: 10 }}>
          Retry Processing
        </button>
      )}
    </div>
  );
};
