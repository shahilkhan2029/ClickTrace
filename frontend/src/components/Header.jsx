import React, { useState } from 'react';
import { 
  RefreshCw, 
  ExternalLink, 
  Play, 
  CheckCircle2, 
  AlertOctagon, 
  ChevronDown, 
  Sparkles,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';
import { api } from '../api';

export default function Header({ title, subtitle, onRefresh, onClearData, loading, showToast }) {
  const [simulating, setSimulating] = useState(false);
  const [showSimMenu, setShowSimMenu] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleSimulate = async (scenario) => {
    try {
      setSimulating(true);
      setShowSimMenu(false);
      await api.simulateJourney(scenario);
      await onRefresh();
      if (showToast) {
        showToast(
          scenario === 'frustrated_registration' 
            ? "Simulated Frustrated Visitor: 4 rapid rage clicks generated on submit button!"
            : "Simulated Smooth Visitor: Complete conversion journey logged!",
          "success"
        );
      }
    } catch (err) {
      console.error("Simulation error:", err);
      if (showToast) {
        showToast("Simulation failed: " + err.message, "error");
      }
    } finally {
      setSimulating(false);
    }
  };

  const handleManualRefresh = async () => {
    await onRefresh();
    if (showToast) {
      showToast("Analytics and telemetry refreshed successfully", "info");
    }
  };

  const handleConfirmClear = async () => {
    try {
      setClearing(true);
      if (onClearData) {
        await onClearData();
      } else {
        await api.resetAnalytics('nexus-college');
        try {
          window.sessionStorage.removeItem('clicktrace_session_id');
        } catch (e) {}
        await onRefresh();
        if (showToast) {
          showToast("All telemetry data cleared! Dashboard is 100% fresh for your demo.", "success");
        }
      }
      setShowClearModal(false);
    } catch (err) {
      console.error("Clear error:", err);
      if (showToast) {
        showToast("Failed to clear data: " + err.message, "error");
      }
    } finally {
      setClearing(false);
    }
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 px-6 sm:px-8 py-3.5 flex items-center justify-between shrink-0 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200/60 text-[10px] font-semibold text-blue-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span> Live Stream
            </span>
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2.5">
          {/* Clear Data Button (Quick 1-Click Demo Reset) */}
          <button
            onClick={() => setShowClearModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-bold text-rose-700 bg-rose-50/80 hover:bg-rose-100/90 transition shadow-2xs hover:border-rose-300"
            title="Wipe all dummy & stored events to start a fresh live demo"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span className="hidden sm:inline">Clear Data</span>
          </button>

          {/* Quick Simulator Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setShowSimMenu(!showSimMenu)}
              disabled={simulating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition shadow-xs hover:border-slate-400 active:bg-slate-100"
            >
              <Play className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
              <span>{simulating ? 'Simulating...' : 'Simulate Visitor'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
            </button>

            {showSimMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowSimMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 text-xs animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Generate Test Telemetry
                  </div>

                  <button
                    onClick={() => handleSimulate('frustrated_registration')}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-amber-50/80 text-slate-700 hover:text-amber-900 flex items-start gap-2.5 transition"
                  >
                    <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-800">Frustrated Registration</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Triggers 4 rapid rage clicks on disabled submit button & form drop-off
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSimulate('smooth_conversion')}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50/80 text-slate-700 hover:text-emerald-900 flex items-start gap-2.5 border-t border-slate-100 transition"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-slate-800">Smooth Conversion</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Browses catalog, scrolls 100%, and submits application successfully
                      </div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Refresh Analytics Button */}
          <button
            onClick={handleManualRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition shadow-xs hover:border-slate-400"
            title="Refresh telemetry and calculations"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Demo Website Link */}
          <a
            href="http://127.0.0.1:8000/demo/index.html"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs shadow-blue-500/20"
          >
            <span>Open Demo</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Confirmation Modal for Clear Data */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <button 
                onClick={() => setShowClearModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">Clear All Telemetry Data?</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                This will wipe all recorded sessions, events, click heatmaps, and AI reports for <strong>Nexus College</strong>.
              </p>
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Perfect for live demo presentations! You can start interacting with the demo website fresh and watch real-time data flow in.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowClearModal(false)}
                disabled={clearing}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClear}
                disabled={clearing}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{clearing ? 'Clearing Data...' : 'Yes, Clear All Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
