from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List, Any, Dict
from datetime import datetime
from app.models.models import UserRole, CameraStatus, AlertSeverity, IncidentStatus, EventCategory


# User schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    badge_number: Optional[str] = None
    role: UserRole = UserRole.MONITORING_OPERATOR
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    last_login: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class LoginRequest(BaseModel):
    username: str
    password: str

# Site schemas
class SiteBase(BaseModel):
    name: str
    code: str
    region: str
    sector: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None

class SiteCreate(SiteBase):
    pass

class SiteResponse(SiteBase):
    id: int
    created_at: datetime
    camera_count: Optional[int] = 0

    model_config = ConfigDict(from_attributes=True)

# Camera schemas
class CameraBase(BaseModel):
    name: str
    identifier: str
    site_id: int
    location_description: Optional[str] = None
    stream_url: str
    protocol: str = "RTSP"
    fps_limit: int = 15
    resolution: str = "1920x1080"
    enable_person_detection: bool = True
    enable_vehicle_detection: bool = True
    enable_anpr: bool = True
    enable_face_detection: bool = True
    enable_virtual_fence: bool = True
    enable_night_monitoring: bool = True
    is_synthetic: bool = False

class CameraCreate(CameraBase):
    pass

class CameraUpdate(BaseModel):
    name: Optional[str] = None
    location_description: Optional[str] = None
    stream_url: Optional[str] = None
    fps_limit: Optional[int] = None
    enable_person_detection: Optional[bool] = None
    enable_vehicle_detection: Optional[bool] = None
    enable_anpr: Optional[bool] = None
    enable_face_detection: Optional[bool] = None
    enable_virtual_fence: Optional[bool] = None
    enable_night_monitoring: Optional[bool] = None
    status: Optional[CameraStatus] = None

class CameraResponse(CameraBase):
    id: int
    status: CameraStatus
    last_heartbeat: Optional[datetime] = None
    created_at: datetime
    site_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# Virtual Zone schemas
class VirtualZoneBase(BaseModel):
    camera_id: int
    name: str
    description: Optional[str] = None
    zone_type: str = "RESTRICTED_POLYGON"
    coordinates: List[List[float]] # [[x, y], [x, y], ...]
    is_active: bool = True
    severity: AlertSeverity = AlertSeverity.HIGH
    dwell_time_seconds: int = 2
    cooldown_seconds: int = 30

class VirtualZoneCreate(VirtualZoneBase):
    pass

class VirtualZoneResponse(VirtualZoneBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# Detection Event schemas
class DetectionEventResponse(BaseModel):
    id: int
    camera_id: int
    category: EventCategory
    object_type: str
    confidence: float
    track_id: Optional[int] = None
    bounding_box: Optional[List[float]] = None
    metadata_json: Optional[Dict[str, Any]] = None
    snapshot_path: Optional[str] = None
    created_at: datetime
    camera_identifier: Optional[str] = None
    site_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# Alert schemas
class IncidentNoteCreate(BaseModel):
    note: str

class IncidentNoteResponse(BaseModel):
    id: int
    alert_id: int
    user_id: int
    author_name: str
    note: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class AlertStatusUpdate(BaseModel):
    status: IncidentStatus
    resolution_notes: Optional[str] = None
    assigned_user_id: Optional[int] = None

class AlertResponse(BaseModel):
    id: int
    alert_code: str
    camera_id: int
    site_id: int
    category: EventCategory
    severity: AlertSeverity
    title: str
    description: str
    triggering_rule: str
    confidence: Optional[float] = None
    status: IncidentStatus
    assigned_user_id: Optional[int] = None
    assigned_user_name: Optional[str] = None
    assigned_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    evidence_snapshot: Optional[str] = None
    evidence_clip: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None
    created_at: datetime
    camera_name: Optional[str] = None
    camera_identifier: Optional[str] = None
    site_name: Optional[str] = None
    notes: Optional[List[IncidentNoteResponse]] = []

    model_config = ConfigDict(from_attributes=True)

# Audit schemas
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    username: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    ip_address: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

# Dashboard Stats
class DashboardStats(BaseModel):
    total_cameras: int
    online_cameras: int
    offline_cameras: int
    streaming_cameras: int
    people_detected_today: int
    vehicles_detected_today: int
    anpr_events_today: int
    active_intrusion_alerts: int
    unresolved_critical_incidents: int
    ai_engine_status: str
    storage_utilization_percent: float
    network_connectivity_status: str
    hourly_trends: List[Dict[str, Any]]
    severity_distribution: Dict[str, int]
    category_distribution: Dict[str, int]
    site_breakdown: List[Dict[str, Any]]
