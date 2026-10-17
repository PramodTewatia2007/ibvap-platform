import React, { useState } from 'react';
import { MapPin, Plus } from 'lucide-react';

import { Site } from '../types';

interface SitesViewProps {
  sites: Site[];
  onCreateSite: (site: Partial<Site>) => void;
}

export const SitesView: React.FC<SitesViewProps> = ({ sites, onCreateSite }) => {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [region, setRegion] = useState('Western Frontier');
  const [sector, setSector] = useState('Sector 4');
  const [desc, setDesc] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateSite({
      name,
      code,
      region,
      sector,
      description: desc,
      latitude: 31.60,
      longitude: 74.57
    });
    setShowModal(false);
    setName('');
    setCode('');
    setDesc('');
  };


  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" /> Border Outposts (BOPs) & Strategic Installations
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Regional hierarchy: Organization → Region → Border Outpost / Checkpoint → Cameras.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 text-xs font-bold rounded-lg flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Border Outpost
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites.map(s => (
          <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-cyan-400">{s.code}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                  {s.camera_count || 0} Cameras
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-100 mt-2">{s.name}</h3>
              <p className="text-xs text-slate-400 mt-1">{s.description || 'Forward border post outpost'}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
              <div>Region: <span className="text-slate-300">{s.region}</span></div>
              <div>Sector: <span className="text-slate-300">{s.sector}</span></div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-4">Register Border Outpost (BOP)</h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Site / BOP Name</label>
                <input
                  type="text"
                  placeholder="e.g. BOP Attari Border Outpost"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Station Code</label>
                <input
                  type="text"
                  placeholder="e.g. BOP-ATTARI-01"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-hidden font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Region</label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Sector</label>
                  <input
                    type="text"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Strategic forward observation outpost"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-bold rounded"
                >
                  Create Outpost
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
