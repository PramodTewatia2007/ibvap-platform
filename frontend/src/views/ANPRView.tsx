import React, { useState } from 'react';
import { Car, Search, CheckCircle2 } from 'lucide-react';


interface ANPRViewProps {
  anprRecords: any[];
  onSearch: (plate: string) => void;
}

export const ANPRView: React.FC<ANPRViewProps> = ({ anprRecords, onSearch }) => {
  const [searchInput, setSearchInput] = useState<string>('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-400" /> Automatic Number Plate Recognition (ANPR) Vault
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time optical vehicle plate recognition, confidence scoring, and jurisdictional registry lookup.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search plate (e.g. PB02AX9182)..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-hidden font-mono uppercase"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-950 hover:bg-blue-900 border border-blue-700 text-blue-300 text-xs font-semibold rounded-lg"
          >
            Search
          </button>
        </form>
      </div>

      {/* ANPR Records Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono bg-slate-950/60">
                <th className="py-3 px-4">License Plate</th>
                <th className="py-3 px-4">Vehicle Category</th>
                <th className="py-3 px-4">Jurisdiction</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Camera ID</th>
                <th className="py-3 px-4">Detection Timestamp</th>
                <th className="py-3 px-4">Validation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {anprRecords.length > 0 ? (
                anprRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-sm text-cyan-300">
                      <span className="px-2.5 py-1 rounded bg-slate-950 border border-cyan-500/40 tracking-wider">
                        {rec.plate_number || 'PB02AX9182'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 capitalize font-medium text-slate-200">
                      {rec.vehicle_type || 'Cargo Truck'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                        {rec.state_jurisdiction || 'PB (Punjab Border)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-400 font-bold">
                      {Math.round(rec.confidence * 100)}%
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      CAM-{rec.camera_id}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {new Date(rec.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" /> {rec.verification_status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                    No matching ANPR license plates detected or scanned yet.
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
