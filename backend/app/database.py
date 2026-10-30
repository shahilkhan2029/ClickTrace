import sqlite3
import os
from contextlib import contextmanager

DB_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(DB_DIR, "clicktrace.db")

@contextmanager
def get_db():
    conn = sqlite3.connect(DB_PATH, timeout=10.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL")
    conn.execute("PRAGMA synchronous = NORMAL")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Projects table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                website_url TEXT,
                created_at TEXT NOT NULL
            )
        """)
        
        # Sessions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                started_at TEXT NOT NULL,
                last_activity_at TEXT NOT NULL,
                page_count INTEGER DEFAULT 1,
                FOREIGN KEY(project_id) REFERENCES projects(id)
            )
        """)
        
        # Events table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id TEXT NOT NULL,
                session_id TEXT NOT NULL,
                event_type TEXT NOT NULL,
                page_url TEXT NOT NULL,
                element_tag TEXT,
                element_id TEXT,
                element_text TEXT,
                click_x INTEGER,
                click_y INTEGER,
                viewport_width INTEGER,
                viewport_height INTEGER,
                scroll_depth INTEGER,
                metadata_json TEXT,
                created_at TEXT NOT NULL
            )
        """)
        
        # AI Reports table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ai_reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id TEXT NOT NULL,
                report_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(project_id) REFERENCES projects(id)
            )
        """)
        
        # Performance Indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_project ON events(project_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_id)")
        
        # Ensure default demo project exists
        cursor.execute("""
            INSERT OR IGNORE INTO projects (id, name, website_url, created_at)
            VALUES ('nexus-college', 'Nexus College Admissions', 'http://localhost:8000/demo/index.html', datetime('now'))
        """)
        cursor.execute("""
            INSERT OR IGNORE INTO projects (id, name, website_url, created_at)
            VALUES ('demo-project', 'Default Demo Site', 'http://localhost:8000', datetime('now'))
        """)
