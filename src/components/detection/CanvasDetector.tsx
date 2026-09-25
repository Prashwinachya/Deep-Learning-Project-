import React, { useRef, useEffect } from 'react';
import type { VehicleTrack, ModelConfig } from '../../types/traffic';

interface CanvasDetectorProps {
  tracksRef: React.MutableRefObject<VehicleTrack[]>;
  modelConfig: ModelConfig;
  lineFlashed: boolean;
  onLinePositionChange?: (newY: number) => void;
  isPaused?: boolean;
}

export const CanvasDetector: React.FC<CanvasDetectorProps> = ({
  tracksRef,
  modelConfig,
  lineFlashed,
  onLinePositionChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingLineRef = useRef<boolean>(false);

  // Handle Dragging the Counting Line
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickYPercent = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Check if clicked near counting line (+- 4%)
    if (Math.abs(clickYPercent - modelConfig.countingLineY) < 5) {
      isDraggingLineRef.current = true;
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingLineRef.current || !containerRef.current || !onLinePositionChange) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newYPercent = Math.max(15, Math.min(85, ((e.clientY - rect.top) / rect.height) * 100));
    onLinePositionChange(newYPercent);
  };

  const handleMouseUp = () => {
    isDraggingLineRef.current = false;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let roadDashOffset = 0;

    const render = () => {
      // Handle canvas resolution
      const width = canvas.width;
      const height = canvas.height;

      // 1. Draw Road Surface & CCTV Lighting
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, 0, width, height);

      // Asphalt Road Bed
      const roadLeft = width * 0.12;
      const roadRight = width * 0.88;
      const roadWidth = roadRight - roadLeft;

      // Road background gradient
      const roadGrad = ctx.createLinearGradient(0, 0, 0, height);
      roadGrad.addColorStop(0, '#111622');
      roadGrad.addColorStop(0.5, '#0e131d');
      roadGrad.addColorStop(1, '#0b0f17');
      ctx.fillStyle = roadGrad;
      ctx.fillRect(roadLeft, 0, roadWidth, height);

      // Road Shoulders & Curbs
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(roadLeft, 0);
      ctx.lineTo(roadLeft, height);
      ctx.moveTo(roadRight, 0);
      ctx.lineTo(roadRight, height);
      ctx.stroke();

      // Yellow Median (Divider between Inbound & Outbound)
      const medianX = width * 0.5;
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(medianX - 3, 0);
      ctx.lineTo(medianX - 3, height);
      ctx.moveTo(medianX + 3, 0);
      ctx.lineTo(medianX + 3, height);
      ctx.stroke();

      // Dashed Lane Dividers (animated motion)
      roadDashOffset = (roadDashOffset + 2) % 40;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 20]);
      ctx.lineDashOffset = -roadDashOffset;

      // Lane 1 / 2 divider (inbound)
      ctx.beginPath();
      ctx.moveTo(width * 0.31, 0);
      ctx.lineTo(width * 0.31, height);
      ctx.stroke();

      // Lane 3 / 4 divider (outbound)
      ctx.beginPath();
      ctx.moveTo(width * 0.69, 0);
      ctx.lineTo(width * 0.69, height);
      ctx.stroke();

      ctx.setLineDash([]); // Reset dash

      // 2. Draw Counting Line
      if (modelConfig.showCountingLine) {
        const lineY = (modelConfig.countingLineY / 100) * height;

        ctx.save();
        if (lineFlashed) {
          ctx.strokeStyle = '#ffffff';
          ctx.shadowColor = '#00f2fe';
          ctx.shadowBlur = 30;
          ctx.lineWidth = 4;
        } else {
          ctx.strokeStyle = 'rgba(0, 242, 254, 0.85)';
          ctx.shadowColor = 'rgba(0, 242, 254, 0.4)';
          ctx.shadowBlur = 12;
          ctx.lineWidth = 2;
        }

        ctx.beginPath();
        ctx.moveTo(roadLeft, lineY);
        ctx.lineTo(roadRight, lineY);
        ctx.stroke();

        // Line directional indicators
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = lineFlashed ? '#ffffff' : '#00f2fe';
        ctx.fillText('COUNT LINE [DETECTION GATE]', roadLeft + 16, lineY - 8);
        ctx.fillText('▲ INBOUND', medianX - 90, lineY + 16);
        ctx.fillText('▼ OUTBOUND', medianX + 24, lineY + 16);
        ctx.restore();
      }

      // 3. Render Simulated Vehicles and Overlays
      const tracks = tracksRef.current;

      for (const track of tracks) {
        // Skip if below confidence threshold
        if (track.confidence < modelConfig.confidenceThreshold) continue;

        const posX = (track.x / 100) * width;
        const posY = (track.y / 100) * height;
        const vW = track.width;
        const vH = track.height;

        // Bounding box top-left
        const boxX = posX - vW / 2;
        const boxY = posY - vH / 2;

        // Trajectory Trail
        if (modelConfig.showTrajectoryTrails && track.trajectory.length > 1) {
          ctx.save();
          ctx.strokeStyle = track.color;
          ctx.lineWidth = 2;
          ctx.globalAlpha = 0.4;
          ctx.beginPath();
          track.trajectory.forEach((pt, idx) => {
            const tx = (pt.x / 100) * width;
            const ty = (pt.y / 100) * height;
            if (idx === 0) ctx.moveTo(tx, ty);
            else ctx.lineTo(tx, ty);
          });
          ctx.stroke();
          ctx.restore();
        }

        // Vehicle Body Graphics (Realistic vehicle shape with shadows and lights)
        ctx.save();
        
        // Vehicle ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.beginPath();
        ctx.roundRect(boxX + 6, boxY + 8, vW - 12, vH - 6, 8);
        ctx.fill();

        // Vehicle Chassis
        const chassisGrad = ctx.createLinearGradient(boxX, boxY, boxX + vW, boxY + vH);
        if (track.type === 'car') {
          chassisGrad.addColorStop(0, '#1e293b');
          chassisGrad.addColorStop(0.5, '#334155');
          chassisGrad.addColorStop(1, '#0f172a');
        } else if (track.type === 'motorcycle') {
          chassisGrad.addColorStop(0, '#581c87');
          chassisGrad.addColorStop(1, '#3b0764');
        } else if (track.type === 'bus') {
          chassisGrad.addColorStop(0, '#065f46');
          chassisGrad.addColorStop(1, '#022c22');
        } else {
          // truck
          chassisGrad.addColorStop(0, '#78350f');
          chassisGrad.addColorStop(1, '#451a03');
        }
        ctx.fillStyle = chassisGrad;
        ctx.beginPath();
        ctx.roundRect(boxX + 8, boxY + 4, vW - 16, vH - 8, 8);
        ctx.fill();

        // Windshield / Glass
        ctx.fillStyle = 'rgba(14, 165, 233, 0.4)';
        const glassY = track.direction === 'inbound' ? boxY + vH * 0.25 : boxY + vH * 0.6;
        ctx.fillRect(boxX + 12, glassY, vW - 24, vH * 0.15);

        // Headlights / Taillights
        if (track.direction === 'inbound') {
          // Headlights pointing down
          ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
          ctx.fillRect(boxX + 10, boxY + vH - 6, 8, 4);
          ctx.fillRect(boxX + vW - 18, boxY + vH - 6, 8, 4);
        } else {
          // Headlights pointing up
          ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
          ctx.fillRect(boxX + 10, boxY + 2, 8, 4);
          ctx.fillRect(boxX + vW - 18, boxY + 2, 8, 4);
        }

        ctx.restore();

        // 4. YOLO Bounding Box & HUD
        if (modelConfig.showBoundingBoxes) {
          ctx.save();
          ctx.strokeStyle = track.color;
          ctx.lineWidth = 1.5;
          ctx.shadowColor = track.color;
          ctx.shadowBlur = 8;
          ctx.strokeRect(boxX, boxY, vW, vH);

          // Corner brackets
          const bracketLen = 10;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          // Top-Left
          ctx.moveTo(boxX, boxY + bracketLen);
          ctx.lineTo(boxX, boxY);
          ctx.lineTo(boxX + bracketLen, boxY);
          // Top-Right
          ctx.moveTo(boxX + vW - bracketLen, boxY);
          ctx.lineTo(boxX + vW, boxY);
          ctx.lineTo(boxX + vW, boxY + bracketLen);
          // Bottom-Left
          ctx.moveTo(boxX, boxY + vH - bracketLen);
          ctx.lineTo(boxX, boxY + vH);
          ctx.lineTo(boxX + bracketLen, boxY + vH);
          // Bottom-Right
          ctx.moveTo(boxX + vW - bracketLen, boxY + vH);
          ctx.lineTo(boxX + vW, boxY + vH);
          ctx.lineTo(boxX + vW, boxY + vH - bracketLen);
          ctx.stroke();

          // Tracking ID / Class Tag (Requested format: CAR ID #27 94% CONFIDENCE)
          if (modelConfig.showTrackIds) {
            const confPct = Math.round(track.confidence * 100);
            const tagText = `${track.type.toUpperCase()} ID #${track.id}  ${confPct}%`;
            
            ctx.font = 'bold 10px "JetBrains Mono", monospace';
            const tagW = ctx.measureText(tagText).width + 12;
            const tagH = 18;
            const tagX = boxX;
            const tagY = boxY - tagH - 4;

            // Tag background
            ctx.fillStyle = 'rgba(8, 11, 17, 0.92)';
            ctx.fillRect(tagX, tagY, tagW, tagH);
            ctx.strokeStyle = track.color;
            ctx.lineWidth = 1;
            ctx.strokeRect(tagX, tagY, tagW, tagH);

            // Tag text
            ctx.fillStyle = track.color;
            ctx.fillText(tagText, tagX + 6, tagY + 13);

            // Speed badge if enabled
            if (modelConfig.showSpeedEstimates) {
              const speedText = `${track.speedKmH} km/h`;
              ctx.font = '9px "JetBrains Mono", monospace';
              const spdW = ctx.measureText(speedText).width + 8;
              const spdY = boxY + vH + 14;
              ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
              ctx.fillRect(boxX, spdY - 10, spdW, 14);
              ctx.fillStyle = '#94a3b8';
              ctx.fillText(speedText, boxX + 4, spdY);
            }
          }

          ctx.restore();
        }
      }

      // 5. CCTV Camera HUD Watermark
      ctx.save();
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 23);
      ctx.fillText(`CAM-04 • NORTH HWY JUNCTION • ${nowStr}`, 24, 28);
      ctx.fillText(`YOLOv11x • CONF > ${Math.round(modelConfig.confidenceThreshold * 100)}% • BYTETRACK`, 24, 46);
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [modelConfig, lineFlashed, tracksRef]);

  return (
    <div 
      ref={containerRef}
      className="video-screen-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        width={960}
        height={540}
        className="detection-canvas"
      />

      {/* Cyber Corner HUD Reticles */}
      <div className="hud-corner-bracket tl" />
      <div className="hud-corner-bracket tr" />
      <div className="hud-corner-bracket bl" />
      <div className="hud-corner-bracket br" />
    </div>
  );
};
