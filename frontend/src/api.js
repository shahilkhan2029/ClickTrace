const API_BASE = "http://127.0.0.1:8000";

export async function fetchJson(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorBody.detail || errorBody.error || `HTTP error ${res.status}`);
  }
  return res.json();
}

export const api = {
  getHealth: () => fetchJson("/api/health"),
  getProjects: () => fetchJson("/api/projects"),
  getOverview: (projectId = "nexus-college") => fetchJson(`/api/analytics/overview?project_id=${projectId}`),
  getSessions: (projectId = "nexus-college") => fetchJson(`/api/sessions?project_id=${projectId}`),
  getSessionDetail: (sessionId, projectId = "nexus-college") => fetchJson(`/api/sessions/${sessionId}?project_id=${projectId}`),
  getHeatmap: (projectId = "nexus-college", pageUrl = "") => {
    const query = pageUrl ? `&page_url=${encodeURIComponent(pageUrl)}` : "";
    return fetchJson(`/api/analytics/heatmap?project_id=${projectId}${query}`);
  },
  getFunnel: (projectId = "nexus-college") => fetchJson(`/api/analytics/funnel?project_id=${projectId}`),
  getIssues: (projectId = "nexus-college") => fetchJson(`/api/analytics/issues?project_id=${projectId}`),
  getAiStatus: () => fetchJson("/api/ai/status"),
  getLatestAiReport: (projectId = "nexus-college") => fetchJson(`/api/ai/reports/latest?project_id=${projectId}`),
  runAiAnalysis: (projectId = "nexus-college") => fetchJson("/api/ai/analyze", {
    method: "POST",
    body: JSON.stringify({ project_id: projectId, limit_sessions: 30 })
  }),
  simulateJourney: (scenario, projectId = "nexus-college") => fetchJson("/api/simulate", {
    method: "POST",
    body: JSON.stringify({ project_id: projectId, scenario })
  }),
  resetAnalytics: (projectId = "nexus-college") => fetchJson(`/api/analytics/reset?project_id=${projectId}`, {
    method: "POST"
  })
};
