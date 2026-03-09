"""Configuration for the NLP model system."""
import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = DATA_DIR / "uploads"
PROCESSED_DIR = DATA_DIR / "processed"
CHECKPOINTS_DIR = BASE_DIR / "checkpoints"
MODELS_DIR = BASE_DIR / "models"

# Create directories
for directory in [DATA_DIR, UPLOADS_DIR, PROCESSED_DIR, CHECKPOINTS_DIR, MODELS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

# Model settings
BERT_MODEL = "sentence-transformers/all-MiniLM-L6-v2"  # Fast and accurate
QUESTION_MODEL = "facebook/bart-large-cnn"  # Better for text generation
MAX_LENGTH = 512
BATCH_SIZE = 8

# Training settings
LEARNING_RATE = 2e-5
EPOCHS = 10
WARMUP_STEPS = 500

# API settings
API_HOST = "0.0.0.0"
API_PORT = 8000

# Question generation settings
MIN_CONTEXT_SIMILARITY = 0.6  # Minimum similarity to consider context relevant
MAX_QUESTIONS_PER_CONTEXT = 5
QUESTION_TYPES = [
    "text",
    "textarea", 
    "email",
    "tel",
    "number",
    "radio",
    "checkbox",
    "select",
    "rating",
    "date"
]
