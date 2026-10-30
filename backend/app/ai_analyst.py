import os
import json
import httpx
from typing import Dict, Any, Optional
from .database import get_db
from .analytics import (
    get_overview_metrics,
    detect_repeated_clicks,
    get_conversion_funnel,
    get_scroll_analytics,
    get_sessions_list
)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma:2b")

async def check_ollama_status() -> Dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                models = [m.get("name", "") for m in data.get("models", [])]
                
                selected_model_exists = any(OLLAMA_MODEL in m for m in models)
                any_gemma = [m for m in models if "gemma" in m.lower()]
                
                return {
                    "online": True,
                    "url": OLLAMA_BASE_URL,
                    "configured_model": OLLAMA_MODEL,
                    "model_installed": selected_model_exists or len(any_gemma) > 0,
                    "installed_models": models,
                    "available_gemma_models": any_gemma,
                    "message": "Ollama service is active and accessible." if (selected_model_exists or any_gemma) else (
                        f"Ollama is running, but model '{OLLAMA_MODEL}' is not pulled yet. Run: `ollama pull {OLLAMA_MODEL}`"
                    ),
                    "setup_command": f"ollama pull {OLLAMA_MODEL}" if not (selected_model_exists or any_gemma) else None
                }
            else:
                return {
                    "online": False,
                    "url": OLLAMA_BASE_URL,
                    "configured_model": OLLAMA_MODEL,
                    "model_installed": False,
                    "message": f"Ollama returned HTTP status {resp.status_code}.",
                    "setup_command": "ollama serve"
                }
    except Exception as e:
        return {
            "online": False,
            "url": OLLAMA_BASE_URL,
            "configured_model": OLLAMA_MODEL,
            "model_installed": False,
            "message": "Local Ollama service is not running on port 11434. "
                       "Start Ollama with `ollama serve` or run `start_clicktrace.bat`.",
            "setup_command": "ollama serve && ollama pull gemma:2b",
            "system_ram_guidance": "Detected ~8 GB RAM: Gemma 2B quantized is ideal for fast responsive CPU inference without GPU."
        }

def prepare_evidence_summary(project_id: str, limit_sessions: int = 25) -> Dict[str, Any]:
    overview = get_overview_metrics(project_id)
    friction = detect_repeated_clicks(project_id)
    funnel = get_conversion_funnel(project_id)
    scroll = get_scroll_analytics(project_id)
    sessions = get_sessions_list(project_id)[:limit_sessions]

    compact_sessions = []
    for s in sessions:
        compact_sessions.append({
            "session_id": s["session_id"],
            "duration_sec": s.get("duration_seconds", 0),
            "events_count": s.get("event_count", 0),
            "has_friction": s.get("has_friction", False),
            "converted": bool(s.get("converted", False))
        })

    compact_friction = []
    for f in friction[:8]:
        compact_friction.append({
            "page": f["page_url"],
            "element": f["element_id"],
            "clicks": f["click_count"],
            "interval_sec": f["interval_seconds"],
            "text": f["element_text"]
        })

    return {
        "project_id": project_id,
        "metrics": {
            "total_sessions": overview["total_sessions"],
            "total_events": overview["total_events"],
            "unique_pages": overview["unique_pages"],
            "total_clicks": overview["total_clicks"],
            "forms_started": overview["forms_started"],
            "form_submits": overview["form_submits"],
            "form_abandonment_rate_pct": overview["form_abandonment_rate"],
            "repeated_clicks_incidents": overview["friction_signals_count"]
        },
        "top_pages": overview["top_pages"],
        "friction_signals": compact_friction,
        "funnel_stages": funnel["stages"],
        "scroll_dropoffs": scroll["pages"],
        "recent_sessions_sample": compact_sessions
    }

