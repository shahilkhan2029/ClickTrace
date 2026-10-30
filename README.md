# ClickTrace — AI-Powered Website UX Intelligence

<p align="center">
  <strong>Understand where visitors struggle on your website, inspect verified behavioral evidence, and diagnose UX friction using lightweight local AI.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Hackathon%20MVP-success?style=flat-square" alt="Status" />
  <img src="https://img.shields.io/badge/AI%20Model-Gemma%202B%20(Local)-blue?style=flat-square" alt="Gemma" />
  <img src="https://img.shields.io/badge/Runtime-Ollama%20(Offline%20CPU)-orange?style=flat-square" alt="Ollama" />
  <img src="https://img.shields.io/badge/Backend-FastAPI%20%2B%20SQLite-green?style=flat-square" alt="Backend" />
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite%20%2B%20Tailwind-61dafb?style=flat-square" alt="Frontend" />
</p>

---

## 🎯 Project Vision

Traditional analytics platforms report numbers: *page views, bounce rates, session times*. They tell you **what** happened, but fail to explain **why** visitors abandoned your checkout, application, or registration.

**ClickTrace** bridges this gap by:
1. Capturing real-time micro-interactions (clicks, coordinates, scroll milestones, safe form progress).
2. Reconstructing chronological visitor journeys step-by-step.
3. Automatically detecting behavioral friction patterns (e.g. repeated **rage clicks** and form abandonment).
4. Utilizing a **local Google Gemma model** to analyze the aggregated behavioral evidence and provide actionable, confidence-rated UX diagnoses.

> **Zero Fabrication Policy**: ClickTrace never asks the AI to guess metrics or hallucinate analytics. All calculations are executed deterministically in Python/SQL, and Gemma evaluates only factual interaction evidence.

---

## ⚡ 1-Click Launch (Windows)

Double-click the included batch launcher file in the project root:

```cmd
start_clicktrace.bat
```

This single command automatically:
1. Verifies and starts the **Ollama** AI service on `localhost:11434`.
2. Starts the **FastAPI** backend server on `http://127.0.0.1:8000`.
3. Starts the **React + Vite** dashboard on `http://localhost:5173`.
4. Opens both the **ClickTrace Dashboard** and the **Demo Website** in your default web browser.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VISITOR / CLIENT WEBSITE                        │
│                 (Demo: Nexus College Admissions 2026)                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Embeds <script src="/sdk/clicktrace.js">
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                  VANILLA JAVASCRIPT TRACKING SDK                       │
│  • Clicks (x, y coords, viewport W/H, sanitized tag/ID/text)           │
│  • Scroll Depth Milestones (25%, 50%, 75%, 100%)                       │
│  • Safe Form Interaction (start, touched fields, submission status)    │
│  • Zero PII Collection (passwords & sensitive text auto-redacted)      │
│  • Resilient Batch Transmission via navigator.sendBeacon & fetch       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ POST /api/events
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     FASTAPI BACKEND & SQLITE (WAL)                     │
│  • High-throughput event ingestion & session association               │
│  • SQLite database with indexed queries: projects, sessions, events    │
│  • Serves SDK script & mounts realistic demo application               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
               ┌────────────────────┴────────────────────┐
               ▼                                         ▼
┌───────────────────────────────┐     ┌──────────────────────────────────┐
│ DETERMINISTIC PYTHON ENGINE   │     │ LOCAL GEMMA UX ANALYST (OLLAMA)  │
│ • Rage Click Detection        │     │ • Hardware-aware (8GB RAM CPU)   │
│   (≥3 clicks on element in 2s)│     │ • Synthesizes factual telemetry  │
│ • User Journey Reconstruction │     │ • Generates structured JSON:     │
│ • Form Abandonment %          │     │   - Executive Assessment         │
│ • Funnel Stage Conversion     │     │   - Ranked Issues & Evidence     │
│ • Heatmap Coordinate Scaling  │     │   - Hypothesis vs Observed Fact  │
└──────────────┬────────────────┘     │   - Actionable UI Recommendations│
               │                      └─────────────────┬────────────────┘
               │                                        │
               └────────────────────┬───────────────────┘
                                    │ REST API
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     CLICKTRACE REACT DASHBOARD                         │
│             (Vite • Tailwind CSS • Lucide • Recharts)                  │
│  [Overview]   [Click Heatmaps]   [User Sessions]   [UX Issues]  [AI]   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technologies Used | Rationale |
| :--- | :--- | :--- |
| **Tracking SDK** | Vanilla JavaScript, DOM API, `sendBeacon` | Zero dependencies, ultra-lightweight (~12 KB), non-blocking |
| **Backend** | Python 3.12, FastAPI, Uvicorn | High performance asynchronous API, strict Pydantic validation |
| **Database** | SQLite 3 (WAL Mode) | Zero setup overhead, persistent local file storage with indexes |
| **Analytics** | Pure Python deterministic calculations | Mathematically exact metrics, zero LLM hallucinations |
| **Local AI Engine** | Ollama (`localhost:11434`), Gemma 2B (`gemma:2b`) | Offline, privacy-preserving CPU execution, zero cloud costs |
| **Frontend UI** | React 19, Vite, Tailwind CSS, Recharts, Lucide | Sleek SaaS aesthetics, dark navy typography, responsive charts |

---

## 🔬 Core Capabilities

### 1. JavaScript Tracking SDK ([clicktrace.js](file:///c:/Users/shahi/OneDrive/Desktop/Jansahayak/backend/static/sdk/clicktrace.js))
Include on any web page:
```html
<script src="http://127.0.0.1:8000/sdk/clicktrace.js" data-project-id="nexus-college"></script>
```
- **Click Tracking**: Captures click coordinates `(x, y)` relative to page document and viewport dimensions.
- **Scroll Milestones**: Fires exactly at 25%, 50%, 75%, and 100% scroll depth.
- **Form Safety**: Records field count and submission outcomes. **Never captures passwords, input values, or credit cards.**
- **Session Continuity**: Generates and persists unique session identifiers in `sessionStorage`.

