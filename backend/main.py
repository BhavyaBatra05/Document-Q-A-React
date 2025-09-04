import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import auth router
from app.api.routes.auth import router as auth_router  # Import the existing auth router

# Create FastAPI app
app = FastAPI(
    title="Document Q&A API",
    description="API for document question answering with visual content support",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Your React frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include auth router
app.include_router(auth_router)  # Add this line to include the auth router

# Root endpoint for testing
@app.get("/")
def read_root():
    return {"message": "Welcome to Document Q&A API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

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