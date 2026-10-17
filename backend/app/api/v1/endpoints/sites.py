from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.models.models import Site, Camera
from app.schemas.schemas import SiteResponse, SiteCreate

router = APIRouter()

@router.get("/", response_model=List[SiteResponse])
async def list_sites(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Site))
    sites = result.scalars().all()
    
    out = []
    for s in sites:
        cams = await db.execute(select(Camera).where(Camera.site_id == s.id))
        c_count = len(cams.scalars().all())
        sr = SiteResponse.model_validate(s)
        sr.camera_count = c_count
        out.append(sr)
    return out

@router.post("/", response_model=SiteResponse)
async def create_site(payload: SiteCreate, db: AsyncSession = Depends(get_db)):
    new_site = Site(**payload.model_dump())
    db.add(new_site)
    await db.commit()
    await db.refresh(new_site)
    res = SiteResponse.model_validate(new_site)
    res.camera_count = 0
    return res

@router.get("/{site_id}", response_model=SiteResponse)
async def get_site(site_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Site).where(Site.id == site_id))
    site = result.scalars().first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    cams = await db.execute(select(Camera).where(Camera.site_id == site.id))
    sr = SiteResponse.model_validate(site)
    sr.camera_count = len(cams.scalars().all())
    return sr

