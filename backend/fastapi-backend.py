# FastAPI Backend for Document Q&A System
"""
Enhanced FastAPI Backend integrating with the existing enhanced_doc_qa.py system
Maintains exact same functionality as Streamlit version but with REST API endpoints
"""

import os
import tempfile
import shutil
import asyncio
import logging
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, Dict, Any, List
import json
import time

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, BackgroundTasks, Form, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from contextlib import asynccontextmanager
import uvicorn

# Import your existing document processing system
from enhanced_doc_qa import (
    SmartDocumentProcessor,
    InMemoryVectorStore, 
    HallucinationResistantAnswerer,
    QAState,
    create_multiagent_workflow
)

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variables for models (will be initialized on startup)
llm = None
vlm_processor = None
vlm_model = None

# Predefined demo files paths on your backend server
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEMO_FILES = {
    "demo_graph": os.path.join(BASE_DIR, "demo_files", "sample w graph.pdf"),
    "demo_data": os.path.join(BASE_DIR, "demo_files", "sampledata.pdf"),
}
demo_ingestion_tasks = {}

# Verify demo files exist
for key, path in DEMO_FILES.items():
    print(f"{key} at {path}: exists={os.path.exists(path)} size={os.path.getsize(path) if os.path.exists(path) else 'N/A'}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Starting FastAPI Document Q&A System...")
    await load_ai_models()
    yield
    # Shutdown
    logger.info("📴 Shutting down FastAPI Document Q&A System...")
    await cleanup_resources()

