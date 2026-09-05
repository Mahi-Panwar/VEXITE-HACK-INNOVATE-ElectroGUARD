from pydantic import BaseModel

class PredictRequest(BaseModel):
    sector: str
    wind: float
    rain: float
