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
  Search,
  Filter,
  Flame,
  Copy,
  Check,
  Code
} from 'lucide-react';
import { api } from '../api';

export default function Sessions({ showToast }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [journeyDetail, setJourneyDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [viewRawEvents, setViewRawEvents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'friction' | 'converted' | 'simulated'
  const [copiedJson, setCopiedJson] = useState(false);

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
      if (showToast) showToast("Failed to load sessions: " + err.message, "error");
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
      if (showToast) showToast("Error loading journey detail: " + err.message, "error");
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleCopyRaw = () => {
    if (!journeyDetail?.raw_events) return;
    navigator.clipboard.writeText(JSON.stringify(journeyDetail.raw_events, null, 2));
    setCopiedJson(true);
    if (showToast) showToast("Raw session telemetry copied to clipboard", "success");
    setTimeout(() => setCopiedJson(false), 2000);
  };

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

  // Filter sessions
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch = s.session_id.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filterMode === 'friction') return s.has_friction;
    if (filterMode === 'converted') return s.converted > 0;
    if (filterMode === 'simulated') return s.session_id.startsWith('sim_');
    return true;
  });

  // Calculate elapsed time from session start
  const firstEventTime = journeyDetail?.journey_steps?.[0]?.timestamp 
    ? new Date(journeyDetail.journey_steps[0].timestamp).getTime() 
    : 0;

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base">Recorded Visitor Journeys</h3>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-200/60">
              Chronological Flow
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Step-by-step reconstruction of navigation, interactions, rage clicks, and conversions
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterMode === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({sessions.length})
          </button>
          <button
            onClick={() => setFilterMode('friction')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterMode === 'friction' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚠️ Friction
          </button>
          <button
            onClick={() => setFilterMode('converted')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterMode === 'converted' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏆 Converted
          </button>
          <button
            onClick={() => setFilterMode('simulated')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterMode === 'simulated' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🤖 Simulated
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sessions Master List (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[700px]">
          {/* Search bar inside list */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
            <input
              type="text"
              placeholder="Search by session ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-slate-800 placeholder-slate-400 w-full outline-none font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-[10px] text-slate-400 hover:text-slate-600 font-bold px-1"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredSessions.length > 0 ? (
              filteredSessions.map((s) => {
                const isSelected = selectedSessionId === s.session_id;
                const isSimulated = s.session_id.startsWith('sim_');
                return (
                  <div
                    key={s.session_id}
                    onClick={() => selectSession(s.session_id)}
                    className={`p-4 cursor-pointer transition text-xs flex items-center justify-between group ${
                      isSelected 
                        ? 'bg-blue-50/90 border-l-4 border-blue-600' 
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1.5 max-w-[260px]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-xs truncate">
                          {s.session_id}
                        </span>
                        {isSimulated && (
                          <span className="bg-purple-100 text-purple-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                            Sim
                          </span>
                        )}
                        {s.has_friction && (
                          <span className="bg-rose-100 text-rose-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5 uppercase">
                            <Flame className="w-2.5 h-2.5" /> Friction
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center gap-2.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" /> {s.duration_seconds}s
                        </span>
                        <span>&bull;</span>
                        <span>{s.page_count} pages</span>
                        <span>&bull;</span>
                        <span className="font-semibold text-slate-700">{s.event_count} events</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {s.converted > 0 && (
                        <span 
                          className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shadow-2xs" 
                          title="Converted application"
                        >
                          ✓
                        </span>
                      )}
                      <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 ${
                        isSelected ? 'text-blue-600' : 'text-slate-300'
                      }`} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-600">No sessions match your search or filter</p>
                <p className="text-[11px] text-slate-400">Clear filters to view all recorded sessions.</p>
              </div>
            )}
          </div>
        </div>

        {/* Selected Session Journey View (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[700px]">
          {journeyDetail ? (
            <div className="flex-1 flex flex-col h-full">
              {/* Header info */}
              <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Reconstructed Journey
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 font-mono mt-0.5 flex items-center gap-2">
                    <span>{journeyDetail.session?.id}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyRaw}
                    className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                    title="Copy full JSON event list"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{copiedJson ? 'Copied' : 'JSON'}</span>
                  </button>

                  <button
                    onClick={() => setViewRawEvents(!viewRawEvents)}
                    className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                  >
                    <Code className="w-3.5 h-3.5 text-blue-600" />
                    <span>{viewRawEvents ? 'Show Journey Steps' : 'Raw Events'}</span>
                  </button>
                </div>
              </div>

              {/* Friction Alert Banner if present */}
              {(journeyDetail.friction_signals || []).length > 0 && (
                <div className="m-4 p-4 bg-rose-50 border-2 border-rose-200/90 rounded-xl text-xs shadow-xs">
                  <div className="font-black text-rose-950 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-600 animate-pulse" />
                    <span className="uppercase tracking-wider">Friction Spike Detected</span>
                  </div>
                  <div className="text-slate-700 mt-1.5 leading-relaxed">
                    User triggered <strong className="text-rose-900">{journeyDetail.friction_signals[0].click_count} rapid repeated clicks</strong> on{' '}
                    <code className="bg-rose-100 px-1.5 py-0.5 rounded font-mono font-bold text-rose-950">
                      {journeyDetail.friction_signals[0].element_id}
                    </code>{' '}
                    within {journeyDetail.friction_signals[0].interval_seconds}s on{' '}
                    <span className="font-semibold text-slate-900">{journeyDetail.friction_signals[0].page_url}</span>.
                  </div>
                </div>
              )}

              {/* Step Sequence Timeline */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                {!viewRawEvents ? (
                  <div className="space-y-4 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                    {(journeyDetail.journey_steps || []).map((step, idx) => {
                      const isRage = step.type === 'click' && (step.element_id?.includes('confusing') || step.element_id?.includes('register'));
                      const currentEventTime = step.timestamp ? new Date(step.timestamp).getTime() : 0;
                      const elapsedSeconds = firstEventTime && currentEventTime 
                        ? ((currentEventTime - firstEventTime) / 1000).toFixed(1) 
                        : '0.0';

                      return (
                        <div key={idx} className="relative flex items-start gap-4 text-xs pl-1">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 border-2 shadow-2xs ${
                            isRage 
                              ? 'bg-rose-50 border-rose-500 text-rose-600 ring-4 ring-rose-100' 
                              : step.type === 'conversion'
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-4 ring-emerald-100'
                              : 'bg-white border-blue-500 text-blue-600'
                          }`}>
                            {getStepIcon(step.icon)}
                          </div>

                          <div className={`flex-1 p-3.5 rounded-xl border shadow-xs transition ${
                            isRage 
                              ? 'bg-rose-50/70 border-rose-200' 
                              : step.type === 'conversion'
                              ? 'bg-emerald-50/70 border-emerald-200'
                              : 'bg-white border-slate-200/90'
                          }`}>
                            <div className="flex items-center justify-between font-bold text-slate-900">
                              <span className={isRage ? 'text-rose-950 font-black' : ''}>
                                {step.label}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">
                                  +{elapsedSeconds}s
                                </span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  {step.timestamp?.substring(11, 19)}
                                </span>
                              </div>
                            </div>

                            <div className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between">
                              <span className="font-mono text-slate-600 font-medium">{step.page_url}</span>
                              {step.coordinates && (
                                <span className="text-slate-400 font-mono">Coords {step.coordinates}</span>
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
                      <div key={ev.id} className="p-3 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 shadow-xs flex items-center justify-between">
                        <div>
                          <span className="font-bold text-blue-400">{ev.event_type}</span>{' '}
                          <span className="text-slate-400">on</span>{' '}
                          <span className="text-amber-300 font-semibold">{ev.page_url}</span>
                          {ev.element_id && <span className="text-emerald-400"> #{ev.element_id}</span>}
                          {ev.click_x && <span className="text-slate-400"> ({ev.click_x}, {ev.click_y})</span>}
                        </div>
                        <span className="text-slate-500 text-[10px]">{ev.created_at?.substring(11, 19)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-xs text-slate-400 space-y-2">
              <Users className="w-10 h-10 text-slate-300" />
              <p className="font-semibold text-slate-600">Select a session on the left to reconstruct its user journey</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
