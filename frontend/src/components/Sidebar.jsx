import React from 'react';
import { 
  LayoutDashboard, 
  Flame, 
  Users, 
  AlertTriangle, 
  BrainCircuit, 
  Settings, 
  ExternalLink,
  Activity,
  Layers
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, health }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'heatmaps', label: 'Click Heatmaps', icon: Flame },
    { id: 'sessions', label: 'User Sessions', icon: Users },
    { id: 'issues', label: 'UX Issues', icon: AlertTriangle, badge: 'Friction' },
    { id: 'ai', label: 'AI UX Analyst', icon: BrainCircuit, badge: 'Gemma' },
    { id: 'settings', label: 'Project Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-blue-500/20">
            CT
          </div>
          <div>
            <h1 className="font-bold text-slate-900 tracking-tight text-base leading-tight">ClickTrace</h1>
            <span className="text-xs text-slate-500 font-medium">UX Intelligence</span>
          </div>
        </div>

        {/* Project Badge */}
        <div className="mt-4 p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-blue-600" /> Active Project
          </div>
          <div className="text-sm font-semibold text-slate-800 truncate mt-0.5">
            Nexus College
          </div>
          <a 
            href="http://127.0.0.1:8000/demo/index.html" 
            target="_blank" 
            rel="noreferrer"
            className="text-[12px] text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1 font-medium"
          >
            Open Demo Website <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Intelligence Suite
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200/60' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-blue-200/70 text-blue-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Service Health Footer */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-amber-500 ring-2 ring-amber-200'}`} />
            <span className="font-medium text-slate-700">API: {health?.status || 'connecting...'}</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
            SQLite
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
          <span>AI Engine (Ollama):</span>
          <span className={`font-semibold ${health?.ollama?.online ? 'text-emerald-600' : 'text-slate-500'}`}>
            {health?.ollama?.online ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
    </aside>
  );
}
