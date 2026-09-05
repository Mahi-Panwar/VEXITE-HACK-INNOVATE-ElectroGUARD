from pydantic import BaseModel

class AnalyzeRequest(BaseModel):
    image_base64: str
    media_type: str = "image/jpeg"
