import cv2
import numpy as np
import time
from typing import List, Dict, Any, Tuple


class SyntheticStreamGenerator:
    """
    Generates realistic synthetic surveillance video frames simulating border outposts,
    checkpoints, and strategic roads with simulated vehicles, border personnel,
    and simulated intrusion trajectories.
    """
    def __init__(self, camera_id: int, camera_name: str, site_name: str, width: int = 640, height: int = 360):
        self.camera_id = camera_id
        self.camera_name = camera_name
        self.site_name = site_name
        self.width = width
        self.height = height
        self.frame_count = 0
        
        # State for moving objects
        self.objects = [
            {
                "id": 101,
                "type": "person",
                "x": 80,
                "y": 180,
                "vx": 1.2,
                "vy": 0.4,
                "width": 30,
                "height": 70,
                "confidence": 0.92
            },
            {
                "id": 204,
                "type": "vehicle",
                "subclass": "truck",
                "plate": "PB02AX9182",
                "x": 420,
                "y": 210,
                "vx": -2.0,
                "vy": 0.1,
                "width": 110,
                "height": 65,
                "confidence": 0.95
            }
        ]

    def read_frame(self) -> Tuple[np.ndarray, List[Dict[str, Any]]]:
        self.frame_count += 1
        # Create base surveillance background (dark terrain with perimeter fence)
        frame = np.zeros((self.height, self.width, 3), dtype=np.uint8)
        
        # Ground and sky gradient (night / twilight surveillance look)
        cv2.rectangle(frame, (0, 0), (self.width, int(self.height * 0.45)), (20, 25, 35), -1)
        cv2.rectangle(frame, (0, int(self.height * 0.45)), (self.width, self.height), (30, 40, 35), -1)
        
        # Border fence line
        fence_y = int(self.height * 0.45)
        for x in range(0, self.width, 30):
            cv2.line(frame, (x, fence_y - 40), (x, fence_y + 40), (70, 75, 80), 2)
        cv2.line(frame, (0, fence_y - 20), (self.width, fence_y - 20), (90, 95, 100), 1)
        cv2.line(frame, (0, fence_y + 10), (self.width, fence_y + 10), (90, 95, 100), 1)
        
        # Roadway
        pts = np.array([[200, fence_y], [400, fence_y], [640, self.height], [100, self.height]], np.int32)
        cv2.fillPoly(frame, [pts], (45, 48, 52))
        
        detections = []
        
        # Update and draw objects
        for obj in self.objects:
            obj["x"] += obj["vx"]
            obj["y"] += obj["vy"]
            
            # Bounce or reset at borders
            if obj["x"] > self.width - obj["width"] or obj["x"] < 20:
                obj["vx"] *= -1
            if obj["y"] > self.height - obj["height"] or obj["y"] < fence_y - 20:
                obj["vy"] *= -1
                
            x, y, w, h = int(obj["x"]), int(obj["y"]), int(obj["width"]), int(obj["height"])
            
            if obj["type"] == "person":
                # Draw person silhouette
                cv2.circle(frame, (x + w // 2, y + 12), 8, (160, 190, 210), -1)
                cv2.rectangle(frame, (x + 5, y + 20), (x + w - 5, y + h), (120, 150, 180), -1)
                
                # Bounding box normalized [ymin, xmin, ymax, xmax]
                norm_box = [round(y / self.height, 4), round(x / self.width, 4), 
                             round((y + h) / self.height, 4), round((x + w) / self.width, 4)]
                
                detections.append({
                    "track_id": obj["id"],
                    "class_name": "person",
                    "confidence": obj["confidence"],
                    "box": norm_box,
                    "metadata": {"action": "walking", "zone_status": "restricted_proximity"}
                })
                
            elif obj["type"] == "vehicle":
                # Draw vehicle body
                cv2.rectangle(frame, (x, y), (x + w, y + h), (70, 100, 140), -1)
                # Wheels
                cv2.circle(frame, (x + 20, y + h), 10, (20, 20, 20), -1)
                cv2.circle(frame, (x + w - 20, y + h), 10, (20, 20, 20), -1)
                # Plate tag
                cv2.rectangle(frame, (x + 25, y + h - 18), (x + 75, y + h - 4), (220, 220, 220), -1)
                cv2.putText(frame, "PB02", (x + 28, y + h - 7), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 0, 0), 1)
                
                norm_box = [round(y / self.height, 4), round(x / self.width, 4), 
                             round((y + h) / self.height, 4), round((x + w) / self.width, 4)]
                
                detections.append({
                    "track_id": obj["id"],
                    "class_name": "vehicle",
                    "subclass": obj["subclass"],
                    "plate": obj["plate"],
                    "confidence": obj["confidence"],
                    "box": norm_box,
                    "metadata": {"vehicle_type": obj["subclass"], "plate": obj["plate"]}
                })

        # Surveillance HUD Overlay
        ts = time.strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(frame, f"IBVAP LIVE | {self.site_name} | {self.camera_name}", (15, 25), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 240, 255), 1, cv2.LINE_AA)
        cv2.putText(frame, f"REC [LIVE] | {ts}", (15, 45), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 100), 1, cv2.LINE_AA)
        
        # Subtle scanline effect
        frame[::4, :, :] = (frame[::4, :, :] * 0.9).astype(np.uint8)
        
        return frame, detections
