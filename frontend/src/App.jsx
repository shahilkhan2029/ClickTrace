import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Overview from './pages/Overview';
import Heatmaps from './pages/Heatmaps';
import Sessions from './pages/Sessions';
import UxIssues from './pages/UxIssues';
import AiAnalysis from './pages/AiAnalysis';
import Settings from './pages/Settings';
import { api } from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [heatmapPageOverride, setHeatmapPageOverride] = useState('');
  const [health, setHealth] = useState(null);
  const [overview, setOverview] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [h, ov, fn] = await Promise.all([
        api.getHealth().catch(() => null),
        api.getOverview('nexus-college').catch(() => null),
        api.getFunnel('nexus-college').catch(() => null)
      ]);
      setHealth(h);
      setOverview(ov);
      setFunnel(fn);
    } catch (e) {
      console.error("Data refresh failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // 10s auto refresh for live events
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = (tab, pageUrl = '') => {
    setActiveTab(tab);
    if (pageUrl) {
      setHeatmapPageOverride(pageUrl);
    }
  };

  const getPageInfo = () => {
    switch (activeTab) {
      case 'overview':
        return { title: 'Executive UX Intelligence', subtitle: 'Real-time visitor interactions and behavioral metrics' };
      case 'heatmaps':
        return { title: 'Click Heatmaps & Spatial Density', subtitle: 'Precise viewport coordinates and click frequency distribution' };
      case 'sessions':
        return { title: 'User Sessions & Journey Flow', subtitle: 'Reconstructed chronologies of navigation, interactions, and conversions' };
      case 'issues':
        return { title: 'UX Friction & Rage Clicks', subtitle: 'Algorithmic identification of obstacles, rage clicks, and form drop-offs' };
      case 'ai':
        return { title: 'Gemma AI UX Analyst', subtitle: 'Local LLM diagnosis of behavioral interaction patterns and recommendations' };
      case 'settings':
        return { title: 'Project Settings & Integration', subtitle: 'Tracking SDK snippet, privacy protections, and database metadata' };
      default:
        return { title: 'ClickTrace', subtitle: 'AI-Powered Website UX Intelligence' };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Fixed Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        health={health} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header 
          title={title} 
          subtitle={subtitle} 
          onRefresh={loadData} 
          loading={loading} 
        />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <Overview 
              overview={overview} 
              funnel={funnel} 
              onNavigate={handleNavigate} 
            />
          )}

          {activeTab === 'heatmaps' && (
            <Heatmaps 
              selectedPageOverride={heatmapPageOverride} 
            />
          )}

          {activeTab === 'sessions' && (
            <Sessions />
          )}

          {activeTab === 'issues' && (
            <UxIssues 
              onNavigate={handleNavigate} 
            />
          )}

          {activeTab === 'ai' && (
            <AiAnalysis />
          )}

          {activeTab === 'settings' && (
            <Settings />
          )}
        </main>
      </div>
    </div>
  );
}
