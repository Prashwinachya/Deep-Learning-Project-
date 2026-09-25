import React, { useRef, useEffect, useState } from 'react';
import { CanvasDetector } from './CanvasDetector';
import { EmptyState } from '../common/EmptyState';
import { 
  Radio, 
  Crosshair, 
  Eye, 
  EyeOff
} from 'lucide-react';
import type { VehicleTrack, ModelConfig, InputMode, SystemStatus, BackendDetection } from '../../types/traffic';

interface LiveViewProps {
  tracksRef: React.MutableRefObject<VehicleTrack[]>;
  modelConfig: ModelConfig;
  lineFlashed: boolean;
  onLinePositionChange: (newY: number) => void;
  systemStatus: SystemStatus;
  inputMode: InputMode;
  fps: number;
  uploadedFile: { name: string; size: string; type: string } | null;
  uploadProgress: number;
  annotatedImageB64?: string | null;
  onToggleBoxes: () => void;
  onToggleTrails: () => void;
  onSendWebcamFrame?: (blob: Blob) => Promise<{ image_base64?: string; detections?: BackendDetection[] }>;
}

export const LiveView: React.FC<LiveViewProps> = ({
  tracksRef,
  modelConfig,
  lineFlashed,
  onLinePositionChange,
  systemStatus,
  inputMode,
  fps,
  uploadedFile,
  uploadProgress,
  annotatedImageB64,
  onToggleBoxes,
  onToggleTrails,
  onSendWebcamFrame,
}) => {
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);
  const webcamCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [webcamAnnotatedUrl, setWebcamAnnotatedUrl] = useState<string | null>(null);

  // Webcam stream capture and frame polling
  useEffect(() => {
    let stream: MediaStream | null = null;
    let frameInterval: any = null;

    if (inputMode === 'webcam') {
      navigator.mediaDevices?.getUserMedia({ video: { width: 960, height: 540 }, audio: false })
        .then((s) => {
          stream = s;
          if (webcamVideoRef.current) {
            webcamVideoRef.current.srcObject = s;
          }

          // Offscreen canvas for grabbing frames every 120ms
          const hiddenCanvas = document.createElement('canvas');
          hiddenCanvas.width = 640;
          hiddenCanvas.height = 360;
          const hCtx = hiddenCanvas.getContext('2d');

          frameInterval = setInterval(() => {
            if (webcamVideoRef.current && hCtx && onSendWebcamFrame && systemStatus !== 'paused' && systemStatus !== 'stopped') {
              hCtx.drawImage(webcamVideoRef.current, 0, 0, 640, 360);
              hiddenCanvas.toBlob((blob) => {
                if (blob) {
                  onSendWebcamFrame(blob).then((res) => {
                    if (res && res.image_base64) {
                      setWebcamAnnotatedUrl(res.image_base64);
                    }
                  });
                }
              }, 'image/jpeg', 0.75);
            }
          }, 120);
        })
        .catch(() => {
          console.warn('Webcam access was denied or not found');
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (frameInterval) clearInterval(frameInterval);
      setWebcamAnnotatedUrl(null);
    };
  }, [inputMode, onSendWebcamFrame, systemStatus]);

  return (
    <div className="live-viewport-card">
      {/* Viewport Top Header HUD */}
      <div className="viewport-header-hud">
        <div className="viewport-title-group">
          <div className="badge badge-cyan">
            <Radio size={12} style={{ animation: 'glow-pulse 1.5s infinite' }} />
            <span>LIVE VIEWPORT</span>
          </div>

          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {inputMode === 'demo' && 'Highway Junction Cam 04 • Real-Time Stream'}
            {inputMode === 'webcam' && 'Local Camera Feed • Real-Time Detection'}
            {inputMode === 'video' && `Video Stream • ${uploadedFile?.name || 'Uploaded File'}`}
            {inputMode === 'image' && `Static Image Inference • ${uploadedFile?.name || 'Analyzed'}`}
          </span>
        </div>

        <div className="viewport-hud-pills">
          <div className="hud-tag hud-tag-live">
            <span className="status-dot status-dot-active" style={{ background: '#f43f5e', boxShadow: '0 0 8px #f43f5e' }} />
            <span>REC</span>
          </div>

          <div className="hud-tag hud-tag-fps">
            <span>FPS:</span>
            <strong style={{ color: 'var(--cyan-primary)' }}>{fps}</strong>
          </div>

          <div className="hud-tag">
            <span>RES:</span>
            <strong>{modelConfig.resolution}</strong>
          </div>

          <button 
            className="btn btn-secondary" 
            style={{ padding: '4px 8px', fontSize: 11 }}
            onClick={onToggleBoxes}
            title="Toggle Bounding Boxes"
          >
            {modelConfig.showBoundingBoxes ? <Eye size={13} /> : <EyeOff size={13} />}
            <span>Boxes</span>
          </button>

          <button 
            className="btn btn-secondary" 
            style={{ padding: '4px 8px', fontSize: 11 }}
            onClick={onToggleTrails}
            title="Toggle Motion Trajectories"
          >
            <Crosshair size={13} />
            <span>Trails</span>
          </button>
        </div>
      </div>

      {/* Main Viewport Screen */}
      <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
        {systemStatus === 'analyzing' ? (
          <EmptyState 
            type="analyzing" 
            title="AI Model Analyzing Stream..." 
            description="Extracting frames, parsing spatial coordinates, and initializing ByteTrack object associations."
            progress={uploadProgress}
          />
        ) : systemStatus === 'stopped' ? (
          <EmptyState 
            type="empty" 
            title="Detection Stream Paused" 
            description="Click 'Start Detection' on the controls panel below to resume real-time computer vision inference."
          />
        ) : inputMode === 'video' ? (
          /* Real Backend MJPEG Stream for Uploaded Video */
          <div className="video-screen-container">
            <img 
              src="http://127.0.0.1:8001/api/stream/video"
              alt="YOLO Video Stream"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => {
                // If stream reconnecting
                (e.target as HTMLImageElement).src = 'http://127.0.0.1:8001/api/stream/video?' + Date.now();
              }}
            />
            {/* Corner Reticles */}
            <div className="hud-corner-bracket tl" />
            <div className="hud-corner-bracket tr" />
            <div className="hud-corner-bracket bl" />
            <div className="hud-corner-bracket br" />
          </div>
        ) : inputMode === 'image' && annotatedImageB64 ? (
          /* Real Backend Annotated Image */
          <div className="video-screen-container">
            <img 
              src={annotatedImageB64}
              alt="YOLO Image Inference"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
            <div className="hud-corner-bracket tl" />
            <div className="hud-corner-bracket tr" />
            <div className="hud-corner-bracket bl" />
            <div className="hud-corner-bracket br" />
          </div>
        ) : inputMode === 'webcam' ? (
          /* Live Webcam Stream with Real Backend YOLO Annotation */
          <div className="video-screen-container">
            {webcamAnnotatedUrl ? (
              <img 
                src={webcamAnnotatedUrl}
                alt="Webcam YOLO Detection"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <video 
                ref={webcamVideoRef} 
                autoPlay 
                playsInline 
                muted 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            )}
            <canvas ref={webcamCanvasRef} style={{ display: 'none' }} />

            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <div className="hud-corner-bracket tl" />
              <div className="hud-corner-bracket tr" />
              <div className="hud-corner-bracket bl" />
              <div className="hud-corner-bracket br" />
              <div 
                className={`counting-line-guide ${lineFlashed ? 'line-flashed' : ''}`}
                style={{ top: `${modelConfig.countingLineY}%` }}
              >
                <div className="counting-line-badge">GATE Y:{Math.round(modelConfig.countingLineY)}%</div>
              </div>
            </div>
          </div>
        ) : (
          /* Canvas Highway Detector */
          <CanvasDetector
            tracksRef={tracksRef}
            modelConfig={modelConfig}
            lineFlashed={lineFlashed}
            onLinePositionChange={onLinePositionChange}
          />
        )}
      </div>
    </div>
  );
};
