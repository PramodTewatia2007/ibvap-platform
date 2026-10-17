import React, { useState } from 'react';
import { ShieldAlert, Plus, Trash2 } from 'lucide-react';

import { Camera, VirtualZone, AlertSeverity } from '../types';

interface ZonesViewProps {
  cameras: Camera[];
  zones: VirtualZone[];
  onCreateZone: (zone: Partial<VirtualZone>) => void;
  onDeleteZone: (zoneId: number) => void;
}

export const ZonesView: React.FC<ZonesViewProps> = ({
  cameras,
  zones,
  onCreateZone,
  onDeleteZone
}) => {
  const [selectedCameraId, setSelectedCameraId] = useState<number>(cameras[0]?.id || 1);
  const [zoneName, setZoneName] = useState<string>('');
  const [zoneDesc, setZoneDesc] = useState<string>('');
  const [severity, setSeverity] = useState<AlertSeverity>('HIGH');

  const filteredZones = zones.filter(z => z.camera_id === selectedCameraId);
  const activeCamera = cameras.find(c => c.id === selectedCameraId);

  const handleCreateZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName.trim()) return;

    // Default 4-point polygon covering 40% to 75% height
    const defaultCoords: [number, number][] = [
      [0.10, 0.40],
      [0.90, 0.40],
      [0.90, 0.75],
      [0.10, 0.75]
    ];

    onCreateZone({
      camera_id: selectedCameraId,
      name: zoneName,
      description: zoneDesc || 'Restricted perimeter virtual fence polygon',
      zone_type: 'RESTRICTED_POLYGON',
      coordinates: defaultCoords,
      severity: severity,
      dwell_time_seconds: 2,
      cooldown_seconds: 30,
      is_active: true
    });

    setZoneName('');
    setZoneDesc('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" /> Virtual Fence & Perimeter Tripwires
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Draw polygonal intrusion zones over CCTV camera coordinate spaces to generate instant border alarms.
          </p>
        </div>

        {/* Camera Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Camera:</span>
          <select
            value={selectedCameraId}
            onChange={(e) => setSelectedCameraId(Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 px-3 py-1.5 rounded-lg font-mono focus:outline-hidden"
          >
            {cameras.map(c => (
              <option key={c.id} value={c.id}>
                {c.identifier} - {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Zone Mapping Canvas */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col">
          <div className="flex items-center justify-between mb-3 text-xs font-mono text-slate-400">
            <span>Video Coordinate Matrix (640x360 Plane)</span>
            <span className="text-cyan-400">NORMALIZED RAYCASTING ACTIVE</span>
          </div>

          <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-800">
            {/* Base Simulated Background */}
            <div className="w-full h-full bg-slate-950 flex items-center justify-center relative">
              {/* SVG Overlay of Defined Zones */}
              <svg className="absolute inset-0 w-full h-full">
                {filteredZones.map(z => {
                  const pointsStr = z.coordinates
                    .map(pt => `${pt[0] * 100}%,${pt[1] * 100}%`)
                    .join(' ');
                  return (
                    <g key={z.id}>
                      <polygon
                        points={pointsStr}
                        className="fill-rose-500/20 stroke-rose-500 stroke-2"
                      />
                      <text
                        x={`${z.coordinates[0][0] * 100 + 2}%`}
                        y={`${z.coordinates[0][1] * 100 + 6}%`}
                        fill="#f43f5e"
                        fontSize="12"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {z.name} ({z.severity})
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div className="text-center text-slate-600 font-mono text-xs pointer-events-none">
                <p>[CAMERA FIELD VIEW: {activeCamera?.identifier}]</p>
                <p className="text-[10px] text-slate-700 mt-1">Normalized coordinates: [0.0 - 1.0]</p>
              </div>
            </div>
          </div>

          <div className="mt-3 p-3 bg-slate-950/70 border border-slate-800 rounded text-[11px] text-slate-400">
            <strong>Intrusion Rule:</strong> Ray-casting point-in-polygon algorithm checks centroid trajectories for pedestrians and vehicles entering designated zones.
          </div>
        </div>

        {/* Zone Definition & Management Form */}
        <div className="lg:col-span-4 space-y-4">
          {/* New Zone Form */}
          <form onSubmit={handleCreateZone} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-cyan-400" /> Define New Zone
            </h3>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Zone Name</label>
              <input
                type="text"
                placeholder="e.g. Zero-Line Buffer Strip"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Alert Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as AlertSeverity)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-hidden"
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Description</label>
              <textarea
                placeholder="Tactical description of restricted zone..."
                value={zoneDesc}
                onChange={(e) => setZoneDesc(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-xs font-bold rounded transition-colors"
            >
              Arm Restricted Zone
            </button>
          </form>

          {/* Configured Zones List */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider mb-3">
              Configured Zones on Camera ({filteredZones.length})
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {filteredZones.map(z => (
                <div key={z.id} className="p-3 bg-slate-950 border border-slate-800 rounded flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200">{z.name}</span>
                      <span className="text-[9px] font-mono px-1 rounded bg-rose-950 text-rose-300 border border-rose-800">
                        {z.severity}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{z.description}</p>
                  </div>
                  <button
                    onClick={() => onDeleteZone(z.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete Zone"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
