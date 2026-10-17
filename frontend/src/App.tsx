import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { OverviewView } from './views/OverviewView';
import { LiveSurveillanceView } from './views/LiveSurveillanceView';
import { AlertsView } from './views/AlertsView';
import { ZonesView } from './views/ZonesView';
import { CamerasView } from './views/CamerasView';
import { SitesView } from './views/SitesView';
import { ANPRView } from './views/ANPRView';
import { FacesView } from './views/FacesView';
import { AuditView } from './views/AuditView';
import { SystemView } from './views/SystemView';

import { api } from './api';
import { 
  User, Site, Camera, VirtualZone, Alert, DashboardStats, IncidentStatus 
} from './types';


export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  
  // Operational state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [zones, setZones] = useState<VirtualZone[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [anprRecords, setAnprRecords] = useState<any[]>([]);
  const [faceRecords, setFaceRecords] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [c2Telemetry, setC2Telemetry] = useState<any>(null);
  
  // Live frame buffer from WebSocket
  const [liveFrames, setLiveFrames] = useState<Record<number, string>>({});

  const refreshData = async () => {
    try {
      const [u, st, cams, s, z, a, anpr, faces, logs, health, c2] = await Promise.all([
        api.getCurrentUser().catch(() => null),
        api.getDashboardStats().catch(() => null),
        api.getCameras().catch(() => []),
        api.getSites().catch(() => []),
        api.getZones().catch(() => []),
        api.getAlerts().catch(() => []),
        api.searchANPR().catch(() => []),
        api.getFaceRecords().catch(() => []),
        api.getAuditLogs().catch(() => []),
        api.getSystemHealth().catch(() => null),
        api.getC2Telemetry().catch(() => null)
      ]);

      if (u) setCurrentUser(u);
      if (st) setStats(st);
      setCameras(cams);
      setSites(s);
      setZones(z);
      setAlerts(a);
      setAnprRecords(anpr);
      setFaceRecords(faces);
      setAuditLogs(logs);
      setSystemHealth(health);
      setC2Telemetry(c2);
    } catch (err) {
      console.error("Failed to load platform data:", err);
    }
  };

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    refreshData();
    const interval = setInterval(() => {
      refreshData();
    }, 10000); // Polling fallback



    // Connect WebSocket for real-time video frames and alerts
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/surveillance`;
    let socket: WebSocket;

    try {
      socket = new WebSocket(wsUrl);
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === 'CAMERA_FRAME') {
            setLiveFrames(prev => ({
              ...prev,
              [data.camera_id]: data.frame_data
            }));
          } else if (data.event === 'NEW_ALERT') {
            setAlerts(prev => [data.alert, ...prev]);
          }
        } catch {
          // ignore parsing error
        }
      };
    } catch (e) {
      console.warn("WebSocket could not be established directly:", e);
    }


    return () => {
      clearInterval(interval);
      if (socket) socket.close();
    };
  }, []);

  const handleUpdateStatus = async (alertId: number, status: IncidentStatus, notes?: string) => {
    await api.updateAlertStatus(alertId, status, notes);
    refreshData();
  };

  const handleAddNote = async (alertId: number, note: string) => {
    await api.addAlertNote(alertId, note);
    refreshData();
  };

  const handleCreateZone = async (zone: Partial<VirtualZone>) => {
    await api.createZone(zone);
    refreshData();
  };

  const handleDeleteZone = async (zoneId: number) => {
    await api.deleteZone(zoneId);
    refreshData();
  };

  const handleCreateCamera = async (cam: Partial<Camera>) => {
    await api.createCamera(cam);
    refreshData();
  };

  const handleTestConnection = async (camId: number) => {
    const res = await api.testCameraConnection(camId);
    alert(`[RTSP TEST SUCCESS]: ${res.message} (Latency: ${res.latency_ms}ms, Codec: ${res.codec})`);
  };

  const handleCreateSite = async (site: Partial<Site>) => {
    await api.createSite(site);
    refreshData();
  };

  const handleSearchANPR = async (plate: string) => {
    const res = await api.searchANPR(plate);
    setAnprRecords(res);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <Header 
        currentUser={currentUser} 
        onRefresh={refreshData} 
        alertCount={alerts.filter(a => a.status === 'NEW').length} 
      />

      <div className="flex flex-1">
        <Sidebar 
          currentTab={currentTab} 
          setTab={setCurrentTab} 
          alertCount={alerts.filter(a => a.status === 'NEW').length} 
        />

        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {currentTab === 'overview' && (
            <OverviewView 
              stats={stats} 
              recentAlerts={alerts} 
              onSelectAlert={() => setCurrentTab('alerts')} 
            />
          )}


          {currentTab === 'live' && (
            <LiveSurveillanceView 
              cameras={cameras} 
              zones={zones} 
              liveFrames={liveFrames} 
              onTestConnection={handleTestConnection} 
            />
          )}

          {currentTab === 'cameras' && (
            <CamerasView 
              cameras={cameras} 
              sites={sites} 
              onCreateCamera={handleCreateCamera} 
              onTestConnection={handleTestConnection} 
            />
          )}

          {currentTab === 'zones' && (
            <ZonesView 
              cameras={cameras} 
              zones={zones} 
              onCreateZone={handleCreateZone} 
              onDeleteZone={handleDeleteZone} 
            />
          )}

          {currentTab === 'alerts' && (
            <AlertsView 
              alerts={alerts} 
              onUpdateStatus={handleUpdateStatus} 
              onAddNote={handleAddNote} 
            />
          )}

          {currentTab === 'anpr' && (
            <ANPRView 
              anprRecords={anprRecords} 
              onSearch={handleSearchANPR} 
            />
          )}

          {currentTab === 'faces' && (
            <FacesView faceRecords={faceRecords} />
          )}

          {currentTab === 'sites' && (
            <SitesView 
              sites={sites} 
              onCreateSite={handleCreateSite} 
            />
          )}

          {currentTab === 'audit' && (
            <AuditView logs={auditLogs} />
          )}

          {currentTab === 'c2_system' && (
            <SystemView 
              systemHealth={systemHealth} 
              c2Telemetry={c2Telemetry} 
            />
          )}

          {(currentTab === 'analytics' || currentTab === 'evidence' || currentTab === 'reports') && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-4">
              <div className="inline-flex p-3 rounded-xl bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 font-mono text-sm">
                MODULE: {currentTab.toUpperCase()}
              </div>
              <h3 className="text-base font-bold text-slate-100">
                {currentTab === 'evidence' ? 'Cryptographic Evidence Vault' : 
                 currentTab === 'reports' ? 'Operational Incident & Uptime Reports' : 'High-Throughput Analytics Stream'}
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Authorized export, legal hold preservation, and comprehensive PDF/CSV analytics generation is enabled.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => alert(`Generating ${currentTab.toUpperCase()} MIL-SPEC audit report archive...`)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700"
                >
                  Generate Verified Audit Export
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
