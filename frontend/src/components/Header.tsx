import React from 'react';
import { 
  ShieldAlert, Radio, Bell, User as UserIcon, 
  Wifi, Server, RefreshCw
} from 'lucide-react';

import { User } from '../types';

interface HeaderProps {
  currentUser: User | null;
  onRefresh: () => void;
  alertCount: number;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onRefresh, alertCount }) => {
  return (
    <header className="h-16 bg-slate-900/90 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
      {/* Platform Branding */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-950/50 border border-cyan-400/30">
          <ShieldAlert className="w-6 h-6 text-slate-950" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-wider text-base text-cyan-400 font-mono">IBVAP</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono font-medium">
              v1.0 MIL-SPEC
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Intelligent Border Video Analytics Platform</p>
        </div>
      </div>

      {/* Central Threat & Health Badges */}
      <div className="hidden lg:flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-950/80 border border-slate-800/80">
          <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-300 font-mono">AI ENGINE: <strong className="text-emerald-400">ONLINE</strong></span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-950/80 border border-slate-800/80">
          <Wifi className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-slate-300 font-mono">C2 MESH: <strong className="text-cyan-400">ACTIVE</strong></span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-950/80 border border-slate-800/80">
          <Server className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-mono">BOP-ATTARI-01</span>
        </div>
      </div>

      {/* Right Controls & User Info */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onRefresh}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-cyan-300 transition-colors border border-slate-700/60"
          title="Refresh Feed & Telemetry"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <div className="relative">
          <div className="p-2 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700/60 flex items-center justify-center">
            <Bell className="w-4 h-4 text-slate-300" />
            {alertCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-lg animate-pulse">
                {alertCount}
              </span>
            )}
          </div>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <UserIcon className="w-4 h-4" />
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-slate-200">{currentUser?.full_name || 'Operator'}</p>
            <p className="text-[10px] font-mono text-cyan-400/80">{currentUser?.role || 'SUPER_ADMIN'}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
