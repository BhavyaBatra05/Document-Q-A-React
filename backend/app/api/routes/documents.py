from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Path
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models.user import User
from app.models.document import Document
from app.schemas.document import DocumentCreate, DocumentResponse
from app.api.deps import get_current_user

router = APIRouter(
    prefix="/api/v1/documents",
    tags=["documents"]
)

@router.post("", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
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
        is_active=True
    )
    
    db.add(document)
    db.commit()
    db.refresh(document)
    
    return document

@router.get("", response_model=List[DocumentResponse])
async def get_user_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all documents for the current user"""
    documents = db.query(Document).filter(Document.user_id == current_user.id).all()
    return documents

@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: int = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific document by ID"""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return document

@router.put("/{document_id}", response_model=DocumentResponse)
async def set_active_document(
    document_id: int = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Set a document as the active document"""
    # First, set all user's documents to inactive
    db.query(Document).filter(Document.user_id == current_user.id).update({"is_active": False})
    
    # Set the specified document to active
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    document.is_active = True
    db.commit()
    db.refresh(document)
    
    return document

@router.delete("/{document_id}")
async def delete_document(
    document_id: int = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a document"""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    db.delete(document)
    db.commit()
    
    return {"success": True}