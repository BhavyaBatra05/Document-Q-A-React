# app/schemas/document.py
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class DocumentCreate(BaseModel):
    name: str
    file_type: str

class DocumentResponse(BaseModel):
    id: str
    name: str
    is_active: bool
    is_ingested: bool
    file_type: str
    has_visual_content: bool
    upload_date: datetime
    word_count: int
    page_count: int

class DocumentList(BaseModel):
    documents: List[DocumentResponse]

class DocumentUpdate(BaseModel):
    is_active: Optional[bool] = None
    is_ingested: Optional[bool] = None

class DocumentAnalysisResponse(BaseModel):
    id: str
    name: str
    text_preview: str
    word_count: int
    page_count: int
    has_visual_content: bool
    visual_pages: List[int] = []
    metadata: Dict[str, Any] = {}