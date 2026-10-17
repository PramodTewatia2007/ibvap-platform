import React from 'react';
import { FileText } from 'lucide-react';


interface AuditViewProps {
  logs: any[];
}

export const AuditView: React.FC<AuditViewProps> = ({ logs }) => {
  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-400" /> Operational & Security Audit Trail
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Immutable event log tracking operator actions, alert acknowledgements, rule adjustments, and evidence exports.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl p-5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Operator</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Target Resource</th>
                <th className="py-2.5 px-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {logs.length > 0 ? (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="py-3 px-3 text-cyan-300 font-bold">{log.username || 'System Operator'}</td>
                    <td className="py-3 px-3 text-slate-200">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{log.resource_type} #{log.resource_id}</td>
                    <td className="py-3 px-3 text-slate-400 text-[11px] truncate max-w-xs">
                      {JSON.stringify(log.details || {})}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No operator actions logged yet in current session.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
