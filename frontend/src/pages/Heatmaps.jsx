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
  Sliders,
  Globe,
  Eye,
  Crosshair,
  Maximize2,
  CheckCircle2
} from 'lucide-react';
import { api } from '../api';

export default function Heatmaps({ selectedPageOverride, showToast, onRefresh }) {
  const [data, setData] = useState(null);
  const [selectedPage, setSelectedPage] = useState(selectedPageOverride || '');
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [activeElementFilter, setActiveElementFilter] = useState(null);
  const [viewMode, setViewMode] = useState('glow'); // 'glow' | 'clusters' | 'pinpoint' | 'rage_only'
  const [backdropMode, setBackdropMode] = useState('live'); // 'live' | 'dark' | 'wireframe'
  const [tagFilter, setTagFilter] = useState('all'); // 'all' | 'button' | 'input' | 'a'
  const [simulating, setSimulating] = useState(false);
  const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });

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
    setActiveElementFilter(null);
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
    // Filter by tag if selected
    if (tagFilter !== 'all' && p.tag !== tagFilter) return;

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

  const availablePages = data?.available_pages || [];
  const totalClicksOnPage = points.length;
  const rageHotspotCount = clusteredPoints.filter(p => p.count >= 4).length;

  const handleCanvasMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * refW);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * refH);
    setMouseCoords({ x: Math.max(0, x), y: Math.max(0, y) });
  };

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Route Switcher Pills Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">Spatial Click Heatmaps</h3>
              <span className="text-[10px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2.5 py-0.5 rounded-full font-bold shadow-2xs">
                Real Coordinate Density
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Exact viewport click telemetry recorded by the ClickTrace SDK with live website backdrop
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`http://127.0.0.1:8000${selectedPage || '/demo/index.html'}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-bold px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 transition shadow-2xs"
            >
              <span>Open Live Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Route Pills Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Routes:
          </span>
          {availablePages.length > 0 ? (
            availablePages.map((p, i) => {
              const isSelected = selectedPage === p.page_url;
              return (
                <button
                  key={i}
                  onClick={() => handlePageChange(p.page_url)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80'
                  }`}
                >
                  <Globe className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                  <span className="font-mono">{p.page_url}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {p.click_count}
                  </span>
                </button>
              );
            })
          ) : (
            <span className="text-xs text-slate-400 italic">No routes recorded yet</span>
          )}
        </div>
      </div>

      {/* Control Ribbon: Visual Modes, Backdrop, & Tag Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs font-semibold">
        {/* Heatmap Visualization Modes */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 text-[11px] uppercase tracking-wider font-bold mr-1">Overlay Mode:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('glow')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition ${
                viewMode === 'glow' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Hotjar-style thermal radial glow"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Thermal Glow</span>
            </button>
            <button
              onClick={() => setViewMode('clusters')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition ${
                viewMode === 'clusters' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Numbered density badges"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Numbered Pins</span>
            </button>
            <button
              onClick={() => setViewMode('pinpoint')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition ${
                viewMode === 'pinpoint' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Precise coordinate crosshairs"
            >
              <Crosshair className="w-3.5 h-3.5 text-blue-500" />
              <span>Crosshairs</span>
            </button>
            <button
              onClick={() => setViewMode('rage_only')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg transition ${
                viewMode === 'rage_only' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Only clusters with 4+ clicks"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Rage Only ({rageHotspotCount})</span>
            </button>
          </div>
        </div>

        {/* Backdrop Mode Switcher */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 text-[11px] uppercase tracking-wider font-bold mr-1">Backdrop:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setBackdropMode('live')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                backdropMode === 'live' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Render actual live website inside viewport"
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>Live Website</span>
            </button>
            <button
              onClick={() => setBackdropMode('dark')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                backdropMode === 'dark' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="High-contrast dark canvas"
            >
              <span>Dark Canvas</span>
            </button>
            <button
              onClick={() => setBackdropMode('wireframe')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition ${
                backdropMode === 'wireframe' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Minimalist light wireframe"
            >
              <span>Wireframe</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Heatmap Canvas with Browser Frame */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden">
        {/* Realistic Browser Window Frame */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-400"></span>
            <span className="w-3 h-3 rounded-full bg-amber-400"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
          </div>

          {/* Browser Address Bar */}
          <div className="flex-1 max-w-lg mx-4">
            <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs text-slate-600 flex items-center justify-between shadow-2xs font-mono">
              <div className="flex items-center gap-2 truncate">
                <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="text-slate-400">http://127.0.0.1:8000</span>
                <span className="text-slate-900 font-bold">{selectedPage || '/demo/index.html'}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-sans hidden sm:inline">200 OK</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-600">
            <span className="hidden md:inline">Viewport: {refW} &times; {refH} px</span>
            <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-lg text-xs font-black">
              {totalClicksOnPage} clicks
            </span>
          </div>
        </div>

        {/* Viewport Canvas Container */}
        <div className="relative bg-slate-950 p-3 sm:p-5">
          <div 
            onMouseMove={handleCanvasMouseMove}
            className={`relative w-full rounded-xl overflow-hidden border shadow-2xl transition-all ${
              backdropMode === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'
            }`}
            style={{ aspectRatio: `${refW} / ${Math.min(refH, 750)}`, minHeight: '500px' }}
          >
            {/* 1. LIVE BACKDROP: Actual Webpage Iframe */}
            {backdropMode === 'live' && (
              <iframe
                src={`http://127.0.0.1:8000${selectedPage || '/demo/index.html'}`}
                title="Live Page Backdrop"
                className="absolute inset-0 w-full h-full border-none pointer-events-none opacity-85 select-none"
                style={{ transform: 'scale(1)', transformOrigin: 'top left' }}
              />
            )}

            {/* 2. WIREFRAME BACKDROP: Subtle layout shapes */}
            {backdropMode === 'wireframe' && (
              <div className="absolute inset-0 opacity-15 pointer-events-none p-8 flex flex-col justify-between">
                <div className="h-12 bg-slate-900 rounded-lg flex items-center px-4 justify-between">
                  <div className="w-32 h-4 bg-slate-800 rounded"></div>
                  <div className="flex gap-4">
                    <div className="w-16 h-3 bg-slate-700 rounded"></div>
                    <div className="w-16 h-3 bg-slate-700 rounded"></div>
                    <div className="w-20 h-3 bg-slate-700 rounded"></div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6 my-auto">
                  <div className="h-48 bg-slate-800 rounded-xl p-4"></div>
                  <div className="h-48 bg-slate-800 rounded-xl p-4"></div>
                  <div className="h-48 bg-slate-800 rounded-xl p-4"></div>
                </div>
                <div className="h-14 bg-slate-900 rounded-lg flex items-center px-4">
                  <div className="w-40 h-4 bg-slate-800 rounded"></div>
                </div>
              </div>
            )}

            {/* 3. DARK CANVAS BACKDROP: Subtle grid */}
            {backdropMode === 'dark' && (
              <div 
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }}
              />
            )}

            {/* OVERLAY MODE: THERMAL GLOW BLOBS */}
            {viewMode === 'glow' && displayPoints.map((pt, idx) => {
              const leftPct = Math.min(Math.max((pt.x / refW) * 100, 2), 98);
              const topPct = Math.min(Math.max((pt.y / refH) * 100, 3), 97);
              const isRage = pt.count >= 4;
              const isMedium = pt.count >= 2;

              // Size and gradient based on click intensity
              const blobSize = isRage ? 90 : isMedium ? 65 : 45;

              return (
                <div
                  key={`glow-${idx}`}
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10 transition-transform hover:scale-125"
                  style={{ 
                    left: `${leftPct}%`, 
                    top: `${topPct}%`,
                    width: `${blobSize}px`,
                    height: `${blobSize}px`
                  }}
                >
                  <div 
                    className={`w-full h-full rounded-full blur-md opacity-85 transition-all ${
                      isRage 
                        ? 'bg-gradient-to-tr from-rose-600 via-amber-500 to-yellow-300 animate-pulse'
                        : isMedium
                        ? 'bg-gradient-to-tr from-amber-500 via-yellow-400 to-emerald-400'
                        : 'bg-gradient-to-tr from-blue-600 via-cyan-400 to-emerald-300'
                    }`}
                  />
                  {/* Center pin core */}
                  <div className="absolute inset-0 flex items-center justify-center font-black text-white text-[11px] drop-shadow-md">
                    {pt.count}
                  </div>
                </div>
              );
            })}

            {/* OVERLAY MODE: NUMBERED CLUSTERS */}
            {viewMode === 'clusters' && displayPoints.map((pt, idx) => {
              const leftPct = Math.min(Math.max((pt.x / refW) * 100, 2), 98);
              const topPct = Math.min(Math.max((pt.y / refH) * 100, 3), 97);
              const isRage = pt.count >= 4;
              const isMedium = pt.count >= 2;
              const isHovered = hoveredPoint === pt;

              return (
                <div
                  key={`cluster-${idx}`}
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all z-20 ${
                    isHovered ? 'scale-125 z-30' : 'hover:scale-115'
                  }`}
                  style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                >
                  <div
                    className={`rounded-full flex items-center justify-center font-black text-white shadow-2xl transition-all border-2 border-white/80 ${
                      isRage
                        ? 'w-11 h-11 bg-rose-600 ring-8 ring-rose-500/40 text-xs animate-pulse shadow-rose-600/50'
                        : isMedium
                        ? 'w-8 h-8 bg-amber-500 ring-6 ring-amber-400/30 text-[11px]'
                        : 'w-7 h-7 bg-blue-600 ring-4 ring-blue-400/25 text-[10px]'
                    }`}
                  >
                    {pt.count}
                  </div>
                </div>
              );
            })}

            {/* OVERLAY MODE: PRECISION CROSSHAIRS */}
            {viewMode === 'pinpoint' && displayPoints.map((pt, idx) => {
              const leftPct = Math.min(Math.max((pt.x / refW) * 100, 2), 98);
              const topPct = Math.min(Math.max((pt.y / refH) * 100, 3), 97);

              return (
                <div
                  key={`pin-${idx}`}
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer hover:scale-150 transition-transform z-20"
                  style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                >
                  <div className="relative flex items-center justify-center w-6 h-6">
                    <div className="w-5 h-5 rounded-full border border-blue-400 bg-blue-500/30 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                    <div className="absolute w-6 h-px bg-blue-400"></div>
                    <div className="absolute h-6 w-px bg-blue-400"></div>
                  </div>
                </div>
              );
            })}

            {/* OVERLAY MODE: RAGE HOTSPOTS ONLY */}
            {viewMode === 'rage_only' && displayPoints.map((pt, idx) => {
              const leftPct = Math.min(Math.max((pt.x / refW) * 100, 2), 98);
              const topPct = Math.min(Math.max((pt.y / refH) * 100, 3), 97);

              return (
                <div
                  key={`rage-${idx}`}
                  onMouseEnter={() => setHoveredPoint(pt)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 hover:scale-125 transition-all"
                  style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                >
                  <div className="w-12 h-12 rounded-full bg-rose-600 text-white font-black flex items-center justify-center text-xs ring-8 ring-rose-500/50 animate-pulse shadow-xl shadow-rose-600/60 border-2 border-white">
                    🔥 {pt.count}
                  </div>
                </div>
              );
            })}

            {/* Active Hover Tooltip */}
            {hoveredPoint && (
              <div
                className="absolute z-40 pointer-events-none bg-slate-900/95 text-white p-3.5 rounded-2xl shadow-2xl text-xs border border-slate-700 -translate-x-1/2 -translate-y-full mb-4 backdrop-blur-md animate-in fade-in zoom-in-95"
                style={{
                  left: `${Math.min(Math.max((hoveredPoint.x / refW) * 100, 15), 85)}%`,
                  top: `${Math.max((hoveredPoint.y / refH) * 100 - 3, 15)}%`
                }}
              >
                <div className="flex items-center gap-2">
                  {hoveredPoint.count >= 4 ? (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded-md">
                      🔥 Rage Friction Hotspot
                    </span>
                  ) : (
                    <span className="text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-md">
                      Element Target
                    </span>
                  )}
                  <span className="text-slate-400 font-mono text-[11px]">
                    &lt;{hoveredPoint.tag || 'element'}&gt;
                  </span>
                </div>
                <div className="font-mono text-sm font-bold text-amber-300 mt-1.5">
                  #{hoveredPoint.element || 'anonymous_target'}
                </div>
                <div className="text-slate-300 text-[11px] mt-1.5 flex items-center gap-2 pt-1 border-t border-slate-800">
                  <span>Coordinates: ({hoveredPoint.x}, {hoveredPoint.y}) px</span>
                  <span>&bull;</span>
                  <span className="font-bold text-white">{hoveredPoint.count} clicks ({Math.round((hoveredPoint.count / (totalClicksOnPage || 1)) * 100)}% of page)</span>
                </div>
              </div>
            )}

            {/* Zero State / Empty Canvas */}
            {points.length === 0 && !loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 text-center p-6 space-y-3 z-30 bg-slate-900/80 backdrop-blur-xs">
                <div className="w-14 h-14 rounded-2xl bg-slate-800 text-blue-400 flex items-center justify-center shadow-lg border border-slate-700">
                  <Flame className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-base text-slate-100">No Clicks Recorded on Selected Route</h4>
                <p className="text-xs text-slate-400 max-w-md">
                  No interaction coordinates have been logged for <strong className="text-white font-mono">{selectedPage}</strong> yet. You can simulate test clicks or browse the demo website live.
                </p>
                <button
                  onClick={handleSimulateClicks}
                  disabled={simulating}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-500/30"
                >
                  {simulating ? 'Generating clicks...' : 'Simulate Test Clicks'}
                </button>
              </div>
            )}

            {/* Live Coordinate HUD at bottom right of canvas */}
            <div className="absolute bottom-3 right-3 z-20 bg-slate-900/90 text-white px-3 py-1.5 rounded-xl border border-slate-700/80 text-[11px] font-mono flex items-center gap-2.5 backdrop-blur shadow-lg">
              <Crosshair className="w-3.5 h-3.5 text-blue-400" />
              <span>X: <strong className="text-blue-300">{mouseCoords.x}</strong></span>
              <span>Y: <strong className="text-blue-300">{mouseCoords.y}</strong></span>
            </div>
          </div>
        </div>

        {/* Heatmap Insights & Element Distribution Grid */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                <span>Top Clicked Elements on {selectedPage}</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                  {topElements.length} Targets
                </span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Click any target below to isolate and highlight on the canvas</p>
            </div>

            {/* Element Tag Filter Pills */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl text-xs font-semibold shadow-2xs">
              <button
                onClick={() => setTagFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  tagFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTagFilter('button')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  tagFilter === 'button' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Buttons
              </button>
              <button
                onClick={() => setTagFilter('input')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  tagFilter === 'input' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Inputs
              </button>
              <button
                onClick={() => setTagFilter('a')}
                className={`px-2.5 py-1 rounded-lg transition ${
                  tagFilter === 'a' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Links
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {topElements.slice(0, 6).map((item, idx) => {
              const isSelected = activeElementFilter === item.element;
              const isRage = item.count >= 4;
              const pct = Math.round((item.count / (totalClicksOnPage || 1)) * 100);

              return (
                <div 
                  key={idx} 
                  onClick={() => setActiveElementFilter(isSelected ? null : item.element)}
                  className={`border rounded-2xl p-4 text-xs flex flex-col justify-between cursor-pointer transition shadow-2xs hover:shadow-md ${
                    isSelected
                      ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200'
                      : isRage
                      ? 'bg-rose-50/80 border-rose-200 hover:bg-rose-100/80'
                      : 'bg-white border-slate-200 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 truncate">
                      <div className="font-mono font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                        {isRage && <Flame className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                        <span>#{item.element || 'anonymous_target'}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Tag: &lt;{item.tag || 'element'}&gt; &bull; ({item.x}, {item.y}) px
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-lg font-black text-xs shrink-0 ${
                      isRage ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {item.count} clicks
                    </span>
                  </div>

                  {/* Percentage Bar */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">{pct}% of page clicks</span>
                    <span className={`font-bold ${isRage ? 'text-rose-700' : 'text-blue-600'}`}>
                      {isSelected ? 'Selected on Map' : 'Click to Highlight'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
