# AI Model Training System - FeedMind Platform

## Overview

This repository contains a comprehensive AI model training system that allows users to upload data (documents, PDFs, images, CSVs, etc.), train a global AI model, and use the trained model to generate intelligent survey questions.

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                    USER INTERFACE (Next.js)                        │
├────────────────────────────────────────────────────────────────────┤
│  Data Upload Page     │  Form Builder     │  AI Suggestion Panel   │
│  - File Upload UI     │  - Question Cards │  - Generate Questions  │
│  - Training Trigger   │  - Drag & Drop    │  - Quick Prompts       │
│  - Status Monitor     │  - AI Integration │  - Auto-complete       │
└───────────┬───────────────────────────┬───────────┬────────────────┘
            │                           │           │
            ▼                           ▼           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API LAYER (Next.js API Routes)              │
├─────────────────────────────────────────────────────────────────┤
│  /api/data/upload    │ /api/data/train  │ Server Actions        │
│  - File validation   │ - Training mgmt  │ - generateQuestions   │
│  - Storage           │ - Status polling │ - getModelInfo        │
└───────────┬────────────────────────────────────┬────────────────┘
            │                                    │
            ▼                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│              PYTHON NLP API (FastAPI)                           │
├─────────────────────────────────────────────────────────────────┤
│  /api/v1/questions/generate     │  /api/v1/questions/model-info │
│  - Question generation          │  - Model status               │
│  - Trained model inference      │  - Training metrics           │
└───────────┬─────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   TRAINING & INFERENCE LAYER                    │
├──────────────────────────┬──────────────────────────────────────┤
│  train_question_generator.py   │  question_predictor.py         │
│  - Data loading          │  - Model loading                     │
│  - Text extraction       │  - Question generation               │
│  - Model training        │  - Type inference                    │
│  - T5 fine-tuning        │  - Template fallback                 │
└──────────────────────────┴──────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TRAINED MODEL (T5-small)                     │
│  - Converts context/prompt → Survey questions                   │
│  - Globally accessible to all platform users                    │
│  - Continuously improves with more training data                │
└─────────────────────────────────────────────────────────────────┘
```

## Features

### 1. **Universal Data Upload**
- **Supported Formats**: CSV, PDF, DOCX, DOC, TXT, MD, JSON, XML, JPG, PNG, GIF, WEBP, BMP, TIFF
- **Size Limit**: 10MB per file
- **Automatic Processing**: Text extraction from images (OCR), PDFs, and Office documents
- **Global Access**: Anyone can upload data to improve the communitymodel

### 2. **Intelligent Training Pipeline**
- **Model**: T5-small (60M parameters) fine-tuned for question generation
- **Training Process**:
  ```
  Uploaded Files → Text Extraction → Pattern Recognition → 
  T5 Fine-tuning → Model Checkpointing → Global Deployment
  ```
- **Training Time**: 5-15 minutes depending on data volume
- **GPU Support**: Automatic CUDA detection for faster training
- **Early Stopping**: Prevents overfitting with validation monitoring

### 3. **Question Generation**
- **Input**: User prompt (e.g., "customer feedback survey")
- **Output**: 5-10 contextually relevant survey questions
- **Question Types**: Text, Textarea, Radio, Checkbox, Select, Email, Tel
- **Features**:
  - Automatic question type inference
  - Smart placeholder generation
  - Option generation for multiple-choice questions
  - Template fallback when model is unavailable

### 4. **Real-time Training Monitoring**
- Progress bar with percentage completion
- Status updates (pending, running, completed, failed)
- Training metrics display
- Automatic model reload after training

## Installation & Setup

### Prerequisites
```bash
- Node.js 18+ and npm/yarn
- Python 3.10+
- pip
- Tesseract OCR (for image text extraction)
```

### 1. Install Python Dependencies
```bash
cd nlp_model
pip install -r requirements.txt
python -m nltk.downloader punkt
```

### 2. Install Tesseract OCR (for image processing)
**Windows:**
```bash
# Download and install from: https://github.com/UB-Mannheim/tesseract/wiki
# Add to PATH: C:\Program Files\Tesseract-OCR
```

**Linux/Mac:**
```bash
sudo apt-get install tesseract-ocr  # Ubuntu/Debian
brew install tesseract               # macOS
```

### 3. Start the NLP API Server
```bash
cd nlp_model
python run_api.py
```
The API will be available at `http://localhost:8000`

