import sqlite3
import contextlib
from backend.app.core.config import DB_PATH

def get_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_conn()
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            phone TEXT UNIQUE,
            name TEXT NOT NULL,
            points INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS reports (
            id TEXT PRIMARY KEY,
            kind TEXT NOT NULL,               -- 'outdoor' | 'indoor'
            category TEXT,
            equipment TEXT,
            fault_type TEXT,
            severity TEXT,
            manpower TEXT,
            heavy_equipment TEXT,
            tools_and_parts TEXT,
            advisory TEXT,
            lat REAL,
            lng REAL,
            sector TEXT,
            reporter_id TEXT,
            reporter_name TEXT,
            status TEXT NOT NULL DEFAULT 'Queued',
            merged_into TEXT,
            created_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_reports_sector ON reports(sector);
        CREATE INDEX IF NOT EXISTS idx_reports_severity ON reports(severity);
        """
    )
    conn.commit()
    conn.close()

@contextlib.contextmanager
def db():
    conn = get_conn()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()
