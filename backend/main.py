import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import all routers
from app.api.routes.auth import router as auth_router
from app.api.routes.documents import router as documents_router
from app.api.routes.chats import router as chats_router

# Create FastAPI app
app = FastAPI(
    title="Document Q&A API",
    description="API for document question answering with visual content support",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Your React frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Include all routers
app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(chats_router)

# Root endpoint for testing
@app.get("/")
def read_root():
    return {"message": "Welcome to Document Q&A API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/v1/test-auth")
def test_auth():
    """Test endpoint that doesn't require authentication"""
    return {
        "message": "Auth API is working", 
        "demo_users": ["admin", "user"],
        "admin_password": "admin123",
        "user_password": "user123"
    }

# Add the list-routes endpoint
@app.get("/list-routes")
def list_routes():
    routes = []
    for route in app.routes:
        routes.append({
            "path": route.path,
            "name": route.name,
            "methods": route.methods
        })
    return {"available_routes": routes}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)