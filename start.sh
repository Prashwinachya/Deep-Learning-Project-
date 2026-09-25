#!/usr/bin/env bash
# ==============================================================================
# VehicleVision AI • Unified Development Startup
# Runs FastAPI YOLO Backend (:8001) + Vite React Frontend (:5173)
# ==============================================================================

set -e

# Change directory to project root
cd "$(dirname "$0")"

echo "============================================================"
echo "  🚗 VehicleVision AI • Real-Time Traffic Intelligence"
echo "  YOLOv8/v11 + ByteTrack Tracking + Counting Engine"
echo "============================================================"

# Ensure backend venv exists
if [ ! -f "backend/venv/bin/uvicorn" ]; then
    echo "⚠️ Backend environment not found. Please run setup first."
    exit 1
fi

echo "-> Starting Backend API (http://127.0.0.1:8001)..."
backend/venv/bin/uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8001 &
BACKEND_PID=$!

echo "-> Starting Frontend Dashboard (http://127.0.0.1:5173)..."
npm run dev -- --host 127.0.0.1 --port 5173 &
FRONTEND_PID=$!

echo "============================================================"
echo "  ✅ Complete application running:"
echo "     • Dashboard UI:  http://127.0.0.1:5173"
echo "     • YOLO Backend:  http://127.0.0.1:8001"
echo "     • API Docs:      http://127.0.0.1:8001/docs"
echo "============================================================"
echo "Press Ctrl+C to terminate both servers."

trap "echo 'Shutting down services...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT INT TERM

wait
