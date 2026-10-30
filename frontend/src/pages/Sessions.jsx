import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  MousePointer, 
  AlertTriangle, 
  Award, 
  ChevronRight, 
  Navigation, 
  ArrowDown, 
  Edit3, 
  CheckCircle,
  FileText,
  X
} from 'lucide-react';
import { api } from '../api';

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [journeyDetail, setJourneyDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [viewRawEvents, setViewRawEvents] = useState(false);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await api.getSessions('nexus-college');
      setSessions(data);
      if (data.length > 0 && !selectedSessionId) {
        selectSession(data[0].session_id);
      }
    } catch (err) {
      console.error("Sessions load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectSession = async (sid) => {
    try {
      setSelectedSessionId(sid);
      setLoadingDetail(true);
      const res = await api.getSessionDetail(sid, 'nexus-college');
      setJourneyDetail(res);
    } catch (err) {
      console.error("Detail error:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const getStepIcon = (icon) => {
    switch (icon) {
      case 'navigation': return <Navigation className="w-3.5 h-3.5 text-blue-600" />;
      case 'arrow-down': return <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />;
      case 'edit-3': return <Edit3 className="w-3.5 h-3.5 text-amber-500" />;
      case 'check-circle': return <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />;
      case 'award': return <Award className="w-3.5 h-3.5 text-emerald-600" />;
      default: return <MousePointer className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Recorded Visitor Sessions</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological journey reconstruction and behavioral friction timelines
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Total Sessions: <span className="text-slate-800">{sessions.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sessions List (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[650px]">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Visitor Sessions
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {sessions.length > 0 ? (
              sessions.map((s) => {
                const isSelected = selectedSessionId === s.session_id;
                const isSimulated = s.session_id.startsWith('sim_');
                return (
                  <div
                    key={s.session_id}
                    onClick={() => selectSession(s.session_id)}
                    className={`p-3.5 cursor-pointer transition text-xs flex items-center justify-between ${
                      isSelected ? 'bg-blue-50/80 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-slate-800 text-[11px] truncate max-w-[170px]">
                          {s.session_id}
                        </span>
                        {isSimulated && (
                          <span className="bg-purple-100 text-purple-700 text-[10px] font-semibold px-1.5 py-0.2 rounded">
                            Simulated
                          </span>
                        )}
                        {s.has_friction && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-semibold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" /> Friction
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> {s.duration_seconds}s
                        </span>
                        <span>{s.page_count} pages</span>
                        <span>{s.event_count} events</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {s.converted > 0 && (
                        <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]" title="Goal Converted">
                          &check;
                        </span>
                      )}
                      <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No visitor sessions found. Browse the demo website to create real interactions.
              </div>
            )}
          </div>
        </div>

        {/* Selected Session Journey View (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[650px]">
          {journeyDetail ? (
            <div className="flex-1 flex flex-col h-full">
              {/* Header info */}
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500">Journey Reconstruction</div>
                  <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                    {journeyDetail.session?.id}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewRawEvents(!viewRawEvents)}
                    className="text-xs px-2.5 py-1 rounded border border-slate-300 font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {viewRawEvents ? 'Show Narrative Steps' : 'View Raw Events'}
                  </button>
                </div>
              </div>

              {/* Friction Alert if present in this session */}
              {(journeyDetail.friction_signals || []).length > 0 && (
                <div className="m-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Friction Detected In This Journey</span>
                  </div>
                  <div className="text-slate-700 mt-1">
                    User performed {journeyDetail.friction_signals[0].click_count} rapid repeated clicks on{' '}
                    <code className="bg-amber-100/70 px-1 py-0.5 rounded font-mono font-bold text-amber-900">
                      {journeyDetail.friction_signals[0].element_id}
                    </code>{' '}
                    within {journeyDetail.friction_signals[0].interval_seconds}s.
                  </div>
                </div>
              )}

              {/* Step Sequence Timeline */}
              <div className="flex-1 overflow-y-auto p-5">
                {!viewRawEvents ? (
                  <div className="space-y-4 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                    {(journeyDetail.journey_steps || []).map((step, idx) => {
                      const isRageClick = step.type === 'click' && step.element_id?.includes('confusing');
                      return (
                        <div key={idx} className="relative flex items-start gap-4 text-xs pl-2">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10 border-2 ${
                            isRageClick 
                              ? 'bg-rose-100 border-rose-500 text-rose-600 ring-2 ring-rose-200' 
                              : step.type === 'conversion'
                              ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                              : 'bg-white border-blue-500 text-blue-600'
                          }`}>
                            {getStepIcon(step.icon)}
                          </div>

                          <div className={`flex-1 p-3 rounded-lg border ${
                            isRageClick 
                              ? 'bg-rose-50/60 border-rose-200' 
                              : step.type === 'conversion'
                              ? 'bg-emerald-50/60 border-emerald-200'
                              : 'bg-slate-50 border-slate-200/80'
                          }`}>
                            <div className="flex items-center justify-between font-semibold text-slate-800">
                              <span className={isRageClick ? 'text-rose-900' : ''}>
                                {step.label}
                              </span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {step.timestamp?.substring(11, 19)}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                              <span className="font-mono text-slate-600">{step.page_url}</span>
                              {step.coordinates && (
                                <span className="text-slate-400">{step.coordinates}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2 font-mono text-[11px]">
                    {(journeyDetail.raw_events || []).map((ev) => (
                      <div key={ev.id} className="p-2 bg-slate-50 border border-slate-200 rounded text-slate-700">
                        <span className="font-bold text-blue-600">{ev.event_type}</span> on{' '}
                        <span className="text-slate-900">{ev.page_url}</span>
                        {ev.element_id && ` [id: ${ev.element_id}]`}
                        {ev.click_x && ` @ (${ev.click_x}, ${ev.click_y})`}
                        <span className="text-slate-400 float-right">{ev.created_at?.substring(11, 19)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              Select a session on the left to reconstruct its user journey.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
