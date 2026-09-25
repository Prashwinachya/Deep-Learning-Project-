import cv2
import numpy as np
import base64
import time
import os
import io
import csv
import asyncio
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, Response, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from tracker import VehicleTracker

app = FastAPI(title="VehicleVision AI API", version="2.0.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
SAMPLE_DIR = os.path.join(os.path.dirname(__file__), "sample_data")
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(SAMPLE_DIR, exist_ok=True)

# Global Tracker Instance
tracker = VehicleTracker(model_name="yolov8n.pt", conf_thresh=0.40)

# Playback State
playback_state = {
    "status": "online",  # online, paused, stopped
    "current_video_path": os.path.join(SAMPLE_DIR, "traffic_sample.mp4"),
    "input_mode": "demo", # demo, video, webcam, image
}

# Active WebSocket connections
connected_websockets: List[WebSocket] = []

class UpdateSettingsRequest(BaseModel):
    confidence_threshold: Optional[float] = None
    counting_line_y: Optional[float] = None
    tracker_type: Optional[str] = None
    model_name: Optional[str] = None

class PlaybackRequest(BaseModel):
    action: str  # start, pause, stop

@app.get("/")
def root():
    return {
        "status": "healthy",
        "service": "VehicleVision AI Engine",
        "model": "YOLOv8",
        "tracker": tracker.tracker_type,
        "counts": tracker.counts
    }

@app.get("/api/stats")
def get_stats():
    return {
        "counts": tracker.counts,
        "fps": tracker.fps,
        "recent_events": tracker.recent_events,
        "line_flashed": tracker.line_flashed,
        "status": playback_state["status"],
        "input_mode": playback_state["input_mode"],
        "confidence_threshold": tracker.conf_thresh,
        "counting_line_y": tracker.counting_line_y
    }

@app.post("/api/controls/update")
def update_controls(req: UpdateSettingsRequest):
    tracker.update_settings(
        conf=req.confidence_threshold,
        line_y=req.counting_line_y,
        tracker=req.tracker_type
    )
    return {
        "success": True,
        "conf": tracker.conf_thresh,
        "line_y": tracker.counting_line_y,
        "tracker": tracker.tracker_type
    }

@app.post("/api/controls/reset")
def reset_counters():
    tracker.reset()
    return {
        "success": True,
        "counts": tracker.counts,
        "recent_events": tracker.recent_events
    }

@app.post("/api/controls/playback")
def set_playback(req: PlaybackRequest):
    act = req.action.lower()
    if act in ["start", "resume"]:
        playback_state["status"] = "online"
    elif act == "pause":
        playback_state["status"] = "paused"
    elif act == "stop":
        playback_state["status"] = "stopped"
        tracker.counted_ids.clear()
        tracker.track_history.clear()
    return {"success": True, "status": playback_state["status"]}

@app.post("/api/detect/image")
async def detect_image(file: UploadFile = File(...)):
    """Process single uploaded image with YOLO and return annotated result and counts."""
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return Response(content='{"error": "Invalid image format"}', status_code=400, media_type="application/json")

    playback_state["input_mode"] = "image"
    annotated_img, detections, telemetry = tracker.process_frame(img, annotate=True)

    # Encode annotated image to JPEG base64
    _, buf = cv2.imencode('.jpg', annotated_img, [cv2.IMWRITE_JPEG_QUALITY, 90])
    img_b64 = base64.b64encode(buf).decode('utf-8')

    # Breakdown of detected classes in this image
    class_breakdown = {
        'car': sum(1 for d in detections if d['class_name'] == 'car'),
        'motorcycle': sum(1 for d in detections if d['class_name'] == 'motorcycle'),
        'bus': sum(1 for d in detections if d['class_name'] == 'bus'),
        'truck': sum(1 for d in detections if d['class_name'] == 'truck'),
        'bicycle': sum(1 for d in detections if d['class_name'] == 'bicycle'),
    }

    return {
        "success": True,
        "image_base64": f"data:image/jpeg;base64,{img_b64}",
        "detections": detections,
        "detected_counts": class_breakdown,
        "total_detected": len(detections),
        "telemetry": telemetry
    }

@app.post("/api/detect/frame")
async def detect_frame(file: UploadFile = File(...)):
    """Process real-time frame from client webcam."""
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        return Response(content='{"error": "Failed to decode frame"}', status_code=400, media_type="application/json")

    playback_state["input_mode"] = "webcam"
    annotated_frame, detections, telemetry = tracker.process_frame(frame, annotate=True)

    _, buf = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
    frame_b64 = base64.b64encode(buf).decode('utf-8')

    return {
        "success": True,
        "image_base64": f"data:image/jpeg;base64,{frame_b64}",
        "detections": detections,
        "telemetry": telemetry
    }

@app.post("/api/upload/video")
async def upload_video(file: UploadFile = File(...)):
    """Upload user video and prepare for processing."""
    file_path = os.path.join(UPLOAD_DIR, "current_video.mp4")
    with open(file_path, "wb") as f:
        f.write(await file.read())

    playback_state["current_video_path"] = file_path
    playback_state["input_mode"] = "video"
    playback_state["status"] = "online"

    # Reset tracker tracking histories for clean run on new video
    tracker.counted_ids.clear()
    tracker.track_history.clear()

    return {
        "success": True,
        "filename": file.filename,
        "path": file_path,
        "stream_url": "/api/stream/video"
    }

def generate_video_stream():
    """Generator for MJPEG video stream with YOLO tracking overlay."""
    video_path = playback_state["current_video_path"]
    if not video_path or not os.path.exists(video_path):
        # Fallback to sample traffic video if available
        sample_path = os.path.join(SAMPLE_DIR, "traffic_sample.mp4")
        if os.path.exists(sample_path):
            video_path = sample_path
        else:
            return

    cap = cv2.VideoCapture(video_path)
    
    while True:
        if playback_state["status"] == "stopped":
            time.sleep(0.1)
            continue

        if playback_state["status"] == "paused":
            time.sleep(0.05)
            continue

        ret, frame = cap.read()
        if not ret:
            # Loop video seamlessly
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            continue

        # Resize to max 960x540 for fast real-time streaming
        h, w = frame.shape[:2]
        if w > 960:
            scale = 960.0 / w
            frame = cv2.resize(frame, (960, int(h * scale)))

        annotated_frame, detections, telemetry = tracker.process_frame(frame, annotate=True)

        _, buffer = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        frame_bytes = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        
        # Target ~30 FPS
        time.sleep(0.033)

@app.get("/api/stream/video")
def video_feed():
    """MJPEG streaming endpoint for video detection."""
    return StreamingResponse(
        generate_video_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.get("/api/export/csv")
def export_csv():
    """Generate and return CSV audit report of all logged vehicle crossing events."""
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers
    writer.writerow([
        "Event ID",
        "Vehicle ID",
        "Vehicle Class",
        "Confidence (%)",
        "Direction",
        "Speed (km/h)",
        "Timestamp",
        "Lane"
    ])

    events = tracker.event_log if tracker.event_log else tracker.recent_events
    for evt in events:
        writer.writerow([
            evt.get("id", ""),
            evt.get("track_id", ""),
            evt.get("class_name", "").capitalize(),
            f"{int(evt.get('confidence', 0) * 100)}%",
            evt.get("direction", "").capitalize(),
            evt.get("speed", ""),
            evt.get("timestamp", ""),
            evt.get("lane", "")
        ])

    writer.writerow([])
    writer.writerow(["--- SUMMARY TOTALS ---"])
    writer.writerow(["Total Vehicles", tracker.counts["total"]])
    writer.writerow(["Cars", tracker.counts["car"]])
    writer.writerow(["Motorcycles", tracker.counts["motorcycle"]])
    writer.writerow(["Buses", tracker.counts["bus"]])
    writer.writerow(["Trucks", tracker.counts["truck"]])
    writer.writerow(["Bicycles", tracker.counts["bicycle"]])
    writer.writerow(["Inbound", tracker.counts["inbound"]])
    writer.writerow(["Outbound", tracker.counts["outbound"]])

    csv_data = output.getvalue()
    filename = f"VehicleVision_Audit_{int(time.time())}.csv"
    
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.websocket("/ws/telemetry")
async def websocket_endpoint(websocket: WebSocket):
    """Real-time bidirectional WebSocket telemetry stream."""
    await websocket.accept()
    connected_websockets.append(websocket)
    try:
        while True:
            # Send stats update every 100ms
            data = {
                "counts": tracker.counts,
                "fps": tracker.fps,
                "recent_events": tracker.recent_events[:10],
                "line_flashed": tracker.line_flashed,
                "status": playback_state["status"],
                "input_mode": playback_state["input_mode"],
                "confidence_threshold": tracker.conf_thresh,
                "counting_line_y": tracker.counting_line_y
            }
            await websocket.send_json(data)
            await asyncio.sleep(0.1)
    except WebSocketDisconnect:
        if websocket in connected_websockets:
            connected_websockets.remove(websocket)
    except Exception:
        if websocket in connected_websockets:
            connected_websockets.remove(websocket)
