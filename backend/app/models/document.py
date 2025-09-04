# app/models/document.py
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId
from app.models.user import PyObjectId

class Document(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    name: str
    path: str
    user_id: PyObjectId
    is_active: bool = False
    is_ingested: bool = False
    file_type: str
    has_visual_content: bool = False
    visual_pages: List[int] = []
    upload_date: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = {}
    word_count: int = 0
    page_count: int = 0
    
    class Config:
        json_encoders = {ObjectId: str}
        arbitrary_types_allowed = True