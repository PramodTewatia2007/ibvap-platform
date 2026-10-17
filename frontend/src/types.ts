export type UserRole = 
  | 'SUPER_ADMIN' 
  | 'SECURITY_ADMIN' 
  | 'MONITORING_OPERATOR' 
  | 'INCIDENT_INVESTIGATOR' 
  | 'READ_ONLY_AUDITOR';

export type CameraStatus = 'ONLINE' | 'OFFLINE' | 'CONNECTING' | 'STREAMING' | 'ERROR';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'NEW' | 'ACKNOWLEDGED' | 'UNDER_REVIEW' | 'ESCALATED' | 'RESOLVED' | 'FALSE_POSITIVE';
export type EventCategory = 
  | 'PERSON_DETECTION' 
  | 'VEHICLE_DETECTION' 
  | 'ZONE_INTRUSION' 
  | 'ANPR_MATCH' 
  | 'FACE_DETECTED' 
  | 'NIGHT_MOVEMENT' 
  | 'CAMERA_TAMPER' 
  | 'SUSPICIOUS_LOITERING';

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  badge_number?: string;
  role: UserRole;
  is_active: boolean;
}

export interface Site {
  id: number;
  name: string;
  code: string;
  region: string;
  sector: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  camera_count?: number;
}

export interface Camera {
  id: number;
  site_id: number;
  site_name?: string;
  name: string;
  identifier: string;
  location_description?: string;
  stream_url: string;
  protocol: string;
  status: CameraStatus;
  fps_limit: number;
  resolution: string;
  enable_person_detection: boolean;
  enable_vehicle_detection: boolean;
  enable_anpr: boolean;
  enable_face_detection: boolean;
  enable_virtual_fence: boolean;
  enable_night_monitoring: boolean;
  is_synthetic: boolean;
  last_heartbeat?: string;
}

export interface VirtualZone {
  id: number;
  camera_id: number;
  name: string;
  description?: string;
  zone_type: string;
  coordinates: [number, number][];
  is_active: boolean;
  severity: AlertSeverity;
  dwell_time_seconds: number;
  cooldown_seconds: number;
}

export interface IncidentNote {
  id: number;
  alert_id: number;
  user_id: number;
  author_name: string;
  note: string;
  created_at: string;
}

export interface Alert {
  id: number;
  alert_code: string;
  camera_id: number;
  camera_name?: string;
  camera_identifier?: string;
  site_id: number;
  site_name?: string;
  category: EventCategory;
  severity: AlertSeverity;
  title: string;
  description: string;
  triggering_rule: string;
  confidence?: number;
  status: IncidentStatus;
  assigned_user_name?: string;
  assigned_at?: string;
  resolved_at?: string;
  resolution_notes?: string;
  evidence_snapshot?: string;
  metadata_json?: Record<string, any>;
  created_at: string;
  notes?: IncidentNote[];
}

export interface DetectionEvent {
  id: number;
  camera_id: number;
  camera_identifier?: string;
  site_name?: string;
  category: EventCategory;
  object_type: string;
  confidence: number;
  track_id?: number;
  bounding_box?: [number, number, number, number];
  metadata_json?: Record<string, any>;
  snapshot_path?: string;
  created_at: string;
}

export interface DashboardStats {
  total_cameras: number;
  online_cameras: number;
  offline_cameras: number;
  streaming_cameras: number;
  people_detected_today: number;
  vehicles_detected_today: number;
  anpr_events_today: number;
  active_intrusion_alerts: number;
  unresolved_critical_incidents: number;
  ai_engine_status: string;
  storage_utilization_percent: number;
  network_connectivity_status: string;
  hourly_trends: { hour: string; people: number; vehicles: number; alerts: number }[];
  severity_distribution: Record<string, number>;
  category_distribution: Record<string, number>;
  site_breakdown: { id: number; name: string; code: string; region: string; camera_count: number }[];
}
