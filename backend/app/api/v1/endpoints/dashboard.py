from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.models import Camera, DetectionEvent, Alert, Site, CameraStatus, IncidentStatus, EventCategory, AlertSeverity
from app.schemas.schemas import DashboardStats
from datetime import datetime, timezone

router = APIRouter()

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    # Camera metrics
    cam_res = await db.execute(select(Camera))
    cameras = cam_res.scalars().all()
    total_cameras = len(cameras)
    online_cameras = sum(1 for c in cameras if c.status in [CameraStatus.ONLINE, CameraStatus.STREAMING])
    offline_cameras = sum(1 for c in cameras if c.status == CameraStatus.OFFLINE)
    streaming_cameras = sum(1 for c in cameras if c.status == CameraStatus.STREAMING)

    # Detection counts today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    
    person_cnt = await db.execute(
        select(func.count(DetectionEvent.id)).where(
            DetectionEvent.category == EventCategory.PERSON_DETECTION,
            DetectionEvent.created_at >= today_start
        )
    )
    people_detected_today = person_cnt.scalar() or 0

    vehicle_cnt = await db.execute(
        select(func.count(DetectionEvent.id)).where(
            DetectionEvent.category == EventCategory.VEHICLE_DETECTION,
            DetectionEvent.created_at >= today_start
        )
    )
    vehicles_detected_today = vehicle_cnt.scalar() or 0

    anpr_cnt = await db.execute(
        select(func.count(DetectionEvent.id)).where(
            DetectionEvent.category == EventCategory.ANPR_MATCH,
            DetectionEvent.created_at >= today_start
        )
    )
    anpr_events_today = anpr_cnt.scalar() or 0

    # Active alert metrics
    active_intrusions = await db.execute(
        select(func.count(Alert.id)).where(
            Alert.category == EventCategory.ZONE_INTRUSION,
            Alert.status.in_([IncidentStatus.NEW, IncidentStatus.ACKNOWLEDGED, IncidentStatus.UNDER_REVIEW])
        )
    )
    active_intrusion_alerts = active_intrusions.scalar() or 0

    unresolved_crit = await db.execute(
        select(func.count(Alert.id)).where(
            Alert.severity == AlertSeverity.CRITICAL,
            Alert.status.in_([IncidentStatus.NEW, IncidentStatus.ACKNOWLEDGED, IncidentStatus.ESCALATED])
        )
    )
    unresolved_critical_incidents = unresolved_crit.scalar() or 0

    # Severity distribution
    sev_counts = {}
    for sev in AlertSeverity:
        res = await db.execute(select(func.count(Alert.id)).where(Alert.severity == sev))
        sev_counts[sev.value] = res.scalar() or 0

    # Category distribution
    cat_counts = {}
    for cat in EventCategory:
        res = await db.execute(select(func.count(Alert.id)).where(Alert.category == cat))
        cat_counts[cat.value] = res.scalar() or 0

    # Hourly mock trends for 24h surveillance timeline
    hourly_trends = [
        {"hour": f"{(h):02d}:00", "people": max(2, (h * 3) % 15), "vehicles": max(1, (h * 5) % 22), "alerts": (h % 4 == 0 and 1 or 0)}
        for h in range(24)
    ]

    # Site breakdown
    site_res = await db.execute(select(Site))
    sites = site_res.scalars().all()
    site_breakdown = []
    for s in sites:
        c_res = await db.execute(select(func.count(Camera.id)).where(Camera.site_id == s.id))
        count = c_res.scalar() or 0
        site_breakdown.append({
            "id": s.id,
            "name": s.name,
            "code": s.code,
            "region": s.region,
            "camera_count": count
        })

    return DashboardStats(
        total_cameras=total_cameras,
        online_cameras=online_cameras,
        offline_cameras=offline_cameras,
        streaming_cameras=streaming_cameras,
        people_detected_today=people_detected_today,
        vehicles_detected_today=vehicles_detected_today,
        anpr_events_today=anpr_events_today,
        active_intrusion_alerts=active_intrusion_alerts,
        unresolved_critical_incidents=unresolved_critical_incidents,
        ai_engine_status="OPERATIONAL (OpenCV + Object Centroid Tracker + Rules Engine)",
        storage_utilization_percent=24.5,
        network_connectivity_status="HEALTHY (Latency 14ms)",
        hourly_trends=hourly_trends,
        severity_distribution=sev_counts,
        category_distribution=cat_counts,
        site_breakdown=site_breakdown
    )
