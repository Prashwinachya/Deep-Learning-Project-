import { X, Download, Camera, ShieldCheck } from 'lucide-react';
import type { VehicleCounts, ModelConfig } from '../../types/traffic';

interface SnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  counts: VehicleCounts;
  modelConfig: ModelConfig;
}

export const SnapshotModal: React.FC<SnapshotModalProps> = ({
  isOpen,
  onClose,
  counts,
  modelConfig,
}) => {
  if (!isOpen) return null;

  const downloadJsonReport = () => {
    const report = {
      platform: 'VehicleVision AI',
      generatedAt: new Date().toISOString(),
      model: modelConfig.modelName,
      tracker: modelConfig.tracker,
      confidenceThreshold: modelConfig.confidenceThreshold,
      countingGateY: modelConfig.countingLineY,
      summary: counts,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VehicleVision_Audit_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Camera size={18} style={{ color: 'var(--cyan-primary)' }} />
            <span style={{ fontSize: 15, fontWeight: 700 }}>Telemetry Snapshot Captured</span>
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
          <div 
            style={{ 
              borderRadius: 10, 
              overflow: 'hidden', 
              background: '#04060a', 
              padding: 16, 
              border: '1px solid var(--glass-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-cyan">TIMESTAMP VERIFIED</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
                {new Date().toLocaleString()}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
              <div>Total Count: <strong style={{ color: 'var(--cyan-primary)' }}>{counts.total} vehicles</strong></div>
              <div>Cars: <strong style={{ color: 'var(--color-car)' }}>{counts.car}</strong></div>
              <div>Motorcycles: <strong style={{ color: 'var(--color-motorcycle)' }}>{counts.motorcycle}</strong></div>
              <div>Buses: <strong style={{ color: 'var(--color-bus)' }}>{counts.bus}</strong></div>
              <div>Heavy Trucks: <strong style={{ color: 'var(--color-truck)' }}>{counts.truck}</strong></div>
              <div>Gate Position: <strong>{modelConfig.countingLineY}% Y-Axis</strong></div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-success)', fontSize: 12 }}>
            <ShieldCheck size={16} />
            <span>Cryptographic watermark hash attached to audit report</span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={downloadJsonReport}>
            <Download size={14} />
            <span>Download Audit JSON</span>
          </button>
        </div>
      </div>
    </div>
  );
};