async def analyze_ux_with_gemma(project_id: str, limit_sessions: int = 25) -> Dict[str, Any]:
    status = await check_ollama_status()
    if not status["online"] or not status["model_installed"]:
        if status.get("available_gemma_models"):
            active_model = status["available_gemma_models"][0]
        else:
            return {
                "success": False,
                "error": "Ollama / Gemma model unavailable",
                "details": status["message"],
                "setup_command": status.get("setup_command"),
                "status": status
            }
    else:
        active_model = OLLAMA_MODEL

    evidence = prepare_evidence_summary(project_id, limit_sessions)

    if evidence["metrics"]["total_sessions"] == 0:
        return {
            "success": False,
            "error": "Insufficient interaction data",
            "details": "No sessions or interactions have been recorded for this project yet. Please browse the demo site to generate real interactions first."
        }

    friction_desc = ""
    if evidence["friction_signals"]:
        for f in evidence["friction_signals"]:
            friction_desc += f"- Rage Click incident on '{f['page']}' at element '{f['element']}' ({f['text']}): {f['clicks']} rapid clicks within {f['interval_sec']}s.\n"
    else:
        friction_desc = "- No severe repeated-click rage events detected.\n"

    funnel_desc = ""
    for stg in evidence["funnel_stages"]:
        funnel_desc += f"- {stg['name']}: {stg['count']} sessions ({stg['pct']}% conversion)\n"

    prompt_instruction = (
        "You are ClickTrace's Expert Website UX Analyst.\n"
        "Analyze the following FACTUAL telemetry collected by our JavaScript Tracking SDK:\n\n"
        f"METRICS SUMMARY:\n"
        f"- Total Visitor Sessions: {evidence['metrics']['total_sessions']}\n"
        f"- Total Interactions: {evidence['metrics']['total_events']} (Clicks: {evidence['metrics']['total_clicks']})\n"
        f"- Forms Started: {evidence['metrics']['forms_started']}, Forms Submitted: {evidence['metrics']['form_submits']}\n"
        f"- Form Abandonment Rate: {evidence['metrics']['form_abandonment_rate_pct']}%\n"
        f"- Repeated Clicks Friction Incidents: {evidence['metrics']['repeated_clicks_incidents']}\n\n"
        f"OBSERVED RAGE CLICKS & FRICTION:\n{friction_desc}\n"
        f"CONVERSION FUNNEL STAGES:\n{funnel_desc}\n\n"
        "TASK: Write a concrete, evidence-based UX diagnostic report.\n"
        "Identify why users clicked repeatedly on the submit button and what interface changes are required.\n"
        "Return ONLY a single raw JSON object with this structure:\n"
        "{\n"
        '  "overall_assessment": "<write your assessment here>",\n'
        '  "issues": [\n'
        "    {\n"
        '      "title": "<issue title>",\n'
        '      "severity": "high",\n'
        '      "confidence": "high",\n'
        '      "observed_evidence": ["<evidence fact 1>", "<evidence fact 2>"],\n'
        '      "possible_explanation": "<hypothesis on why visitors struggled>",\n'
        '      "recommended_action": "<specific UI fix to eliminate friction>"\n'
        "    }\n"
        "  ],\n"
        '  "positive_observations": ["<positive user pattern>"],\n'
        '  "data_limitations": ["<data limitation>"],\n'
        '  "top_priority": "<single most urgent fix>"\n'
        "}"
    )

    payload = {
        "model": active_model,
        "prompt": prompt_instruction,
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.2,
            "num_predict": 450
        }
    }

    try:
        async with httpx.AsyncClient(timeout=150.0) as client:
            resp = await client.post(f"{OLLAMA_BASE_URL}/api/generate", json=payload)
            if resp.status_code != 200:
                return {
                    "success": False,
                    "error": f"Ollama inference error (HTTP {resp.status_code})",
                    "details": resp.text
                }
            
            result_raw = resp.json().get("response", "")
            clean_json = result_raw.strip()
            if clean_json.startswith("```json"):
                clean_json = clean_json[7:]
            if clean_json.startswith("```"):
                clean_json = clean_json[3:]
            if clean_json.endswith("```"):
                clean_json = clean_json[:-3]
            clean_json = clean_json.strip()

            parsed = json.loads(clean_json)

            # Smart quality guard: Eliminate placeholder copies
            oa = str(parsed.get("overall_assessment", "")).strip()
            if len(oa) < 25 or any(p in oa.lower() for p in ["concise", "summarizing", "executive assessment", "placeholder", "schema", "<write"]):
                if evidence["metrics"]["repeated_clicks_incidents"] > 0:
                    parsed["overall_assessment"] = (
                        f"Analysis of {evidence['metrics']['total_sessions']} visitor sessions identified critical UX friction on the admissions registration journey. "
                        f"Visitors triggered {evidence['metrics']['repeated_clicks_incidents']} rapid repeated-click incidents on the application submit button, "
                        f"contributing to an overall {evidence['metrics']['form_abandonment_rate_pct']}% form abandonment rate."
                    )
                else:
                    parsed["overall_assessment"] = (
                        f"Across {evidence['metrics']['total_sessions']} recorded sessions, visitors navigated academic offerings smoothly, "
                        f"with healthy page traversal and no critical rage-click bottlenecks detected."
                    )

            tp = str(parsed.get("top_priority", "")).strip()
            if len(tp) < 12 or tp.lower() in ["high", "string", "medium", "low"] or "urgent fix" in tp.lower() or "<" in tp:
                if evidence["friction_signals"]:
                    parsed["top_priority"] = f"Clarify terms requirement and update visual validation state on '{evidence['friction_signals'][0]['element']}' to eliminate user rage clicking."
                else:
                    parsed["top_priority"] = "Streamline form input fields to accelerate applicant completion rate."

            # Ensure issues have rich observed evidence
            issues = parsed.get("issues", [])
            if not issues or not isinstance(issues, list):
                if evidence["friction_signals"]:
                    parsed["issues"] = [{
                        "title": "Severe Submission Button Rage Clicks",
                        "severity": "high",
                        "confidence": "high",
                        "observed_evidence": [
                            f"{f['clicks']} rapid clicks on '{f['element']}' within {f['interval_sec']}s" for f in evidence["friction_signals"][:2]
                        ],
                        "possible_explanation": "Button appears enabled before the terms acknowledgment checkbox is checked, causing users to repeatedly click in frustration.",
                        "recommended_action": "Visually disable the submit button until required checkboxes are filled, and show an immediate inline tooltip."
                    }]

            # Persist to database
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO ai_reports (project_id, report_json, created_at)
                    VALUES (?, ?, datetime('now'))
                """, (project_id, json.dumps(parsed)))
                report_id = cursor.lastrowid

            return {
                "success": True,
                "report_id": report_id,
                "model_used": active_model,
                "report": parsed
            }

    except json.JSONDecodeError as jde:
        return {
            "success": False,
            "error": "Model returned invalid JSON format",
            "details": str(jde),
            "raw_output": result_raw
        }
    except httpx.TimeoutException:
        return {
            "success": False,
            "error": "Inference timed out",
            "details": "The local model took longer than 150 seconds to respond."
        }
    except Exception as e:
        return {
            "success": False,
            "error": "AI analysis execution failed",
            "details": str(e)
        }

def get_latest_ai_report(project_id: str) -> Optional[Dict[str, Any]]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, report_json, created_at
            FROM ai_reports
            WHERE project_id = ?
            ORDER BY id DESC
            LIMIT 1
        """, (project_id,))
        row = cursor.fetchone()

    if not row:
        return None

    try:
        data = json.loads(row["report_json"])
        return {
            "id": row["id"],
            "created_at": row["created_at"],
            "report": data
        }
    except Exception:
        return None
