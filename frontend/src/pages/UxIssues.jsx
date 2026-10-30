import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, ArrowRight, ShieldAlert, CheckCircle2, ExternalLink } from 'lucide-react';
import { api } from '../api';

export default function UxIssues({ onNavigate }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadIssues = async () => {
    try {
      setLoading(true);
      const data = await api.getIssues('nexus-college');
      setIssues(data);
    } catch (err) {
      console.error("Issues load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Detected UX Friction & Obstacles</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated algorithmic detection of rage clicks, repeated interactions, and form drop-offs
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Detected Obstacles: <span className="text-slate-900">{issues.length}</span>
        </div>
      </div>

      {issues.length > 0 ? (
        <div className="space-y-4">
          {issues.map((issue) => {
            const isHigh = issue.severity === 'high';
            return (
              <div 
                key={issue.id}
                className={`bg-white border rounded-xl p-5 shadow-sm transition hover:shadow-md ${
                  isHigh ? 'border-rose-200 ring-2 ring-rose-50' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      isHigh ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      <AlertTriangle className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <h4 className="font-bold text-slate-900 text-sm">{issue.type}</h4>
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded ${
                          isHigh ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {issue.severity} Priority
                        </span>
                      </div>

                      <div className="text-xs text-slate-600">
                        Target: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-semibold text-slate-800">{issue.element_id}</code>{' '}
                        on page <span className="font-semibold text-blue-700">{issue.page_url}</span>
                      </div>

                      <div className="text-xs text-slate-500 pt-1">
                        <strong>Observed Telemetry:</strong> {issue.metrics}
                      </div>
                    </div>
                  </div>

                  <div className="text-right text-xs text-slate-400">
                    <div>{issue.timestamp?.substring(0, 10)}</div>
                    <div>{issue.timestamp?.substring(11, 19)}</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="text-slate-600">
                    <strong className="text-slate-800">Recommended Action:</strong> {issue.suggested_fix}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onNavigate('heatmaps', issue.page_url)}
                      className="px-2.5 py-1 rounded border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      Inspect Heatmap
                    </button>
                    <button
                      onClick={() => onNavigate('ai')}
                      className="px-2.5 py-1 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 flex items-center gap-1"
                    >
                      Ask AI Analyst &rarr;
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h4 className="font-bold text-slate-900 text-sm">No Active UX Friction Detected</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            No rage clicks or abnormal drop-offs have exceeded detection thresholds yet.
            Test the intentionally tricky registration form or simulate a frustrated journey from the header bar.
          </p>
        </div>
      )}
    </div>
  );
}
