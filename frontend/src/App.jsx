import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast from './components/Toast';
import ChatBot from './components/ChatBot';
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
  const [toast, setToast] = useState(null);
  const [dataVersion, setDataVersion] = useState(0);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

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

  const handleClearData = async () => {
    try {
      setLoading(true);
      await api.resetAnalytics('nexus-college');
      try {
        window.sessionStorage.removeItem('clicktrace_session_id');
      } catch (e) {}
      setDataVersion(prev => prev + 1);
      await loadData();
      showToast("All telemetry data cleared! The dashboard is 100% fresh for your demo.", "success");
    } catch (err) {
      console.error("Reset error:", err);
      showToast("Failed to clear data: " + err.message, "error");
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
        return { 
          title: 'Executive UX Intelligence', 
          subtitle: 'Real-time visitor telemetry, behavior trends, and drop-off analytics' 
        };
      case 'heatmaps':
        return { 
          title: 'Click Heatmaps & Spatial Density', 
          subtitle: 'Precise viewport coordinates and click frequency distribution' 
        };
      case 'sessions':
        return { 
          title: 'User Sessions & Journey Flow', 
          subtitle: 'Reconstructed chronologies of navigation, interactions, and conversions' 
        };
      case 'issues':
        return { 
          title: 'UX Friction & Rage Clicks', 
          subtitle: 'Algorithmic identification of obstacles, rage clicks, and form drop-offs' 
        };
      case 'ai':
        return { 
          title: 'Gemma AI UX Analyst', 
          subtitle: 'Local LLM diagnosis of behavioral interaction patterns and recommendations' 
        };
      case 'settings':
        return { 
          title: 'Project Settings & Integration', 
          subtitle: 'Tracking SDK snippet, privacy protections, and database telemetry controls' 
        };
      default:
        return { 
          title: 'ClickTrace', 
          subtitle: 'AI-Powered Website UX Intelligence' 
        };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <div className="flex h-screen bg-slate-50/70 overflow-hidden font-sans antialiased text-slate-800">
      {/* Toast Notification Container */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Fixed Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        health={health} 
        issuesCount={overview?.friction_signals_count || 0}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header 
          title={title} 
          subtitle={subtitle} 
          onRefresh={loadData} 
          onClearData={handleClearData}
          loading={loading} 
          showToast={showToast}
        />

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && (
            <Overview 
              key={`overview-${dataVersion}`}
              overview={overview} 
              funnel={funnel} 
              onNavigate={handleNavigate} 
              onRefresh={loadData}
              showToast={showToast}
            />
          )}

          {activeTab === 'heatmaps' && (
            <Heatmaps 
              key={`heatmaps-${dataVersion}`}
              selectedPageOverride={heatmapPageOverride} 
              showToast={showToast}
              onRefresh={loadData}
            />
          )}

          {activeTab === 'sessions' && (
            <Sessions 
              key={`sessions-${dataVersion}`}
              showToast={showToast}
            />
          )}

          {activeTab === 'issues' && (
            <UxIssues 
              key={`issues-${dataVersion}`}
              onNavigate={handleNavigate} 
              showToast={showToast}
            />
          )}

          {activeTab === 'ai' && (
            <AiAnalysis 
              key={`ai-${dataVersion}`}
              showToast={showToast}
            />
          )}

          {activeTab === 'settings' && (
            <Settings 
              key={`settings-${dataVersion}`}
              overview={overview}
              health={health}
              onResetData={handleClearData}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Floating Local AI UX Copilot Chatbot */}
      <ChatBot projectId="nexus-college" />
    </div>
  );
}
