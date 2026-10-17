import asyncio
import cv2
import base64
import time
from datetime import datetime, timezone
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.models import Camera, VirtualZone, DetectionEvent, Alert, EventCategory, IncidentStatus, CameraStatus
from app.ai.synthetic_stream import SyntheticStreamGenerator
from app.ai.analytics_engine import analytics_engine
from app.core.ws_manager import ws_manager


class StreamWorker:
    def __init__(self):
        self.generators = {}
        self.is_running = False

    async def run(self):
        self.is_running = True
        print("[StreamWorker] Starting intelligent video analytics background worker...")
        
        while self.is_running:
            try:
                async with AsyncSessionLocal() as session:
                    # Fetch active cameras
                    result = await session.execute(select(Camera))
                    cameras = result.scalars().all()
                    
                    for cam in cameras:
                        # Initialize generator if needed
                        if cam.id not in self.generators:
                            self.generators[cam.id] = SyntheticStreamGenerator(
                                camera_id=cam.id,
                                camera_name=cam.name,
                                site_name=f"Sector-{cam.site_id}"
                            )
                        
                        gen = self.generators[cam.id]
                        frame, detections = gen.read_frame()
                        
                        # Fetch camera zones
                        zone_res = await session.execute(select(VirtualZone).where(VirtualZone.camera_id == cam.id, VirtualZone.is_active == True))
                        zones = zone_res.scalars().all()
                        zone_dicts = [
                            {
                                "id": z.id,
                                "name": z.name,
                                "coordinates": z.coordinates,
                                "severity": z.severity.value,
                                "cooldown_seconds": z.cooldown_seconds
                            }
                            for z in zones
                        ]
                        
                        # Evaluate rules
                        events = analytics_engine.evaluate_rules(
                            camera_id=cam.id,
                            site_id=cam.site_id,
                            frame=frame,
                            detections=detections,
                            zones=zone_dicts,
                            enable_night_rules=cam.enable_night_monitoring
                        )
                        
                        # Process generated events & alerts
                        for ev in events:
                            if ev["type"] == "DETECTION":
                                det_event = DetectionEvent(
                                    camera_id=cam.id,
                                    category=EventCategory[ev["category"]],
                                    object_type=ev["object_type"],
                                    confidence=ev["confidence"],
                                    track_id=ev.get("track_id"),
                                    bounding_box=ev.get("bounding_box"),
                                    metadata_json=ev.get("metadata")
                                )
                                session.add(det_event)
                                
                            elif ev["type"] == "ANPR":
                                det_event = DetectionEvent(
                                    camera_id=cam.id,
                                    category=EventCategory.ANPR_MATCH,
                                    object_type="plate",
                                    confidence=ev["confidence"],
                                    metadata_json=ev.get("metadata")
                                )
                                session.add(det_event)
                                
                            elif ev["type"] == "ALERT":
                                alert_code = f"ALT-{int(time.time())}-{cam.id}"
                                new_alert = Alert(
                                    alert_code=alert_code,
                                    camera_id=cam.id,
                                    site_id=cam.site_id,
                                    category=EventCategory[ev["category"]],
                                    severity=ev["severity"],
                                    title=ev["title"],
                                    description=ev["description"],
                                    triggering_rule=ev["triggering_rule"],
                                    confidence=ev["confidence"],
                                    status=IncidentStatus.NEW,
                                    evidence_snapshot=ev.get("evidence_snapshot"),
                                    metadata_json=ev.get("metadata")
                                )
                                session.add(new_alert)
                                await session.flush()
                                
                                # Broadcast alert via WebSocket
                                await ws_manager.broadcast({
                                    "event": "NEW_ALERT",
                                    "alert": {
                                        "id": new_alert.id,
                                        "alert_code": new_alert.alert_code,
                                        "camera_id": cam.id,
                                        "site_id": cam.site_id,
                                        "title": new_alert.title,
                                        "severity": new_alert.severity.value,
                                        "category": new_alert.category.value,
                                        "description": new_alert.description,
                                        "evidence_snapshot": new_alert.evidence_snapshot,
                                        "created_at": new_alert.created_at.isoformat()
                                    }
                                })
                        
                        # Update camera status
                        cam.status = CameraStatus.STREAMING
                        cam.last_heartbeat = datetime.now(timezone.utc)
                        
                        await session.commit()
                        
                        # Broadcast telemetry with base64 thumbnail for live monitoring
                        _, buffer = cv2.imencode('.jpg', frame, [int(cv2.IMWRITE_JPEG_QUALITY), 65])
                        jpg_as_text = base64.b64encode(buffer).decode('utf-8')
                        
                        await ws_manager.broadcast({
                            "event": "CAMERA_FRAME",
                            "camera_id": cam.id,
                            "frame_data": f"data:image/jpeg;base64,{jpg_as_text}",
                            "detections": detections,
                            "fps": cam.fps_limit
                        })

            except asyncio.CancelledError:
                self.is_running = False
                break
            except Exception as e:
                # Log and continue cleanly
                print(f"[StreamWorker] Warning: {e}")
                await asyncio.sleep(2)
            
            # Tick rate for surveillance processing (approx 2-3 fps for background analytics)
            await asyncio.sleep(1.0)

stream_worker = StreamWorker()

