import React from 'react';
import { Cctv, Users, ShieldAlert, Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { DashboardStats, Alert } from '../types';


interface OverviewViewProps {
  stats: DashboardStats | null;
  recentAlerts: Alert[];
  onSelectAlert: (alert: Alert) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ stats, recentAlerts, onSelectAlert }) => {
  if (!stats) {
    return <div className="p-8 text-center text-slate-500 font-mono">Loading surveillance telemetry...</div>;
  }

  const statCards = [
    { label: 'Active Cameras', value: `${stats.online_cameras} / ${stats.total_cameras}`, sub: 'Online Feeds', icon: Cctv, color: 'text-emerald-400', border: 'border-emerald-500/20' },
    { label: 'People Detected Today', value: stats.people_detected_today, sub: 'Border Perimeter', icon: Users, color: 'text-cyan-400', border: 'border-cyan-500/20' },
    { label: 'Vehicles & ANPR Scans', value: `${stats.vehicles_detected_today} (${stats.anpr_events_today} plates)`, sub: 'Corridor & Gates', icon: Activity, color: 'text-blue-400', border: 'border-blue-500/20' },
    { label: 'Active Intrusions', value: stats.active_intrusion_alerts, sub: 'Virtual Zones Breached', icon: ShieldAlert, color: 'text-rose-400', border: 'border-rose-500/20' },
  ];

  const SEV_COLORS: Record<string, string> = {
    LOW: '#38bdf8',
    MEDIUM: '#facc15',
    HIGH: '#fb923c',
    CRITICAL: '#f43f5e',
  };

  const pieData = Object.entries(stats.severity_distribution || {}).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Central Border Operations Command (CBOC)
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono">
              ALL SECTORS ONLINE
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time AI video analytics, vehicle tracking, virtual perimeter tripwires, and ANPR feed aggregation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] uppercase font-mono text-slate-400">AI Worker Status</p>
            <p className="text-xs font-mono font-semibold text-cyan-300">OPENCV TRACKER ACTIVE</p>
          </div>
          <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={`bg-slate-900/90 border ${card.border} rounded-xl p-4 shadow-lg`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{card.label}</span>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className="mt-3">
                <h3 className="text-2xl font-bold font-mono text-slate-100">{card.value}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Detection Trends 24H */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Surveillance Detections Over 24 Hours</h3>
              <p className="text-xs text-slate-500">Hourly person vs vehicle movements across all border cameras</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> People
              </span>
              <span className="flex items-center gap-1.5 text-blue-500">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Vehicles
              </span>
            </div>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.hourly_trends}>
                <defs>
                  <linearGradient id="colorPeople" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorVehicles" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="people" stroke="#22d3ee" fillOpacity={1} fill="url(#colorPeople)" />
                <Area type="monotone" dataKey="vehicles" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVehicles)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alert Severity Distribution */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Alert Severity Breakdown</h3>
            <p className="text-xs text-slate-500 mb-4">Cumulative incidents by priority tier</p>
            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SEV_COLORS[entry.name] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800">
            {Object.entries(stats.severity_distribution || {}).map(([sev, cnt]) => (
              <div key={sev} className="flex items-center justify-between px-2 py-1 bg-slate-950/60 rounded border border-slate-800/80">
                <span className="text-[11px] font-mono text-slate-400">{sev}:</span>
                <span className="text-xs font-mono font-bold text-slate-200">{cnt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Alerts Feed Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Recent Security Alerts & Incidents</h3>
            <p className="text-xs text-slate-500">Live triage queue with verified snapshot evidence</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2.5 px-3">Alert Code</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Camera / Site</th>
                <th className="py-2.5 px-3">Trigger Rule</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Time</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentAlerts.slice(0, 5).map((alert) => (
                <tr key={alert.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 font-mono font-semibold text-cyan-400">{alert.alert_code}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                      alert.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                      alert.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                      alert.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40' :
                      'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                    }`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">{alert.category}</td>
                  <td className="py-3 px-3 text-slate-300">
                    <div>{alert.camera_identifier || `CAM-${alert.camera_id}`}</div>
                    <div className="text-[10px] text-slate-500">{alert.site_name || 'BOP Sector'}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-400 truncate max-w-xs">{alert.triggering_rule}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      {alert.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400">{new Date(alert.created_at).toLocaleTimeString()}</td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => onSelectAlert(alert)}
                      className="px-2.5 py-1 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 text-xs font-medium transition-colors"
                    >
                      Investigate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
