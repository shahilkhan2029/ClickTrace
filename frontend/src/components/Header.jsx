import React, { useState } from 'react';
import { RefreshCw, ExternalLink, Play, CheckCircle2, AlertOctagon, ChevronDown, Sparkles } from 'lucide-react';
import { api } from '../api';

export default function Header({ title, subtitle, onRefresh, loading, showToast }) {
  const [simulating, setSimulating] = useState(false);
  const [showSimMenu, setShowSimMenu] = useState(false);

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

  return (
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
  );
}
