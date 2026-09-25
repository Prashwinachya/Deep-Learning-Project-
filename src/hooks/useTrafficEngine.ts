import { useState, useEffect, useRef, useCallback } from 'react';
import type { 
  VehicleType,
  VehicleTrack, 
  DetectionEvent, 
  VehicleCounts, 
  TimeSeriesPoint, 
  InputMode, 
  SystemStatus, 
  ModelConfig,
  BackendStats,
  BackendDetection
} from '../types/traffic';

const BACKEND_URL = 'http://127.0.0.1:8001';
const WS_URL = 'ws://127.0.0.1:8001/ws/telemetry';

const VEHICLE_CONFIGS: Record<VehicleType, { label: string; color: string; minSpeed: number; maxSpeed: number; width: number; height: number }> = {
  car: { label: 'CAR', color: '#38bdf8', minSpeed: 50, maxSpeed: 75, width: 68, height: 110 },
  motorcycle: { label: 'MOTORCYCLE', color: '#a855f7', minSpeed: 60, maxSpeed: 85, width: 32, height: 65 },
  bus: { label: 'BUS', color: '#10b981', minSpeed: 40, maxSpeed: 55, width: 85, height: 165 },
  truck: { label: 'TRUCK', color: '#f59e0b', minSpeed: 35, maxSpeed: 50, width: 90, height: 175 },
  bicycle: { label: 'BICYCLE', color: '#22d3ee', minSpeed: 20, maxSpeed: 30, width: 26, height: 55 },
};

const INITIAL_COUNTS: VehicleCounts = {
  total: 128,
  car: 82,
  motorcycle: 31,
  bus: 7,
  truck: 8,
  bicycle: 0,
  inbound: 72,
  outbound: 56,
};

const INITIAL_TRACKS: VehicleTrack[] = [
  {
    id: 27,
    type: 'car',
    confidence: 0.94,
    speedKmH: 64,
    direction: 'inbound',
    x: 32,
    y: 28,
    width: 68,
    height: 110,
    trajectory: [{ x: 32, y: 15 }, { x: 32, y: 22 }, { x: 32, y: 28 }],
    counted: false,
    timestamp: Date.now(),
    lane: 2,
    color: '#38bdf8',
  },
  {
    id: 31,
    type: 'truck',
    confidence: 0.91,
    speedKmH: 48,
    direction: 'outbound',
    x: 68,
    y: 72,
    width: 90,
    height: 175,
    trajectory: [{ x: 68, y: 88 }, { x: 68, y: 80 }, { x: 68, y: 72 }],
    counted: false,
    timestamp: Date.now(),
    lane: 3,
    color: '#f59e0b',
  },
  {
    id: 34,
    type: 'motorcycle',
    confidence: 0.97,
    speedKmH: 78,
    direction: 'outbound',
    x: 78,
    y: 35,
    width: 32,
    height: 65,
    trajectory: [{ x: 78, y: 55 }, { x: 78, y: 45 }, { x: 78, y: 35 }],
    counted: true,
    timestamp: Date.now(),
    lane: 4,
    color: '#a855f7',
  },
  {
    id: 36,
    type: 'bus',
    confidence: 0.93,
    speedKmH: 42,
    direction: 'inbound',
    x: 22,
    y: 75,
    width: 85,
    height: 165,
    trajectory: [{ x: 22, y: 50 }, { x: 22, y: 62 }, { x: 22, y: 75 }],
    counted: true,
    timestamp: Date.now(),
    lane: 1,
    color: '#10b981',
  },
];

