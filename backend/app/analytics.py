import json
from datetime import datetime
from typing import Dict, List, Any, Optional
from .database import get_db

def parse_iso(ts_str: str) -> float:
    """Parse ISO timestamp or sqlite datetime to epoch seconds."""
    if not ts_str:
        return 0.0
    try:
        # Replace Z with UTC offset if present
        cleaned = ts_str.replace("Z", "+00:00")
        return datetime.fromisoformat(cleaned).timestamp()
    except Exception:
        try:
            return datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S").timestamp()
        except Exception:
            return 0.0

def detect_repeated_clicks(project_id: str) -> List[Dict[str, Any]]:
    """
    Identify cases where the same session clicks the same element
    at least three times within two seconds.
    """
    signals = []
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT session_id, page_url, element_tag, element_id, element_text, created_at, id
            FROM events
            WHERE project_id = ? AND event_type = 'click' AND element_id IS NOT NULL AND element_id != ''
            ORDER BY session_id, created_at ASC, id ASC
        """, (project_id,))
        rows = cursor.fetchall()

    if not rows:
        return signals

    current_session = None
    session_clicks: List[sqlite3.Row] = []

    def evaluate_session_clicks(clicks):
        detected = []
        n = len(clicks)
        if n < 3:
            return detected

        i = 0
        while i < n:
            target_elem = clicks[i]['element_id']
            target_page = clicks[i]['page_url']
            start_time = parse_iso(clicks[i]['created_at'])

            cluster = [clicks[i]]
            j = i + 1
            while j < n:
                next_elem = clicks[j]['element_id']
                next_page = clicks[j]['page_url']
                next_time = parse_iso(clicks[j]['created_at'])

                if next_elem == target_elem and next_page == target_page:
                    if (next_time - start_time) <= 2.0:
                        cluster.append(clicks[j])
                        j += 1
                    else:
                        break
                else:
                    j += 1
                    if (next_time - start_time) > 2.0:
                        break

            if len(cluster) >= 3:
                duration = round(parse_iso(cluster[-1]['created_at']) - start_time, 2)
                detected.append({
                    "session_id": cluster[0]['session_id'],
                    "page_url": target_page,
                    "element_id": target_elem,
                    "element_text": cluster[0]['element_text'] or target_elem,
                    "element_tag": cluster[0]['element_tag'] or 'button',
                    "click_count": len(cluster),
                    "interval_seconds": max(duration, 0.2),
                    "timestamp": cluster[0]['created_at'],
                    "severity": "high" if len(cluster) >= 5 else "medium",
                    "type": "repeated_click_frustration"
                })
                i += len(cluster)
            else:
                i += 1
        return detected

    for row in rows:
        if row['session_id'] != current_session:
            if session_clicks:
                signals.extend(evaluate_session_clicks(session_clicks))
            current_session = row['session_id']
            session_clicks = [row]
        else:
            session_clicks.append(row)

    if session_clicks:
        signals.extend(evaluate_session_clicks(session_clicks))

    return signals

def get_overview_metrics(project_id: str) -> Dict[str, Any]:
    with get_db() as conn:
        cursor = conn.cursor()

        # Sessions count
        cursor.execute("SELECT COUNT(*) as count FROM sessions WHERE project_id = ?", (project_id,))
        total_sessions = cursor.fetchone()['count']

        # Events count and unique pages
        cursor.execute("""
            SELECT 
                COUNT(*) as total_events,
                COUNT(DISTINCT page_url) as unique_pages,
                SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) as total_clicks,
                SUM(CASE WHEN event_type = 'form_start' THEN 1 ELSE 0 END) as forms_started,
                SUM(CASE WHEN event_type = 'form_submit' THEN 1 ELSE 0 END) as form_submits,
                SUM(CASE WHEN event_type = 'conversion' THEN 1 ELSE 0 END) as conversions
            FROM events
            WHERE project_id = ?
        """, (project_id,))
        row = cursor.fetchone()

        total_events = row['total_events'] or 0
        unique_pages = row['unique_pages'] or 0
        total_clicks = row['total_clicks'] or 0
        forms_started = row['forms_started'] or 0
        form_submits = row['form_submits'] or 0
        conversions = row['conversions'] or 0

        # Successful conversions = either conversion events or form_submits if no conversion event
        successful_conversions = conversions if conversions > 0 else form_submits

        # Form abandonment rate
        if forms_started > 0:
            form_abandonment_rate = round(max(0, (forms_started - successful_conversions)) / forms_started * 100, 1)
        else:
            form_abandonment_rate = 0.0

        # Top pages visited
        cursor.execute("""
            SELECT 
                page_url,
                COUNT(*) as event_count,
                COUNT(DISTINCT session_id) as session_count,
                SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) as click_count
            FROM events
            WHERE project_id = ?
            GROUP BY page_url
            ORDER BY session_count DESC, event_count DESC
            LIMIT 6
        """, (project_id,))
        top_pages = [dict(r) for r in cursor.fetchall()]

        # Event distribution by type
        cursor.execute("""
            SELECT event_type, COUNT(*) as count
            FROM events
            WHERE project_id = ?
            GROUP BY event_type
            ORDER BY count DESC
        """, (project_id,))
        event_types = [dict(r) for r in cursor.fetchall()]

        # Activity timeline (by hour or last entries)
        cursor.execute("""
            SELECT 
                substr(created_at, 1, 16) as time_bucket,
                COUNT(*) as event_count,
                COUNT(DISTINCT session_id) as active_sessions
            FROM events
            WHERE project_id = ?
            GROUP BY time_bucket
            ORDER BY time_bucket DESC
            LIMIT 12
        """, (project_id,))
        timeline_rows = [dict(r) for r in cursor.fetchall()]
        timeline_rows.reverse()

    # Friction signals
    friction_signals = detect_repeated_clicks(project_id)
    friction_count = len(friction_signals)

    return {
        "total_sessions": total_sessions,
        "total_events": total_events,
        "unique_pages": unique_pages,
        "total_clicks": total_clicks,
        "forms_started": forms_started,
        "form_submits": form_submits,
        "successful_conversions": successful_conversions,
        "form_abandonment_rate": form_abandonment_rate,
        "friction_signals_count": friction_count,
        "recent_friction_signals": friction_signals[:5],
        "top_pages": top_pages,
        "event_types": event_types,
        "timeline": timeline_rows
    }

def get_sessions_list(project_id: str) -> List[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                s.id as session_id,
                s.started_at,
                s.last_activity_at,
                s.page_count,
                COUNT(e.id) as event_count,
                SUM(CASE WHEN e.event_type = 'click' THEN 1 ELSE 0 END) as click_count,
                SUM(CASE WHEN e.event_type = 'conversion' OR e.event_type = 'form_submit' THEN 1 ELSE 0 END) as converted
            FROM sessions s
            LEFT JOIN events e ON s.id = e.session_id
            WHERE s.project_id = ?
            GROUP BY s.id
            ORDER BY s.last_activity_at DESC
        """, (project_id,))
        sessions = [dict(r) for r in cursor.fetchall()]

    # Check which sessions have friction
    all_friction = detect_repeated_clicks(project_id)
    friction_session_ids = {f['session_id']: f for f in all_friction}

    for s in sessions:
        start_ts = parse_iso(s['started_at'])
        end_ts = parse_iso(s['last_activity_at'])
        duration = max(0, int(end_ts - start_ts))
        s['duration_seconds'] = duration
        s['has_friction'] = s['session_id'] in friction_session_ids
        s['friction_details'] = friction_session_ids.get(s['session_id'])

    return sessions

