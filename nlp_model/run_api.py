"""Run the FastAPI server."""
import uvicorn
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent))

if __name__ == "__main__":
    print("=" * 80)
    print("  FeedMind NLP API v2.0 - BERT-based Question Generation")
    print("=" * 80)
    print()
    print("🧠 Using BERT for context understanding")
    print("📝 Using BART for question generation")
    print("🎯 Generates specific, context-aware questions")
    print()
    print("API will be available at: http://localhost:8000")
    print("Documentation at: http://localhost:8000/docs")
    print()
    print("=" * 80)
    
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
