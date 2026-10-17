import React, { useState } from 'react';
import { Radio, RefreshCw } from 'lucide-react';
import { Camera, VirtualZone } from '../types';

interface LiveSurveillanceViewProps {
  cameras: Camera[];
  zones: VirtualZone[];
  liveFrames: Record<number, string>;
  onTestConnection: (camId: number) => void;
}

export const LiveSurveillanceView: React.FC<LiveSurveillanceViewProps> = ({
  cameras,
  zones,
  liveFrames,
  onTestConnection
}) => {
  const [gridColumns, setGridColumns] = useState<2 | 3 | 4>(2);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);


  return (
    <div className="space-y-4">
      {/* Viewport Control Bar */}
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-500 animate-pulse" />
            <span className="text-xs font-mono font-bold text-slate-200">TACTICAL VIDEO MATRIX</span>
          </div>
          <span className="text-xs text-slate-500">|</span>
          <span className="text-xs font-mono text-cyan-400">{cameras.length} Active Feeds</span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showOverlays} 
              onChange={(e) => setShowOverlays(e.target.checked)} 
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span>HUD & AI Overlays</span>
          </label>

          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button 
              onClick={() => setGridColumns(2)} 
              className={`px-2 py-1 text-xs rounded font-mono ${gridColumns === 2 ? 'bg-cyan-950 text-cyan-300 font-bold' : 'text-slate-400'}`}
            >
              2x2
            </button>
            <button 
              onClick={() => setGridColumns(3)} 
              className={`px-2 py-1 text-xs rounded font-mono ${gridColumns === 3 ? 'bg-cyan-950 text-cyan-300 font-bold' : 'text-slate-400'}`}
            >
              3x3
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Camera Feeds */}
      <div className={`grid grid-cols-1 ${gridColumns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4`}>
        {cameras.map((cam) => {
          const frame = liveFrames[cam.id];
          const camZones = zones.filter(z => z.camera_id === cam.id);

          return (
            <div 
              key={cam.id} 
              className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col group relative"
            >
              {/* Camera Header Overlay */}
              <div className="bg-slate-950/90 border-b border-slate-800/80 px-3 py-2 flex items-center justify-between z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-xs font-semibold text-slate-200">{cam.identifier}</span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{cam.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {cam.fps_limit} FPS
                  </span>
                  <button
                    onClick={() => onTestConnection(cam.id)}
                    title="Test RTSP Connection"
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Video Player / Canvas Frame */}
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                {frame ? (
                  <img 
                    src={frame} 
                    alt={`Stream ${cam.identifier}`} 
                    className="w-full h-full object-cover select-none"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-600 gap-2">
                    <Radio className="w-6 h-6 animate-pulse" />
                    <span className="text-xs font-mono">CONNECTING TO VIDEO GATEWAY...</span>
                  </div>
                )}

                {/* Simulated Virtual Zone SVG Overlay */}
                {showOverlays && camZones.length > 0 && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {camZones.map(z => {
                      const pointsStr = z.coordinates
                        .map(pt => `${pt[0] * 100}%,${pt[1] * 100}%`)
                        .join(' ');
                      return (
                        <polygon
                          key={z.id}
                          points={pointsStr}
                          className="fill-rose-500/15 stroke-rose-500 stroke-2 stroke-dasharray-4"
                        />
                      );
                    })}
                  </svg>
                )}

                {/* Video HUD Overlays */}
                {showOverlays && (
                  <div className="absolute top-2 left-2 pointer-events-none space-y-1">
                    <div className="bg-slate-950/80 backdrop-blur-xs border border-cyan-500/30 px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300">
                      AI INFERENCE: OBJECT_TRACKER + ANPR
                    </div>
                  </div>
                )}

                {showOverlays && (
                  <div className="absolute bottom-2 right-2 pointer-events-none">
                    <div className="bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      STREAM HEALTHY (0% DROP)
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Footer Meta */}
              <div className="p-2.5 bg-slate-950/60 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <div className="truncate max-w-[200px]">
                  <span>Loc: </span>
                  <span className="text-slate-300 font-mono">{cam.location_description || 'Sector Perimeter'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {cam.enable_virtual_fence && (
                    <span className="text-[10px] px-1 rounded bg-rose-950/50 text-rose-300 border border-rose-800/50 font-mono">
                      FENCE ACTIVE
                    </span>
                  )}
                  {cam.enable_anpr && (
                    <span className="text-[10px] px-1 rounded bg-blue-950/50 text-blue-300 border border-blue-800/50 font-mono">
                      ANPR
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
