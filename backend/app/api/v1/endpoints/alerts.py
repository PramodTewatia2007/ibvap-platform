from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional
from datetime import datetime, timezone
from app.core.database import get_db
from app.models.models import Alert, IncidentNote, Camera, Site, User, IncidentStatus, AlertSeverity, EventCategory, AuditLog
from app.schemas.schemas import AlertResponse, AlertStatusUpdate, IncidentNoteCreate, IncidentNoteResponse


router = APIRouter()

@router.get("/", response_model=List[AlertResponse])
async def list_alerts(
    status: Optional[IncidentStatus] = None,
    severity: Optional[AlertSeverity] = None,
    category: Optional[EventCategory] = None,
    site_id: Optional[int] = None,
    limit: int = Query(50, le=100),
    db: AsyncSession = Depends(get_db)
):
    query = select(Alert).order_by(desc(Alert.created_at))
    if status:
        query = query.where(Alert.status == status)
    if severity:
        query = query.where(Alert.severity == severity)
    if category:
        query = query.where(Alert.category == category)
    if site_id:
        query = query.where(Alert.site_id == site_id)
        
    query = query.limit(limit)
    result = await db.execute(query)
    alerts = result.scalars().all()
    
    out = []
    for a in alerts:
        cam_res = await db.execute(select(Camera).where(Camera.id == a.camera_id))
        cam = cam_res.scalars().first()
        site_res = await db.execute(select(Site).where(Site.id == a.site_id))
        site = site_res.scalars().first()
        
        assigned_name = None
        if a.assigned_user_id:
            user_res = await db.execute(select(User).where(User.id == a.assigned_user_id))
            user = user_res.scalars().first()
            if user:
                assigned_name = user.full_name
                
        # Fetch notes
        notes_res = await db.execute(select(IncidentNote).where(IncidentNote.alert_id == a.id))
        notes = notes_res.scalars().all()
        
        ar = AlertResponse.model_validate(a)
        ar.camera_name = cam.name if cam else ""
        ar.camera_identifier = cam.identifier if cam else ""
        ar.site_name = site.name if site else ""
        ar.assigned_user_name = assigned_name
        ar.notes = [IncidentNoteResponse.model_validate(n) for n in notes]
        out.append(ar)
        
    return out

@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    a = result.scalars().first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    cam_res = await db.execute(select(Camera).where(Camera.id == a.camera_id))
    cam = cam_res.scalars().first()
    site_res = await db.execute(select(Site).where(Site.id == a.site_id))
    site = site_res.scalars().first()
    
    assigned_name = None
    if a.assigned_user_id:
        user_res = await db.execute(select(User).where(User.id == a.assigned_user_id))
        user = user_res.scalars().first()
        if user:
            assigned_name = user.full_name
            
    notes_res = await db.execute(select(IncidentNote).where(IncidentNote.alert_id == a.id))
    notes = notes_res.scalars().all()
    
    ar = AlertResponse.model_validate(a)
    ar.camera_name = cam.name if cam else ""
    ar.camera_identifier = cam.identifier if cam else ""
    ar.site_name = site.name if site else ""
    ar.assigned_user_name = assigned_name
    ar.notes = [IncidentNoteResponse.model_validate(n) for n in notes]
    return ar

@router.patch("/{alert_id}/status", response_model=AlertResponse)
async def update_alert_status(alert_id: int, payload: AlertStatusUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    a = result.scalars().first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    a.status = payload.status
    if payload.resolution_notes:
        a.resolution_notes = payload.resolution_notes
    if payload.assigned_user_id:
        a.assigned_user_id = payload.assigned_user_id
        a.assigned_at = datetime.now(timezone.utc)
    if payload.status in [IncidentStatus.RESOLVED, IncidentStatus.FALSE_POSITIVE]:
        a.resolved_at = datetime.now(timezone.utc)

        
    # Create audit log
    audit = AuditLog(
        action=f"UPDATE_ALERT_STATUS_{payload.status.value}",
        resource_type="ALERT",
        resource_id=str(a.id),
        details={"status": payload.status.value, "notes": payload.resolution_notes}
    )
    db.add(audit)
    
    await db.commit()
    await db.refresh(a)
    return await get_alert(alert_id=a.id, db=db)

@router.post("/{alert_id}/notes", response_model=IncidentNoteResponse)
async def add_incident_note(alert_id: int, payload: IncidentNoteCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    a = result.scalars().first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    # Default to system operator note
    note = IncidentNote(
        alert_id=alert_id,
        user_id=1,
        author_name="Border Control Operator",
        note=payload.note
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note