### 4. Start the Next.js Application
```bash
# In the project root
npm install
npm run dev
```
The web app will be available at `http://localhost:3000`

## Usage Guide

### For Data Contributors (Anyone)

1. **Navigate to Data Upload Page**
   - Click "Upload Training Data" in the navigation bar
   - Or go to `/data-upload`

2. **Upload Your Data**
   - Drag & drop files or click to browse
   - Supported: PDFs (brochures, forms), CSVs (feedback data), Images (screenshots), Documents (Word, Text)
   - Files are automatically processed and added to the training dataset

3. **Train the Model**
   - Once files are uploaded, click "Start Training"
   - Monitor progress in real-time
   - Training typically takes 5-15 minutes
   - The trained model becomes available to everyone immediately

### For Survey Creators (Anyone)

1. **Create a New Form**
   - Go to "Forms" → "Create New Form"
   - Enter form title and description

2. **Use AI Suggestion**
   - Look for the "AI Suggestion" panel on the right
   - See "Quick Prompts" for common survey types
   - Or enter a custom prompt (e.g., "event registration feedback")
   - Click the send button

3. **Review Generated Questions**
   - AI generates 5 contextually relevant questions
   - Each question has appropriate type (text, radio, textarea, etc.)
   - Click individual questions to add them
   - Or click "Accept all questions"

4. **Customize & Publish**
   - Edit questions as needed
   - Add/remove options for multiple-choice questions
   - Publish your form

## Technical Details

### Training Data Processing

#### CSV Files
```python
# Expected columns (flexible):
- feedback_text, comment, text, description, review (for main content)
- rating, score (for ratings)
- category (for categorization)
```

#### PDF/DOCX Files
```python
# Automatic text extraction
- Splits into 500-word chunks
- Generates context-aware questions for each chunk
- Supports multi-page documents
```

#### Images
```python
# OCR processing with Tesseract
- Extracts text from screenshots, photos, scanned documents
- Supports: JPG, PNG, GIF, WEBP, BMP, TIFF
```

#### JSON/XML
```python
# Structured data parsing
- Analyzes keys/values
- Generates questions based on data structure
```

### Model Architecture

**Base Model**: `t5-small` (Text-To-Text Transfer Transformer)
- **Parameters**: 60 million
- **Task**: Conditional text generation
- **Input**: `"generate questions: {context}"`
- **Output**: `"Question 1? | Question 2? | Question 3?"`

**Training Configuration**:
```python
{
  "epochs": 10,
  "batch_size": 8,
  "learning_rate": 5e-4,
  "max_input_length": 512,
  "max_output_length": 256,
  "num_beams": 4,
  "temperature": 0.8
}
```

**Training Process**:
1. Load uploaded files from `nlp_model/data/raw/uploads/`
2. Extract text and generate training pairs
3. Augment with base question patterns
4. Fine-tune T5 model
5. Save to `nlp_model/models/question_generator/`
6. Model automatically loads for inference

### API Endpoints

#### Data Upload
```typescript
POST /api/data/upload
Content-Type: multipart/form-data

Body: FormData with file

Response: {
  success: true,
  filename: string,
  size: number,
  path: string
}
```

#### Start Training
```typescript
POST /api/data/train
Content-Type: application/json

Body: {
  trainingType: "question_generation",
  config: {
    epochs: 10,
    batch_size: 8,
    learning_rate: 0.0005
  }
}

Response: {
  success: true,
  jobId: string,
  status: object
}
```

#### Get Training Status
```typescript
GET /api/data/train?jobId={jobId}

Response: {
  jobId: string,
  status: "pending" | "running" | "completed" | "failed",
  progress: number,
  message: string,
  startedAt: string,
  completedAt?: string,
  error?: string
}
```

