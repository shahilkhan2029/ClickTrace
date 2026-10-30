import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  ShieldCheck, 
  Database, 
  Code, 
  Trash2, 
  AlertTriangle,
  RefreshCw,
  Server,
  Layers,
  Lock
} from 'lucide-react';
import { api } from '../api';

export default function Settings({ overview, health, onResetData, showToast }) {
  const [activeSnippetTab, setActiveSnippetTab] = useState('html'); // 'html' | 'react' | 'vue'
  const [copied, setCopied] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const htmlSnippet = `<!-- ClickTrace Client SDK -->
<script 
  src="http://127.0.0.1:8000/sdk/clicktrace.js" 
  data-project-id="nexus-college"
  defer>
</script>`;

  const reactSnippet = `// React / Next.js Integration
import { useEffect } from 'react';

export default function useClickTrace() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'http://127.0.0.1:8000/sdk/clicktrace.js';
    script.setAttribute('data-project-id', 'nexus-college');
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);
}`;

  const vueSnippet = `<!-- Vue 3 / Nuxt Integration -->
<script setup>
import { onMounted } from 'vue';

onMounted(() => {
  const script = document.createElement('script');
  script.src = 'http://127.0.0.1:8000/sdk/clicktrace.js';
  script.setAttribute('data-project-id', 'nexus-college');
  script.defer = true;
  document.body.appendChild(script);
});
</script>`;

  const getCurrentSnippet = () => {
    switch (activeSnippetTab) {
      case 'react': return reactSnippet;
      case 'vue': return vueSnippet;
      default: return htmlSnippet;
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getCurrentSnippet());
    setCopied(true);
    if (showToast) showToast("Integration snippet copied to clipboard!", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmReset = async () => {
    try {
      setResetting(true);
      await api.resetAnalytics('nexus-college');
      setShowResetConfirm(false);
      if (onResetData) await onResetData();
      if (showToast) showToast("All stored events and sessions have been reset successfully!", "success");
    } catch (err) {
      if (showToast) showToast("Reset failed: " + err.message, "error");
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-slate-900 text-base">Project Settings & Integration</h3>
          <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-200/60">
            nexus-college
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Tracking SDK snippet, privacy protections, and database telemetry controls
        </p>
      </div>

      {/* Embed Tracking SDK */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-600" />
            <h4 className="font-bold text-slate-900 text-sm">Embed Tracking SDK</h4>
          </div>

          <div className="flex items-center gap-2">
            {/* Snippet Framework Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setActiveSnippetTab('html')}
                className={`px-3 py-1 rounded-lg transition ${
                  activeSnippetTab === 'html' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                HTML / Script
              </button>
              <button
                onClick={() => setActiveSnippetTab('react')}
                className={`px-3 py-1 rounded-lg transition ${
                  activeSnippetTab === 'react' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                React / Next.js
              </button>
              <button
                onClick={() => setActiveSnippetTab('vue')}
                className={`px-3 py-1 rounded-lg transition ${
                  activeSnippetTab === 'vue' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Vue / Nuxt
              </button>
            </div>

            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Inject this lightweight (&lt;8 KB, zero dependencies) client script into your web pages. It automatically measures click coordinates, element hierarchies, scroll depths (25%, 50%, 75%, 100%), and form funnel interactions with batch queuing.
        </p>

        <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-slate-200 overflow-x-auto border border-slate-800 shadow-inner">
          <pre><code>{getCurrentSnippet()}</code></pre>
        </div>
      </div>

      {/* Database Telemetry Stats & Reset Management */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Telemetry Storage & Database</h4>
              <p className="text-xs text-slate-500">Live metrics from local SQLite WAL repository</p>
            </div>
          </div>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition shadow-2xs self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Reset Stored Telemetry</span>
          </button>
        </div>

        {/* Live database stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Events Stored</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 block">{overview?.total_events || 0}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Sessions Logged</span>
            <span className="text-lg font-black text-slate-900 mt-0.5 block">{overview?.total_sessions || 0}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Database Engine</span>
            <span className="text-sm font-bold text-slate-800 mt-0.5 block">SQLite 3 (WAL)</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block">Local AI Model</span>
            <span className="text-sm font-bold text-blue-700 mt-0.5 block font-mono">gemma:2b</span>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showResetConfirm && (
          <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-xl text-xs space-y-3 animate-in fade-in">
            <div className="flex items-start gap-2.5 text-rose-900">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-extrabold text-sm block">Confirm Database Wipe</strong>
                <p className="text-rose-800 mt-0.5 leading-relaxed">
                  Are you sure you want to delete all recorded events, visitor sessions, and AI diagnoses for project <strong>nexus-college</strong>? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-200">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                disabled={resetting}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition shadow-2xs"
              >
                {resetting ? 'Resetting...' : 'Yes, Delete All Telemetry'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Privacy and Compliance Standards */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h4 className="font-bold text-slate-900 text-sm">Privacy-First Architecture & Compliance</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="font-bold text-slate-900 block">Zero Form Value Recording</span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              ClickTrace never records passwords, input values, emails, or credentials. Only field count and submission status are tracked.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="font-bold text-slate-900 block">Automatic Text Scrubbing</span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Element text is capped at 50 characters and scrubbed of authentication tokens, PINs, and sensitive keywords automatically.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span className="font-bold text-slate-900 block">100% Local Air-Gapped Privacy</span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              All events remain strictly on the local SQLite database. No external cloud endpoints or third-party analytics trackers receive visitor data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