export function useTrafficEngine() {
  const [counts, setCounts] = useState<VehicleCounts>(INITIAL_COUNTS);
  const [recentEvents, setRecentEvents] = useState<DetectionEvent[]>([
    { id: 'evt-1', trackId: 27, type: 'car', confidence: 0.94, direction: 'inbound', speedKmH: 62, timestamp: new Date(Date.now() - 1000), lane: 1 },
    { id: 'evt-2', trackId: 31, type: 'truck', confidence: 0.91, direction: 'inbound', speedKmH: 48, timestamp: new Date(Date.now() - 3200), lane: 2 },
    { id: 'evt-3', trackId: 34, type: 'motorcycle', confidence: 0.97, direction: 'outbound', speedKmH: 74, timestamp: new Date(Date.now() - 5800), lane: 3 },
  ]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>('online');
  const [inputMode, setInputMode] = useState<InputMode>('demo');
  const [fps, setFps] = useState<number>(60);
  const [lineFlashed, setLineFlashed] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string; type: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [annotatedImageB64, setAnnotatedImageB64] = useState<string | null>(null);
  const [imageDetections, setImageDetections] = useState<BackendDetection[]>([]);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);

  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    modelName: 'yolov8n',
    confidenceThreshold: 0.40,
    iouThreshold: 0.45,
    tracker: 'ByteTrack',
    countingLineY: 55, // 55% from top
    targetFps: 60,
    showBoundingBoxes: true,
    showTrackIds: true,
    showTrajectoryTrails: true,
    showSpeedEstimates: true,
    showCountingLine: true,
    resolution: '1920x1080',
  });

  // Time Series History for Recharts
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>(() => {
    const points: TimeSeriesPoint[] = [];
    const now = new Date();
    for (let i = 10; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 60000);
      points.push({
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        cars: 6 + Math.floor(Math.random() * 5),
        motorcycles: 2 + Math.floor(Math.random() * 3),
        buses: Math.floor(Math.random() * 2),
        trucks: 1 + Math.floor(Math.random() * 2),
        bicycles: Math.floor(Math.random() * 2),
        total: 10 + Math.floor(Math.random() * 8),
        density: 45 + Math.floor(Math.random() * 30),
      });
    }
    return points;
  });

  // Active Vehicle Tracks for Canvas Detector (Pre-seeded so vehicles are immediately visible)
  const tracksRef = useRef<VehicleTrack[]>(INITIAL_TRACKS);
  const nextTrackIdRef = useRef<number>(37);
  const lastSpawnTimeRef = useRef<number>(Date.now());
  const frameCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(performance.now());
  const requestRef = useRef<number | null>(null);

  // Trigger Counting Line Flash
  const triggerLineFlash = useCallback(() => {
    setLineFlashed(true);
    setTimeout(() => setLineFlashed(false), 300);
  }, []);

  // Spawn new vehicle on road
  const spawnVehicle = useCallback((): VehicleTrack => {
    const id = nextTrackIdRef.current++;
    const types: VehicleType[] = ['car', 'car', 'motorcycle', 'truck', 'bus', 'bicycle'];
    const type = types[Math.floor(Math.random() * types.length)];
    const config = VEHICLE_CONFIGS[type];
    const lane = Math.floor(Math.random() * 4) + 1; // Lanes 1, 2, 3, 4
    const direction: 'inbound' | 'outbound' = lane <= 2 ? 'inbound' : 'outbound';

    const laneXMap: Record<number, number> = {
      1: 22 + (Math.random() * 6 - 3),
      2: 36 + (Math.random() * 6 - 3),
      3: 64 + (Math.random() * 6 - 3),
      4: 78 + (Math.random() * 6 - 3),
    };

    const startY = direction === 'inbound' ? -15 : 115;
    const speedKmH = Math.floor(config.minSpeed + Math.random() * (config.maxSpeed - config.minSpeed));
    const confidence = parseFloat((0.85 + Math.random() * 0.14).toFixed(2));

    return {
      id,
      type,
      confidence,
      speedKmH,
      direction,
      x: laneXMap[lane],
      y: startY,
      width: config.width,
      height: config.height,
      trajectory: [{ x: laneXMap[lane], y: startY }],
      counted: false,
      timestamp: Date.now(),
      lane,
      color: config.color,
    };
  }, []);

  // 60 FPS Highway Motion & Detection Loop
  useEffect(() => {
    if (systemStatus === 'paused' || systemStatus === 'stopped') {
      return;
    }

    let isMounted = true;

    const tick = (now: number) => {
      // Calculate real-time FPS
      frameCountRef.current++;
      if (now - lastFpsTimeRef.current >= 1000) {
        setFps(Math.min(60, Math.round((frameCountRef.current * 1000) / (now - lastFpsTimeRef.current))));
        frameCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }

      // Continuously spawn vehicles in demo mode (every 1.2 to 2.2 seconds)
      if (inputMode === 'demo') {
        const timeSinceSpawn = Date.now() - lastSpawnTimeRef.current;
        if (timeSinceSpawn > 1400 && tracksRef.current.length < 8) {
          tracksRef.current.push(spawnVehicle());
          lastSpawnTimeRef.current = Date.now();
        }
      }

      // Update positions of active tracks
      const countingLine = modelConfig.countingLineY;
      const survivingTracks: VehicleTrack[] = [];

      for (const track of tracksRef.current) {
        // Speed in terms of % delta per frame
        const delta = (track.speedKmH / 60) * 0.28;
        const prevY = track.y;

        if (track.direction === 'inbound') {
          track.y += delta;
        } else {
          track.y -= delta;
        }

        // Add to trajectory (keep last 14 points)
        if (frameCountRef.current % 4 === 0) {
          track.trajectory.push({ x: track.x, y: track.y });
          if (track.trajectory.length > 14) {
            track.trajectory.shift();
          }
        }

        // Check line crossing
        if (!track.counted) {
          const crossed =
            (track.direction === 'inbound' && prevY <= countingLine && track.y >= countingLine) ||
            (track.direction === 'outbound' && prevY >= countingLine && track.y <= countingLine);

          if (crossed) {
            track.counted = true;
            triggerLineFlash();

            // Increment counts
            setCounts((prev) => ({
              ...prev,
              total: prev.total + 1,
              [track.type]: (prev[track.type] || 0) + 1,
              [track.direction]: prev[track.direction] + 1,
            }));

            // Create detection event
            const newEvent: DetectionEvent = {
              id: `evt-${Date.now()}-${track.id}`,
              trackId: track.id,
              type: track.type,
              confidence: track.confidence,
              direction: track.direction,
              speedKmH: track.speedKmH,
              timestamp: new Date(),
              lane: track.lane,
            };

            setRecentEvents((prev) => [newEvent, ...prev.slice(0, 24)]);

            // Periodically update time series
            setTimeSeries((prev) => {
              const last = prev[prev.length - 1];
              if (!last) return prev;
              return [
                ...prev.slice(0, prev.length - 1),
                {
                  ...last,
                  total: last.total + 1,
                  cars: track.type === 'car' ? last.cars + 1 : last.cars,
                  motorcycles: track.type === 'motorcycle' ? last.motorcycles + 1 : last.motorcycles,
                  buses: track.type === 'bus' ? last.buses + 1 : last.buses,
                  trucks: track.type === 'truck' ? last.trucks + 1 : last.trucks,
                  bicycles: track.type === 'bicycle' ? last.bicycles + 1 : last.bicycles,
                },
              ];
            });
          }
        }

        // Keep vehicle within vertical bounds (-25% to 125%)
        if (track.y >= -25 && track.y <= 125) {
          survivingTracks.push(track);
        }
      }

      tracksRef.current = survivingTracks;

      if (isMounted) {
        requestRef.current = requestAnimationFrame(tick);
      }
    };

    requestRef.current = requestAnimationFrame(tick);

    return () => {
      isMounted = false;
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [systemStatus, inputMode, modelConfig.countingLineY, spawnVehicle, triggerLineFlash]);

  // Poll backend stats periodically if video is active
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/stats`);
      if (res.ok) {
        const data: BackendStats = await res.json();
        setBackendConnected(true);
        if (inputMode === 'video') {
          setCounts(data.counts);
          if (data.fps > 0) setFps(data.fps);
          if (data.line_flashed) setLineFlashed(true);

          if (data.recent_events && data.recent_events.length > 0) {
            const mappedEvents: DetectionEvent[] = data.recent_events.map((e) => ({
              id: e.id,
              trackId: e.track_id,
              type: e.class_name,
              confidence: e.confidence,
              direction: e.direction,
              speedKmH: e.speed,
              timestamp: new Date(e.timestamp),
              lane: e.lane,
            }));
            setRecentEvents(mappedEvents);
          }
        }
      }
    } catch {}
  }, [inputMode]);

  // Connect to WebSocket telemetry
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      try {
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          setBackendConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data: BackendStats = JSON.parse(event.data);
            if (inputMode === 'video') {
              setCounts(data.counts);
              if (data.fps > 0) setFps(data.fps);
              setLineFlashed(data.line_flashed);

              if (data.recent_events && data.recent_events.length > 0) {
                const mappedEvents: DetectionEvent[] = data.recent_events.map((e) => ({
                  id: e.id,
                  trackId: e.track_id,
                  type: e.class_name,
                  confidence: e.confidence,
                  direction: e.direction,
                  speedKmH: e.speed,
                  timestamp: new Date(e.timestamp),
                  lane: e.lane,
                }));
                setRecentEvents(mappedEvents);
              }
            }
          } catch {}
        };

        ws.onclose = () => {
          setBackendConnected(false);
          reconnectTimeout = setTimeout(connectWs, 2500);
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch {
        reconnectTimeout = setTimeout(connectWs, 2500);
      }
    };

    connectWs();
    const pollInterval = setInterval(fetchStats, 1500);

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      clearInterval(pollInterval);
    };
  }, [fetchStats, inputMode]);

  // Actions
  const startDetection = useCallback(async () => {
    setSystemStatus('online');
    try {
      await fetch(`${BACKEND_URL}/api/controls/playback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
    } catch {}
  }, []);

  const pauseDetection = useCallback(async () => {
    setSystemStatus('paused');
    try {
      await fetch(`${BACKEND_URL}/api/controls/playback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause' }),
      });
    } catch {}
  }, []);

  const stopDetection = useCallback(async () => {
    setSystemStatus('stopped');
    tracksRef.current = [];
    try {
      await fetch(`${BACKEND_URL}/api/controls/playback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      });
    } catch {}
  }, []);

  const resetCounters = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/controls/reset`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setCounts(data.counts);
        setRecentEvents([]);
      }
    } catch {
      setCounts(INITIAL_COUNTS);
      setRecentEvents([]);
    }
  }, []);

  const setCountingLineY = useCallback((val: number) => {
    const clamped = Math.max(15, Math.min(85, val));
    setModelConfig((prev) => ({ ...prev, countingLineY: clamped }));
    fetch(`${BACKEND_URL}/api/controls/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ counting_line_y: clamped / 100 }),
    }).catch(() => {});
  }, []);

  const setConfidenceThreshold = useCallback((val: number) => {
    setModelConfig((prev) => ({ ...prev, confidenceThreshold: val }));
    fetch(`${BACKEND_URL}/api/controls/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confidence_threshold: val }),
    }).catch(() => {});
  }, []);

  const toggleBoundingBoxes = useCallback(() => {
    setModelConfig((prev) => ({ ...prev, showBoundingBoxes: !prev.showBoundingBoxes }));
  }, []);

  const toggleTrackIds = useCallback(() => {
    setModelConfig((prev) => ({ ...prev, showTrackIds: !prev.showTrackIds }));
  }, []);

  const toggleTrajectories = useCallback(() => {
    setModelConfig((prev) => ({ ...prev, showTrajectoryTrails: !prev.showTrajectoryTrails }));
  }, []);

  // Upload video or image to real YOLO backend
  const handleFileUpload = useCallback(async (file: File, type: 'video' | 'image') => {
    setUploadedFile({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      type: file.type || (type === 'video' ? 'video/mp4' : 'image/jpeg'),
    });
    setUploadProgress(0);
    setSystemStatus('analyzing');

    const formData = new FormData();
    formData.append('file', file);

    try {
      if (type === 'image') {
        const res = await fetch(`${BACKEND_URL}/api/detect/image`, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setUploadProgress(100);
          setAnnotatedImageB64(data.image_base64);
          setImageDetections(data.detections);
          setCounts((prev) => ({
            ...prev,
            ...data.detected_counts,
            total: prev.total + data.total_detected,
          }));
          setSystemStatus('online');
          setInputMode('image');
        } else {
          setSystemStatus('error');
        }
      } else {
        // Video upload
        const res = await fetch(`${BACKEND_URL}/api/upload/video`, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          setUploadProgress(100);
          setSystemStatus('online');
          setInputMode('video');
        } else {
          setSystemStatus('error');
        }
      }
    } catch (err) {
      console.error('File upload error', err);
      setSystemStatus('error');
    }
  }, []);

  // Send single webcam frame to backend for real-time inference
  const sendWebcamFrame = useCallback(async (blob: Blob): Promise<{ image_base64?: string; detections?: BackendDetection[] }> => {
    const formData = new FormData();
    formData.append('file', blob, 'frame.jpg');

    try {
      const res = await fetch(`${BACKEND_URL}/api/detect/frame`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return {};
  }, []);

  // Export CSV directly from backend
  const exportCsv = useCallback(() => {
    window.open(`${BACKEND_URL}/api/export/csv`, '_blank');
  }, []);

  return {
    counts,
    recentEvents,
    systemStatus,
    inputMode,
    setInputMode,
    fps,
    lineFlashed,
    modelConfig,
    setModelConfig,
    timeSeries,
    uploadedFile,
    uploadProgress,
    annotatedImageB64,
    imageDetections,
    backendConnected,
    tracksRef,
    startDetection,
    pauseDetection,
    stopDetection,
    resetCounters,
    setCountingLineY,
    setConfidenceThreshold,
    toggleBoundingBoxes,
    toggleTrackIds,
    toggleTrajectories,
    handleFileUpload,
    sendWebcamFrame,
    exportCsv,
  };
}