#### Generate Questions (Python API)
```python
POST http://localhost:8000/api/v1/questions/generate
Content-Type: application/json

Body: {
  "prompt": "customer satisfaction survey",
  "num_questions": 5,
  "temperature": 0.8,
  "use_trained_model": true
}

Response: {
  "questions": [...],
  "model_used": "trained_model" | "fallback_templates",
  "prompt": string,
  "num_generated": number
}
```

## File Structure

```
nlp_model/
├── training/
│   └── train_question_generator.py   # Main training script
├── inference/
│   └── question_predictor.py         # Inference for trained model
├── api/
│   ├── app.py                        # FastAPI application
│   └── routes/
│       └── questions.py              # Question generation endpoints
├── data/
│   └── raw/
│       └── uploads/                  # User-uploaded files
├── models/
│   └── question_generator/           # Trained model storage
├── checkpoints/
│   └── question_gen/                 # Training checkpoints
└── requirements.txt                  # Python dependencies

app/(dashboard)/
└── data-upload/
    └── page.tsx                      # Data upload page

components/
├── data/
│   └── data-upload-form.tsx          # Upload UI + Training trigger
└── forms/
    └── ai-prompt-panel.tsx           # AI suggestion panel

server/actions/
└── ai.ts                             # Server actions for AI features

app/api/
├── data/
│   ├── upload/route.ts               # File upload API
│   └── train/route.ts                # Training management API
```

## Best Practices

### For Data Upload
- **Quality over Quantity**: Upload well-structured, relevant data
- **Diverse Sources**: Include various document types for better model generalization
- **Regular Updates**: Re-train periodically as new data is uploaded
- **File Size**: Keep individual files under 10MB

### For Question Generation
- **Specific Prompts**: Use descriptive prompts (e.g., "product feedback survey for mobile app")
- **Review Output**: Always review and customize generated questions
- **Quick Prompts**: Use provided templates for common scenarios
- **Iteration**: Try different prompts if results aren't satisfactory

### For Model Training
- **Minimum Data**: Have at least 10-20 uploaded files before training
- **Avoid Interruption**: Don't close browser during training
- **Check Logs**: Monitor training progress and logs
- **Test After Training**: Verify model improvements with test prompts

## Troubleshooting

### Model Not Loading
```bash
# Check if model directory exists
ls nlp_model/models/question_generator/

# Retrain if necessary
cd nlp_model
python training/train_question_generator.py
```

### Training Fails
```bash
# Check Python dependencies
pip install -r requirements.txt

# Check CUDA availability (optional, for GPU)
python -c "import torch; print(torch.cuda.is_available())"

# Check logs
tail -f nlp_model/logs/*.log
```

### OCR Issues
```bash
# Verify Tesseract installation
tesseract --version

# On Windows, ensure PATH includes Tesseract
echo %PATH% | findstr Tesseract
```

### API Connection Issues
```bash
# Verify NLP API is running
curl http://localhost:8000/health

# Check NLP_API_URL environment variable
echo $NLP_API_URL  # Should be http://localhost:8000
```

## Performance Optimization

### For Large Datasets
- Train with GPU (`CUDA_VISIBLE_DEVICES=0 python training/train_question_generator.py`)
- Increase batch size if you have enough memory
- Use gradient accumulation for large batches

### For Production
- Use model quantization (INT8) for faster inference
- Cache frequent prompts and their results
- Use Redis for training status instead of in-memory storage
- Deploy NLP API with multiple workers

## Security Considerations

- **Authentication**: All API endpoints require user authentication
- **File Validation**: Strict file type and size validation
- **Virus Scanning**: Consider adding virus scanning for uploaded files (production)
- **Rate Limiting**: Implement rate limits on training endpoints
- **Data Privacy**: Ensure compliance with data protection regulations

## Future Enhancements

- [ ] Multi-language support
- [ ] Advanced question types (matrix, ranking, etc.)
- [ ] Question quality scoring
- [ ] Automatic question categorization
- [ ] Batch question generation
- [ ] Fine-grained training controls
- [ ] Model versioning and rollback
- [ ] A/B testing for generated questions
- [ ] Question analytics and optimization

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

[Your License Here]

## Support

For issues, questions, or feature requests, please:
- Open an issue on GitHub
- Contact support
- Check documentation at `/docs`

---

**Built with ❤️ for the feedback community**
