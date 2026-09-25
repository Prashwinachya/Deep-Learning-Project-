import { X, Cpu, Check } from 'lucide-react';
import type { ModelConfig } from '../../types/traffic';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ModelConfig;
  onChangeConfig: (newConfig: ModelConfig) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Cpu size={18} style={{ color: 'var(--cyan-primary)' }} />
            <span style={{ fontSize: 15, fontWeight: 700 }}>AI Inference & Detection Architecture</span>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ padding: 6, borderRadius: '50%' }}
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Model Weights Selector */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
              YOLO MODEL BACKBONE
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { id: 'YOLOv11x', name: 'YOLOv11x (Heavy)', desc: 'Enterprise Traffic Accuracy • 68.2 mAP' },
                { id: 'YOLOv11m', name: 'YOLOv11m (Medium)', desc: 'High Throughput Balanced • 54.1 mAP' },
                { id: 'YOLOv11s', name: 'YOLOv11s (Fast)', desc: 'Edge Device Lightweight • 46.8 mAP' },
                { id: 'YOLOv8x', name: 'YOLOv8x (Legacy)', desc: 'Standard Benchmark Weights' },
              ].map((m) => (
                <div
                  key={m.id}
                  onClick={() => onChangeConfig({ ...config, modelName: m.id as any })}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    background: config.modelName === m.id ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: config.modelName === m.id ? '1px solid var(--cyan-primary)' : '1px solid var(--glass-border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <strong style={{ fontSize: 12.5, color: config.modelName === m.id ? 'var(--cyan-primary)' : 'var(--text-primary)' }}>
                      {m.name}
                    </strong>
                    {config.modelName === m.id && <Check size={14} style={{ color: 'var(--cyan-primary)' }} />}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{m.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tracker Selection */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
              OBJECT TRACKING ENGINE
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['ByteTrack', 'BoT-SORT'].map((tracker) => (
                <button
                  key={tracker}
                  className={`btn ${config.tracker === tracker ? 'btn-cyber' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: 10 }}
                  onClick={() => onChangeConfig({ ...config, tracker: tracker as any })}
                >
                  <span>{tracker}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Visual Overlays Toggles */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
              HUD TELEMETRY OVERLAYS
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Bounding Boxes', key: 'showBoundingBoxes' },
                { label: 'Tracking IDs & Class', key: 'showTrackIds' },
                { label: 'Trajectory Trails', key: 'showTrajectoryTrails' },
                { label: 'Speed Estimates (km/h)', key: 'showSpeedEstimates' },
                { label: 'Counting Gate Line', key: 'showCountingLine' },
              ].map((item) => (
                <label
                  key={item.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--glass-border-subtle)',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  <span>{item.label}</span>
                  <input
                    type="checkbox"
                    checked={(config as any)[item.key]}
                    onChange={(e) => onChangeConfig({ ...config, [item.key]: e.target.checked })}
                    style={{ accentColor: 'var(--cyan-primary)', cursor: 'pointer' }}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Processing Resolution */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, display: 'block' }}>
              INFERENCE RESOLUTION
            </label>
            <select
              value={config.resolution}
              onChange={(e) => onChangeConfig({ ...config, resolution: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                background: '#090d15',
                color: 'var(--text-primary)',
                border: '1px solid var(--glass-border)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
              }}
            >
              <option value="1920x1080">1920x1080 (FHD 1080p - Recommended)</option>
              <option value="1280x720">1280x720 (HD 720p - High Speed)</option>
              <option value="2560x1440">2560x1440 (2K QHD - High Density)</option>
              <option value="3840x2160">3840x2160 (4K UHD - Maximum Zoom)</option>
            </select>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};
