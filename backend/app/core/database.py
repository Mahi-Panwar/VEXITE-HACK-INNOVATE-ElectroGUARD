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
    
    # Seed default initial grid reports if empty
    count = conn.execute("SELECT COUNT(*) as cnt FROM reports").fetchone()["cnt"]
    if count == 0:
        import time
        now = int(time.time())
        seed_reports = [
            ("r_bhopal_50m", "outdoor", "Public Utility Grid", "Distribution Transformer", "Sparking & Overheating", "Emergency", "2 Senior Linemen + 1 Tech", "Bucket Truck", "Insulated Gloves, Fuse Wire", "Danger! Stand clear 10m minimum.", 23.2602, 77.4126, "Sector 3", "u_system", "Grid Monitoring Unit", "Queued", None, now),
            ("r_bhopal_sub", "outdoor", "Public Utility Grid", "Feeder Pillar Panel", "Damaged Busbar Insulator", "High", "2 Linemen", "Utility Van", "Test Clamp, Meter", "Notify local sub-station team.", 23.2640, 77.4180, "Sector 3", "u_system", "Grid Monitoring Unit", "Queued", None, now - 3600),
            ("r_indore_grid", "outdoor", "Public Utility Grid", "High Voltage Pole", "Leaning Pole & Sagging Cable", "High", "3 Cable Crew", "Crane Truck", "Guy Wire, Tensioner", "Cordon off street area.", 22.7199, 75.8580, "Sector 1", "u_system", "Grid Monitoring Unit", "Queued", None, now - 7200),
            ("r_delhi_grid", "outdoor", "Public Utility Grid", "Substation Transformer", "Oil Leak & Arc Fault", "Emergency", "4 Emergency Crew", "Fire Suppression Unit", "Arc Shield, Transformer Oil", "Isolate circuit immediately.", 28.6142, 77.2093, "Sector 4", "u_system", "Grid Monitoring Unit", "Queued", None, now - 10800),
        ]
        conn.executemany(
            """INSERT INTO reports (id, kind, category, equipment, fault_type, severity,
               manpower, heavy_equipment, tools_and_parts, advisory, lat, lng, sector,
               reporter_id, reporter_name, status, merged_into, created_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            seed_reports
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