# Initialize FastAPI app
app = FastAPI(
    title="Enhanced Document Q&A System",
    description="FastAPI backend for multi-agent document processing with VLM support",
    version="2.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Pydantic Models
class LoginRequest(BaseModel):
    username: str
    password: str

class QueryRequest(BaseModel):
    query: str
    session_id: str
    document_id: Optional[str] = None  # Add this

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: str
    confidence: Optional[float] = None

class DocumentInfo(BaseModel):
    task_id: str
    filename: str
    size: int
    upload_time: str
    processing_status: str
    word_count: Optional[int] = None
    page_count: Optional[int] = None
    extraction_method: Optional[str] = None

class ProcessingStatus(BaseModel):
    status: str  # "processing", "completed", "error"
    progress: float
    message: str
    details: Optional[Dict[str, Any]] = None

# In-memory storage (use Redis/Database in production)
user_sessions = {}
uploaded_documents = {}
processing_tasks = {}

# Updated for multi-user, multi-chat session storage:
chat_sessions = {}  # { username: { session_id: [messages] } }

# Demo users
DEMO_USERS = {
    "user": {"password": "password", "is_admin": False},
    "admin": {"password": "admin", "is_admin": True}
}

# AI Models Loading
async def load_ai_models():
    """Load AI models with graceful fallback"""
    global llm, vlm_processor, vlm_model
    
    try:
        # Load LLM
        from langchain_google_genai import ChatGoogleGenerativeAI
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if gemini_api_key:
            llm = ChatGoogleGenerativeAI(
                model='gemini-2.0-flash',
                google_api_key=gemini_api_key
            )
            logger.info("✅ Google Gemini LLM loaded successfully")
        else:
            logger.warning("⚠️ Gemini API key not found")

        # Load VLM models
        try:
            from transformers import AutoProcessor, AutoModelForVision2Seq
            huggingface_key = os.getenv("HUGGINGFACE_API_KEY")
            
            vlm_processor = AutoProcessor.from_pretrained(
                "HuggingFaceTB/SmolVLM-256M-Instruct",
                token=huggingface_key
            )
            vlm_model = AutoModelForVision2Seq.from_pretrained(
                "HuggingFaceTB/SmolVLM-256M-Instruct", 
                token=huggingface_key
            )
            logger.info("✅ VLM models loaded successfully")
        except Exception as e:
            logger.warning(f"⚠️ Could not load VLM models: {e}")
            vlm_processor = None
            vlm_model = None

    except Exception as e:
        logger.error(f"❌ Error loading models: {e}")
        raise

async def cleanup_resources():
    """Cleanup resources on shutdown"""
    # Clean up temporary files
    for session_id, session_data in user_sessions.items():
        if 'temp_dir' in session_data:
            try:
                shutil.rmtree(session_data['temp_dir'])
            except Exception as e:
                logger.error(f"Error cleaning up temp dir: {e}")

# Authentication
def verify_credentials(username: str, password: str, is_admin: bool = False) -> bool:
    """Verify user credentials"""
    user = DEMO_USERS.get(username)
    if not user:
        return False
    
    if user["password"] != password:
        return False
    
    if is_admin and not user["is_admin"]:
        return False
    
    return True

def create_session(username: str, is_admin: bool) -> str:
    """Create user session"""
    session_id = str(uuid.uuid4())
    user_sessions[session_id] = {
        "username": username,
        "is_admin": is_admin,
        "login_time": datetime.now().isoformat(),
        "temp_dir": tempfile.mkdtemp(prefix=f"doc_qa_{username}_")
    }
    return session_id

def verify_session(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Verify session token"""
    session_id = credentials.credentials
    session = user_sessions.get(session_id)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    return session

# API Endpoints

@app.post("/api/auth/login")
async def login(request: LoginRequest):
    """User authentication"""
    user = DEMO_USERS.get(request.username)
    if not user or user["password"] != request.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    session_id = create_session(request.username, user["is_admin"] )
    
    return {
        "access_token": session_id,
        "token_type": "bearer",
        "user": {
            "username": request.username,
            "is_admin": user["is_admin"],
        }
    }

@app.post("/api/auth/logout")
async def logout(session: Dict[str, Any] = Depends(verify_session)):
    """User logout"""
    # Find and remove session
    session_id = None
    for sid, sess_data in user_sessions.items():
        if sess_data["username"] == session["username"]:
            session_id = sid
            break
    
    if session_id:
        # Cleanup temp directory
        temp_dir = session.get('temp_dir')
        if temp_dir and os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
        
        del user_sessions[session_id]
    
    return {"message": "Logged out successfully"}

@app.get("/api/user/profile")
async def get_profile(session: Dict[str, Any] = Depends(verify_session)):
    """Get user profile"""
    return {
        "username": session["username"],
        "is_admin": session["is_admin"],
        "login_time": session["login_time"]
    }
    
@app.delete("/api/chat/history/clear_all")
async def clear_all_chat_history(session: Dict[str, Any] = Depends(verify_session)):
    """Clear all chat histories for the logged-in user."""
    username = session["username"]
    if username in chat_sessions:
        del chat_sessions[username]
    return {"message": f"All chat histories cleared for user {username}"}


async def process_document(task_id: str, file_path: str, filename: str):
    """Background task for document processing"""
    try:
        logger.info(f"process_document called: task_id={task_id}, file_path={file_path}, filename={filename}")
        processing_tasks[task_id]["status"] = "processing"
        processing_tasks[task_id]["progress"] = 10.0
        processing_tasks[task_id]["message"] = "Initializing document processor..."
        
        processor = SmartDocumentProcessor(
            llm=llm,
            vlm_processor=vlm_processor,
            vlm_model=vlm_model,
            batch_size=5,
            max_workers=3
        )
        
        processing_tasks[task_id]["progress"] = 20.0
        processing_tasks[task_id]["message"] = "Analyzing document structure..."
        
        extraction_result = processor.extract_text_smart(file_path)
        
        if not extraction_result["success"]:
            processing_tasks[task_id]["status"] = "error"
            processing_tasks[task_id]["message"] = f"Extraction failed: {extraction_result.get('error', 'Unknown error')}"
            return
        
        processing_tasks[task_id]["progress"] = 60.0
        processing_tasks[task_id]["message"] = "Creating vector store..."
        
        vectorstore = InMemoryVectorStore(session_id=task_id)
        vs_result = vectorstore.create_vectorstore(extraction_result["text"])
        
        if not vs_result["success"]:
            processing_tasks[task_id]["status"] = "error"
            processing_tasks[task_id]["message"] = f"Vector store creation failed: {vs_result.get('error', 'Unknown error')}"
            return
        
        processing_tasks[task_id]["progress"] = 90.0
        processing_tasks[task_id]["message"] = "Finalizing..."
        
        doc_info = {
            "filename": filename,
            "file_path": file_path,
            "size": os.path.getsize(file_path),
            "upload_time": datetime.now().isoformat(),
            "processing_status": "completed",
            "word_count": extraction_result.get("word_count", 0),
            "page_count": extraction_result.get("pages", 1),
            "extraction_method": extraction_result.get("extraction_method", "unknown"),
            "vectorstore": vectorstore,
            "chunk_count": vs_result["chunk_count"]
        }
        
        uploaded_documents[task_id] = doc_info
        
        processing_tasks[task_id]["status"] = "completed"
        processing_tasks[task_id]["progress"] = 100.0
        processing_tasks[task_id]["message"] = "Document processing completed successfully!"
        processing_tasks[task_id]["details"] = {
            "word_count": extraction_result.get("word_count", 0),
            "page_count": extraction_result.get("pages", 1),
            "chunk_count": vs_result["chunk_count"],
            "extraction_method": extraction_result.get("extraction_method", "unknown")
        }
        
        processor.cleanup()
        
    except Exception as e:
        logger.error(f"Document processing error: {e}")
        processing_tasks[task_id]["status"] = "error" 
        processing_tasks[task_id]["message"] = f"Processing error: {str(e)}"


@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    session: Dict[str, Any] = Depends(verify_session)
):
    """Upload and process document"""
    
    # if not session["is_admin"]:
    #     raise HTTPException(status_code=403, detail="Admin access required")
    
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")
    
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ['.pdf', '.docx', '.txt']:
        raise HTTPException(status_code=400, detail="Unsupported file format")
    
    # Check file size (200MB limit as per UI)
    file_size = 0
    content = await file.read()
    file_size = len(content)
    
    if file_size > 200 * 1024 * 1024:  # 200MB
        raise HTTPException(status_code=413, detail="File too large (max 200MB)")
    
    # Save file
    temp_dir = session.get('temp_dir')
    if not temp_dir:
        temp_dir = tempfile.mkdtemp(prefix=f"doc_qa_{session['username']}_")
        session['temp_dir'] = temp_dir
    
    file_path = Path(temp_dir) / file.filename
    
    with open(file_path, 'wb') as f:
        f.write(content)
    
    # Create processing task
    task_id = str(uuid.uuid4())
    processing_tasks[task_id] = {
        "status": "processing",
        "progress": 0.0,
        "message": "Starting document processing...",
        "file_path": str(file_path),
        "filename": file.filename,
        "session_id": session.get("session_id", "unknown"),
        "start_time": datetime.now().isoformat()
    }
    
    # Start background processing
    background_tasks.add_task(process_document, task_id, str(file_path), file.filename)
    
    return {
        "task_id": task_id,
        "message": "Document upload started",
        "filename": file.filename,
        "size": file_size
    }

# process_document async task as-is ...

# @app.get("/api/documents/processing-status/{task_id}")
# async def get_processing_status(task_id: str):
#     """Get document processing status"""
    
#     task = processing_tasks.get(task_id)
#     if not task:
#         raise HTTPException(status_code=404, detail="Task not found")
    
#     return ProcessingStatus(
#         status=task["status"],
#         progress=task["progress"],
#         message=task["message"],
#         details=task.get("details")
#     )

@app.get("/api/documents/processing-status/{task_id}")
async def get_processing_status(task_id: str):
    """Get document processing status for regular and demo ingestion tasks"""
    
    task = processing_tasks.get(task_id)
    if task:
        return ProcessingStatus(
            status=task["status"],
            progress=task.get("progress", 0),
            message=task.get("message", ""),
            details=task.get("details"),
        )
    
    # Check demo ingestion tasks
    demo_task = demo_ingestion_tasks.get(task_id)
    if demo_task:
        return ProcessingStatus(
            status=demo_task["status"],
            progress=100 if demo_task["status"] == "completed" else 0,
            message=demo_task.get("message", ""),
            details=demo_task.get("details"),
        )
    
    raise HTTPException(status_code=404, detail="Task not found")


@app.get("/api/documents/list")
async def list_documents(session: Dict[str, Any] = Depends(verify_session)):
    """List uploaded documents"""
    
    documents = []
    for doc_id, doc_info in uploaded_documents.items():
        documents.append(DocumentInfo(
            task_id=doc_id,
            filename=doc_info["filename"],
            size=doc_info["size"],
            upload_time=doc_info["upload_time"],
            processing_status=doc_info["processing_status"],
            word_count=doc_info.get("word_count"),
            page_count=doc_info.get("page_count"),
            extraction_method=doc_info.get("extraction_method")
        ))
    
    return {"documents": documents}

@app.post("/api/documents/{document_id}/set_active")
async def set_active_document(document_id: str, session: Dict[str, Any] = Depends(verify_session)):
    # Confirm document exists
    if document_id not in uploaded_documents:
        raise HTTPException(status_code=404, detail="Document not found")

    # Store active document id in user session data
    session["active_document_id"] = document_id

    # Potentially record active doc elsewhere or update flags as needed

    return {"message": "Active document updated"}

@app.post("/api/chat/query")
async def query_document(request: QueryRequest, session: Dict[str, Any] = Depends(verify_session)):
    """Query uploaded documents and store chat history per user and session."""
    username = session["username"]

    if not uploaded_documents:
        raise HTTPException(status_code=400, detail="No documents uploaded. Please upload a document first.")

    doc_info = None
    if request.document_id and request.document_id in uploaded_documents:
        doc_info = uploaded_documents[request.document_id]
    else:
        doc_id = list(uploaded_documents.keys())[0]
        doc_info = uploaded_documents[doc_id]

    if doc_info["processing_status"] != "completed":
        raise HTTPException(status_code=400, detail="Document is still being processed")

    try:
        vectorstore = doc_info["vectorstore"]
        chunks = vectorstore.retrieve_chunks(request.query, k=6)

        if not chunks:
            answer = "I couldn't find relevant information in the document to answer your question."
            confidence = 0.1
            sources_used = 0
        else:
            answerer = HallucinationResistantAnswerer(llm=llm)
            answer_result = answerer.generate_answer(request.query, chunks)
            answer = answer_result["answer"]
            confidence = answer_result["confidence"]
            sources_used = answer_result["sources_used"]

        if username not in chat_sessions:
            chat_sessions[username] = {}

        if request.session_id not in chat_sessions[username]:
            chat_sessions[username][request.session_id] = []

        # Append user message
        chat_sessions[username][request.session_id].append({
            "role": "user",
            "content": request.query,
            "timestamp": datetime.now().isoformat(),
        })
        # Append assistant response
        chat_sessions[username][request.session_id].append({
            "role": "assistant",
            "content": answer,
            "confidence": confidence,
            "sources_used": sources_used,
            "timestamp": datetime.now().isoformat(),
        })

        return {
            "answer": answer,
            "confidence": confidence,
            "sources_used": sources_used,
            "chunks_retrieved": len(chunks),
        }
    except Exception as e:
        logger.error(f"Query processing error: {e}")
        raise HTTPException(status_code=500, detail=f"Query processing failed: {str(e)}")

@app.get("/api/chat/history/{session_id}")
async def get_chat_history(session_id: str, session: Dict[str, Any] = Depends(verify_session)):
    """Return chat messages for specific user and session_id."""
    username = session["username"]
    user_chats = chat_sessions.get(username, {})
    history = user_chats.get(session_id, [])
    return {"history": history}

@app.get("/api/chat/sessions")
async def get_chat_sessions(session: Dict[str, Any] = Depends(verify_session)):
    """List all chat sessions metadata for the logged-in user."""
    username = session["username"]
    user_chats = chat_sessions.get(username, {})
    sessions_list = []
    for ses_id, messages in user_chats.items():
        last_msg = messages[-1] if messages else {}
        sessions_list.append({
            "sessionId": ses_id,
            "lastMessage": last_msg.get("content", ""),
            "lastTimestamp": last_msg.get("timestamp", ""),
            "messageCount": len(messages)
        })
    sessions_list.sort(key=lambda x: x["lastTimestamp"], reverse=True)
    return {"sessions": sessions_list}

@app.delete("/api/chat/history/{session_id}")
async def clear_chat_history(session_id: str, session: Dict[str, Any] = Depends(verify_session)):
    """Clear chat history for specific user+session."""
    username = session["username"]
    if username in chat_sessions and session_id in chat_sessions[username]:
        del chat_sessions[username][session_id]
    return {"message": "Chat history cleared"}

@app.get("/api/system/status")
async def get_system_status(session: Dict[str, Any] = Depends(verify_session)):
    """Get system status"""
    if not session["is_admin"]:
        raise HTTPException(status_code=403, detail="Admin access required")
    return {
        "system_health": "Healthy",
        "documents_processed": len(uploaded_documents),
        "active_sessions": len(user_sessions),
        "models_loaded": {
            "llm": llm is not None,
            "vlm_processor": vlm_processor is not None,
            "vlm_model": vlm_model is not None
        }
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0"
    }

# Exception handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status_code": exc.status_code}
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "status_code": 500}
    )

from fastapi import BackgroundTasks

@app.post("/api/documents/demo_ingest/{task_id}")
async def demo_ingest_document(task_id: str, background_tasks: BackgroundTasks, session: dict = Depends(verify_session)):
    if task_id not in DEMO_FILES:
        raise HTTPException(status_code=404, detail="Demo document not found")
    
    # Generate unique ingestion ID for task tracking
    file_path = DEMO_FILES[task_id]
    ingestion_id = task_id
    

    # Track ingestion task
    demo_ingestion_tasks[ingestion_id] = {
        "status": "processing",
        "file_path": file_path,
        "start_time": datetime.now().isoformat(),
        "message": "Starting demo ingestion"
    }

    # Start actual ingestion in background
    background_tasks.add_task(perform_demo_ingestion, ingestion_id, file_path, task_id)

    return {"message": "Demo ingestion started", "task_id": ingestion_id}


async def perform_demo_ingestion(ingestion_id: str, file_path: str, task_id:str):
    logger.info(f"Starting demo ingestion: task_id={task_id}, file_path={file_path}, filename={os.path.basename(file_path)}")
    processing_tasks[ingestion_id] = {
        "status": "processing",
        "progress": 0.0,
        "message": "Starting document processing...",
        "file_path": file_path,
        "filename": os.path.basename(file_path),
        "session_id": None,
        "start_time": datetime.now().isoformat()
    }
    
    try:
        # Await processing (which updates processing_tasks and uploaded_documents)
        await process_document(ingestion_id, file_path, os.path.basename(file_path))  # Reuse your existing processing method

        # After processing, assign metadata as needed
        demo_ingestion_tasks[ingestion_id]["status"] = "completed"
        demo_ingestion_tasks[ingestion_id]["message"] = "Demo ingestion completed"

    except Exception as e:
        logger.error(f"Demo ingestion error: {e}")
        demo_ingestion_tasks[ingestion_id]["status"] = "error"
        demo_ingestion_tasks[ingestion_id]["message"] = f"Demo ingestion failed: {str(e)}"

# Development server entrypoint
if __name__ == "__main__":
    uvicorn.run(
        "fastapi-backend:app",
        host="0.0.0.0", 
        port=8000,
        reload=True,
        log_level="info"
    )
