import React from 'react';
import { Cpu, Activity, ShieldCheck, Zap } from 'lucide-react';
import type { ModelConfig } from '../../types/traffic';

interface FooterProps {
  modelConfig: ModelConfig;
  fps: number;
}

export const Footer: React.FC<FooterProps> = ({ modelConfig, fps }) => {
  return (
    <footer className="system-footer">
      <div className="footer-left">
        <div className="footer-pill" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
          <span>VehicleVision AI</span>
          <span style={{ color: 'var(--text-muted)' }}>•</span>
          <span style={{ color: 'var(--text-secondary)' }}>Real-Time Traffic Intelligence</span>
        </div>
      </div>

      <div className="footer-right">
        <div className="footer-pill">
          <Cpu size={13} style={{ color: 'var(--cyan-primary)' }} />
          <span>Model:</span>
          <strong>{modelConfig.modelName}</strong>
        </div>

        <div className="footer-pill">
          <Activity size={13} style={{ color: 'var(--color-motorcycle)' }} />
          <span>Tracking:</span>
          <strong>{modelConfig.tracker}</strong>
        </div>

        <div className="footer-pill">
          <Zap size={13} style={{ color: 'var(--color-success)' }} />
          <span>FPS:</span>
          <strong style={{ fontFamily: 'var(--font-mono)' }}>{fps} / {modelConfig.targetFps}</strong>
        </div>

        <div className="footer-pill">
          <span>Resolution:</span>
          <strong style={{ fontFamily: 'var(--font-mono)' }}>{modelConfig.resolution}</strong>
        </div>

        <div className="footer-pill">
          <ShieldCheck size={13} style={{ color: 'var(--color-success)' }} />
          <span>Inference:</span>
          <strong style={{ color: 'var(--color-success)' }}>14.2 ms (CUDA Active)</strong>
        </div>
      </div>
    </footer>
  );
};
