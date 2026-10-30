import React, { useState } from 'react';
import { Copy, Check, ShieldCheck, Database, Code, Globe, Layers } from 'lucide-react';

export default function Settings() {
  const [copied, setCopied] = useState(false);

  const snippet = `<script src="http://127.0.0.1:8000/sdk/clicktrace.js" data-project-id="nexus-college"></script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h3 className="font-bold text-slate-900 text-base">Project Settings & Tracking Integration</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure project parameters and embed the tracking SDK
        </p>
      </div>

      {/* Embed Tracking SDK */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-blue-600" />
            <h4 className="font-bold text-slate-900 text-sm">Tracking SDK Script Tag</h4>
          </div>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Script Tag</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Paste this snippet immediately before the closing <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">&lt;/body&gt;</code> tag of any web application to start capturing clicks, scrolls, journeys, and form drop-offs.
        </p>

        <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-200 overflow-x-auto border border-slate-800">
          <code>{snippet}</code>
        </div>
      </div>

      {/* Privacy and Compliance */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h4 className="font-bold text-slate-900 text-sm">Privacy & Sensitive Data Filtering</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <span className="font-bold text-slate-800 block mb-1">Zero Form Text Collection</span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              ClickTrace never records passwords, input values, or credit card numbers. Only field count and submission status are tracked.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <span className="font-bold text-slate-800 block mb-1">Strict Text Redaction</span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              Element text is capped at 50 characters and scrubbed of authentication tokens, PINs, and sensitive keywords automatically.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <span className="font-bold text-slate-800 block mb-1">Local Data Isolation</span>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              All events remain strictly on the local SQLite database. No external cloud endpoints or analytics trackers receive visitor data.
            </p>
          </div>
        </div>
      </div>

      {/* Storage & Architecture Details */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-blue-600" />
          <h4 className="font-bold text-slate-900 text-sm">Database & Runtime Architecture</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Database Engine:</span>
              <span className="font-semibold text-slate-800">SQLite 3 (WAL Mode)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Backend Framework:</span>
              <span className="font-semibold text-slate-800">FastAPI & Uvicorn (Python 3.12)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Database File:</span>
              <span className="font-mono text-slate-700">backend/clicktrace.db</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Local AI Engine:</span>
              <span className="font-semibold text-slate-800">Ollama (Gemma Quantized)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">SDK Distribution:</span>
              <span className="font-semibold text-slate-800">Vanilla JS (No Dependencies)</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100">
              <span className="text-slate-500">Frontend Dashboard:</span>
              <span className="font-semibold text-slate-800">React + Vite + Tailwind CSS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
