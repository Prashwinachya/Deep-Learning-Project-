import { 
  Camera, 
  Cpu, 
  Settings, 
  Maximize2, 
  Radio,
  ChevronDown
} from 'lucide-react';
import type { SystemStatus } from '../../types/traffic';

interface HeaderProps {
  systemStatus: SystemStatus;
  onOpenSettings: () => void;
  onTakeSnapshot: () => void;
  inputMode: string;
}

export const Header: React.FC<HeaderProps> = ({
  systemStatus,
  onOpenSettings,
  onTakeSnapshot,
  inputMode,
}) => {
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="top-nav">
      {/* Brand Section */}
      <div className="brand-section">
        <div className="brand-logo-glow">
          <Cpu size={22} />
        </div>
        <div className="brand-title-wrap">
          <div className="brand-title">
            VehicleVision <span style={{ color: 'var(--cyan-primary)' }}>AI</span>
          </div>
          <span className="brand-subtitle">Traffic Intelligence Platform</span>
        </div>
      </div>

      {/* Nav Center: Camera Source & Online Status */}
      <div className="nav-center-actions">
        <div className="camera-source-pill">
          <Camera size={14} style={{ color: 'var(--cyan-primary)' }} />
          <span>Stream:</span>
          <strong style={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>
            {inputMode === 'demo' ? 'Cam 04 • Highway Junction' : inputMode === 'webcam' ? 'Live USB Webcam' : `${inputMode} Stream`}
          </strong>
          <ChevronDown size={13} style={{ color: 'var(--text-muted)' }} />
        </div>

        {/* System Online Badge */}
        <div className="badge badge-green" style={{ padding: '5px 12px' }}>
          <span className="status-dot status-dot-active" />
          <span>
            {systemStatus === 'online' ? 'System Online' : 
             systemStatus === 'analyzing' ? 'AI Analyzing' : 
             systemStatus === 'paused' ? 'Stream Paused' : 'System Standby'}
          </span>
        </div>

        <div className="hud-tag" style={{ border: 'none', background: 'transparent' }}>
          <Radio size={13} style={{ color: 'var(--cyan-primary)', animation: 'glow-pulse 1.5s infinite' }} />
          <span>ByteTrack Active</span>
        </div>
      </div>

      {/* Nav Right: Actions & Profile */}
      <div className="nav-right-actions">
        <button 
          className="btn btn-secondary" 
          onClick={onTakeSnapshot}
          title="Capture High-Res Inference Snapshot"
        >
          <Camera size={15} />
          <span>Snapshot</span>
        </button>

        <button 
          className="btn btn-secondary" 
          onClick={onOpenSettings}
          title="Model & Detection Settings"
        >
          <Settings size={15} />
          <span>Settings</span>
        </button>

        <button 
          className="btn btn-secondary" 
          onClick={toggleFullscreen}
          title="Toggle Fullscreen Dashboard"
          style={{ padding: '8px 10px' }}
        >
          <Maximize2 size={15} />
        </button>

        <div 
          style={{ 
            width: 34, 
            height: 34, 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
          title="Operator: Smart City Command Center"
        >
          SC
        </div>
      </div>
    </header>
  );
};
