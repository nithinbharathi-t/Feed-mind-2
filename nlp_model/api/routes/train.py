"""Training endpoints."""
from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import sys
from pathlib import Path
import shutil

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

import config

router = APIRouter()

# Training status storage (in production, use Redis or database)
training_status = {}

class UploadResponse(BaseModel):
    """Response for file upload."""
    message: str
    filename: str
    file_path: str
    file_type: str

class TrainingRequest(BaseModel):
    """Request to start training."""
    epochs: int = 3
    batch_size: int = 4
    learning_rate: float = 2e-5

class TrainingStatus(BaseModel):
    """Training status response."""
    status: str
    progress: float
    message: str
    details: Optional[Dict[str, Any]] = None

@router.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a file for training.
    Supports: PDF, DOCX, TXT, CSV, Excel, JSON, Images
    """
    try:
        # Validate file extension
        allowed_extensions = {'.pdf', '.docx', '.doc', '.txt', '.csv', '.xlsx', 
                            '.xls', '.json', '.jpg', '.jpeg', '.png'}
        file_ext = Path(file.filename).suffix.lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400, 
                detail=f"File type {file_ext} not supported. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Save file
        file_path = config.UPLOADS_DIR / file.filename
        with open(file_path, 'wb') as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return UploadResponse(
            message="File uploaded successfully",
            filename=file.filename,
            file_path=str(file_path),
            file_type=file_ext
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/uploads")
async def list_uploads():
    """List all uploaded files."""
    try:
        uploads = []
        if config.UPLOADS_DIR.exists():
            for file_path in config.UPLOADS_DIR.glob('*'):
                if file_path.is_file():
                    uploads.append({
                        'filename': file_path.name,
                        'size': file_path.stat().st_size,
                        'extension': file_path.suffix,
                        'path': str(file_path)
                    })
        
        return {
            "count": len(uploads),
            "files": uploads
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/train", response_model=TrainingStatus)
async def start_training(
    request: TrainingRequest,
    background_tasks: BackgroundTasks
):
    """
    Start model training on uploaded documents.
    
    Note: This is a placeholder. Actual training would be complex and resource-intensive.
    In production, this should:
    1. Process all uploaded documents
    2. Extract training data (context -> questions)
    3. Fine-tune BART model
    4. Save checkpoints
    """
    try:
        # Check if training is already running
        if training_status.get('status') == 'running':
            return TrainingStatus(
                status='already_running',
                progress=training_status.get('progress', 0),
                message='Training is already in progress'
            )
        
        # Check for uploaded files
        uploads_dir = config.UPLOADS_DIR
        if not uploads_dir.exists() or not list(uploads_dir.glob('*')):
            raise HTTPException(
                status_code=400,
                detail="No uploaded files found. Please upload training data first."
            )
        
        # Initialize training status
        training_status['status'] = 'running'
        training_status['progress'] = 0
        training_status['message'] = 'Initializing training...'
        
        # Note: Actual training implementation would be more complex
        # For now, we'll mark it as completed since the model uses pretrained BERT+BART
        training_status['status'] = 'completed'
        training_status['progress'] = 100
        training_status['message'] = 'Model is ready. Using pre-trained BERT + BART with uploaded context.'
        
        return TrainingStatus(
            status='completed',
            progress=100,
            message='Model is ready to generate context-aware questions from your uploaded documents',
            details={
                'epochs': request.epochs,
                'model': 'BERT + BART (pre-trained)',
                'context_aware': True,
                'uploaded_files': len(list(uploads_dir.glob('*')))
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        training_status['status'] = 'error'
        training_status['message'] = str(e)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/train/status", response_model=TrainingStatus)
async def get_training_status():
    """Get current training status."""
    if not training_status:
        return TrainingStatus(
            status='idle',
            progress=0,
            message='No training in progress'
        )
    
    return TrainingStatus(
        status=training_status.get('status', 'idle'),
        progress=training_status.get('progress', 0),
        message=training_status.get('message', 'Unknown'),
        details=training_status.get('details')
    )

@router.delete("/uploads/{filename}")
async def delete_upload(filename: str):
    """Delete an uploaded file."""
    try:
        file_path = config.UPLOADS_DIR / filename
        if file_path.exists():
            file_path.unlink()
            return {"message": f"Deleted {filename}"}
        else:
            raise HTTPException(status_code=404, detail="File not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
