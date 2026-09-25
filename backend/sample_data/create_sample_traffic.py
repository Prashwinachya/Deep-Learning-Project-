import cv2
import numpy as np
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
from tracker import VehicleTracker

def generate_multi_vehicle_video():
    sample_dir = os.path.dirname(__file__)
    bus_path = os.path.join(sample_dir, "bus.jpg")
    out_video_path = os.path.join(sample_dir, "traffic_sample.mp4")
    
    bus_img = cv2.imread(bus_path)
    # Bus crop from bus.jpg
    bus_crop = bus_img[231:756, 23:805]
    bus_sprite = cv2.resize(bus_crop, (150, 110))
    bh, bw = bus_sprite.shape[:2]

    # Car crop from another portion of bus.jpg (or traffic)
    car_crop = bus_img[240:500, 100:600]
    car_sprite = cv2.resize(car_crop, (120, 80))
    ch, cw = car_sprite.shape[:2]

    width, height = 960, 540
    fps = 30
    num_frames = 120  # 4 seconds

    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    writer = cv2.VideoWriter(out_video_path, fourcc, fps, (width, height))

    for f in range(num_frames):
        prog = f / float(num_frames - 1)
        frame = np.full((height, width, 3), (25, 30, 36), dtype=np.uint8)

        # Asphalt roadway
        cv2.rectangle(frame, (100, 0), (860, height), (42, 47, 54), -1)

        # Curbs
        cv2.line(frame, (100, 0), (100, height), (70, 80, 95), 4)
        cv2.line(frame, (860, 0), (860, height), (70, 80, 95), 4)

        # Center yellow median
        cv2.line(frame, (477, 0), (477, height), (30, 200, 240), 3)
        cv2.line(frame, (483, 0), (483, height), (30, 200, 240), 3)

        # Lane dividers
        dash_offset = (f * 6) % 40
        for y in range(-dash_offset, height, 40):
            cv2.line(frame, (290, max(0, y)), (290, min(height, y + 20)), (180, 180, 180), 2)
            cv2.line(frame, (670, max(0, y)), (670, min(height, y + 20)), (180, 180, 180), 2)

        # 1. Inbound Bus (Lane 1, moving down)
        bus_y = int(-120 + prog * 640)
        bx1, bx2 = 140, 140 + bw
        by1, by2 = max(0, bus_y), min(height, bus_y + bh)
        if by2 > by1 and bx2 > bx1:
            sy1 = max(0, -bus_y)
            sy2 = sy1 + (by2 - by1)
            frame[by1:by2, bx1:bx2] = bus_sprite[sy1:sy2, 0:bw]

        # 2. Inbound Car (Lane 2, moving down, offset)
        car_y = int(-200 + prog * 700)
        cx1, cx2 = 330, 330 + cw
        cy1, cy2 = max(0, car_y), min(height, car_y + ch)
        if cy2 > cy1 and cx2 > cx1:
            csy1 = max(0, -car_y)
            csy2 = csy1 + (cy2 - cy1)
            frame[cy1:cy2, cx1:cx2] = car_sprite[csy1:csy2, 0:cw]

        # 3. Outbound Vehicle (Lane 3, moving up)
        out_y = int(580 - prog * 680)
        ox1, ox2 = 520, 520 + cw
        oy1, oy2 = max(0, out_y), min(height, out_y + ch)
        if oy2 > oy1 and ox2 > ox1:
            osy1 = max(0, -out_y)
            osy2 = osy1 + (oy2 - oy1)
            # Flip upside down for outbound direction
            flipped_car = cv2.flip(car_sprite, 0)
            frame[oy1:oy2, ox1:ox2] = flipped_car[0:(oy2-oy1), 0:cw]

        writer.write(frame)

    writer.release()
    print(f"Generated realistic multi-vehicle video at: {out_video_path}")

    # Also save representative frame 60 as sample image
    cap = cv2.VideoCapture(out_video_path)
    cap.set(cv2.CAP_PROP_POS_FRAMES, 60)
    ret, f60 = cap.read()
    if ret:
        cv2.imwrite(os.path.join(sample_dir, "traffic_sample.jpg"), f60)
    cap.release()

if __name__ == "__main__":
    generate_multi_vehicle_video()
