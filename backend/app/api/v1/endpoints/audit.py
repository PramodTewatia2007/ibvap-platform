from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional
from app.core.database import get_db
from app.models.models import AuditLog, User
from app.schemas.schemas import AuditLogResponse

router = APIRouter()

@router.get("/", response_model=List[AuditLogResponse])
async def list_audit_logs(
    resource_type: Optional[str] = None,
    limit: int = Query(50, le=100),
    db: AsyncSession = Depends(get_db)
):
    query = select(AuditLog).order_by(desc(AuditLog.timestamp))
    if resource_type:
        query = query.where(AuditLog.resource_type == resource_type)
    query = query.limit(limit)
    res = await db.execute(query)
    logs = res.scalars().all()
    
    out = []
    for log in logs:
        uname = None
        if log.user_id:
            u_res = await db.execute(select(User).where(User.id == log.user_id))
            u = u_res.scalars().first()
            if u:
                uname = u.username
        lr = AuditLogResponse.model_validate(log)
        lr.username = uname
        out.append(lr)

    return out
