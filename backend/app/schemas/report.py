from pydantic import BaseModel, Field
from typing import Optional

class ReportSubmit(BaseModel):
    kind: str = Field(pattern="^(outdoor|indoor)$")
    category: Optional[str] = None
    equipment: Optional[str] = None
    fault_type: Optional[str] = None
    severity: str
    manpower: Optional[str] = None
    heavy_equipment: Optional[str] = None
    tools_and_parts: Optional[str] = None
    advisory: Optional[str] = None
    lat: float
    lng: float
    sector: str
    reporter_id: str
    reporter_name: str
