from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.core.database import get_db
from app.models.models import VirtualZone, Camera
from app.schemas.schemas import VirtualZoneResponse, VirtualZoneCreate

router = APIRouter()

@router.get("/", response_model=List[VirtualZoneResponse])
async def list_zones(camera_id: Optional[int] = None, db: AsyncSession = Depends(get_db)):
    query = select(VirtualZone)
    if camera_id:
        query = query.where(VirtualZone.camera_id == camera_id)
    result = await db.execute(query)
    zones = result.scalars().all()
    return zones

@router.post("/", response_model=VirtualZoneResponse)
async def create_zone(payload: VirtualZoneCreate, db: AsyncSession = Depends(get_db)):
    # Validate camera existence
    cam = await db.execute(select(Camera).where(Camera.id == payload.camera_id))
    if not cam.scalars().first():
        raise HTTPException(status_code=400, detail="Referenced camera does not exist")

    new_zone = VirtualZone(**payload.model_dump())
    db.add(new_zone)
    await db.commit()
    await db.refresh(new_zone)
    return new_zone


@router.delete("/{zone_id}")
async def delete_zone(zone_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(VirtualZone).where(VirtualZone.id == zone_id))
    zone = res.scalars().first()
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    await db.delete(zone)
    await db.commit()
    return {"message": "Virtual zone deleted successfully"}
