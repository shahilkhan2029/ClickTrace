from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

class EventItem(BaseModel):
    session_id: str
    event_type: str
    page_url: str
    element_tag: Optional[str] = None
    element_id: Optional[str] = None
    element_text: Optional[str] = None
    click_x: Optional[int] = None
    click_y: Optional[int] = None
    viewport_width: Optional[int] = None
    viewport_height: Optional[int] = None
    scroll_depth: Optional[int] = None
    metadata_json: Optional[str] = None
    timestamp: Optional[str] = None

class EventBatch(BaseModel):
    project_id: str = "demo-project"
    events: List[EventItem]

class ProjectCreate(BaseModel):
    id: str
    name: str
    website_url: Optional[str] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    website_url: Optional[str]
    created_at: str

class AIAnalysisRequest(BaseModel):
    project_id: str = "nexus-college"
    limit_sessions: int = 50

class SimulateJourneyRequest(BaseModel):
    project_id: str = "nexus-college"
    scenario: str = "frustrated_registration"  # "smooth_conversion", "frustrated_registration", "bounced_landing"
