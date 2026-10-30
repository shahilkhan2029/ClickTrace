import React, { useState, useEffect } from 'react';
import { 
  MousePointer, 
  Layers, 
  Info, 
  Filter, 
  ArrowUpRight, 
  Flame, 
  Target, 
  AlertTriangle,
  ExternalLink,
  Lock,
  RefreshCw,
  Sparkles,
  Sliders
} from 'lucide-react';
import { api } from '../api';

export default function Heatmaps({ selectedPageOverride, showToast, onRefresh }) {
  const [data, setData] = useState(null);
  const [selectedPage, setSelectedPage] = useState(selectedPageOverride || '');
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [activeElementFilter, setActiveElementFilter] = useState(null);
  const [viewMode, setViewMode] = useState('density'); // 'density' | 'pinpoint' | 'rage_only'
  const [simulating, setSimulating] = useState(false);

  const loadHeatmap = async (page) => {
    try {
      setLoading(true);
      const res = await api.getHeatmap('nexus-college', page);
      setData(res);
      if (!selectedPage && res.selected_page) {
        setSelectedPage(res.selected_page);
      }
    } catch (err) {
      console.error("Heatmap load error:", err);
      if (showToast) showToast("Failed to load heatmap: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHeatmap(selectedPageOverride || selectedPage);
  }, [selectedPageOverride]);

  const handlePageChange = (newPage) => {
    setSelectedPage(newPage);
    loadHeatmap(newPage);
  };

  const handleSimulateClicks = async () => {
    try {
      setSimulating(true);
      await api.simulateJourney('frustrated_registration');
      if (onRefresh) await onRefresh();
      await loadHeatmap(selectedPage);
      if (showToast) showToast("Simulated rage clicks generated for heatmap inspection!", "success");
    } catch (e) {
      if (showToast) showToast("Simulation failed: " + e.message, "error");
    } finally {
      setSimulating(false);
    }
  };

  const refW = data?.reference_viewport?.width || 1280;
  const refH = data?.reference_viewport?.height || 800;

  // Group coordinates to show click density
  const points = data?.points || [];
  const clusteredPoints = [];
  const radius = 28;

  points.forEach((p) => {
    const existing = clusteredPoints.find(
      (c) => Math.abs(c.x - p.x) < radius && Math.abs(c.y - p.y) < radius
    );
    if (existing) {
      existing.count += 1;
      existing.elements.push(p.element);
      if (!existing.element && p.element) existing.element = p.element;
    } else {
      clusteredPoints.push({
        x: p.x,
        y: p.y,
        element: p.element,
        tag: p.tag,
        count: 1,
        elements: [p.element]
      });
    }
  });

  // Sort top clicked elements
  const topElements = [...clusteredPoints].sort((a, b) => b.count - a.count);

  // Filter points based on viewMode and activeElementFilter
  const displayPoints = clusteredPoints.filter((pt) => {
    if (activeElementFilter && pt.element !== activeElementFilter) return false;
    if (viewMode === 'rage_only') return pt.count >= 4;
    return true;
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Filter and Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base">Interaction Click Heatmap</h3>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold border border-blue-200/60">
              Spatial Coordinates
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real viewport click density captured by the ClickTrace client SDK
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Target Page Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <span className="text-xs font-semibold text-slate-500">Route:</span>
            <select
              value={selectedPage}
              onChange={(e) => handlePageChange(e.target.value)}
              className="text-xs bg-transparent text-slate-800 font-bold outline-none cursor-pointer"
            >
              {(data?.available_pages || []).length > 0 ? (
                data.available_pages.map((p, i) => (
                  <option key={i} value={p.page_url}>
                    {p.page_url} ({p.click_count} clicks)
                  </option>
                ))
              ) : (
                <option value="">No recorded pages</option>
              )}
            </select>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode('density')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                viewMode === 'density' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Density glow mode"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Density</span>
            </button>
            <button
              onClick={() => setViewMode('pinpoint')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                viewMode === 'pinpoint' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Pinpoint markers"
            >
              <Target className="w-3.5 h-3.5 text-blue-500" />
              <span>Pinpoints</span>
            </button>
            <button
              onClick={() => setViewMode('rage_only')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                viewMode === 'rage_only' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Rage click hotspots only"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Rage Only</span>
            </button>
          </div>

          {/* Open Live Demo Page */}
          <a
            href={`http://127.0.0.1:8000${selectedPage || '/demo/index.html'}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-bold px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition shadow-2xs"
          >
            <span>Live Page</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Heatmap Canvas with Browser Frame */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Browser Mockup Chrome Header */}
        <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-400"></span>
            <span className="w-3 h-3 rounded-full bg-amber-400"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
          </div>

          {/* Browser Address Bar */}
          <div className="flex-1 max-w-md mx-4">
            <div className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-xs text-slate-600 flex items-center gap-2 shadow-2xs font-mono truncate">
              <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
              <span className="text-slate-400">http://127.0.0.1:8000</span>
              <span className="text-slate-900 font-bold">{selectedPage || '/demo/index.html'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span className="hidden sm:inline">Viewport: {refW} &times; {refH} px</span>
            <span className="bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded text-[11px] font-bold">
              {points.length} clicks
            </span>
          </div>
        </div>

        {/* Viewport Canvas */}
        <div className="p-4 sm:p-6 bg-slate-950">
          <div 
            className="relative w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-2xl"
            style={{ aspectRatio: `${refW} / ${Math.min(refH, 700)}`, minHeight: '460px' }}
          >
            {/* Subtle simulated page wireframe background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none p-8 flex flex-col justify-between">
              <div className="h-10 bg-white rounded-lg flex items-center px-4 justify-between">
                <div className="w-28 h-4 bg-white rounded"></div>
                <div className="flex gap-4">
                  <div className="w-16 h-3 bg-white rounded"></div>
                  <div className="w-16 h-3 bg-white rounded"></div>
                  <div className="w-20 h-3 bg-white rounded"></div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-6 my-auto">
                <div className="h-44 bg-white rounded-xl p-4 flex flex-col justify-between">
                  <div className="w-1/2 h-4 bg-white rounded"></div>
                  <div className="w-full h-16 bg-white/50 rounded"></div>
                  <div className="w-1/3 h-6 bg-white rounded"></div>
                </div>
                <div className="h-44 bg-white rounded-xl p-4 flex flex-col justify-between">
                  <div className="w-1/2 h-4 bg-white rounded"></div>
                  <div className="w-full h-16 bg-white/50 rounded"></div>
                  <div className="w-1/3 h-6 bg-white rounded"></div>
                </div>
                <div className="h-44 bg-white rounded-xl p-4 flex flex-col justify-between">
                  <div className="w-1/2 h-4 bg-white rounded"></div>
                  <div className="w-full h-16 bg-white/50 rounded"></div>
                  <div className="w-1/3 h-6 bg-white rounded"></div>
                </div>
              </div>
              <div className="h-14 bg-white rounded-lg flex items-center px-4">
                <div className="w-36 h-4 bg-white rounded"></div>
              </div>
            </div>

            {/* Interactive Click Coordinates Markers */}
            {displayPoints.map((pt, idx) => {
              const leftPct = Math.min(Math.max((pt.x / refW) * 100, 3), 97);
              const topPct = Math.min(Math.max((pt.y / refH) * 100, 4), 95);
              const isHotspot = pt.count >= 4;
              const isMedium = pt.count >= 2;
              const isHovered = hoveredPoint === pt;

              if (viewMode === 'pinpoint') {
                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredPoint(pt)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-150 z-10"
                    style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                  >
                    <div className="w-4 h-4 rounded-full bg-blue-500/80 border-2 border-white flex items-center justify-center shadow-lg">
                      <div className="w-1 h-1 rounded-full bg-white"></div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all z-10 ${
                    isHovered ? 'scale-125 z-20' : 'hover:scale-115'
                  }`}
                  style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                >
                  <div
                    className={`rounded-full flex items-center justify-center font-black text-white shadow-xl transition-all ${
                      isHotspot
                        ? 'w-11 h-11 bg-rose-600/90 ring-8 ring-rose-500/40 text-xs animate-pulse shadow-rose-600/50'
                        : isMedium
                        ? 'w-8 h-8 bg-amber-500/90 ring-6 ring-amber-400/30 text-[11px]'
                        : 'w-6 h-6 bg-blue-500/90 ring-4 ring-blue-400/20 text-[10px]'
                    }`}
                  >
                    {pt.count}
                  </div>
                </div>
              );
            })}

            {/* Active Hover Tooltip */}
            {hoveredPoint && (
              <div
                className="absolute z-30 pointer-events-none bg-slate-900/95 text-white p-3.5 rounded-xl shadow-2xl text-xs border border-slate-700 -translate-x-1/2 -translate-y-full mb-3 backdrop-blur"
                style={{
                  left: `${Math.min(Math.max((hoveredPoint.x / refW) * 100, 15), 85)}%`,
                  top: `${Math.max((hoveredPoint.y / refH) * 100 - 4, 14)}%`
                }}
              >
                <div className="flex items-center gap-2">
                  {hoveredPoint.count >= 4 ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-500 text-white px-2 py-0.5 rounded">
                      🔥 Rage Hotspot
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded">
                      Element Target
                    </span>
                  )}
                  <span className="text-slate-300 font-mono text-[11px]">
                    &lt;{hoveredPoint.tag || 'element'}&gt;
                  </span>
                </div>
                <div className="font-mono text-sm font-bold text-amber-300 mt-1.5">
                  #{hoveredPoint.element || 'anonymous_target'}
                </div>
                <div className="text-slate-300 text-[11px] mt-1 flex items-center gap-2">
                  <span>Coordinates: ({hoveredPoint.x}, {hoveredPoint.y})</span>
                  <span>&bull;</span>
                  <span className="font-bold text-white">{hoveredPoint.count} clicks recorded</span>
                </div>
              </div>
            )}

            {/* Empty State */}
            {points.length === 0 && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 text-center p-6 space-y-3">
                <MousePointer className="w-12 h-12 text-slate-600" />
                <h4 className="font-bold text-sm text-slate-200">No clicks recorded on this page yet</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Click below to simulate visitor interaction with rage clicks, or browse the demo website live.
                </p>
                <button
                  onClick={handleSimulateClicks}
                  disabled={simulating}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition shadow-md"
                >
                  {simulating ? 'Simulating...' : 'Generate Test Clicks'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Heatmap Analysis Insights Table */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Top Clicked Targets on Selected Page
              </h4>
              <p className="text-[11px] text-slate-500">Click any card to highlight on the viewport canvas</p>
            </div>
            {activeElementFilter && (
              <button
                onClick={() => setActiveElementFilter(null)}
                className="text-xs text-blue-600 font-bold hover:text-blue-800"
              >
                Reset Filter
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {topElements.slice(0, 6).map((item, idx) => {
              const isSelected = activeElementFilter === item.element;
              const isRage = item.count >= 4;
              const pct = Math.round((item.count / (points.length || 1)) * 100);

              return (
                <div 
                  key={idx} 
                  onClick={() => setActiveElementFilter(isSelected ? null : item.element)}
                  className={`border rounded-xl p-3.5 text-xs flex items-center justify-between cursor-pointer transition ${
                    isSelected
                      ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200'
                      : isRage
                      ? 'bg-rose-50/70 border-rose-200 hover:bg-rose-100/70'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1 truncate max-w-[190px]">
                    <div className="font-mono font-bold text-slate-800 truncate">
                      #{item.element || 'Generic Click'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Coords: ({item.x}, {item.y}) &bull; {pct}% of page clicks
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg font-black text-xs ${
                    isRage ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {item.count} clicks
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
