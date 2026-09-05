import time
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from backend.app.schemas.report import ReportSubmit
from backend.app.core.config import SECTORS, DEDUP_RADIUS_M, POINTS_PER_REPORT
from backend.app.core.database import db
from backend.app.core.helpers import haversine_m, gen_id

router = APIRouter(prefix="/api", tags=["reports"])

@router.post("/reports")
def submit_report(r: ReportSubmit):
    if r.sector not in SECTORS:
        raise HTTPException(status_code=400, detail=f"sector must be one of {SECTORS}")

    with db() as conn:
        candidates = conn.execute(
            "SELECT * FROM reports WHERE kind=? AND category IS ? AND merged_into IS NULL",
            (r.kind, r.category),
        ).fetchall()
        duplicate = None
        for c in candidates:
            if c["lat"] is None or c["lng"] is None:
                continue
            if haversine_m(c["lat"], c["lng"], r.lat, r.lng) <= DEDUP_RADIUS_M:
                duplicate = c
                break

        if duplicate is not None:
            new_id = gen_id("r")
            conn.execute(
                """INSERT INTO reports (id, kind, category, equipment, fault_type, severity,
                   manpower, heavy_equipment, tools_and_parts, advisory, lat, lng, sector,
                   reporter_id, reporter_name, status, merged_into, created_at)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (new_id, r.kind, r.category, r.equipment, r.fault_type, r.severity,
                 r.manpower, r.heavy_equipment, r.tools_and_parts, r.advisory, r.lat, r.lng,
                 r.sector, r.reporter_id, r.reporter_name, "Merged", duplicate["id"], int(time.time())),
            )
            return {"duplicate": True, "mergedInto": duplicate["id"], "pointsAwarded": 0, "reportId": new_id}

        new_id = gen_id("r")
        conn.execute(
            """INSERT INTO reports (id, kind, category, equipment, fault_type, severity,
               manpower, heavy_equipment, tools_and_parts, advisory, lat, lng, sector,
               reporter_id, reporter_name, status, merged_into, created_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NULL,?)""",
            (new_id, r.kind, r.category, r.equipment, r.fault_type, r.severity,
             r.manpower, r.heavy_equipment, r.tools_and_parts, r.advisory, r.lat, r.lng,
             r.sector, r.reporter_id, r.reporter_name, "Queued", int(time.time())),
        )
        existing = conn.execute("SELECT * FROM users WHERE id=?", (r.reporter_id,)).fetchone()
        if existing is None:
            conn.execute(
                "INSERT INTO users (id, phone, name, points, created_at) VALUES (?,NULL,?,?,?)",
                (r.reporter_id, r.reporter_name, POINTS_PER_REPORT, int(time.time())),
            )
        else:
            conn.execute(
                "UPDATE users SET points = points + ?, name = ? WHERE id=?",
                (POINTS_PER_REPORT, r.reporter_name, r.reporter_id),
            )

    return {"duplicate": False, "reportId": new_id, "pointsAwarded": POINTS_PER_REPORT}


@router.get("/reports")
def list_reports(severity: Optional[str] = None, sector: Optional[str] = None,
                  reporter_id: Optional[str] = None, limit: int = 200):
    q = "SELECT * FROM reports WHERE merged_into IS NULL"
    params: List = []
    if severity and severity != "All":
        q += " AND severity=?"
        params.append(severity)
    if sector:
        q += " AND sector=?"
        params.append(sector)
    if reporter_id:
        q += " AND reporter_id=?"
        params.append(reporter_id)
    q += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)
    with db() as conn:
        rows = conn.execute(q, params).fetchall()
        return [dict(row) for row in rows]


@router.get("/sectors/summary")
def sectors_summary():
    with db() as conn:
        out = []
        for s in SECTORS:
            rows = conn.execute(
                "SELECT severity FROM reports WHERE sector=? AND merged_into IS NULL", (s,)
            ).fetchall()
            severities = [row["severity"] for row in rows]
            rank = {"Emergency": 3, "High": 2, "Moderate": 1, "Low": 0}
            worst = max(severities, key=lambda s2: rank.get(s2, 0)) if severities else None
            out.append({"sector": s, "count": len(severities), "worstSeverity": worst})
        return out
