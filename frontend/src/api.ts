import axios from 'axios';
import { 
  User, Site, Camera, VirtualZone, Alert, DetectionEvent, DashboardStats, 
  IncidentStatus, AlertSeverity, EventCategory 
} from './types';

const API_BASE = '/api/v1';

export const api = {
  // Auth
  login: async (username: string, password: string) => {
    const res = await axios.post(`${API_BASE}/auth/login`, { username, password });
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await axios.get<User>(`${API_BASE}/auth/me`);
    return res.data;
  },

  // Dashboard
  getDashboardStats: async () => {
    const res = await axios.get<DashboardStats>(`${API_BASE}/dashboard/stats`);
    return res.data;
  },

  // Cameras
  getCameras: async (siteId?: number) => {
    const res = await axios.get<Camera[]>(`${API_BASE}/cameras/`, { params: { site_id: siteId } });
    return res.data;
  },
  createCamera: async (data: Partial<Camera>) => {
    const res = await axios.post<Camera>(`${API_BASE}/cameras/`, data);
    return res.data;
  },
  testCameraConnection: async (cameraId: number) => {
    const res = await axios.post(`${API_BASE}/cameras/${cameraId}/test-connection`);
    return res.data;
  },

  // Sites
  getSites: async () => {
    const res = await axios.get<Site[]>(`${API_BASE}/sites/`);
    return res.data;
  },
  createSite: async (data: Partial<Site>) => {
    const res = await axios.post<Site>(`${API_BASE}/sites/`, data);
    return res.data;
  },

  // Virtual Zones
  getZones: async (cameraId?: number) => {
    const res = await axios.get<VirtualZone[]>(`${API_BASE}/zones/`, { params: { camera_id: cameraId } });
    return res.data;
  },
  createZone: async (data: Partial<VirtualZone>) => {
    const res = await axios.post<VirtualZone>(`${API_BASE}/zones/`, data);
    return res.data;
  },
  deleteZone: async (zoneId: number) => {
    const res = await axios.delete(`${API_BASE}/zones/${zoneId}`);
    return res.data;
  },

  // Alerts & Incidents
  getAlerts: async (params?: { status?: IncidentStatus; severity?: AlertSeverity; category?: EventCategory; site_id?: number }) => {
    const res = await axios.get<Alert[]>(`${API_BASE}/alerts/`, { params });
    return res.data;
  },
  updateAlertStatus: async (alertId: number, status: IncidentStatus, resolution_notes?: string) => {
    const res = await axios.patch<Alert>(`${API_BASE}/alerts/${alertId}/status`, { status, resolution_notes });
    return res.data;
  },
  addAlertNote: async (alertId: number, note: string) => {
    const res = await axios.post(`${API_BASE}/alerts/${alertId}/notes`, { note });
    return res.data;
  },

  // Analytics, Events & ANPR
  getEvents: async (category?: EventCategory, cameraId?: number) => {
    const res = await axios.get<DetectionEvent[]>(`${API_BASE}/analytics/events`, { params: { category, camera_id: cameraId } });
    return res.data;
  },
  searchANPR: async (plate?: string) => {
    const res = await axios.get<any[]>(`${API_BASE}/analytics/anpr`, { params: { plate } });
    return res.data;
  },
  getFaceRecords: async () => {
    const res = await axios.get<any[]>(`${API_BASE}/analytics/faces`);
    return res.data;
  },

  // Audit Logs
  getAuditLogs: async () => {
    const res = await axios.get<any[]>(`${API_BASE}/audit/`);
    return res.data;
  },

  // System & C2
  getSystemHealth: async () => {
    const res = await axios.get(`${API_BASE}/system/status`);
    return res.data;
  },
  getC2Telemetry: async () => {
    const res = await axios.get(`${API_BASE}/system/c2/telemetry`);
    return res.data;
  }
};
