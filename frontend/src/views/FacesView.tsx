import React from 'react';
import { UserCheck, ShieldAlert, Lock } from 'lucide-react';


interface FacesViewProps {
  faceRecords: any[];
}

export const FacesView: React.FC<FacesViewProps> = ({ faceRecords }) => {
  return (
    <div className="space-y-4">
      {/* Policy Warning Banner */}
      <div className="bg-amber-950/40 border border-amber-600/40 p-4 rounded-xl flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
            Biometric Regulatory Safeguard Notice
          </h3>
          <p className="text-xs text-amber-200/80 mt-1">
            Facial recognition is strictly controlled. Face region detection is permitted for perimeter counting, but automated identity matching against watchlists remains locked unless explicitly authorized by higher command with legal warrants.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-cyan-400" /> Face Detection Event Records
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono">
                <th className="py-2.5 px-3">Detection ID</th>
                <th className="py-2.5 px-3">Camera ID</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Recognition Status</th>
                <th className="py-2.5 px-3">Safeguard Policy Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {faceRecords.length > 0 ? (
                faceRecords.map(r => (
                  <tr key={r.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono text-cyan-400">FD-{r.id}</td>
                    <td className="py-3 px-3 font-mono text-slate-300">CAM-{r.camera_id}</td>
                    <td className="py-3 px-3 font-mono text-emerald-400">{Math.round(r.confidence * 100)}%</td>
                    <td className="py-3 px-3 font-mono text-slate-400">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1 w-fit">
                        <Lock className="w-3 h-3" /> {r.recognition_status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px] italic">{r.note}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                    No face detection events registered in current surveillance window.
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
