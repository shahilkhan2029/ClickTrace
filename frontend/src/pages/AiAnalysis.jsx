import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  Cpu, 
  Terminal, 
  AlertCircle, 
  CheckCircle, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingUp, 
  RefreshCw,
  Info
} from 'lucide-react';
import { api } from '../api';

export default function AiAnalysis() {
  const [aiStatus, setAiStatus] = useState(null);
  const [latestReport, setLatestReport] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const fetchStatusAndReport = async () => {
    try {
      setLoadingInitial(true);
      setErrorMsg(null);
      const [statusRes, reportRes] = await Promise.all([
        api.getAiStatus(),
        api.getLatestAiReport('nexus-college')
      ]);
      setAiStatus(statusRes);
      if (reportRes && reportRes.report) {
        setLatestReport(reportRes);
      }
    } catch (err) {
      console.error("AI load error:", err);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    fetchStatusAndReport();
  }, []);

  const handleRunAnalysis = async () => {
    try {
      setAnalyzing(true);
      setErrorMsg(null);
      const res = await api.runAiAnalysis('nexus-college');
      if (res.success) {
        setLatestReport({
          id: res.report_id,
          created_at: new Date().toISOString(),
          report: res.report
        });
      } else {
        setErrorMsg(res.error + ': ' + (res.details || ''));
      }
    } catch (err) {
      setErrorMsg(err.message || 'Analysis failed to execute');
    } finally {
      setAnalyzing(false);
    }
  };

  const report = latestReport?.report;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header and Trigger Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Gemma AI UX Investigation Engine</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Synthesizes recorded user journeys, rage click signals, and conversion funnels to deliver evidence-grounded UX diagnoses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-xs transition shadow-sm ${
              analyzing
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
                <span>Synthesizing Evidence...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run Gemma UX Analysis</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Model & Hardware Runtime Status Card */}
      <div className="bg-slate-900 text-white rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-xs tracking-wider uppercase text-slate-300">
              Local Hardware & Inference Runtime
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${aiStatus?.online ? 'bg-emerald-400 ring-2 ring-emerald-400/30' : 'bg-amber-400 ring-2 ring-amber-400/30'}`} />
            <span className="text-slate-300 font-medium">
              {aiStatus?.online ? 'Ollama Online' : 'Ollama Offline'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <div className="text-slate-400 text-[11px]">Hardware & RAM Context:</div>
            <div className="font-semibold text-slate-200 mt-0.5">8 GB RAM (CPU Execution)</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Optimized for lightweight 1B models</div>
          </div>

          <div>
            <div className="text-slate-400 text-[11px]">Configured Model:</div>
            <div className="font-mono font-semibold text-blue-400 mt-0.5">
              {aiStatus?.configured_model || 'gemma3:1b'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Status: {aiStatus?.model_installed ? 'Installed & Ready' : 'Not installed locally'}
            </div>
          </div>

          <div>
            <div className="text-slate-400 text-[11px]">Offline / Local Command:</div>
            <div className="font-mono text-[11px] bg-slate-800 px-2 py-1 rounded text-amber-300 mt-0.5 flex items-center gap-1.5">
              <Terminal className="w-3 h-3 text-slate-400" />
              <span>ollama run gemma3:1b</span>
            </div>
          </div>
        </div>

        {/* Informative message if Ollama is not currently active */}
        {!aiStatus?.online && (
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-start gap-2 text-xs text-amber-300/90">
            <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <span>Ollama is not running on port 11434. To enable live local Gemma inference, run: </span>
              <code className="bg-slate-800 px-1.5 py-0.5 rounded font-mono text-white">ollama serve && ollama pull gemma3:1b</code>
              <p className="text-slate-400 text-[11px] mt-0.5">
                ClickTrace will never silently switch to cloud APIs. Stored reports generated from previously analyzed telemetry are preserved below.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error / Feedback Notice */}
      {errorMsg && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Inference Notice:</strong>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* AI Report Content Display */}
      {report ? (
        <div className="space-y-6">
          {/* Top Priority Callout */}
          {report.top_priority && (
            <div className="bg-rose-50 border-2 border-rose-200 rounded-xl p-5 text-xs text-rose-950 flex items-start gap-3 shadow-sm">
              <div className="w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                !
              </div>
              <div>
                <span className="font-bold uppercase tracking-wider text-[11px] text-rose-700">Urgent Top Priority Action</span>
                <p className="text-sm font-bold text-rose-900 mt-1 leading-snug">{report.top_priority}</p>
              </div>
            </div>
          )}

          {/* Overall Assessment */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Executive UX Assessment</span>
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200/80">
              {report.overall_assessment}
            </p>
          </div>

          {/* Issues Grid */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 text-sm">Identified UX Obstacles & Explanations</h4>
            {(report.issues || []).map((iss, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">{iss.title}</h5>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        iss.severity === 'high' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        Severity: {iss.severity}
                      </span>
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        Confidence: {iss.confidence}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Evidence bullets */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs">
                  <span className="font-semibold text-slate-700 block mb-1">Observed Telemetry Evidence:</span>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                    {(iss.observed_evidence || []).map((ev, eidx) => (
                      <li key={eidx}>{ev}</li>
                    ))}
                  </ul>
                </div>

                <div className="text-xs grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div>
                    <strong className="text-slate-800 block mb-0.5">Possible Explanation:</strong>
                    <p className="text-slate-600 text-[11px] leading-relaxed">{iss.possible_explanation}</p>
                  </div>
                  <div>
                    <strong className="text-blue-900 block mb-0.5">Recommended Action:</strong>
                    <p className="text-blue-800 text-[11px] leading-relaxed bg-blue-50/60 p-2.5 rounded border border-blue-100">
                      {iss.recommended_action}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Positives & Limitations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5 text-emerald-800">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Positive Interaction Patterns</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {(report.positive_observations || []).map((pos, pidx) => (
                  <li key={pidx} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">&bull;</span>
                    <span>{pos}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5 text-slate-800">
                <Info className="w-4 h-4 text-slate-500" />
                <span>Data Limitations & Evidence Bounds</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-500">
                {(report.data_limitations || []).map((lim, lidx) => (
                  <li key={lidx} className="flex items-start gap-2">
                    <span className="text-slate-400 font-bold">&bull;</span>
                    <span>{lim}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <BrainCircuit className="w-12 h-12 text-blue-500 mx-auto mb-3" />
          <h4 className="font-bold text-slate-900 text-base">No AI UX Analysis Stored Yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Click "Run Gemma UX Analysis" above to process collected interaction evidence through the local inference engine.
          </p>
        </div>
      )}
    </div>
  );
}
