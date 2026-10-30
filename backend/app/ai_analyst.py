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
    """
    Check if Ollama is running and whether the selected model or any Gemma model is installed.
    Provides clear hardware/RAM based recommendations.
    """
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                models = [m.get("name", "") for m in data.get("models", [])]
                
                # Check for exact or compatible gemma model
                selected_model_exists = any(OLLAMA_MODEL in m for m in models)
                any_gemma = [m for m in models if "gemma" in m.lower()]
                
                return {
                    "online": True,
                    "url": OLLAMA_BASE_URL,
                    "configured_model": OLLAMA_MODEL,
                    "model_installed": selected_model_exists,
                    "installed_models": models,
                    "available_gemma_models": any_gemma,
                    "message": "Ollama service is active and accessible." if selected_model_exists else (
                        f"Ollama is running, but model '{OLLAMA_MODEL}' is not pulled yet. Run: `ollama pull {OLLAMA_MODEL}`"
                    ),
                    "setup_command": f"ollama pull {OLLAMA_MODEL}" if not selected_model_exists else None
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
                       "For this 8 GB RAM system, install Ollama and pull lightweight Gemma 1B: "
                       "`ollama run gemma3:1b` (or `ollama run gemma:2b`).",
            "setup_command": "ollama serve && ollama pull gemma3:1b",
            "system_ram_guidance": "Detected ~8 GB RAM: Gemma 1B quantized is ideal for fast responsive CPU inference without GPU."
        }

def prepare_evidence_summary(project_id: str, limit_sessions: int = 25) -> Dict[str, Any]:
    """
    Extract factual, non-fabricated interaction evidence for the AI prompt.
    """
    overview = get_overview_metrics(project_id)
    friction = detect_repeated_clicks(project_id)
    funnel = get_conversion_funnel(project_id)
    scroll = get_scroll_analytics(project_id)
    sessions = get_sessions_list(project_id)[:limit_sessions]

    # Compact session trajectories
    compact_sessions = []
    for s in sessions:
        compact_sessions.append({
            "session_id": s["session_id"],
            "duration_sec": s.get("duration_seconds", 0),
            "events_count": s.get("event_count", 0),
            "has_friction": s.get("has_friction", False),
            "converted": bool(s.get("converted", False))
        })

    # Summary of rage clicks / repeated clicks
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
    """
    Run Gemma analysis via Ollama. Validates status first, constructs strict prompt,
    enforces JSON output, validates structure, and stores in SQLite.
    """
    status = await check_ollama_status()
    if not status["online"] or not status["model_installed"]:
        # If specific configured model isn't there, check if another gemma exists
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

    # If there is literally 0 sessions, inform user
    if evidence["metrics"]["total_sessions"] == 0:
        return {
            "success": False,
            "error": "Insufficient interaction data",
            "details": "No sessions or interactions have been recorded for this project yet. Please browse the demo site to generate real interactions first."
        }

    system_prompt = (
        "You are ClickTrace's expert UX investigation engine.\n"
        "Analyze the supplied factual website interaction data.\n"
        "Your responsibilities:\n"
        "1. Identify potential UX friction based ONLY on observed evidence.\n"
        "2. Explain the evidence behind each observation.\n"
        "3. Distinguish factual observations from hypotheses.\n"
        "4. Suggest concrete, practical UI/UX improvements.\n"
        "5. Assign priority (low | medium | high) and confidence (low | medium | high).\n"
        "STRICT CONSTRAINTS:\n"
        "- Never invent events, user metrics or intentions not present in the data.\n"
        "- Never claim that correlation proves causation.\n"
        "- If evidence is limited or inconclusive, explicitly state data limitations.\n"
        "- Return ONLY valid JSON matching this exact structure with NO markdown fences, NO preamble:"
        """
{
  "overall_assessment": "concise executive summary",
  "issues": [
    {
      "title": "Clear issue title",
      "severity": "low | medium | high",
      "confidence": "low | medium | high",
      "observed_evidence": ["fact 1", "fact 2"],
      "possible_explanation": "why users might struggle here",
      "recommended_action": "actionable fix"
    }
  ],
  "positive_observations": ["positive pattern 1"],
  "data_limitations": ["limitation or gap in data"],
  "top_priority": "the single most urgent UX fix"
}
"""
    )

    user_prompt = f"WEBSITE INTERACTION EVIDENCE DATA:\n{json.dumps(evidence, indent=2)}\n\nAnalyze this data and produce the required JSON response."

    payload = {
        "model": active_model,
        "prompt": f"{system_prompt}\n\n{user_prompt}",
        "stream": False,
        "format": "json",
        "options": {
            "temperature": 0.1,
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
            
            # Parse & validate JSON
            clean_json = result_raw.strip()
            if clean_json.startswith("```json"):
                clean_json = clean_json[7:]
            if clean_json.startswith("```"):
                clean_json = clean_json[3:]
            if clean_json.endswith("```"):
                clean_json = clean_json[:-3]
            clean_json = clean_json.strip()

            parsed = json.loads(clean_json)

            # Store in database
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
            "details": "The local model took longer than 45 seconds to respond. Consider using a 1B model (gemma3:1b) for responsive CPU execution."
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