def get_session_journey(project_id: str, session_id: str) -> Dict[str, Any]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT *
            FROM sessions
            WHERE id = ? AND project_id = ?
        """, (session_id, project_id))
        session_row = cursor.fetchone()

        if not session_row:
            return {"error": "Session not found"}

        cursor.execute("""
            SELECT 
                id, event_type, page_url, element_tag, element_id, element_text,
                click_x, click_y, viewport_width, viewport_height, scroll_depth,
                metadata_json, created_at
            FROM events
            WHERE session_id = ? AND project_id = ?
            ORDER BY created_at ASC, id ASC
        """, (session_id, project_id))
        events = [dict(r) for r in cursor.fetchall()]

    # Reconstruct human-readable narrative journey steps
    journey_steps = []
    current_page = None

    for evt in events:
        step_type = evt['event_type']
        page = evt['page_url']
        
        # Check if page changed
        if page != current_page:
            current_page = page
            journey_steps.append({
                "type": "page_transition",
                "label": f"Navigated to {page}",
                "page_url": page,
                "timestamp": evt['created_at'],
                "icon": "navigation"
            })

        if step_type == 'click':
            journey_steps.append({
                "type": "click",
                "label": f"Clicked '{evt['element_text'] or evt['element_id'] or evt['element_tag']}'",
                "page_url": page,
                "element_id": evt['element_id'],
                "coordinates": f"({evt['click_x']}, {evt['click_y']})" if evt['click_x'] is not None else None,
                "timestamp": evt['created_at'],
                "icon": "mouse-pointer"
            })
        elif step_type == 'scroll':
            journey_steps.append({
                "type": "scroll",
                "label": f"Scrolled to {evt['scroll_depth']}% depth",
                "page_url": page,
                "scroll_depth": evt['scroll_depth'],
                "timestamp": evt['created_at'],
                "icon": "arrow-down"
            })
        elif step_type == 'form_start':
            journey_steps.append({
                "type": "form_start",
                "label": f"Started interacting with form '{evt['element_id']}'",
                "page_url": page,
                "timestamp": evt['created_at'],
                "icon": "edit-3"
            })
        elif step_type == 'form_submit':
            journey_steps.append({
                "type": "form_submit",
                "label": f"Submitted form '{evt['element_id']}'",
                "page_url": page,
                "timestamp": evt['created_at'],
                "icon": "check-circle"
            })
        elif step_type == 'conversion':
            journey_steps.append({
                "type": "conversion",
                "label": "Completed Conversion Goal",
                "page_url": page,
                "timestamp": evt['created_at'],
                "icon": "award"
            })

    # Detect friction specifically for this session
    session_friction = [
        f for f in detect_repeated_clicks(project_id)
        if f['session_id'] == session_id
    ]

    return {
        "session": dict(session_row),
        "total_events": len(events),
        "friction_signals": session_friction,
        "journey_steps": journey_steps,
        "raw_events": events
    }

def get_heatmap_data(project_id: str, page_url: Optional[str] = None) -> Dict[str, Any]:
    with get_db() as conn:
        cursor = conn.cursor()

        # Find available pages with clicks
        cursor.execute("""
            SELECT page_url, COUNT(*) as click_count
            FROM events
            WHERE project_id = ? AND event_type = 'click' AND click_x IS NOT NULL
            GROUP BY page_url
            ORDER BY click_count DESC
        """, (project_id,))
        available_pages = [dict(r) for r in cursor.fetchall()]

        selected_page = page_url
        if not selected_page and available_pages:
            selected_page = available_pages[0]['page_url']

        points = []
        reference_viewport = {"width": 1280, "height": 800}

        if selected_page:
            cursor.execute("""
                SELECT 
                    id, click_x, click_y, viewport_width, viewport_height, 
                    element_tag, element_id, element_text, created_at
                FROM events
                WHERE project_id = ? AND event_type = 'click' AND page_url = ? AND click_x IS NOT NULL
                ORDER BY created_at DESC
                LIMIT 500
            """, (project_id, selected_page))
            raw_points = [dict(r) for r in cursor.fetchall()]

            # Determine dominant viewport
            widths = [p['viewport_width'] for p in raw_points if p['viewport_width']]
            heights = [p['viewport_height'] for p in raw_points if p['viewport_height']]
            if widths and heights:
                reference_viewport["width"] = max(widths)
                reference_viewport["height"] = max(heights)

            # Group clustered clicks for frequency visual
            for p in raw_points:
                points.append({
                    "x": p['click_x'],
                    "y": p['click_y'],
                    "element": p['element_text'] or p['element_id'] or p['element_tag'],
                    "tag": p['element_tag'],
                    "timestamp": p['created_at']
                })

        return {
            "selected_page": selected_page,
            "available_pages": available_pages,
            "total_clicks": len(points),
            "reference_viewport": reference_viewport,
            "points": points
        }

def get_conversion_funnel(project_id: str) -> Dict[str, Any]:
    """
    Funnel:
    1. Visited Landing Page ('/demo/index.html' or '/')
    2. Visited Course/Registration Page ('/demo/courses.html' or '/demo/register.html')
    3. Started Form ('form_start')
    4. Completed Form / Conversion ('form_submit' or 'conversion')
    """
    with get_db() as conn:
        cursor = conn.cursor()

        # Distinct sessions at each stage
        # Stage 1: Any session landing on home/index
        cursor.execute("""
            SELECT DISTINCT session_id FROM events
            WHERE project_id = ? AND (page_url LIKE '%index%' OR page_url = '/' OR page_url LIKE '%demo%')
        """, (project_id,))
        s1 = {r['session_id'] for r in cursor.fetchall()}

        # Stage 2: Navigated to catalog or registration
        cursor.execute("""
            SELECT DISTINCT session_id FROM events
            WHERE project_id = ? AND (page_url LIKE '%course%' OR page_url LIKE '%register%')
        """, (project_id,))
        s2 = {r['session_id'] for r in cursor.fetchall()}

        # Stage 3: Form started
        cursor.execute("""
            SELECT DISTINCT session_id FROM events
            WHERE project_id = ? AND event_type = 'form_start'
        """, (project_id,))
        s3 = {r['session_id'] for r in cursor.fetchall()}

        # Stage 4: Form submitted or conversion
        cursor.execute("""
            SELECT DISTINCT session_id FROM events
            WHERE project_id = ? AND (event_type = 'form_submit' OR event_type = 'conversion')
        """, (project_id,))
        s4 = {r['session_id'] for r in cursor.fetchall()}

    c1 = len(s1)
    c2 = len(s1.intersection(s2)) if s1 else len(s2)
    c3 = len(s1.intersection(s2).intersection(s3)) if (s1 and s2) else len(s3)
    c4 = len(s1.intersection(s2).intersection(s3).intersection(s4)) if (s1 and s2 and s3) else len(s4)

    # In case user enters directly into registration
    if c1 == 0 and (c2 > 0 or c3 > 0 or c4 > 0):
        c1 = max(len(s2), len(s3), len(s4))

    stages = [
        {"name": "1. Landing Page Visit", "count": c1, "pct": 100.0 if c1 > 0 else 0.0},
        {"name": "2. Course & Registration Pages", "count": c2, "pct": round((c2 / c1 * 100), 1) if c1 > 0 else 0.0},
        {"name": "3. Form Interaction Started", "count": c3, "pct": round((c3 / c1 * 100), 1) if c1 > 0 else 0.0},
        {"name": "4. Application Submitted", "count": c4, "pct": round((c4 / c1 * 100), 1) if c1 > 0 else 0.0}
    ]

    return {
        "stages": stages,
        "overall_conversion_rate": stages[-1]["pct"] if c1 > 0 else 0.0,
        "total_funnel_entries": c1
    }

def get_scroll_analytics(project_id: str) -> Dict[str, Any]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                page_url,
                scroll_depth,
                COUNT(DISTINCT session_id) as session_count
            FROM events
            WHERE project_id = ? AND event_type = 'scroll' AND scroll_depth IS NOT NULL
            GROUP BY page_url, scroll_depth
            ORDER BY page_url, scroll_depth ASC
        """, (project_id,))
        rows = [dict(r) for r in cursor.fetchall()]

    data_by_page = {}
    for r in rows:
        p = r['page_url']
        if p not in data_by_page:
            data_by_page[p] = {"25%": 0, "50%": 0, "75%": 0, "100%": 0}
        depth_key = f"{r['scroll_depth']}%"
        data_by_page[p][depth_key] = r['session_count']

    return {"pages": data_by_page}
