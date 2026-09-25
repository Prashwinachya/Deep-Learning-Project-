import cv2
import os
import sys

# Ensure backend directory is in path
sys.path.insert(0, os.path.dirname(__file__))

from tracker import VehicleTracker

def test_pipeline():
    sample_dir = os.path.join(os.path.dirname(__file__), "sample_data")
    bus_img_path = os.path.join(sample_dir, "bus.jpg")
    video_path = os.path.join(sample_dir, "traffic_sample.mp4")

    print("\n--- TEST 1: Image Detection with YOLO ---")
    tracker = VehicleTracker(model_name="yolov8n.pt", conf_thresh=0.35)
    
    assert os.path.exists(bus_img_path), f"File {bus_img_path} not found"
    img = cv2.imread(bus_img_path)
    assert img is not None, "Failed to read bus.jpg"

    annotated_img, detections, telemetry = tracker.process_frame(img, annotate=True)
    print(f"Detections found in bus.jpg: {len(detections)}")
    classes_found = [d['class_name'] for d in detections]
    print(f"Vehicle classes detected: {classes_found}")
    assert any(c in ['bus', 'car', 'motorcycle', 'truck', 'bicycle'] for c in classes_found), "Expected at least one vehicle class detected"
    print("✅ TEST 1 PASSED: Real YOLO image detection working!")

    print("\n--- TEST 2: Multi-Frame Video Tracking & Anti-Duplicate Counting ---")
    tracker.reset()
    cap = cv2.VideoCapture(video_path)
    assert cap.isOpened(), f"Failed to open {video_path}"

    frame_count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        frame_count += 1
        _, dets, tele = tracker.process_frame(frame, annotate=True)

    cap.release()
    print(f"Processed {frame_count} frames.")
    print(f"Final Counts: {tracker.counts}")
    print(f"Counted Unique IDs: {tracker.counted_ids}")
    print(f"Total Unique Crossed: {len(tracker.counted_ids)}")
    print(f"Recorded Events: {len(tracker.recent_events)}")

    # Anti-duplicate verification: total counted must equal length of counted_ids
    assert tracker.counts['total'] == len(tracker.counted_ids), (
        f"Anti-duplicate failed: total count {tracker.counts['total']} != unique IDs {len(tracker.counted_ids)}"
    )
    print("✅ TEST 2 PASSED: Persistent tracking and anti-duplicate line counting verified!")

    print("\n--- TEST 3: Settings Updates & Reset ---")
    tracker.update_settings(conf=0.60, line_y=0.45)
    assert tracker.conf_thresh == 0.60
    assert tracker.counting_line_y == 0.45

    tracker.reset()
    assert tracker.counts['total'] == 0
    assert len(tracker.counted_ids) == 0
    print("✅ TEST 3 PASSED: Reset and settings configuration verified!")

    print("\nALL BACKEND UNIT TESTS PASSED SUCCESSFULLY! 🚀")

if __name__ == "__main__":
    test_pipeline()
