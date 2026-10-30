import React, { useState, useEffect } from 'react';
import { MousePointer, Layers, Info, Filter, ArrowUpRight } from 'lucide-react';
import { api } from '../api';

export default function Heatmaps({ selectedPageOverride }) {
  const [data, setData] = useState(null);
  const [selectedPage, setSelectedPage] = useState(selectedPageOverride || '');
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);

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

  const refW = data?.reference_viewport?.width || 1280;
  const refH = data?.reference_viewport?.height || 800;

  // Group coordinates to show click density
  const points = data?.points || [];
  const clusteredPoints = [];
  const radius = 25;

  points.forEach((p) => {
    const existing = clusteredPoints.find(
      (c) => Math.abs(c.x - p.x) < radius && Math.abs(c.y - p.y) < radius
    );
    if (existing) {
      existing.count += 1;
      existing.elements.push(p.element);
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

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Filter and Info Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Interaction Click Heatmap</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Real click coordinates recorded by the ClickTrace SDK scaled to reference viewport
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Target Page:</span>
            <select
              value={selectedPage}
              onChange={(e) => handlePageChange(e.target.value)}
              className="border border-slate-300 rounded-lg text-xs px-3 py-1.5 bg-white text-slate-800 font-medium outline-none focus:border-blue-500 shadow-sm"
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

          <a
            href={`http://127.0.0.1:8000${selectedPage || '/demo/index.html'}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50"
          >
            Open Live Page <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Heatmap Viewport Canvas */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
          <div className="flex items-center gap-2 font-medium">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Viewport: {refW} &times; {refH} px</span>
            <span>&bull;</span>
            <span className="text-slate-800 font-semibold">{points.length} total clicks recorded</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> 1 click
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> 2-3 clicks
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span> 4+ clicks (Rage Hotspot)
            </span>
          </div>
        </div>

        {/* Viewport Box */}
        <div 
          className="relative w-full bg-slate-900/90 rounded-lg overflow-hidden border border-slate-300 shadow-inner"
          style={{ aspectRatio: `${refW} / ${Math.min(refH, 750)}`, minHeight: '440px' }}
        >
          {/* Subtle simulated page wireframe background */}
          <div className="absolute inset-0 opacity-15 pointer-events-none p-6 flex flex-col justify-between">
            <div className="h-10 bg-white/40 rounded flex items-center px-4 justify-between">
              <div className="w-24 h-4 bg-white/60 rounded"></div>
              <div className="flex gap-3">
                <div className="w-16 h-3 bg-white/50 rounded"></div>
                <div className="w-16 h-3 bg-white/50 rounded"></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-6 my-auto">
              <div className="h-44 bg-white/20 rounded-lg p-4"></div>
              <div className="h-44 bg-white/20 rounded-lg p-4"></div>
              <div className="h-44 bg-white/20 rounded-lg p-4"></div>
            </div>
            <div className="h-12 bg-white/30 rounded flex items-center px-4">
              <div className="w-32 h-3 bg-white/50 rounded"></div>
            </div>
          </div>

          {/* Interactive Click Coordinates Markers */}
          {clusteredPoints.map((pt, idx) => {
            // Scale percentages
            const leftPct = Math.min(Math.max((pt.x / refW) * 100, 2), 98);
            const topPct = Math.min(Math.max((pt.y / refH) * 100, 3), 96);
            const isHotspot = pt.count >= 4;
            const isMedium = pt.count >= 2;

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
                className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125 z-10"
                style={{ left: `${leftPct}%`, top: `${topPct}%` }}
              >
                {/* Radial Glow */}
                <div
                  className={`rounded-full flex items-center justify-center font-bold text-white shadow-lg transition-all ${
                    isHotspot
                      ? 'w-10 h-10 bg-rose-600/90 ring-8 ring-rose-500/30 text-xs animate-pulse'
                      : isMedium
                      ? 'w-8 h-8 bg-amber-500/90 ring-4 ring-amber-400/30 text-[11px]'
                      : 'w-6 h-6 bg-blue-500/90 ring-2 ring-blue-300/30 text-[10px]'
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
              className="absolute z-30 pointer-events-none bg-slate-900 text-white p-3 rounded-lg shadow-xl text-xs border border-slate-700 -translate-x-1/2 -translate-y-full mb-3"
              style={{
                left: `${Math.min(Math.max((hoveredPoint.x / refW) * 100, 10), 90)}%`,
                top: `${Math.max((hoveredPoint.y / refH) * 100 - 4, 12)}%`
              }}
            >
              <div className="font-bold text-amber-300">
                {hoveredPoint.count >= 4 ? '🔥 High Friction Rage Hotspot' : 'Target Element'}
              </div>
              <div className="font-mono text-[11px] text-slate-200 mt-1">
                {hoveredPoint.element || 'Unnamed Element'} ({hoveredPoint.tag || 'tag'})
              </div>
              <div className="text-slate-400 text-[10px] mt-1">
                Coordinates: ({hoveredPoint.x}, {hoveredPoint.y}) &bull; {hoveredPoint.count} clicks
              </div>
            </div>
          )}

          {points.length === 0 && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 text-center p-6">
              <MousePointer className="w-10 h-10 text-slate-500 mb-2" />
              <p className="font-semibold text-sm">No clicks recorded on this page yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Interact with the demo website or trigger a test session from the top header to view coordinates.
              </p>
            </div>
          )}
        </div>

        {/* Heatmap Analysis Insights Table */}
        <div className="mt-6 border-t border-slate-100 pt-5">
          <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">
            Top Clicked Elements On Selected Page
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {clusteredPoints.slice(0, 6).map((item, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-xs flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 truncate max-w-[200px]">
                    {item.element || 'Generic Click'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Coords: ({item.x}, {item.y})
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                  item.count >= 4 ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {item.count} clicks
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
