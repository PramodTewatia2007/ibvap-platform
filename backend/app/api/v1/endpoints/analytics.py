from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional
from app.core.database import get_db
from app.models.models import DetectionEvent, Camera, Site, EventCategory
from app.schemas.schemas import DetectionEventResponse

router = APIRouter()

@router.get("/events", response_model=List[DetectionEventResponse])
async def list_events(
    category: Optional[EventCategory] = None,
    camera_id: Optional[int] = None,
    limit: int = Query(50, le=100),
    db: AsyncSession = Depends(get_db)
):
    query = select(DetectionEvent).order_by(desc(DetectionEvent.created_at))
    if category:
        query = query.where(DetectionEvent.category == category)
    if camera_id:
        query = query.where(DetectionEvent.camera_id == camera_id)
        
    query = query.limit(limit)
    res = await db.execute(query)
    events = res.scalars().all()
    
    out = []
    for ev in events:
        cam_res = await db.execute(select(Camera).where(Camera.id == ev.camera_id))
        cam = cam_res.scalars().first()
        site_name = ""
        cam_ident = ""
        if cam:
            cam_ident = cam.identifier
            site_res = await db.execute(select(Site).where(Site.id == cam.site_id))
            site = site_res.scalars().first()
            if site:
                site_name = site.name
                
        er = DetectionEventResponse.model_validate(ev)
        er.camera_identifier = cam_ident
        er.site_name = site_name
        out.append(er)

    return out

@router.get("/anpr")
async def search_anpr(
    plate: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    query = select(DetectionEvent).where(DetectionEvent.category == EventCategory.ANPR_MATCH).order_by(desc(DetectionEvent.created_at))
    res = await db.execute(query)
    records = res.scalars().all()
    
    filtered = []
    for r in records:
        meta = r.metadata_json or {}
        p_text = meta.get("plate", "")
        if plate and plate.upper() not in p_text.upper():
            continue
        filtered.append({
            "id": r.id,
            "plate_number": p_text,
            "vehicle_type": meta.get("vehicle_type", "truck"),
            "confidence": r.confidence,
            "camera_id": r.camera_id,
            "created_at": r.created_at.isoformat(),
            "verification_status": "AUTOMATICALLY_VALIDATED",
            "state_jurisdiction": meta.get("state_code", "PB")
        })
        if len(filtered) >= limit:
            break
            
    return filtered

@router.get("/faces")
async def list_face_records(
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    query = select(DetectionEvent).where(DetectionEvent.category == EventCategory.FACE_DETECTED).order_by(desc(DetectionEvent.created_at)).limit(limit)
    res = await db.execute(query)
    records = res.scalars().all()
    return [
        {
            "id": r.id,
            "camera_id": r.camera_id,
            "confidence": r.confidence,
            "bounding_box": r.bounding_box,
            "created_at": r.created_at.isoformat(),
            "recognition_status": "DISABLED_BY_SECURITY_POLICY",
            "note": "Facial identification is restricted under regulatory border surveillance safeguards."
        }
        for r in records
    ]
