# app/schemas/chat.py
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class MessageCreate(BaseModel):
    content: str

class MessageResponse(BaseModel):
    role: str
    content: str
    timestamp: datetime

class ChatCreate(BaseModel):
    document_id: Optional[str] = None
    title: Optional[str] = None

class ChatResponse(BaseModel):
    id: str
    title: str
    preview: str
    created_at: datetime
    updated_at: datetime
    document_id: Optional[str] = None
    messages: List[MessageResponse]

class ChatList(BaseModel):
    chats: List[ChatResponse]

class ChatUpdate(BaseModel):
    title: Optional[str] = None

class QueryRequest(BaseModel):
    query: str
    document_id: Optional[str] = None

class QueryResponse(BaseModel):
    answer: str
    confidence: float
    sources_used: int
    context_length: int = 0