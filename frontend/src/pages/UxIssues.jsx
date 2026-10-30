import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  TrendingDown, 
  ArrowRight, 
  ShieldAlert, 
  CheckCircle2, 
  ExternalLink,
  Flame,
  Sparkles,
  Layers,
  Wrench,
  Search
} from 'lucide-react';
import { api } from '../api';

export default function UxIssues({ onNavigate, showToast }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'rage' | 'form'
  const [simulating, setSimulating] = useState(false);

  const loadIssues = async () => {
    try {
      setLoading(true);
      const data = await api.getIssues('nexus-college');
      setIssues(data);
    } catch (err) {
      console.error("Issues load error:", err);
      if (showToast) showToast("Failed to load UX friction issues: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);

  const handleSimulateFriction = async () => {
    try {
      setSimulating(true);
      await api.simulateJourney('frustrated_registration');
      await loadIssues();
      if (showToast) showToast("Simulated frustrated session with 4 rage clicks generated!", "success");
    } catch (e) {
      if (showToast) showToast("Simulation failed: " + e.message, "error");
    } finally {
      setSimulating(false);
    }
  };

  const filteredIssues = issues.filter((iss) => {
    if (filterType === 'rage') return iss.type.includes('Repeated') || iss.type.includes('Rage');
    if (filterType === 'form') return iss.type.includes('Form');
    return true;
  });

  const highPriorityCount = issues.filter(i => i.severity === 'high').length;
  const rageCount = issues.filter(i => i.type.includes('Repeated') || i.type.includes('Rage')).length;

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Metrics Ribbon */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base">Algorithmic Friction & UX Obstacles</h3>
            <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded font-bold border border-rose-200/60">
              Deterministic Detection
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time identification of repeated rage clicks (&ge;3 clicks in 2s) and form abandonment thresholds
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterType === 'all' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Obstacles ({issues.length})
          </button>
          <button
            onClick={() => setFilterType('rage')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterType === 'rage' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔥 Rage Clicks ({rageCount})
          </button>
          <button
            onClick={() => setFilterType('form')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filterType === 'form' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📉 Form Drop-Offs
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Obstacles</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{issues.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Identified in recorded telemetry</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5 text-slate-600" />
          </div>
        </div>

        <div className="bg-white border border-rose-200 rounded-xl p-4 shadow-xs flex items-center justify-between bg-gradient-to-r from-white to-rose-50/30">
          <div>
            <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">High Priority Alerts</div>
            <div className="text-2xl font-black text-rose-700 mt-1">{highPriorityCount}</div>
            <div className="text-[11px] text-rose-500 mt-0.5">Requiring prompt UI remediation</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-blue-200 rounded-xl p-4 shadow-xs flex items-center justify-between bg-gradient-to-r from-white to-blue-50/30">
          <div>
            <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">AI Investigation</div>
            <div className="text-xs font-bold text-blue-900 mt-1.5">Gemma 2B Engine Ready</div>
            <div className="text-[11px] text-blue-500 mt-0.5">Synthesizes evidence into fixes</div>
          </div>
          <button
            onClick={() => onNavigate('ai')}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition shadow-2xs"
          >
            Launch AI &rarr;
          </button>
        </div>
      </div>

      {/* Issues Detailed Cards */}
      {filteredIssues.length > 0 ? (
        <div className="space-y-4">
          {filteredIssues.map((issue) => {
            const isHigh = issue.severity === 'high';
            return (
              <div 
                key={issue.id}
                className={`bg-white border rounded-2xl p-6 shadow-xs transition hover:shadow-md ${
                  isHigh ? 'border-rose-200 ring-2 ring-rose-50' : 'border-slate-200'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-start gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                      isHigh ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isHigh ? <Flame className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <h4 className="font-extrabold text-slate-900 text-base">{issue.type}</h4>
                        <span className={`text-[10px] uppercase tracking-wider font-black px-2.5 py-0.5 rounded-full ${
                          isHigh ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {issue.severity} Priority
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                        <span>Target Element:</span>
                        <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-800 border border-slate-200">
                          #{issue.element_id}
                        </code>
                        <span>on route</span>
                        <span className="font-bold text-blue-700 font-mono">{issue.page_url}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs text-slate-400 font-mono">
                    <div>{issue.timestamp?.substring(0, 10)}</div>
                    <div>{issue.timestamp?.substring(11, 19)} UTC</div>
                  </div>
                </div>

                {/* Two-Column Diagnosis: Evidence vs Recommended Fix */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
                    <strong className="text-slate-800 font-bold block uppercase text-[10px] tracking-wider text-slate-500">
                      Observed Behavioral Telemetry
                    </strong>
                    <p className="text-slate-700 font-medium leading-relaxed">
                      {issue.metrics}
                    </p>
                    <div className="text-[11px] text-slate-500 pt-1">
                      Session ID: <span className="font-mono font-semibold text-slate-700">{issue.session_id}</span>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200/70 space-y-1.5">
                    <strong className="text-blue-950 font-bold block uppercase text-[10px] tracking-wider text-blue-600 flex items-center gap-1">
                      <Wrench className="w-3 h-3 text-blue-600" /> Actionable UI Fix Recommendation
                    </strong>
                    <p className="text-blue-900 font-semibold leading-relaxed">
                      {issue.suggested_fix}
                    </p>
                    <div className="text-[11px] text-blue-700 pt-1">
                      Impact: Prevents user disorientation, reduces drop-off, boosts form completion.
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
                  <button
                    onClick={() => onNavigate('heatmaps', issue.page_url)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition shadow-2xs"
                  >
                    Inspect in Heatmap
                  </button>
                  <button
                    onClick={() => onNavigate('sessions')}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs transition shadow-2xs"
                  >
                    View Session
                  </button>
                  <button
                    onClick={() => onNavigate('ai')}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 flex items-center gap-1.5 transition shadow-2xs shadow-blue-500/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask Gemma AI</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h4 className="font-bold text-slate-900 text-base">No UX Friction Obstacles Detected</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No rage click bursts (&ge;3 clicks in 2s) or high abandonment rates currently exceed alert thresholds.
          </p>
          <button
            onClick={handleSimulateFriction}
            disabled={simulating}
            className="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition shadow-xs"
          >
            {simulating ? 'Simulating...' : 'Simulate Frustrated Journey'}
          </button>
        </div>
      )}
    </div>
  );
}
