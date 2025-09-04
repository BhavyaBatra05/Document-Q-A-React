# app/models/chat.py
from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from datetime import datetime
from bson import ObjectId
from app.models.user import PyObjectId

class Message(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    chat_id: PyObjectId
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {ObjectId: str}
        arbitrary_types_allowed = True

class Chat(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId
    document_id: Optional[PyObjectId] = None
    title: str = "New Chat"
    preview: str = ""
    messages: List[Message] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {ObjectId: str}
        arbitrary_types_allowed = True