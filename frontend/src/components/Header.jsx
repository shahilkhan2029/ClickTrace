import React, { useState } from 'react';
import { RefreshCw, ExternalLink, Play, CheckCircle2, AlertOctagon } from 'lucide-react';
import { api } from '../api';

export default function Header({ title, subtitle, onRefresh, loading }) {
  const [simulating, setSimulating] = useState(false);
  const [showSimMenu, setShowSimMenu] = useState(false);

  const handleSimulate = async (scenario) => {
    try {
      setSimulating(true);
      setShowSimMenu(false);
      await api.simulateJourney(scenario);
      await onRefresh();
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Simulator Menu */}
        <div className="relative">
          <button
            onClick={() => setShowSimMenu(!showSimMenu)}
            disabled={simulating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm"
          >
            <Play className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
            <span>{simulating ? 'Simulating...' : 'Simulate Visitor Journey'}</span>
          </button>

          {showSimMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-50 text-xs">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Generate Test Telemetry
              </div>
              <button
                onClick={() => handleSimulate('frustrated_registration')}
                className="w-full text-left px-3 py-2 hover:bg-amber-50 text-slate-700 hover:text-amber-900 flex items-start gap-2"
              >
                <AlertOctagon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Frustrated Registration</div>
                  <div className="text-[11px] text-slate-500">4 rapid rage clicks on submit button</div>
                </div>
              </button>
              <button
                onClick={() => handleSimulate('smooth_conversion')}
                className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 flex items-start gap-2 border-t border-slate-100"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold">Smooth Conversion</div>
                  <div className="text-[11px] text-slate-500">Course browse & completed application</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Refresh Analytics Button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition shadow-sm"
          title="Refresh telemetry and calculations"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>

        {/* Demo Website Link */}
        <a
          href="http://127.0.0.1:8000/demo/index.html"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-sm"
        >
          <span>Open Demo Website</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </header>
  );
}
