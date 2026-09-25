import cv2
import numpy as np
import time
from typing import Dict, List, Set, Tuple, Optional, Any
from ultralytics import YOLO

# COCO class IDs mapped to vehicle categories
VEHICLE_CLASS_MAP = {
    1: 'bicycle',
    2: 'car',
    3: 'motorcycle',
    5: 'bus',
    7: 'truck'
}

CLASS_COLORS = {
    'car': (248, 189, 56),        # Sky Blue in BGR: (56, 189, 248) -> BGR is (248, 189, 56)
    'motorcycle': (247, 85, 168), # Vivid Purple: (168, 85, 247) -> BGR (247, 85, 168)
    'bus': (129, 185, 16),        # Emerald Green: (16, 185, 129) -> BGR (129, 185, 16)
    'truck': (11, 158, 245),      # Amber: (245, 158, 11) -> BGR (11, 158, 245)
    'bicycle': (254, 242, 0),     # Neon Cyan: (0, 242, 254) -> BGR (254, 242, 0)
}

class VehicleTracker:
    def __init__(self, model_name: str = "yolov8n.pt", conf_thresh: float = 0.40):
        print(f"[Tracker] Loading YOLO model {model_name}...")
        self.model = YOLO(model_name)
        self.conf_thresh = conf_thresh
        self.iou_thresh = 0.45
        self.tracker_type = "bytetrack.yaml"
        self.counting_line_y = 0.55  # normalized Y (0.0 to 1.0)
        
        # State
        self.counts = {
            'total': 0,
            'car': 0,
            'motorcycle': 0,
            'bus': 0,
            'truck': 0,
            'bicycle': 0,
            'inbound': 0,
            'outbound': 0,
        }
        
        self.counted_ids: Set[int] = set()
        self.track_history: Dict[int, List[Tuple[float, float, float]]] = {}  # id -> list of (x, y, time)
        self.track_classes: Dict[int, str] = {}
        self.recent_events: List[Dict[str, Any]] = []
        self.event_log: List[Dict[str, Any]] = []
        
        self.line_flashed = False
        self.line_flash_until = 0.0
        self.prev_frame_time = time.time()
        self.fps = 0.0

    def reset(self):
        """Reset all counters and tracking histories."""
        self.counts = {
            'total': 0,
            'car': 0,
            'motorcycle': 0,
            'bus': 0,
            'truck': 0,
            'bicycle': 0,
            'inbound': 0,
            'outbound': 0,
        }
        self.counted_ids.clear()
        self.track_history.clear()
        self.track_classes.clear()
        self.recent_events.clear()
        self.event_log.clear()
        self.line_flashed = False

    def update_settings(self, conf: Optional[float] = None, line_y: Optional[float] = None, tracker: Optional[str] = None):
        if conf is not None:
            self.conf_thresh = max(0.05, min(0.95, conf))
        if line_y is not None:
            self.counting_line_y = max(0.10, min(0.90, line_y))
        if tracker is not None:
            self.tracker_type = "botsort.yaml" if tracker == "BoT-SORT" else "bytetrack.yaml"

    def process_frame(
        self, 
        frame: np.ndarray, 
        annotate: bool = True,
        show_boxes: bool = True,
        show_ids: bool = True,
        show_trails: bool = True,
        show_speed: bool = True,
        show_line: bool = True
    ) -> Tuple[np.ndarray, List[Dict[str, Any]], Dict[str, Any]]:
        """
        Process a single image or video frame through YOLO + ByteTrack.
        Detects, tracks, computes counting line crossings, and annotates frame.
        """
        h, w = frame.shape[:2]
        now = time.time()
        
        # Calculate real-time FPS
        dt = now - self.prev_frame_time
        if dt > 0:
            self.fps = round(0.9 * self.fps + 0.1 * (1.0 / dt), 1)
        self.prev_frame_time = now

        # Line flash timer check
        if now < self.line_flash_until:
            self.line_flashed = True
        else:
            self.line_flashed = False

        # Run YOLO with tracking enabled
        results = self.model.track(
            source=frame,
            persist=True,
            conf=self.conf_thresh,
            iou=self.iou_thresh,
            classes=list(VEHICLE_CLASS_MAP.keys()),
            tracker=self.tracker_type,
            verbose=False
        )

        detections = []
        counting_y_px = int(self.counting_line_y * h)
        active_ids = set()

        if results and len(results) > 0 and results[0].boxes is not None:
            boxes = results[0].boxes
            for i in range(len(boxes)):
                cls_id = int(boxes.cls[i].item())
                if cls_id not in VEHICLE_CLASS_MAP:
                    continue
                
                v_type = VEHICLE_CLASS_MAP[cls_id]
                conf = float(boxes.conf[i].item())
                xyxy = boxes.xyxy[i].cpu().numpy()
                x1, y1, x2, y2 = xyxy

                # Center point
                cx = (x1 + x2) / 2.0
                cy = (y1 + y2) / 2.0

                # Track ID
                track_id = int(boxes.id[i].item()) if boxes.id is not None and boxes.id[i] is not None else None

                direction = 'inbound'
                speed_kmh = 50.0

                if track_id is not None:
                    active_ids.add(track_id)
                    self.track_classes[track_id] = v_type
                    
                    if track_id not in self.track_history:
                        self.track_history[track_id] = []
                    
                    hist = self.track_history[track_id]
                    hist.append((cx, cy, now))
                    if len(hist) > 20:
                        hist.pop(0)

                    # Determine direction and speed from trajectory
                    if len(hist) >= 2:
                        first_pt = hist[0]
                        last_pt = hist[-1]
                        delta_y = last_pt[1] - first_pt[1]
                        delta_t = last_pt[2] - first_pt[2]
                        
                        direction = 'inbound' if delta_y >= 0 else 'outbound'
                        if delta_t > 0.05:
                            # Pixel velocity to approx km/h
                            pixel_speed = np.sqrt((last_pt[0] - first_pt[0])**2 + delta_y**2) / delta_t
                            speed_kmh = round(min(120.0, max(20.0, (pixel_speed / h) * 180.0)), 1)

                    # Check Counting Line Crossing
                    if track_id not in self.counted_ids and len(hist) >= 2:
                        prev_cy = hist[-2][1]
                        curr_cy = hist[-1][1]

                        # Did centroid cross the counting line between previous and current frame?
                        crossed_down = (prev_cy < counting_y_px and curr_cy >= counting_y_px)
                        crossed_up = (prev_cy > counting_y_px and curr_cy <= counting_y_px)

                        if crossed_down or crossed_up:
                            # Mark ID as counted (Strict Anti-Duplicate Guarantee)
                            self.counted_ids.add(track_id)
                            
                            cross_dir = 'inbound' if crossed_down else 'outbound'
                            
                            # Increment counters
                            self.counts['total'] += 1
                            self.counts[v_type] += 1
                            self.counts[cross_dir] += 1

                            # Trigger line flash
                            self.line_flashed = True
                            self.line_flash_until = now + 0.35

                            # Log event
                            event_item = {
                                'id': f"evt-{int(now * 1000)}-{track_id}",
                                'track_id': track_id,
                                'class_name': v_type,
                                'confidence': round(conf, 2),
                                'direction': cross_dir,
                                'speed': speed_kmh,
                                'timestamp': time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(now)),
                                'lane': 1 if cx < w * 0.35 else (2 if cx < w * 0.5 else (3 if cx < w * 0.65 else 4))
                            }
                            self.recent_events.insert(0, event_item)
                            if len(self.recent_events) > 30:
                                self.recent_events.pop()
                            self.event_log.append(event_item)

                detections.append({
                    'box': [round(float(x1), 1), round(float(y1), 1), round(float(x2), 1), round(float(y2), 1)],
                    'class_name': v_type,
                    'confidence': round(conf, 2),
                    'track_id': track_id,
                    'direction': direction,
                    'speed': speed_kmh
                })

        # Prune old track histories not seen for 3 seconds
        stale_ids = [tid for tid, pts in self.track_history.items() if tid not in active_ids and (now - pts[-1][2]) > 3.0]
        for tid in stale_ids:
            del self.track_history[tid]

        # Draw Annotations if requested
        out_frame = frame.copy() if annotate else frame
        if annotate:
            # 1. Draw Counting Line
            if show_line:
                line_color = (255, 255, 255) if self.line_flashed else (254, 242, 0) # White flash or Cyan
                thickness = 3 if self.line_flashed else 2
                cv2.line(out_frame, (0, counting_y_px), (w, counting_y_px), line_color, thickness)
                
                # Line label
                cv2.putText(
                    out_frame,
                    f"COUNT GATE [Y:{int(self.counting_line_y * 100)}%]",
                    (20, counting_y_px - 10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    line_color,
                    1,
                    cv2.LINE_AA
                )
                cv2.putText(
                    out_frame,
                    "INBOUND v",
                    (w // 4, counting_y_px + 20),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (254, 242, 0),
                    1,
                    cv2.LINE_AA
                )
                cv2.putText(
                    out_frame,
                    "^ OUTBOUND",
                    (3 * w // 4, counting_y_px + 20),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    (247, 85, 168),
                    1,
                    cv2.LINE_AA
                )

            # 2. Draw Trajectories
            if show_trails:
                for tid, pts in self.track_history.items():
                    v_cls = self.track_classes.get(tid, 'car')
                    t_color = CLASS_COLORS.get(v_cls, (254, 242, 0))
                    for k in range(1, len(pts)):
                        pt1 = (int(pts[k-1][0]), int(pts[k-1][1]))
                        pt2 = (int(pts[k][0]), int(pts[k][1]))
                        cv2.line(out_frame, pt1, pt2, t_color, 2)

            # 3. Draw Bounding Boxes and HUD Labels
            if show_boxes:
                for det in detections:
                    bx = det['box']
                    x1, y1, x2, y2 = map(int, bx)
                    v_type = det['class_name']
                    color = CLASS_COLORS.get(v_type, (254, 242, 0))

                    # Bounding Box
                    cv2.rectangle(out_frame, (x1, y1), (x2, y2), color, 2)

                    # Corner reticles for high-tech look
                    c_len = 10
                    # Top-left
                    cv2.line(out_frame, (x1, y1), (x1 + c_len, y1), (255, 255, 255), 3)
                    cv2.line(out_frame, (x1, y1), (x1, y1 + c_len), (255, 255, 255), 3)
                    # Top-right
                    cv2.line(out_frame, (x2, y1), (x2 - c_len, y1), (255, 255, 255), 3)
                    cv2.line(out_frame, (x2, y1), (x2, y1 + c_len), (255, 255, 255), 3)
                    # Bottom-left
                    cv2.line(out_frame, (x1, y2), (x1 + c_len, y2), (255, 255, 255), 3)
                    cv2.line(out_frame, (x1, y2), (x1, y2 - c_len), (255, 255, 255), 3)
                    # Bottom-right
                    cv2.line(out_frame, (x2, y2), (x2 - c_len, y2), (255, 255, 255), 3)
                    cv2.line(out_frame, (x2, y2), (x2, y2 - c_len), (255, 255, 255), 3)

                    # HUD Label Tag (CAR ID #27 94% CONFIDENCE)
                    if show_ids:
                        t_id_str = f"#{det['track_id']}" if det['track_id'] is not None else "NEW"
                        conf_pct = int(det['confidence'] * 100)
                        label = f"{v_type.upper()} ID {t_id_str} {conf_pct}%"
                        
                        (tw, th), baseline = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
                        tag_y = max(y1, th + 8)
                        cv2.rectangle(out_frame, (x1, tag_y - th - 6), (x1 + tw + 8, tag_y + 2), (10, 14, 22), -1)
                        cv2.rectangle(out_frame, (x1, tag_y - th - 6), (x1 + tw + 8, tag_y + 2), color, 1)
                        cv2.putText(out_frame, label, (x1 + 4, tag_y - 2), cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1, cv2.LINE_AA)

                        if show_speed and det.get('speed'):
                            spd_label = f"{det['speed']} km/h"
                            (sw, sh), _ = cv2.getTextSize(spd_label, cv2.FONT_HERSHEY_SIMPLEX, 0.4, 1)
                            cv2.rectangle(out_frame, (x1, y2 + 2), (x1 + sw + 6, y2 + sh + 8), (10, 14, 22), -1)
                            cv2.putText(out_frame, spd_label, (x1 + 3, y2 + sh + 4), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (200, 200, 200), 1, cv2.LINE_AA)

            # Telemetry Watermark Overlay
            cv2.putText(
                out_frame,
                f"VEHICLEVISION AI • YOLOv8 • FPS: {self.fps} • DETECTIONS: {len(detections)}",
                (20, 28),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (0, 242, 254),
                1,
                cv2.LINE_AA
            )

        telemetry = {
            'counts': self.counts,
            'fps': self.fps,
            'recent_events': self.recent_events,
            'line_flashed': self.line_flashed,
            'active_tracks_count': len(active_ids),
        }

        return out_frame, detections, telemetry
