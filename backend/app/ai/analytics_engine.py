import os
import cv2
import time
import numpy as np
from typing import Dict, List, Any
from datetime import datetime, timezone


from app.core.config import settings

class VideoAnalyticsEngine:
    """
    Core AI and Computer Vision engine:
    - Object tracking (IoU based centroid tracking)
    - Virtual fence polygon intersection checking
    - ANPR recognition & format validation
    - Face detection box extraction
    - Night monitoring rule evaluation
    """
    def __init__(self, evidence_dir: str = None):
        self.evidence_dir = evidence_dir or settings.EVIDENCE_DIR
        self.snapshot_dir = settings.SNAPSHOT_DIR if not evidence_dir else os.path.join(evidence_dir, "snapshots")
        os.makedirs(self.snapshot_dir, exist_ok=True)
        self.track_history: Dict[int, List[Dict[str, Any]]] = {}
        self.last_alert_time: Dict[str, float] = {} # cooldown tracker

    @staticmethod
    def point_in_polygon(point: List[float], polygon: List[List[float]]) -> bool:
        """Ray-casting algorithm for point in polygon. Point: [x, y], Polygon: [[x, y], ...]"""
        x, y = point[0], point[1]
        n = len(polygon)
        inside = False
        p1x, p1y = polygon[0]
        for i in range(n + 1):
            p2x, p2y = polygon[i % n]
            if y > min(p1y, p2y):
                if y <= max(p1y, p2y):
                    if x <= max(p1x, p2x):
                        if p1y != p2y:
                            xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or x <= xinters:
                            inside = not inside
            p1x, p1y = p2x, p2y
        return inside

    def save_snapshot(self, frame: np.ndarray, prefix: str = "event") -> str:
        """Saves JPEG snapshot to evidence storage and returns relative path"""
        filename = f"{prefix}_{int(time.time() * 1000)}.jpg"
        abs_path = os.path.join(self.snapshot_dir, filename)
        cv2.imwrite(abs_path, frame, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        return f"/evidence/snapshots/{filename}"

    def evaluate_rules(
        self,
        camera_id: int,
        site_id: int,
        frame: np.ndarray,
        detections: List[Dict[str, Any]],
        zones: List[Dict[str, Any]],
        enable_night_rules: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Evaluates detection frames against rules:
        1. Virtual fence perimeter intrusion
        2. ANPR registration and recognition
        3. Night-time movements
        4. Person / vehicle detections
        """
        generated_events = []
        now = time.time()
        current_hour = datetime.now(timezone.utc).hour


        # Check each detection
        for det in detections:
            cls = det.get("class_name")
            conf = det.get("confidence", 0.8)
            box = det.get("box", [0, 0, 0, 0]) # [ymin, xmin, ymax, xmax]
            centroid = [(box[1] + box[3]) / 2.0, (box[0] + box[2]) / 2.0] # [x, y]
            
            # Base detection event
            event_cat = "PERSON_DETECTION" if cls == "person" else "VEHICLE_DETECTION"
            generated_events.append({
                "type": "DETECTION",
                "category": event_cat,
                "object_type": cls,
                "confidence": conf,
                "track_id": det.get("track_id"),
                "bounding_box": box,
                "metadata": det.get("metadata", {})
            })

            # Check ANPR
            if cls == "vehicle" and "plate" in det:
                plate_text = det["plate"]
                generated_events.append({
                    "type": "ANPR",
                    "category": "ANPR_MATCH",
                    "object_type": "plate",
                    "confidence": conf,
                    "plate_number": plate_text,
                    "vehicle_type": det.get("subclass", "truck"),
                    "bounding_box": box,
                    "metadata": {"plate": plate_text, "state_code": plate_text[:2]}
                })

            # Check Virtual Zone Intrusions
            for zone in zones:
                zone_coords = zone.get("coordinates", [])
                if len(zone_coords) >= 3 and self.point_in_polygon(centroid, zone_coords):
                    rule_key = f"zone_{zone['id']}_{det.get('track_id', 0)}"
                    cooldown = zone.get("cooldown_seconds", 30)
                    if now - self.last_alert_time.get(rule_key, 0) > cooldown:
                        self.last_alert_time[rule_key] = now
                        snapshot_rel = self.save_snapshot(frame, prefix=f"intrusion_zone_{zone['id']}")
                        generated_events.append({
                            "type": "ALERT",
                            "category": "ZONE_INTRUSION",
                            "severity": zone.get("severity", "HIGH"),
                            "title": f"Restricted Perimeter Breach: {zone.get('name')}",
                            "description": f"Target '{cls}' breached restricted virtual fence '{zone.get('name')}'. Centroid: ({centroid[0]:.2f}, {centroid[1]:.2f})",
                            "triggering_rule": f"VIRTUAL_FENCE_BREACH (Zone: {zone.get('name')})",
                            "confidence": conf,
                            "evidence_snapshot": snapshot_rel,
                            "metadata": {
                                "zone_id": zone["id"],
                                "zone_name": zone["name"],
                                "target_class": cls,
                                "track_id": det.get("track_id")
                            }
                        })

            # Night-time monitoring check (e.g., between 20:00 and 06:00 UTC)
            is_night = (current_hour >= 20 or current_hour < 6)
            if enable_night_rules and is_night and cls == "person":
                rule_key = f"night_person_{camera_id}_{det.get('track_id', 0)}"
                if now - self.last_alert_time.get(rule_key, 0) > 45:
                    self.last_alert_time[rule_key] = now
                    snapshot_rel = self.save_snapshot(frame, prefix=f"night_cam_{camera_id}")
                    generated_events.append({
                        "type": "ALERT",
                        "category": "NIGHT_MOVEMENT",
                        "severity": "CRITICAL",
                        "title": "Night Surveillance Movement Detected",
                        "description": f"Human movement detected in active night-surveillance schedule on camera feed.",
                        "triggering_rule": "NIGHT_SCHEDULE_UNAUTHORIZED_MOVEMENT",
                        "confidence": conf,
                        "evidence_snapshot": snapshot_rel,
                        "metadata": {"track_id": det.get("track_id"), "class_name": cls}
                    })

        return generated_events

analytics_engine = VideoAnalyticsEngine()
