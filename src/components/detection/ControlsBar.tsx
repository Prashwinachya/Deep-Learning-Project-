import React from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Sliders, 
  Gauge, 
  Route, 
  Percent,
  Download
} from 'lucide-react';
import type { SystemStatus, ModelConfig } from '../../types/traffic';

interface ControlsBarProps {
  systemStatus: SystemStatus;
  modelConfig: ModelConfig;
  fps: number;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onReset: () => void;
  onConfidenceChange: (val: number) => void;
  onLineChange: (val: number) => void;
  onToggleTracking: () => void;
  onExportCsv: () => void;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  systemStatus,
  modelConfig,
  fps,
  onStart,
  onPause,
  onStop,
  onReset,
  onConfidenceChange,
  onLineChange,
  onToggleTracking,
  onExportCsv,
}) => {
  const isOnline = systemStatus === 'online';

  return (
    <div className="controls-card">
      <div className="controls-main-row">
        {/* Playback & Action Controls */}
        <div className="controls-button-group">
          {isOnline ? (
            <button className="btn btn-secondary" onClick={onPause}>
              <Pause size={15} />
              <span>Pause</span>
            </button>
          ) : (
            <button className="btn btn-primary" onClick={onStart}>
              <Play size={15} fill="currentColor" />
              <span>Start Detection</span>
            </button>
          )}

          <button 
            className="btn btn-secondary" 
            onClick={onStop}
            disabled={systemStatus === 'stopped'}
          >
            <Square size={14} />
            <span>Stop</span>
          </button>

          <button 
            className="btn btn-secondary" 
            onClick={onReset}
            title="Reset All Vehicle Counters"
          >
            <RotateCcw size={14} />
            <span>Reset Counter</span>
          </button>

          <button 
            className={`btn ${modelConfig.showTrackIds ? 'btn-cyber' : 'btn-secondary'}`}
            onClick={onToggleTracking}
            title="Toggle ByteTrack ID Overlays"
          >
            <Route size={14} />
            <span>Tracking {modelConfig.showTrackIds ? 'ON' : 'OFF'}</span>
          </button>

          <button 
            className="btn btn-secondary"
            onClick={onExportCsv}
            title="Export Detection Event Logs to CSV"
          >
            <Download size={14} style={{ color: 'var(--cyan-primary)' }} />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Live FPS / Telemetry Gauge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="hud-tag" style={{ background: 'rgba(0, 242, 254, 0.06)', borderColor: 'var(--glass-border)' }}>
            <Gauge size={14} style={{ color: 'var(--cyan-primary)' }} />
            <span>Target:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{modelConfig.targetFps} FPS</strong>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <span>Real:</span>
            <strong style={{ color: fps >= 25 ? 'var(--color-success)' : 'var(--color-truck)' }}>
              {fps} FPS
            </strong>
          </div>
        </div>
      </div>

      {/* Sliders Grid: Confidence Threshold & Counting Line Position */}
      <div className="controls-sliders-grid">
        {/* Confidence Slider */}
        <div className="control-slider-item">
          <div className="control-slider-label-row">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Percent size={13} style={{ color: 'var(--cyan-primary)' }} />
              <span>Detection Confidence Threshold</span>
            </span>
            <span className="slider-value-badge">
              {Math.round(modelConfig.confidenceThreshold * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.10"
            max="0.95"
            step="0.05"
            value={modelConfig.confidenceThreshold}
            onChange={(e) => onConfidenceChange(parseFloat(e.target.value))}
            className="cyber-slider"
          />
        </div>

        {/* Counting Line Position Slider */}
        <div className="control-slider-item">
          <div className="control-slider-label-row">
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sliders size={13} style={{ color: 'var(--cyan-primary)' }} />
              <span>Counting Line Position (Y-Axis)</span>
            </span>
            <span className="slider-value-badge">
              {Math.round(modelConfig.countingLineY)}%
            </span>
          </div>
          <input
            type="range"
            min="20"
            max="80"
            step="1"
            value={modelConfig.countingLineY}
            onChange={(e) => onLineChange(parseInt(e.target.value, 10))}
            className="cyber-slider"
          />
        </div>
      </div>
    </div>
  );
};
