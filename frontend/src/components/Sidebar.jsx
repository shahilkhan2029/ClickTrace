import React from 'react';
import { 
  LayoutDashboard, 
  Flame, 
  Users, 
  AlertTriangle, 
  BrainCircuit, 
  Settings, 
  ExternalLink,
  Layers,
  Cpu
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, health, issuesCount = 0 }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'heatmaps', label: 'Click Heatmaps', icon: Flame },
    { id: 'sessions', label: 'User Sessions', icon: Users },
    { 
      id: 'issues', 
      label: 'UX Friction', 
      icon: AlertTriangle, 
      badge: issuesCount > 0 ? `${issuesCount} Alerts` : 'Friction',
      badgeColor: issuesCount > 0 ? 'bg-rose-100 text-rose-700 font-bold' : 'bg-slate-100 text-slate-600'
    },
    { id: 'ai', label: 'AI UX Analyst', icon: BrainCircuit, badge: 'Gemma 2B', badgeColor: 'bg-blue-100 text-blue-700 font-bold' },
    { id: 'settings', label: 'Project Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen select-none shrink-0 z-20">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20 tracking-wider">
            CT
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-slate-900 tracking-tight text-base leading-tight">ClickTrace</h1>
              <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded uppercase">Local</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">UX Intelligence</span>
          </div>
        </div>

        {/* Project Card */}
        <div className="mt-4 p-3 bg-slate-50/90 rounded-xl border border-slate-200/80">
          <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-blue-600" /> Monitored Site
          </div>
          <div className="text-sm font-bold text-slate-800 truncate mt-0.5">
            Nexus College
          </div>
          <a 
            href="http://127.0.0.1:8000/demo/index.html" 
            target="_blank" 
            rel="noreferrer"
            className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1 font-semibold group"
          >
            <span>Launch demo website</span>
            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Intelligence Suite
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-blue-200/80 text-blue-900 font-bold' : item.badgeColor
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Service Health & Local Status Footer */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-50/70 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${health?.status === 'healthy' ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-amber-500 ring-4 ring-amber-100'}`} />
            <span className="font-semibold text-slate-700">Backend API</span>
          </div>
          <span className="text-[10px] font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
            SQLite WAL
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
          <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            <span>Local Gemma:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${health?.ollama?.online ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-slate-400'}`} />
            <span className={`text-[11px] font-bold ${health?.ollama?.online ? 'text-emerald-700' : 'text-slate-500'}`}>
              {health?.ollama?.online ? 'Online (CPU)' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
