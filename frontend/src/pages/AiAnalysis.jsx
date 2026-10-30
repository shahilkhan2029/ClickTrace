import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  Cpu, 
  Terminal, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingUp, 
  RefreshCw,
  Info,
  Copy,
  Check,
  Zap,
  Target,
  ArrowRight,
  Layers,
  Flame
} from 'lucide-react';
import { api } from '../api';

export default function AiAnalysis() {
  const [aiStatus, setAiStatus] = useState(null);
  const [latestReport, setLatestReport] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState(1);
  const [errorMsg, setErrorMsg] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const fetchStatusAndReport = async () => {
    try {
      setLoadingInitial(true);
      setErrorMsg(null);
      const [statusRes, reportRes] = await Promise.all([
        api.getAiStatus().catch(() => ({ online: false, configured_model: 'gemma:2b', model_installed: false })),
        api.getLatestAiReport('nexus-college').catch(() => null)
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
      setAnalysisStage(1);

      const stageTimer1 = setTimeout(() => setAnalysisStage(2), 2500);
      const stageTimer2 = setTimeout(() => setAnalysisStage(3), 6000);

      const res = await api.runAiAnalysis('nexus-college');
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);

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
      setAnalysisStage(1);
    }
  };

  const handleCopyReport = () => {
    if (!latestReport?.report) return;
    navigator.clipboard.writeText(JSON.stringify(latestReport.report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const report = latestReport?.report;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden border border-slate-800">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-300 animate-pulse" />
              <span>Gemma 2B Local UX Intelligence</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              AI UX Investigation Engine
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Analyzes real visitor trajectories, rage clicks, and conversion drop-offs to formulate evidence-grounded UX diagnoses.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {report && (
              <button
                onClick={handleCopyReport}
                className="px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                <span>{copied ? 'Copied JSON' : 'Export Report'}</span>
              </button>
            )}

            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition shadow-lg ${
                analyzing
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/30 hover:shadow-blue-500/50'
              }`}
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-300" />
                  <span>Synthesizing Evidence...</span>
                </>
              ) : (
                <>
                  <BrainCircuit className="w-4 h-4" />
                  <span>Run Gemma UX Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Multi-Stage Inference Visualizer (When Running) */}
        {analyzing && (
          <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className={`p-3 rounded-lg border flex items-center gap-2.5 transition-all ${
              analysisStage >= 1 ? 'bg-blue-500/20 border-blue-400/40 text-blue-200' : 'bg-slate-800/40 border-slate-700 text-slate-400'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                analysisStage >= 1 ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
              }`}>1</div>
              <span>Reading Telemetry & Rage Clicks</span>
            </div>

            <div className={`p-3 rounded-lg border flex items-center gap-2.5 transition-all ${
              analysisStage >= 2 ? 'bg-blue-500/20 border-blue-400/40 text-blue-200' : 'bg-slate-800/40 border-slate-700 text-slate-400'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                analysisStage >= 2 ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
              }`}>2</div>
              <span>Processing Funnel & Heatmaps</span>
            </div>

            <div className={`p-3 rounded-lg border flex items-center gap-2.5 transition-all ${
              analysisStage >= 3 ? 'bg-blue-500/20 border-blue-400/40 text-blue-200' : 'bg-slate-800/40 border-slate-700 text-slate-400'
            }`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                analysisStage >= 3 ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
              }`}>3</div>
              <span>Gemma 2B Synthesizing Diagnoses</span>
            </div>
          </div>
        )}
      </div>

      {/* Modern Hardware & Model Context Ribbon */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${aiStatus?.online ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-amber-500 ring-4 ring-amber-100'}`} />
            <span className="font-bold text-slate-800">
              Ollama: {aiStatus?.online ? 'Active (:11434)' : 'Offline'}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

          <div className="flex items-center gap-1.5 text-slate-600">
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            <span>Configured Model:</span>
            <span className="font-mono font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100">
              {aiStatus?.configured_model || 'gemma:2b'}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

          <div className="flex items-center gap-1.5 text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Hardware Context:</span>
            <span className="font-medium text-slate-800">8 GB RAM • Fast CPU Quantized</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={fetchStatusAndReport} 
            className="text-slate-500 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition"
            title="Refresh local engine status"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Warning Notice If Service Is Offline */}
      {!aiStatus?.online && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="font-bold block text-sm">Ollama Local Service Is Offline</strong>
            <p className="text-amber-800 leading-relaxed">
              To activate live inference, start Ollama with <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold text-amber-900">ollama serve</code> or double-click <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-bold text-amber-900">start_clicktrace.bat</code>.
            </p>
          </div>
        </div>
      )}

      {/* Error Message if Fetch Failed */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Inference Notice:</strong>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Generated Report Content */}
      {report ? (
        <div className="space-y-6">
          {/* Top Priority Action Banner */}
          {report.top_priority && (
            <div className="bg-gradient-to-r from-rose-50 via-rose-50/80 to-amber-50 border-2 border-rose-200/90 rounded-2xl p-6 shadow-sm flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
                <Target className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] uppercase tracking-wider font-extrabold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                    Urgent Top Priority Action
                  </span>
                  <span className="text-xs text-rose-500 font-semibold">Immediate Impact</span>
                </div>
                <h4 className="text-base font-bold text-slate-900 leading-snug">
                  {report.top_priority}
                </h4>
              </div>
            </div>
          )}

          {/* Executive Assessment Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Executive UX Assessment</h3>
              </div>
              <span className="text-xs text-slate-400">
                Generated {latestReport.created_at ? new Date(latestReport.created_at).toLocaleTimeString() : 'Recently'}
              </span>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/60 font-medium">
              {report.overall_assessment}
            </p>
          </div>

          {/* Detailed Issues Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <span>Identified Friction Obstacles ({report.issues?.length || 0})</span>
              </h3>
              <span className="text-xs text-slate-500">Ranked by severity & behavioral evidence</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {(report.issues || []).map((iss, idx) => {
                const isHigh = String(iss.severity).toLowerCase().includes('high');
                return (
                  <div 
                    key={idx}
                    className={`bg-white border rounded-2xl p-6 shadow-sm transition hover:shadow-md ${
                      isHigh ? 'border-rose-200 ring-2 ring-rose-50/50' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5 mb-4">
                      <div>
                        <h4 className="text-base font-bold text-slate-900 tracking-tight">
                          {iss.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full ${
                            isHigh ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            Severity: {iss.severity}
                          </span>
                          <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full">
                            Confidence: {iss.confidence}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Observed Evidence Tags */}
                    <div className="mb-4">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Observed Telemetry Evidence
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {(iss.observed_evidence || []).map((ev, eidx) => (
                          <div 
                            key={eidx} 
                            className="text-xs bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200/80 font-medium flex items-center gap-1.5"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            <span>{ev}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Two-Column Diagnosis: Explanation vs Recommended Fix */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                        <strong className="text-slate-800 font-bold block mb-1">
                          Probable Cause (Hypothesis):
                        </strong>
                        <p className="text-slate-600 leading-relaxed text-xs">
                          {iss.possible_explanation}
                        </p>
                      </div>

                      <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/70">
                        <strong className="text-blue-950 font-bold block mb-1">
                          Actionable UI Recommendation:
                        </strong>
                        <p className="text-blue-900 leading-relaxed text-xs font-medium">
                          {iss.recommended_action}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Positives & Limitations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm border-b border-slate-100 pb-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Positive Interaction Patterns</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                {(report.positive_observations || []).map((pos, pidx) => (
                  <li key={pidx} className="flex items-start gap-2 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-emerald-600 font-bold mt-0.5">&bull;</span>
                    <span className="text-slate-700 font-medium">{pos}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm border-b border-slate-100 pb-2.5">
                <Info className="w-4 h-4 text-slate-500" />
                <span>Data Limitations & Evidence Bounds</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600">
                {(report.data_limitations || []).map((lim, lidx) => (
                  <li key={lidx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                    <span className="text-slate-400 font-bold mt-0.5">&bull;</span>
                    <span className="text-slate-600">{lim}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm space-y-3">
          <BrainCircuit className="w-12 h-12 text-blue-500 mx-auto" />
          <h4 className="font-bold text-slate-900 text-base">No AI UX Analysis Stored Yet</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click the blue "Run Gemma UX Analysis" button above to evaluate your recorded interaction data through the local Gemma engine.
          </p>
        </div>
      )}
    </div>
  );
}