### 2. Algorithmic Rage Click Detection ([analytics.py](file:///c:/Users/shahi/OneDrive/Desktop/Jansahayak/backend/app/analytics.py))
- Detects instances where a visitor clicks the exact same element $\ge 3$ times within a $2.0$-second interval.
- Groups events and creates high-priority friction signals linked to page URLs and element IDs.

### 3. Chronological Journey Reconstruction ([Sessions.jsx](file:///c:/Users/shahi/OneDrive/Desktop/Jansahayak/frontend/src/pages/Sessions.jsx))
- Reconstructs narrative flows of each visitor session:
  $$\text{Page Visit} \longrightarrow \text{Scroll Milestone} \longrightarrow \text{Course Click} \longrightarrow \text{Form Start} \longrightarrow \text{Rage Click} \longrightarrow \text{Conversion / Exit}$$
- Allows reviewers to toggle between narrative timeline steps and raw event JSON logs.

### 4. Interactive Click Heatmaps ([Heatmaps.jsx](file:///c:/Users/shahi/OneDrive/Desktop/Jansahayak/frontend/src/pages/Heatmaps.jsx))
- Dynamically scales click coordinates to a standard 1280x800 desktop viewport.
- Highlights high-friction clusters with pulsating red rage hotspot markers and coordinate tooltips.

### 5. Gemma AI UX Investigation Engine ([ai_analyst.py](file:///c:/Users/shahi/OneDrive/Desktop/Jansahayak/backend/app/ai_analyst.py))
- Reads actual recorded sessions and issues a structured JSON diagnosis:
  - `overall_assessment` (Executive summary)
  - `issues` (Severity, confidence, observed evidence, explanation, recommended action)
  - `positive_observations` & `data_limitations`
  - `top_priority`
- Validates JSON output before committing to SQLite.

---

## 🎓 5-Minute Hackathon Demonstration Workflow

1. **Launch Services**:
   Run `start_clicktrace.bat` (or start backend & frontend manually).
2. **Interact with the Demo Site**:
   Navigate to [http://127.0.0.1:8000/demo/index.html](http://127.0.0.1:8000/demo/index.html).
   - See the green **ClickTrace Active** badge in the header.
   - Scroll down to trigger scroll milestones.
   - Click **"Apply for Fall 2026"** to go to the admissions registration page.
3. **Trigger the Intentional Friction (Rage Clicks)**:
   - On `register.html`, fill in your name and email.
   - Click the **"Submit Application"** button **4 times rapidly** without checking the required terms box (or click *"Trigger 5x Rapid Clicks"* in the bottom bar).
   - The button shakes, generating real repeated-click events.
4. **Complete the Application**:
   - Check the terms checkbox and click submit to trigger the green conversion celebration screen.
5. **Inspect the Dashboard**:
   Go to [http://localhost:5173](http://localhost:5173):
   - **Overview**: View live counts of sessions, clicks, funnel drop-off, and telemetry timeline.
   - **Heatmaps**: Select `/demo/register.html` to see the red rage hotspot on `btn_submit_confusing`.
   - **User Sessions**: Inspect your reconstructed step-by-step user journey.
   - **UX Issues**: View the detected repeated clicks incident and suggested UI fix.
   - **AI UX Analyst**: Click **"Run Gemma UX Analysis"** to see Gemma examine the factual evidence and deliver its diagnosis!

---

## 📡 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Backend, SQLite, and Ollama service health check |
| `GET` | `/sdk/clicktrace.js` | Serves the production JavaScript tracking SDK |
| `POST` | `/api/events` | Ingests throttled batches of client interaction events |
| `GET` | `/api/analytics/overview` | Returns aggregate metrics, top pages, and timeline data |
| `GET` | `/api/sessions` | Lists all recorded visitor sessions with friction tags |
| `GET` | `/api/sessions/{session_id}` | Returns reconstructed user journey steps and raw events |
| `GET` | `/api/analytics/heatmap` | Returns scaled click coordinates and frequency for a page |
| `GET` | `/api/analytics/funnel` | Returns multi-stage conversion funnel drop-off metrics |
| `GET` | `/api/analytics/issues` | Returns detected friction obstacles and rage click incidents |
| `GET` | `/api/ai/status` | Checks Ollama runtime and installed Gemma models |
| `POST` | `/api/ai/analyze` | Invokes Gemma to analyze factual interaction evidence |
| `POST` | `/api/simulate` | Simulates realistic test visitor flows (for evaluation) |

---

## 🔒 Privacy & Data Governance

ClickTrace is built with strict privacy-by-design principles:
- **No Form Input Value Capture**: Input contents, passwords, authentication tokens, and credit cards are never recorded.
- **Strict Text Redaction**: Clicked element text is capped at 50 characters and scrubbed of sensitive keywords (`password`, `pin`, `cvv`, etc.).
- **100% Local Storage**: All data remains on the local SQLite database. No third-party tracking scripts or external cloud AI calls are made.

---

## 🧪 Automated Testing

Execute the complete end-to-end test suite:
```bash
python test_clicktrace.py
```
Verifies all 9 development priorities: backend health, SDK delivery, event batch ingestion, overview metrics, rage-click detection, journey reconstruction, heatmap scaling, funnel drop-offs, and Gemma AI analysis.

---

## 📄 License
MIT License. Built for the Offline UX Intelligence Hackathon.
