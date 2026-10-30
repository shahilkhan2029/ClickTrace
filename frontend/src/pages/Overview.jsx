import React, { useState } from 'react';
import { 
  Users, 
  MousePointer, 
  AlertTriangle, 
  Award, 
  TrendingDown, 
  ArrowRight,
  Layers,
  Sparkles,
  Flame,
  Clock,
  ArrowUpRight,
  BarChart3,
  Activity
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { api } from '../api';

export default function Overview({ overview, funnel, onNavigate, onRefresh, showToast }) {
  const [chartMetric, setChartMetric] = useState('events'); // 'events' | 'sessions'
  const [simulating, setSimulating] = useState(false);

  if (!overview) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-slate-400 space-y-3">
        <Activity className="w-8 h-8 animate-pulse text-blue-500" />
        <span className="text-sm font-medium">Loading telemetry overview...</span>
      </div>
    );
  }

  const handleSimulateQuick = async (scenario) => {
    try {
      setSimulating(true);
      await api.simulateJourney(scenario);
      if (onRefresh) await onRefresh();
      if (showToast) {
        showToast(
          scenario === 'frustrated_registration' 
            ? "Frustrated visitor journey simulated with rage clicks!" 
            : "Smooth visitor conversion journey simulated!", 
          "success"
        );
      }
    } catch (e) {
      if (showToast) showToast("Simulation failed: " + e.message, "error");
    } finally {
      setSimulating(false);
    }
  };

  const statCards = [
    {
      id: 'sessions',
      label: 'Total Sessions',
      value: overview.total_sessions || 0,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200/60',
      desc: 'Distinct visitor visits',
      targetTab: 'sessions'
    },
    {
      id: 'events',
      label: 'Total Events',
      value: overview.total_events || 0,
      icon: MousePointer,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200/60',
      desc: `${overview.total_clicks || 0} clicks • ${overview.unique_pages || 0} routes`,
      targetTab: 'heatmaps'
    },
    {
      id: 'friction',
      label: 'Friction Signals',
      value: overview.friction_signals_count || 0,
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: (overview.friction_signals_count || 0) > 0 ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200',
      desc: 'Repeated clicks / frustration',
      highlight: (overview.friction_signals_count || 0) > 0,
      targetTab: 'issues'
    },
    {
      id: 'conversions',
      label: 'Conversions',
      value: overview.successful_conversions || 0,
      icon: Award,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200/60',
      desc: 'Enrollments submitted',
      targetTab: 'sessions'
    },
    {
      id: 'abandonment',
      label: 'Form Drop-Off',
      value: `${overview.form_abandonment_rate || 0}%`,
      icon: TrendingDown,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: (overview.form_abandonment_rate || 0) > 30 ? 'border-rose-200 ring-2 ring-rose-50' : 'border-slate-200',
      desc: `${overview.forms_started || 0} started, ${overview.successful_conversions || 0} done`,
      targetTab: 'issues'
    },
    {
      id: 'pages',
      label: 'Unique Pages',
      value: overview.unique_pages || 0,
      icon: Layers,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200/60',
      desc: 'Monitored endpoints',
      targetTab: 'heatmaps'
    }
  ];

  const timelineData = (overview.timeline || []).map(item => ({
    time: item.time_bucket.split('T')[1] || item.time_bucket,
    events: item.event_count,
    sessions: item.active_sessions
  }));

  // Calculate funnel drop-offs
  const stages = funnel?.stages || [];

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Stat Grid with Click-to-Inspect Action */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((c) => {
          const Icon = c.icon;
          return (
            <div 
              key={c.id} 
              onClick={() => onNavigate(c.targetTab)}
              className={`bg-white border rounded-xl p-4 shadow-xs transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer group relative overflow-hidden ${c.borderColor}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{c.label}</span>
                <div className={`w-8 h-8 rounded-lg ${c.bgColor} ${c.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900 tracking-tight">{c.value}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 truncate font-medium flex items-center justify-between">
                <span>{c.desc}</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts & Funnel Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interaction Activity Timeline (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm tracking-tight">Interaction Telemetry Timeline</h3>
                <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">Live</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Time-series distribution of visitor actions</p>
            </div>

            {/* Metric Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold self-start sm:self-auto">
              <button
                onClick={() => setChartMetric('events')}
                className={`px-3 py-1 rounded-md transition ${
                  chartMetric === 'events' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Events ({overview.total_events || 0})
              </button>
              <button
                onClick={() => setChartMetric('sessions')}
                className={`px-3 py-1 rounded-md transition ${
                  chartMetric === 'sessions' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Active Sessions ({overview.total_sessions || 0})
              </button>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartMetric === 'events' ? "#2563eb" : "#0d9488"} stopOpacity={0.25}/>
                      <stop offset="95%" stopColor={chartMetric === 'events' ? "#2563eb" : "#0d9488"} stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      background: '#0f172a', 
                      border: '1px solid #1e293b', 
                      borderRadius: '10px', 
                      color: '#fff', 
                      fontSize: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)' 
                    }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={chartMetric} 
                    stroke={chartMetric === 'events' ? "#2563eb" : "#0d9488"} 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#colorMetric)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <BarChart3 className="w-10 h-10 text-slate-400 mb-2" />
                <p className="text-xs font-bold text-slate-700">No interaction events logged yet</p>
                <p className="text-[11px] text-slate-500 max-w-sm mt-0.5">
                  Browse the demo site or click below to simulate realistic visitor actions with rage clicks.
                </p>
                <button
                  onClick={() => handleSimulateQuick('frustrated_registration')}
                  disabled={simulating}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition shadow-xs"
                >
                  {simulating ? 'Generating...' : 'Simulate Sample Journey'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Funnel Progress Summary (1 col) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Admissions Funnel</h3>
                <p className="text-xs text-slate-500 mt-0.5">Visitor drop-off by stage</p>
              </div>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                {funnel?.overall_conversion_rate || 0}% Conv
              </span>
            </div>

            <div className="space-y-3.5 mt-2">
              {stages.map((stage, i) => {
                const prevStage = i > 0 ? stages[i - 1] : null;
                const dropOffPct = prevStage && prevStage.count > 0 
                  ? Math.round(((prevStage.count - stage.count) / prevStage.count) * 100) 
                  : 0;

                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 truncate max-w-[180px]">{stage.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{stage.count} visitors</span>
                        <span className="text-slate-400 text-[10px]">({stage.pct}%)</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2.5 rounded-full transition-all duration-700" 
                        style={{ width: `${Math.max(stage.pct, 3)}%` }}
                      />
                    </div>

                    {dropOffPct > 0 && (
                      <div className="flex items-center justify-end gap-1 text-[10px] text-rose-500 font-medium">
                        <TrendingDown className="w-3 h-3" />
                        <span>-{dropOffPct}% drop-off from previous stage</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              Total entries: <strong className="text-slate-800">{funnel?.total_funnel_entries || 0}</strong>
            </span>
            <button 
              onClick={() => onNavigate('sessions')} 
              className="text-blue-600 font-bold hover:text-blue-800 flex items-center gap-1 transition"
            >
              <span>Inspect Sessions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Top Pages & Recent Friction Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Visited Pages */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Top Visited Pages</h3>
              <span className="text-xs text-slate-400 font-medium">By unique visitors</span>
            </div>

            <div className="divide-y divide-slate-100">
              {(overview.top_pages || []).length > 0 ? (
                overview.top_pages.map((p, idx) => {
                  const maxEvents = overview.top_pages[0]?.event_count || 1;
                  const relativePct = Math.round((p.event_count / maxEvents) * 100);

                  return (
                    <div key={idx} className="py-3 flex items-center justify-between text-xs group">
                      <div className="space-y-1 max-w-[240px] sm:max-w-sm">
                        <span className="font-mono font-bold text-slate-800 block truncate group-hover:text-blue-600 transition">
                          {p.page_url}
                        </span>
                        <div className="text-slate-400 text-[11px] flex items-center gap-2">
                          <span>{p.session_count} visitors</span>
                          <span>&bull;</span>
                          <span>{p.click_count} clicks</span>
                          <span>&bull;</span>
                          <span className="font-semibold text-slate-600">{p.event_count} total events</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden hidden sm:block">
                          <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${relativePct}%` }} />
                        </div>
                        <button 
                          onClick={() => onNavigate('heatmaps', p.page_url)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold px-2 py-1 rounded bg-blue-50/70 hover:bg-blue-100 transition"
                          title="View spatial heatmap for this page"
                        >
                          <span>Heatmap</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No page visits captured yet. Open the demo website to create traffic.
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-right">
            <button 
              onClick={() => onNavigate('heatmaps')} 
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
            >
              <span>Explore all heatmaps</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Recent Friction Signals */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Detected UX Friction Signals</span>
              </h3>
              <button 
                onClick={() => onNavigate('issues')}
                className="text-xs text-blue-600 font-bold hover:text-blue-800 inline-flex items-center gap-1"
              >
                <span>View all ({overview.friction_signals_count || 0})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {(overview.recent_friction_signals || []).length > 0 ? (
                overview.recent_friction_signals.map((sig, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => onNavigate('issues')}
                    className="p-3 bg-amber-50/70 border border-amber-200/90 rounded-xl text-xs hover:bg-amber-100/70 transition cursor-pointer"
                  >
                    <div className="flex items-center justify-between font-bold text-amber-950">
                      <span className="truncate max-w-[260px] flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Repeated Clicks: {sig.element_id || sig.element_text}</span>
                      </span>
                      <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">
                        {sig.click_count} clicks in {sig.interval_seconds}s
                      </span>
                    </div>
                    <div className="text-slate-600 text-[11px] mt-1.5 flex items-center justify-between">
                      <span className="font-mono text-slate-700">{sig.page_url}</span>
                      <span className="text-slate-400">{sig.timestamp?.substring(11, 19)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center text-xs text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-700">No active rage clicks or friction patterns detected</p>
                  <p className="text-[11px] text-slate-400">All visitor interactions are progressing without repeated clicks.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-right">
            <button 
              onClick={() => onNavigate('ai')} 
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-blue-600" />
              <span>Diagnose with Gemma AI</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
