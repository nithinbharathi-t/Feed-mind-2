"""Question generation endpoints."""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

from core.question_generator import QuestionGenerator
from core.context_analyzer import ContextAnalyzer
from utils.document_processor import DocumentProcessor
import config

router = APIRouter()

# Global instances (lazily loaded)
_generator = None
_processor = None

def get_generator():
    """Get or create question generator instance."""
    global _generator
    if _generator is None:
        print("Loading question generator...")
        _generator = QuestionGenerator()
        print("✅ Question generator loaded")
    return _generator

def get_processor():
    """Get or create document processor instance."""
    global _processor
    if _processor is None:
        _processor = DocumentProcessor()
    return _processor

class GenerateRequest(BaseModel):
    """Request model for question generation."""
    prompt: str
    num_questions: int = 5
    use_uploaded_data: bool = True

class QuestionResponse(BaseModel):
    """Response model for generated questions."""
    questions: List[Dict[str, Any]]
    generated_from_context: bool
    num_documents_used: int
    message: str

@router.post("/questions/generate", response_model=QuestionResponse)
async def generate_questions(request: GenerateRequest):
    """
    Generate questions based on prompt and uploaded documents.
    
    This endpoint:
    1. Analyzes all uploaded documents using BERT
    2. Extracts relevant context for the prompt
    3. Generates specific questions with appropriate types and options
    """
    try:
        generator = get_generator()
        processor = get_processor()
        
        uploaded_documents = []
        
        # Load and process uploaded documents if requested
        if request.use_uploaded_data:
            uploads_dir = config.UPLOADS_DIR
            if uploads_dir.exists():
                for file_path in uploads_dir.glob('*'):
                    if file_path.is_file():
                        try:
                            doc = processor.process_file(str(file_path))
                            if doc.get('text'):
                                uploaded_documents.append(doc)
                        except Exception as e:
                            print(f"Error processing {file_path}: {e}")
        
        # Generate questions
        questions = generator.generate_questions(
            prompt=request.prompt,
            num_questions=request.num_questions,
            uploaded_documents=uploaded_documents if uploaded_documents else None
        )
        
        return QuestionResponse(
            questions=questions,
            generated_from_context=len(uploaded_documents) > 0,
            num_documents_used=len(uploaded_documents),
            message=f"Generated {len(questions)} questions" + 
                    (f" from {len(uploaded_documents)} documents" if uploaded_documents else " using templates")
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/questions/model-info")
async def get_model_info():
    """Get information about the loaded model."""
    generator = get_generator()
    
    return {
        "model_loaded": generator.model is not None,
        "model_type": "BERT + BART",
        "context_analyzer": "sentence-transformers/all-MiniLM-L6-v2",
        "question_generator": "facebook/bart-large-cnn",
        "features": [
            "Context extraction from documents",
            "Topic clustering",
            "Entity recognition",
            "Semantic similarity matching",
            "Context-specific question generation"
        ],
        "status": "operational"
    }

@router.post("/questions/analyze-context")
async def analyze_context(prompt: str):
    """
    Analyze context for a prompt using uploaded documents.
    Useful for debugging and understanding what contexts are being used.
    """
    try:
        processor = get_processor()
        analyzer = ContextAnalyzer()
        
        uploaded_documents = []
        uploads_dir = config.UPLOADS_DIR
        
        if uploads_dir.exists():
            for file_path in uploads_dir.glob('*'):
                if file_path.is_file():
                    try:
                        doc = processor.process_file(str(file_path))
                        if doc.get('text'):
                            uploaded_documents.append(doc)
                    except Exception as e:
                        print(f"Error processing {file_path}: {e}")
        
        if not uploaded_documents:
            return {
                "message": "No documents uploaded",
                "contexts": []
            }
        
        # Analyze all documents
        all_contexts = []
        for doc in uploaded_documents:
            analysis = analyzer.analyze_document(doc)
            all_contexts.extend(analysis.get('question_contexts', []))
        
        # Find relevant contexts for prompt
        relevant_contexts = analyzer.find_similar_contexts(prompt, all_contexts, top_k=5)
        
        return {
            "message": f"Found {len(all_contexts)} contexts from {len(uploaded_documents)} documents",
            "num_documents": len(uploaded_documents),
            "total_contexts": len(all_contexts),
            "relevant_contexts": [
                {
                    "context": ctx,
                    "similarity": float(sim),
                    "relevance": "high" if sim > 0.7 else "medium" if sim > 0.4 else "low"
                }
                for ctx, sim in relevant_contexts
            ]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
