# 🚗 VehicleVision AI — Real-Time Vehicle Detection & Traffic Analytics System

> An intelligent, real-time computer vision platform powered by **YOLOv8**, **ByteTrack**, **FastAPI**, and **React + TypeScript** for automated vehicle detection, multi-object tracking, speed & flow estimation, and interactive traffic analytics.

---

## 👥 Contributors & Team Members

- **Prashwin PJ**
- **Pratham P Alva**
- **Chirag Shetty**

---

## 🌟 Key Features

- **🛰️ Real-Time Deep Learning Detection**: Leverages **YOLOv8** to detect cars, buses, trucks, motorcycles, bicycles, and traffic sign elements with high confidence.
- **🎯 Multi-Object Tracking & Vehicle Counting**: Employs **ByteTrack** for persistent object tracking and bidirectional line-crossing vehicle counters.
- **⚡ High-Performance FastAPI Backend**: Asynchronous REST API and WebSocket streaming server powering live inference and frame processing.
- **📊 Dynamic Analytics Dashboard**: Interactive graphs built with **Recharts** and **Framer Motion**, displaying vehicle density, speed trends, class breakdown, and activity logs.
- **📷 Snapshot & Reporting Capabilities**: Capture live frame snapshots with full telemetry metadata and export analytical logs.
- **🖥️ Dual Execution Modes**: Client-side fallback canvas detection & server-accelerated YOLO stream integration.

---

## 🛠️ Tech Stack

### **Frontend**
- **Framework**: React 19 + TypeScript (Vite 8)
- **Styling**: Modern Custom CSS System & Glassmorphism UI
- **Visualization**: Recharts, Framer Motion, Lucide Icons
- **Tooling**: Oxlint & TypeScript

### **Backend**
- **Engine**: Python 3.10+, FastAPI, Uvicorn
- **Computer Vision**: OpenCV, Ultralytics YOLOv8, PyTorch
- **Tracking Engine**: ByteTrack / Kalman Filtering
- **Communications**: WebSockets & REST APIs

---

## 📂 Project Structure

```
Vehicle_Detection/
├── backend/                  # Python FastAPI Backend
│   ├── main.py               # FastAPI API routes & WebSocket streaming engine
│   ├── tracker.py            # ByteTrack / Object tracking implementation
│   ├── requirements.txt      # Python dependencies
│   ├── sample_data/          # Sample traffic videos & images for testing
│   ├── test_full_system.py   # Backend system integration test suite
│   └── uploads/              # Video upload processing directory
├── src/                      # React TypeScript Frontend
│   ├── components/           # UI components (Analytics, Detection, Controls, Layout)
│   ├── hooks/                # Custom React hooks (useTrafficEngine)
│   ├── styles/               # Component & dashboard styles
│   ├── types/                # TypeScript interfaces & types
│   ├── App.tsx               # Main Dashboard application entrypoint
│   └── main.tsx              # React mounting root
├── public/                   # Static assets & icons
├── start.sh                  # Unified dev startup script (Backend + Frontend)
├── yolov8n.pt                # Pre-trained YOLOv8 nano model weights
└── package.json              # Frontend npm dependencies & scripts
```

---

## ⚡ Getting Started

### Prerequisites

- **Node.js** (v18+ recommended) & `npm`
- **Python** (v3.10+ recommended) & `pip`

### 1. Clone the Repository

```bash
git clone https://github.com/Prashwinachya/Deep-Learning-Project-.git
cd Deep-Learning-Project-
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python requirements
pip install -r requirements.txt

cd ..
```

### 3. Frontend Setup

```bash
# Install NPM dependencies
npm install
```

---

## 🚀 Running the Application

You can launch both the **FastAPI Backend (:8001)** and **Vite React Frontend (:5173)** concurrently using the unified startup script:

```bash
chmod +x start.sh
./start.sh
```

Alternatively, you can run them individually:

- **Start Backend**: `npm run dev:backend` (Runs FastAPI at `http://127.0.0.1:8001`)
- **Start Frontend**: `npm run dev` (Runs React Dashboard at `http://127.0.0.1:5173`)

### 📌 Interactive Interfaces

- **Dashboard UI**: [http://127.0.0.1:5173](http://127.0.0.1:5173)
- **FastAPI Documentation**: [http://127.0.0.1:8001/docs](http://127.0.0.1:8001/docs)

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

