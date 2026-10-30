import os
import json
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .database import init_db, get_db
from .schemas import EventBatch, ProjectCreate, ProjectResponse, AIAnalysisRequest, SimulateJourneyRequest
from .analytics import (
    get_overview_metrics,
    get_sessions_list,
    get_session_journey,
    get_heatmap_data,
    get_conversion_funnel,
    detect_repeated_clicks,
    get_scroll_analytics
)
from .ai_analyst import check_ollama_status, analyze_ux_with_gemma, get_latest_ai_report

app = FastAPI(
    title="ClickTrace API",
    description="AI-Powered Website UX Intelligence Platform",
    version="1.0.0"
)

# CORS middleware for SDK and Dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SDK_PATH = os.path.join(BASE_DIR, "static", "sdk", "clicktrace.js")
DEMO_DIR = os.path.join(os.path.dirname(BASE_DIR), "demo-site")

# Mount demo site if directory exists
if os.path.exists(DEMO_DIR):
    app.mount("/demo", StaticFiles(directory=DEMO_DIR, html=True), name="demo")

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/api/health")
async def health_check():
    db_ok = False
    try:
        with get_db() as conn:
            conn.execute("SELECT 1")
            db_ok = True
    except Exception:
        db_ok = False

    ollama_info = await check_ollama_status()

    return {
        "status": "healthy" if db_ok else "unhealthy",
        "database": "connected" if db_ok else "disconnected",
        "ollama": ollama_info,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

@app.get("/sdk/clicktrace.js")
def serve_sdk():
    if not os.path.exists(SDK_PATH):
        raise HTTPException(status_code=404, detail="SDK script not found")
    return FileResponse(
        SDK_PATH,
        media_type="application/javascript",
        headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
    )

@app.post("/api/events")
def track_events(batch: EventBatch):
    if not batch.events:
        return {"status": "ok", "inserted": 0}

    project_id = batch.project_id
    now_iso = datetime.utcnow().isoformat() + "Z"

    with get_db() as conn:
        cursor = conn.cursor()

        # Track session activity
        sessions_touched = {}

        for evt in batch.events:
            ts = evt.timestamp or now_iso
            sess_id = evt.session_id
            page = evt.page_url

            if sess_id not in sessions_touched:
                sessions_touched[sess_id] = {
                    "first_seen": ts,
                    "last_seen": ts,
                    "pages": set([page])
                }
            else:
                sessions_touched[sess_id]["last_seen"] = max(sessions_touched[sess_id]["last_seen"], ts)
                sessions_touched[sess_id]["pages"].add(page)

            cursor.execute("""
                INSERT INTO events (
                    project_id, session_id, event_type, page_url,
                    element_tag, element_id, element_text,
                    click_x, click_y, viewport_width, viewport_height,
                    scroll_depth, metadata_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                project_id,
                sess_id,
                evt.event_type,
                page,
                evt.element_tag,
                evt.element_id,
                evt.element_text,
                evt.click_x,
                evt.click_y,
                evt.viewport_width,
                evt.viewport_height,
                evt.scroll_depth,
                evt.metadata_json,
                ts
            ))

        # Upsert sessions
        for sid, sdata in sessions_touched.items():
            cursor.execute("""
                INSERT INTO sessions (id, project_id, started_at, last_activity_at, page_count)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    last_activity_at = excluded.last_activity_at,
                    page_count = sessions.page_count + ?
            """, (sid, project_id, sdata["first_seen"], sdata["last_seen"], len(sdata["pages"]), len(sdata["pages"])))

    return {"status": "ok", "inserted": len(batch.events)}

@app.get("/api/projects")
def list_projects():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, website_url, created_at FROM projects ORDER BY created_at DESC")
        return [dict(r) for r in cursor.fetchall()]

@app.post("/api/projects")
def create_project(proj: ProjectCreate):
    with get_db() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO projects (id, name, website_url, created_at)
                VALUES (?, ?, ?, datetime('now'))
            """, (proj.id, proj.name, proj.website_url))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Project already exists or invalid: {str(e)}")
    return {"status": "created", "id": proj.id}

@app.get("/api/analytics/overview")
def overview_analytics(project_id: str = "nexus-college"):
    return get_overview_metrics(project_id)

@app.get("/api/sessions")
def list_sessions(project_id: str = "nexus-college"):
    return get_sessions_list(project_id)

@app.get("/api/sessions/{session_id}")
def session_detail(session_id: str, project_id: str = "nexus-college"):
    res = get_session_journey(project_id, session_id)
    if "error" in res:
        raise HTTPException(status_code=404, detail=res["error"])
    return res

@app.get("/api/analytics/heatmap")
def heatmap_analytics(project_id: str = "nexus-college", page_url: Optional[str] = None):
    return get_heatmap_data(project_id, page_url)

@app.get("/api/analytics/funnel")
def funnel_analytics(project_id: str = "nexus-college"):
    return get_conversion_funnel(project_id)

@app.get("/api/analytics/issues")
def ux_issues_list(project_id: str = "nexus-college"):
    repeated_clicks = detect_repeated_clicks(project_id)
    funnel = get_conversion_funnel(project_id)
    overview = get_overview_metrics(project_id)

    issues = []
    # Add repeated click rage signals
    for idx, rc in enumerate(repeated_clicks):
        issues.append({
            "id": f"issue_rage_{idx+1}",
            "type": "Repeated Clicks (Rage Clicks)",
            "severity": rc["severity"],
            "element_id": rc["element_id"],
            "element_text": rc["element_text"],
            "page_url": rc["page_url"],
            "metrics": f"{rc['click_count']} rapid clicks within {rc['interval_seconds']}s",
            "session_id": rc["session_id"],
            "timestamp": rc["timestamp"],
            "suggested_fix": f"Check responsiveness and hover/loading states for {rc['element_id']}"
        })

    # Add form abandonment signal if high
    if overview["form_abandonment_rate"] > 30 and overview["forms_started"] >= 2:
        issues.append({
            "id": "issue_form_abandon",
            "type": "High Form Drop-Off",
            "severity": "high" if overview["form_abandonment_rate"] > 60 else "medium",
            "element_id": "registration_form",
            "element_text": "Enrollment Application Form",
            "page_url": "/demo/register.html",
            "metrics": f"{overview['form_abandonment_rate']}% abandonment rate ({overview['forms_started']} started, {overview['successful_conversions']} completed)",
            "session_id": "Aggregated",
            "timestamp": datetime.utcnow().isoformat(),
            "suggested_fix": "Streamline input requirements and clarify required checkboxes or validation notices"
        })

    return issues

@app.get("/api/ai/status")
async def ai_status():
    return await check_ollama_status()

@app.get("/api/ai/reports/latest")
def latest_ai_report(project_id: str = "nexus-college"):
    rep = get_latest_ai_report(project_id)
    return rep or {"status": "no_reports"}

@app.post("/api/ai/analyze")
async def run_ai_analysis(req: AIAnalysisRequest):
    result = await analyze_ux_with_gemma(req.project_id, req.limit_sessions)
    return result

@app.post("/api/simulate")
def simulate_journey(req: SimulateJourneyRequest):
    """
    Simulates a realistic visitor session for testing/evaluation.
    Clearly marked as simulated in metadata.
    Scenarios:
    1. 'frustrated_registration': user visits landing, goes to register, fills form, gets stuck on confusing button, clicks 4 times rapidly, abandons.
    2. 'smooth_conversion': user lands, reads courses, registers, submits successfully.
    3. 'bounced_landing': lands on index, scrolls 25%, leaves.
    """
    import random
    import time
    ts = datetime.utcnow()
    sess_id = f"sim_{req.scenario}_{int(ts.timestamp())}_{random.randint(100, 999)}"
    pid = req.project_id
    sim_meta = json.dumps({"is_simulated": True, "scenario": req.scenario})

    events = []
    base_time = ts.timestamp() - 60  # 1 min ago

    def iso(offset_sec):
        return datetime.fromtimestamp(base_time + offset_sec).isoformat() + "Z"

    if req.scenario == "frustrated_registration":
        events = [
            ("navigation", "/demo/index.html", "window", "page_load", "Nexus College - Home", None, None, 1280, 800, None, 0),
            ("scroll", "/demo/index.html", "window", "scroll_50pct", None, None, None, 1280, 800, 50, 4),
            ("click", "/demo/index.html", "a", "btn_apply_hero", "Apply for Fall 2026", 420, 310, 1280, 800, None, 8),
            ("navigation", "/demo/register.html", "window", "page_load", "Fall 2026 Registration", None, None, 1280, 800, None, 10),
            ("form_start", "/demo/register.html", "form", "registration_form", "Form interaction initiated", None, None, 1280, 800, None, 15),
            ("click", "/demo/register.html", "input", "input_fullname", "John Doe", 380, 240, 1280, 800, None, 18),
            ("click", "/demo/register.html", "select", "select_major", "Computer Science", 380, 320, 1280, 800, None, 24),
            # Rage click sequence on tricky submit button (4 clicks within 1.2s)
            ("click", "/demo/register.html", "button", "btn_submit_confusing", "Submit Application", 450, 560, 1280, 800, None, 30.0),
            ("click", "/demo/register.html", "button", "btn_submit_confusing", "Submit Application", 450, 560, 1280, 800, None, 30.3),
            ("click", "/demo/register.html", "button", "btn_submit_confusing", "Submit Application", 451, 561, 1280, 800, None, 30.7),
            ("click", "/demo/register.html", "button", "btn_submit_confusing", "Submit Application", 450, 560, 1280, 800, None, 31.1),
        ]
    elif req.scenario == "smooth_conversion":
        events = [
            ("navigation", "/demo/index.html", "window", "page_load", "Nexus College - Home", None, None, 1280, 800, None, 0),
            ("click", "/demo/index.html", "a", "nav_courses", "View Courses", 600, 40, 1280, 800, None, 5),
            ("navigation", "/demo/courses.html", "window", "page_load", "Available Courses - Nexus", None, None, 1280, 800, None, 7),
            ("scroll", "/demo/courses.html", "window", "scroll_75pct", None, None, None, 1280, 800, 75, 12),
            ("click", "/demo/courses.html", "a", "btn_enroll_cs", "Enroll Now", 850, 430, 1280, 800, None, 18),
            ("navigation", "/demo/register.html", "window", "page_load", "Fall 2026 Registration", None, None, 1280, 800, None, 20),
            ("form_start", "/demo/register.html", "form", "registration_form", "Form interaction initiated", None, None, 1280, 800, None, 23),
            ("form_submit", "/demo/register.html", "form", "registration_form", "Form submission attempt", 450, 560, 1280, 800, None, 40),
            ("conversion", "/demo/register.html", "conversion", "application_confirmed", "Successful conversion reached", None, None, 1280, 800, None, 41),
        ]
    else:  # bounced_landing
        events = [
            ("navigation", "/demo/index.html", "window", "page_load", "Nexus College - Home", None, None, 1280, 800, None, 0),
            ("scroll", "/demo/index.html", "window", "scroll_25pct", None, None, None, 1280, 800, 25, 3),
            ("click", "/demo/index.html", "div", "hero_banner", "Banner Area", 500, 200, 1280, 800, None, 5),
        ]

    with get_db() as conn:
        cursor = conn.cursor()
        pages = set()
        first_ts = iso(events[0][-1])
        last_ts = iso(events[-1][-1])

        for ev in events:
            etype, page, etag, eid, etext, cx, cy, vw, vh, sd, offset = ev
            pages.add(page)
            cursor.execute("""
                INSERT INTO events (
                    project_id, session_id, event_type, page_url,
                    element_tag, element_id, element_text,
                    click_x, click_y, viewport_width, viewport_height,
                    scroll_depth, metadata_json, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                pid, sess_id, etype, page, etag, eid, etext,
                cx, cy, vw, vh, sd, sim_meta, iso(offset)
            ))

        cursor.execute("""
            INSERT INTO sessions (id, project_id, started_at, last_activity_at, page_count)
            VALUES (?, ?, ?, ?, ?)
        """, (sess_id, pid, first_ts, last_ts, len(pages)))

    return {
        "status": "success",
        "session_id": sess_id,
        "scenario": req.scenario,
        "events_created": len(events)
    }
