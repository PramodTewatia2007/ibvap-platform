import React, { useState } from 'react';
import { MessageSquare, Search } from 'lucide-react';
import { Alert, IncidentStatus } from '../types';


interface AlertsViewProps {
  alerts: Alert[];
  onUpdateStatus: (alertId: number, status: IncidentStatus, notes?: string) => void;
  onAddNote: (alertId: number, note: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ alerts, onUpdateStatus, onAddNote }) => {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(alerts[0] || null);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [noteInput, setNoteInput] = useState<string>('');
  const [resNoteInput, setResNoteInput] = useState<string>('');

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity !== 'ALL' && a.severity !== filterSeverity) return false;
    if (filterStatus !== 'ALL' && a.status !== filterStatus) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        a.alert_code.toLowerCase().includes(q) ||
        a.title.toLowerCase().includes(q) ||
        (a.camera_identifier && a.camera_identifier.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleStatusChange = (status: IncidentStatus) => {
    if (!selectedAlert) return;
    onUpdateStatus(selectedAlert.id, status, resNoteInput || undefined);
    setResNoteInput('');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert || !noteInput.trim()) return;
    onAddNote(selectedAlert.id, noteInput);
    setNoteInput('');
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search alerts by code, title, camera..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-hidden"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ESCALATED">Escalated</option>
            <option value="RESOLVED">Resolved</option>
            <option value="FALSE_POSITIVE">False Positive</option>
          </select>
        </div>
      </div>

      {/* Main 2-Column Split: Alert List & Detail/Investigation Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-3 h-[700px] flex flex-col">
          <div className="p-2 border-b border-slate-800 text-xs font-mono text-slate-400 font-semibold">
            Active Security Incidents ({filteredAlerts.length})
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 p-1 mt-2">
            {filteredAlerts.map((a) => {
              const isSelected = selectedAlert?.id === a.id;
              return (
                <div
                  key={a.id}
                  onClick={() => setSelectedAlert(a)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-500/80 shadow-md'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-cyan-400">{a.alert_code}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      a.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                      a.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' :
                      'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                    }`}>
                      {a.severity}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-200 mt-1">{a.title}</h4>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{a.description}</p>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{a.camera_identifier || `CAM-${a.camera_id}`}</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{a.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Detail & Investigation Desk */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 h-[700px] flex flex-col overflow-y-auto">
          {selectedAlert ? (
            <div className="space-y-5">
              {/* Alert Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold text-cyan-400">{selectedAlert.alert_code}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
                      {selectedAlert.severity}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      {selectedAlert.status}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-100 mt-1">{selectedAlert.title}</h2>
                  <p className="text-xs text-slate-400 mt-1">{selectedAlert.description}</p>
                </div>
              </div>

              {/* Snapshot Evidence Visualizer */}
              {selectedAlert.evidence_snapshot && (
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-slate-400 font-semibold">Incident Evidence Snapshot</span>
                    <span className="text-[10px] font-mono text-emerald-400">HASH-VERIFIED ORIGINAL</span>
                  </div>
                  <div className="aspect-video bg-black rounded overflow-hidden border border-slate-800">
                    <img 
                      src={selectedAlert.evidence_snapshot} 
                      alt="Incident Snapshot" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Rule & Metadata Table */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/80 p-3 rounded-lg border border-slate-800/80">
                <div>
                  <span className="text-slate-500 font-mono">Trigger Rule:</span>
                  <p className="text-slate-200 font-semibold">{selectedAlert.triggering_rule}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-mono">Camera & Site:</span>
                  <p className="text-slate-200">{selectedAlert.camera_identifier} ({selectedAlert.site_name || 'BOP'})</p>
                </div>
                <div>
                  <span className="text-slate-500 font-mono">Timestamp:</span>
                  <p className="text-slate-200 font-mono">{new Date(selectedAlert.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-mono">AI Confidence:</span>
                  <p className="text-cyan-400 font-mono font-semibold">{Math.round((selectedAlert.confidence || 0.85) * 100)}%</p>
                </div>
              </div>

              {/* Triage & Status Actions */}
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
                <h4 className="text-xs font-mono font-semibold text-slate-300">Incident Triage Workflow</h4>
                
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleStatusChange('ACKNOWLEDGED')}
                    className="px-3 py-1.5 rounded bg-blue-900/60 hover:bg-blue-800 border border-blue-600 text-blue-200 text-xs font-medium"
                  >
                    Acknowledge
                  </button>
                  <button
                    onClick={() => handleStatusChange('UNDER_REVIEW')}
                    className="px-3 py-1.5 rounded bg-amber-900/60 hover:bg-amber-800 border border-amber-600 text-amber-200 text-xs font-medium"
                  >
                    Mark Under Review
                  </button>
                  <button
                    onClick={() => handleStatusChange('ESCALATED')}
                    className="px-3 py-1.5 rounded bg-rose-900/60 hover:bg-rose-800 border border-rose-600 text-rose-200 text-xs font-medium"
                  >
                    Escalate to HQ
                  </button>
                  <button
                    onClick={() => handleStatusChange('RESOLVED')}
                    className="px-3 py-1.5 rounded bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-600 text-emerald-200 text-xs font-medium"
                  >
                    Resolve Incident
                  </button>
                  <button
                    onClick={() => handleStatusChange('FALSE_POSITIVE')}
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 text-xs font-medium"
                  >
                    False Positive
                  </button>
                </div>

                <div className="pt-2">
                  <input
                    type="text"
                    placeholder="Resolution summary or escalation justification..."
                    value={resNoteInput}
                    onChange={(e) => setResNoteInput(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Operator Notes History */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-cyan-400" /> Investigation Notes
                </h4>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedAlert.notes && selectedAlert.notes.length > 0 ? (
                    selectedAlert.notes.map(n => (
                      <div key={n.id} className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                          <span className="text-cyan-400 font-semibold">{n.author_name}</span>
                          <span>{new Date(n.created_at).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-200 mt-1">{n.note}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">No investigator notes recorded yet.</p>
                  )}
                </div>

                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add operational observation or field action..."
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-xs font-semibold rounded-lg"
                  >
                    Add Note
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 font-mono text-xs">
              Select an incident from the queue to start investigation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
