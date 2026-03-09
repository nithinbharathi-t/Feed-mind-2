"""Health check endpoints."""
from fastapi import APIRouter
import torch

router = APIRouter()

@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "gpu_available": torch.cuda.is_available(),
        "device": "cuda" if torch.cuda.is_available() else "cpu"
    }

@router.get("/status")
async def get_status():
    """Get system status."""
    return {
        "api_version": "2.0.0",
        "status": "operational",
        "features": {
            "question_generation": True,
            "context_analysis": True,
            "document_upload": True,
            "model_training": True
        },
        "gpu_available": torch.cuda.is_available()
    }
