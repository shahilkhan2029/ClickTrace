import React from 'react';
import { 
  Users, 
  MousePointer, 
  AlertTriangle, 
  Award, 
  FileText, 
  TrendingDown, 
  ArrowRight,
  Clock,
  Layers
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export default function Overview({ overview, funnel, onNavigate }) {
  if (!overview) {
    return (
      <div className="p-8 flex items-center justify-center text-slate-500">
        Loading analytics overview...
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Sessions',
      value: overview.total_sessions || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      desc: 'Distinct visitor visits'
    },
    {
      label: 'Total Events',
      value: overview.total_events || 0,
      icon: MousePointer,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      desc: 'Clicks, scrolls & navs'
    },
    {
      label: 'Friction Signals',
      value: overview.friction_signals_count || 0,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      desc: 'Repeated clicks / dropoffs',
      highlight: (overview.friction_signals_count || 0) > 0
    },
    {
      label: 'Conversions',
      value: overview.successful_conversions || 0,
      icon: Award,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      desc: 'Applications completed'
    },
    {
      label: 'Form Abandonment',
      value: `${overview.form_abandonment_rate || 0}%`,
      icon: TrendingDown,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      desc: `${overview.forms_started || 0} started, ${overview.successful_conversions || 0} completed`
    },
    {
      label: 'Unique Pages',
      value: overview.unique_pages || 0,
      icon: Layers,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      desc: 'Recorded site routes'
    }
  ];

  const timelineData = (overview.timeline || []).map(item => ({
    time: item.time_bucket.split('T')[1] || item.time_bucket,
    events: item.event_count,
    sessions: item.active_sessions
  }));

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Stat Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div 
              key={i} 
              className={`bg-white border rounded-xl p-4 shadow-sm transition hover:shadow ${
                c.highlight ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{c.label}</span>
                <div className={`w-8 h-8 rounded-lg ${c.bgColor} ${c.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900 tracking-tight">{c.value}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 truncate">{c.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Main Charts & Funnel Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interaction Activity Timeline (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Interaction Telemetry Timeline</h3>
              <p className="text-xs text-slate-500">Live events recorded across visitor sessions</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> Events
            </div>
          </div>

          <div className="h-64 w-full">
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorEvt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="events" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorEvt)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No events recorded yet. Browse the demo website to see live telemetry.
              </div>
            )}
          </div>
        </div>

        {/* Funnel Progress Summary (1 col) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Admissions Funnel</h3>
                <p className="text-xs text-slate-500">Visitor progression stages</p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {funnel?.overall_conversion_rate || 0}% Conv
              </span>
            </div>

            <div className="space-y-3 mt-3">
              {(funnel?.stages || []).map((stage, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700 truncate">{stage.name}</span>
                    <span className="font-semibold text-slate-900">{stage.count} ({stage.pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.max(stage.pct, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Funnel entries: {funnel?.total_funnel_entries || 0}</span>
            <button 
              onClick={() => onNavigate('sessions')} 
              className="text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
            >
              Inspect Sessions <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Top Pages & Recent Friction Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Visited Pages */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm mb-3">Top Visited Pages</h3>
          <div className="divide-y divide-slate-100">
            {(overview.top_pages || []).length > 0 ? (
              overview.top_pages.map((p, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">{p.page_url}</span>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      {p.session_count} visitors &bull; {p.click_count} clicks
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[11px]">
                      {p.event_count} events
                    </span>
                    <button 
                      onClick={() => onNavigate('heatmaps', p.page_url)}
                      className="text-blue-600 hover:text-blue-800 font-medium p-1"
                      title="View heatmap for this page"
                    >
                      Heatmap &rarr;
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                No page visits captured yet.
              </div>
            )}
          </div>
        </div>

        {/* Recent Friction Signals */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Detected UX Friction Signals</span>
            </h3>
            <button 
              onClick={() => onNavigate('issues')}
              className="text-xs text-blue-600 font-medium hover:text-blue-700"
            >
              View all ({overview.friction_signals_count || 0}) &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {(overview.recent_friction_signals || []).length > 0 ? (
              overview.recent_friction_signals.map((sig, idx) => (
                <div key={idx} className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-lg text-xs">
                  <div className="flex items-center justify-between font-semibold text-amber-900">
                    <span className="truncate max-w-[280px]">
                      Repeated Clicks: {sig.element_id || sig.element_text}
                    </span>
                    <span className="bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded text-[10px]">
                      {sig.click_count} clicks in {sig.interval_seconds}s
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px] mt-1 flex items-center justify-between">
                    <span>Page: {sig.page_url}</span>
                    <span className="text-slate-400">{sig.timestamp?.substring(11, 19)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No rage clicks or friction patterns detected yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
