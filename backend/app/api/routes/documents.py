from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Path
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
import os
from datetime import datetime

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.document import Document
from app.schemas.document import DocumentCreate, DocumentResponse

router = APIRouter(
    prefix="/api/v1/documents",
    tags=["documents"]
)

@router.post("", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a new document"""
    # This is a simplified example - you'll need to implement actual file saving
    # and document processing logic
    
    # Create document in DB
    document = Document(
        name=file.filename,
        path="/path/to/storage/" + file.filename,  # You'll need to implement actual file saving
        user_id=current_user.id,
        is_active=True,
        file_type=file.filename.split('.')[-1].lower()
    )
    
    doc_dict = document.dict(by_alias=True)
    result = await db.documents.insert_one(doc_dict)
    
    # Return the created document
    created_document = await db.documents.find_one({"_id": result.inserted_id})
    return Document(**created_document)

@router.get("", response_model=List[DocumentResponse])
async def get_user_documents(
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all documents for the current user"""
    cursor = db.documents.find({"user_id": current_user.id})
    documents = await cursor.to_list(length=100)  # Limiting to 100 documents
    return [Document(**doc) for doc in documents]

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str = Path(...),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific document by ID"""
    document = await db.documents.find_one({
        "_id": ObjectId(document_id),
        "user_id": current_user.id
    })
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return Document(**document)

@router.put("/{document_id}", response_model=DocumentResponse)
async def set_active_document(
    document_id: str = Path(...),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Set a document as the active document"""
    # First, set all user's documents to inactive
    await db.documents.update_many(
        {"user_id": current_user.id},
        {"$set": {"is_active": False}}
    )
    
    # Set the specified document to active
    result = await db.documents.update_one(
        {"_id": ObjectId(document_id), "user_id": current_user.id},
        {"$set": {"is_active": True}}
    )
    
    if result.modified_count == 0:
        # Check if document exists
        document_exists = await db.documents.find_one({
            "_id": ObjectId(document_id),
            "user_id": current_user.id
        })
        
        if not document_exists:
            raise HTTPException(status_code=404, detail="Document not found")
    
    # Get the updated document
    updated_document = await db.documents.find_one({"_id": ObjectId(document_id)})
    return Document(**updated_document)

@router.delete("/{document_id}")
async def delete_document(
    document_id: str = Path(...),
    db: AsyncIOMotorDatabase = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a document"""
    # Check if document exists first
    document = await db.documents.find_one({
        "_id": ObjectId(document_id),
        "user_id": current_user.id
    })
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete the document
    result = await db.documents.delete_one({
        "_id": ObjectId(document_id),
        "user_id": current_user.id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"success": True}