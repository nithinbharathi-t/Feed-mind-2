"""Main FastAPI application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import generate, train, health

app = FastAPI(
    title="FeedMind NLP API",
    description="BERT-based question generation API with context understanding",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your Next.js URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(generate.router, prefix="/api/v1", tags=["generation"])
app.include_router(train.router, prefix="/api/v1", tags=["training"])

@app.on_event("startup")
async def startup_event():
    """Initialize models on startup."""
    print("🚀 Starting FeedMind NLP API v2.0")
    print("📊 Loading models...")
    # Models are loaded lazily on first request

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    print("👋 Shutting down FeedMind NLP API")

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "FeedMind NLP API v2.0",
        "status": "running",
        "docs": "/docs",
        "version": "2.0.0"
    }
