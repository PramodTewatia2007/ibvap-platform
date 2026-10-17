import React, { useState } from 'react';
import { Cctv, Plus } from 'lucide-react';

import { Camera, Site } from '../types';

interface CamerasViewProps {
  cameras: Camera[];
  sites: Site[];
  onCreateCamera: (cam: Partial<Camera>) => void;
  onTestConnection: (camId: number) => void;
}

export const CamerasView: React.FC<CamerasViewProps> = ({
  cameras,
  sites,
  onCreateCamera,
  onTestConnection
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [identifier, setIdentifier] = useState<string>('');
  const [siteId, setSiteId] = useState<number>(sites[0]?.id || 1);
  const [streamUrl, setStreamUrl] = useState<string>('rtsp://10.12.0.104:554/live/ch0');
  const [fps, setFps] = useState<number>(15);
  const [locationDesc, setLocationDesc] = useState<string>('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateCamera({
      name,
      identifier,
      site_id: siteId,
      stream_url: streamUrl,
      fps_limit: fps,
      location_description: locationDesc,
      protocol: 'RTSP',
      resolution: '1920x1080',
      enable_person_detection: true,
      enable_vehicle_detection: true,
      enable_anpr: true,
      enable_face_detection: true,
      enable_virtual_fence: true,
      enable_night_monitoring: true,
      is_synthetic: true
    });
    setShowModal(false);
    setName('');
    setIdentifier('');
    setLocationDesc('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Cctv className="w-5 h-5 text-cyan-400" /> Border Camera & RTSP Stream Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Register high-resolution optical / thermal CCTV streams, configure frame limits, and enable modular AI pipelines.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-xs font-bold rounded-lg flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Register Camera Feed
        </button>
      </div>

      {/* Camera Grid Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-mono bg-slate-950/60">
              <th className="py-3 px-4">Identifier</th>
              <th className="py-3 px-4">Camera Name</th>
              <th className="py-3 px-4">BOP / Sector Site</th>
              <th className="py-3 px-4">Location</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Configured Pipeline</th>
              <th className="py-3 px-4">Resolution / FPS</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {cameras.map((c) => (
              <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-cyan-400">{c.identifier}</td>
                <td className="py-3 px-4 font-semibold text-slate-200">{c.name}</td>
                <td className="py-3 px-4 text-slate-300">{c.site_name || 'BOP Sector'}</td>
                <td className="py-3 px-4 text-slate-400">{c.location_description || 'Perimeter'}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1 w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {c.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex gap-1 flex-wrap">
                    {c.enable_person_detection && <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[9px] font-mono text-cyan-300">HUMAN</span>}
                    {c.enable_vehicle_detection && <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[9px] font-mono text-blue-300">VEHICLE</span>}
                    {c.enable_virtual_fence && <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[9px] font-mono text-rose-300">TRIPWIRE</span>}
                    {c.enable_anpr && <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[9px] font-mono text-amber-300">ANPR</span>}
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-slate-400">
                  {c.resolution} @ {c.fps_limit}fps
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => onTestConnection(c.id)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700"
                  >
                    Test Stream
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Cctv className="w-5 h-5 text-cyan-400" /> Register Surveillance Camera
            </h3>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Camera Name</label>
                <input
                  type="text"
                  placeholder="e.g. Observation Post Beta PTZ"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Identifier Code</label>
                <input
                  type="text"
                  placeholder="e.g. CAM-SECTOR-005"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-hidden font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 block mb-1">Assign BOP / Site</label>
                  <select
                    value={siteId}
                    onChange={(e) => setSiteId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-hidden"
                  >
                    {sites.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Frame Sampling Rate (FPS)</label>
                  <input
                    type="number"
                    value={fps}
                    onChange={(e) => setFps(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Encrypted RTSP Stream URL</label>
                <input
                  type="text"
                  value={streamUrl}
                  onChange={(e) => setStreamUrl(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-hidden font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">Credentials stored securely in backend and never sent to browser clients.</p>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Location Description</label>
                <input
                  type="text"
                  placeholder="e.g. North Watchtower, Km 14 Border Road"
                  value={locationDesc}
                  onChange={(e) => setLocationDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 font-bold rounded"
                >
                  Register Feed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
