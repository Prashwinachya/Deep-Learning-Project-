export type VehicleType = 'car' | 'motorcycle' | 'bus' | 'truck' | 'bicycle';

export interface BoundingBox {
  x: number; // percentage 0-100 or canvas pixels
  y: number;
  width: number;
  height: number;
}

export interface VehicleTrack {
  id: number;
  type: VehicleType;
  confidence: number;
  speedKmH: number;
  direction: 'inbound' | 'outbound';
  x: number; // current x in %
  y: number; // current y in %
  width: number;
  height: number;
  trajectory: Array<{ x: number; y: number }>;
  counted: boolean;
  timestamp: number;
  lane: number;
  color: string;
}

export interface DetectionEvent {
  id: string;
  trackId: number;
  type: VehicleType;
  confidence: number;
  direction: 'inbound' | 'outbound';
  speedKmH: number;
  timestamp: Date;
  lane: number;
}

export interface VehicleCounts {
  total: number;
  car: number;
  motorcycle: number;
  bus: number;
  truck: number;
  bicycle: number;
  inbound: number;
  outbound: number;
}

export interface TimeSeriesPoint {
  time: string;
  cars: number;
  motorcycles: number;
  buses: number;
  trucks: number;
  bicycles: number;
  total: number;
  density: number;
}

export type InputMode = 'demo' | 'webcam' | 'video' | 'image';

export type SystemStatus = 'online' | 'analyzing' | 'paused' | 'stopped' | 'error';

export interface ModelConfig {
  modelName: 'YOLOv11x' | 'YOLOv11m' | 'YOLOv11s' | 'YOLOv8x' | 'yolov8n';
  confidenceThreshold: number; // 0.1 - 0.99
  iouThreshold: number;
  tracker: 'ByteTrack' | 'BoT-SORT';
  countingLineY: number; // percentage 10-90
  targetFps: number;
  showBoundingBoxes: boolean;
  showTrackIds: boolean;
  showTrajectoryTrails: boolean;
  showSpeedEstimates: boolean;
  showCountingLine: boolean;
  resolution: string;
}

export interface BackendDetection {
  box: [number, number, number, number]; // [x1, y1, x2, y2] normalized or px
  class_name: VehicleType;
  confidence: number;
  track_id: number | null;
  direction?: 'inbound' | 'outbound';
  speed?: number;
}

export interface BackendStats {
  counts: VehicleCounts;
  fps: number;
  recent_events: Array<{
    id: string;
    track_id: number;
    class_name: VehicleType;
    confidence: number;
    direction: 'inbound' | 'outbound';
    speed: number;
    timestamp: string;
    lane: number;
  }>;
  line_flashed: boolean;
  status: SystemStatus;
}
