import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, Enum, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    SECURITY_ADMIN = "SECURITY_ADMIN"
    MONITORING_OPERATOR = "MONITORING_OPERATOR"
    INCIDENT_INVESTIGATOR = "INCIDENT_INVESTIGATOR"
    READ_ONLY_AUDITOR = "READ_ONLY_AUDITOR"

class CameraStatus(str, enum.Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    CONNECTING = "CONNECTING"
    STREAMING = "STREAMING"
    ERROR = "ERROR"

class AlertSeverity(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class IncidentStatus(str, enum.Enum):
    NEW = "NEW"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    UNDER_REVIEW = "UNDER_REVIEW"
    ESCALATED = "ESCALATED"
    RESOLVED = "RESOLVED"
    FALSE_POSITIVE = "FALSE_POSITIVE"

class EventCategory(str, enum.Enum):
    PERSON_DETECTION = "PERSON_DETECTION"
    VEHICLE_DETECTION = "VEHICLE_DETECTION"
    ZONE_INTRUSION = "ZONE_INTRUSION"
    ANPR_MATCH = "ANPR_MATCH"
    FACE_DETECTED = "FACE_DETECTED"
    NIGHT_MOVEMENT = "NIGHT_MOVEMENT"
    CAMERA_TAMPER = "CAMERA_TAMPER"
    SUSPICIOUS_LOITERING = "SUSPICIOUS_LOITERING"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    badge_number = Column(String(50), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.MONITORING_OPERATOR, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    last_login = Column(DateTime, nullable=True)

    assigned_incidents = relationship("Alert", back_populates="assigned_user")
    audit_logs = relationship("AuditLog", back_populates="user")

class Site(Base):
    __tablename__ = "sites"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    code = Column(String(20), unique=True, nullable=False)  # e.g. BOP-ATTARI-01
    region = Column(String(50), nullable=False)  # e.g. Western Border Sector
    sector = Column(String(50), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    cameras = relationship("Camera", back_populates="site", cascade="all, delete-orphan")

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    name = Column(String(100), nullable=False)
    identifier = Column(String(50), unique=True, index=True, nullable=False) # e.g. CAM-WEST-001
    location_description = Column(String(255), nullable=True)
    stream_url = Column(String(500), nullable=False)  # encrypted or private RTSP / synthetic feed URL
    protocol = Column(String(20), default="RTSP")
    status = Column(Enum(CameraStatus), default=CameraStatus.OFFLINE)
    fps_limit = Column(Integer, default=15)
    resolution = Column(String(20), default="1920x1080")
    
    # Analytics toggles
    enable_person_detection = Column(Boolean, default=True)
    enable_vehicle_detection = Column(Boolean, default=True)
    enable_anpr = Column(Boolean, default=True)
    enable_face_detection = Column(Boolean, default=True)
    enable_virtual_fence = Column(Boolean, default=True)
    enable_night_monitoring = Column(Boolean, default=True)
    
    is_synthetic = Column(Boolean, default=False)
    last_heartbeat = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    site = relationship("Site", back_populates="cameras")
    zones = relationship("VirtualZone", back_populates="camera", cascade="all, delete-orphan")
    events = relationship("DetectionEvent", back_populates="camera", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="camera", cascade="all, delete-orphan")

class VirtualZone(Base):
    __tablename__ = "virtual_zones"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    zone_type = Column(String(50), default="RESTRICTED_POLYGON") # RESTRICTED_POLYGON, TRIPWIRE
    coordinates = Column(JSON, nullable=False) # List of [x, y] normalized vertices [[0.1, 0.2], ...]
    is_active = Column(Boolean, default=True)
    severity = Column(Enum(AlertSeverity), default=AlertSeverity.HIGH)
    dwell_time_seconds = Column(Integer, default=2)
    cooldown_seconds = Column(Integer, default=30)
    created_at = Column(DateTime, default=utc_now)

    camera = relationship("Camera", back_populates="zones")

class DetectionEvent(Base):
    __tablename__ = "detection_events"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False)
    category = Column(Enum(EventCategory), nullable=False)
    object_type = Column(String(50), nullable=False) # person, car, truck, bus, motorcycle, plate, face
    confidence = Column(Float, nullable=False)
    track_id = Column(Integer, nullable=True)
    bounding_box = Column(JSON, nullable=True) # [ymin, xmin, ymax, xmax] normalized
    metadata_json = Column(JSON, nullable=True) # ANPR plate text, vehicle class, face bbox, etc.
    snapshot_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=utc_now, index=True)

    camera = relationship("Camera", back_populates="events")

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_code = Column(String(50), unique=True, index=True, nullable=False) # e.g. ALT-20261018-001
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    category = Column(Enum(EventCategory), nullable=False)
    severity = Column(Enum(AlertSeverity), default=AlertSeverity.MEDIUM, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    triggering_rule = Column(String(255), nullable=False)
    confidence = Column(Float, nullable=True)
    
    status = Column(Enum(IncidentStatus), default=IncidentStatus.NEW, nullable=False)
    assigned_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    evidence_snapshot = Column(String(500), nullable=True)
    evidence_clip = Column(String(500), nullable=True)
    metadata_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=utc_now, index=True)

    camera = relationship("Camera", back_populates="alerts")
    assigned_user = relationship("User", back_populates="assigned_incidents")
    notes = relationship("IncidentNote", back_populates="alert", cascade="all, delete-orphan")

class IncidentNote(Base):
    __tablename__ = "incident_notes"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    author_name = Column(String(100), nullable=False)
    note = Column(Text, nullable=False)
    created_at = Column(DateTime, default=utc_now)

    alert = relationship("Alert", back_populates="notes")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False) # e.g. "ACKNOWLEDGE_ALERT", "CREATE_ZONE", "EXPORT_EVIDENCE"
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(50), nullable=True)
    ip_address = Column(String(50), nullable=True)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=utc_now, index=True)

    user = relationship("User", back_populates="audit_logs")
