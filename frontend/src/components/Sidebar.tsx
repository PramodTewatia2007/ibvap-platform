import React from 'react';
import { 
  LayoutDashboard, Video, Cctv, Cpu, ShieldAlert, AlertOctagon, 
  Car, UserCheck, FolderLock, FileBarChart, MapPin, Settings, 
  FileText 
} from 'lucide-react';


export type NavTab = 
  | 'overview' 
  | 'live' 
  | 'cameras' 
  | 'analytics' 
  | 'zones' 
  | 'alerts' 
  | 'anpr' 
  | 'faces' 
  | 'evidence' 
  | 'reports' 
  | 'sites' 
  | 'audit' 
  | 'c2_system';

interface SidebarProps {
  currentTab: NavTab;
  setTab: (tab: NavTab) => void;
  alertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setTab, alertCount }) => {
  const navItems = [
    { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'live', label: 'Live CCTV Surveillance', icon: Video, badge: 'LIVE' },
    { id: 'cameras', label: 'Camera Management', icon: Cctv },
    { id: 'zones', label: 'Virtual Fence Management', icon: ShieldAlert },
    { id: 'alerts', label: 'Alerts & Incidents', icon: AlertOctagon, count: alertCount },
    { id: 'anpr', label: 'Vehicle & ANPR Records', icon: Car },
    { id: 'faces', label: 'Face Detection Records', icon: UserCheck },
    { id: 'analytics', label: 'AI Analytics Stream', icon: Cpu },
    { id: 'evidence', label: 'Evidence Management', icon: FolderLock },
    { id: 'reports', label: 'Reports & Analytics', icon: FileBarChart },
    { id: 'sites', label: 'BOP & Site Management', icon: MapPin },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
    { id: 'c2_system', label: 'System & C2 Config', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-[calc(100vh-4rem)] sticky top-16 select-none">
      <div className="p-3 text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold px-4">
        Border Command Center
      </div>

      <nav className="flex-1 overflow-y-auto px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id as NavTab)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-700/50 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded">
                  {item.badge}
                </span>
              )}
              {Boolean(item.count && item.count > 0) && (
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-rose-600 text-white rounded-full">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Security Protocol:</span>
          <span className="text-emerald-400 font-mono font-medium">DEFCON 4</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
          <span>Surveillance Sector:</span>
          <span className="text-cyan-400 font-mono">SECTOR-04-WEST</span>
        </div>
      </div>
    </aside>
  );
};
