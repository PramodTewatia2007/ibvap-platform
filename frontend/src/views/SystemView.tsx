import React from 'react';
import { Settings, Server, Wifi } from 'lucide-react';


interface SystemViewProps {
  systemHealth: any;
  c2Telemetry: any;
}

export const SystemView: React.FC<SystemViewProps> = ({ systemHealth, c2Telemetry }) => {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" /> System Diagnostics & Command-and-Control (C2) Gateway
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Monitor system health, remote border deployment resilience, store-and-forward caching, and external C2 feeds.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Layer Diagnostics */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Server className="w-4 h-4 text-emerald-400" /> Three-Tier Architectural Health
          </h3>

          <div className="space-y-2 text-xs font-mono">
            {Object.entries(systemHealth?.layers || {}).map(([layer, st]) => (
              <div key={layer} className="p-3 bg-slate-950 rounded border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300 uppercase">{layer.replace('_', ' ')}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                  {String(st)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* C2 Telemetry Mesh */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Wifi className="w-4 h-4 text-cyan-400" /> External Command & Control Interop
          </h3>

          <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">C2 Node ID:</span>
              <span className="text-cyan-300">{c2Telemetry?.bop_node_id || 'BOP-WEST-SECTOR-01'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Threat Posture:</span>
              <span className="text-amber-400 font-bold">{c2Telemetry?.threat_level || 'ELEVATED'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Perimeter Status:</span>
              <span className="text-emerald-400">{c2Telemetry?.perimeter_status || 'MONITORED'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Active Interventions:</span>
              <span className="text-rose-400 font-bold">{c2Telemetry?.active_interventions || 1}</span>
            </div>
          </div>

          <div className="p-3 bg-cyan-950/40 border border-cyan-800/40 rounded text-[11px] text-cyan-200/90 font-mono">
            <strong>Standardized Interop:</strong> Supports open REST/WebSocket C2 webhooks for seamless integration with national defense command grids.
          </div>
        </div>
      </div>
    </div>
  );
};
