# Quick Start Guide - AI Model Training System

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies (One-time setup)

#### Python Environment
```bash
cd nlp_model

# Install Python packages
pip install -r requirements.txt

# Download NLTK data
python -c "import nltk; nltk.download('punkt')"
```

#### Install Tesseract OCR (for image processing)
- **Windows**: Download from https://github.com/UB-Mannheim/tesseract/wiki
- **Linux**: `sudo apt-get install tesseract-ocr`
- **macOS**: `brew install tesseract`

#### Node.js Dependencies
```bash
# In project root
npm install
```

### Step 2: Start the Servers

#### Terminal 1 - Python NLP API
```bash
cd nlp_model
python run_api.py
```
✅ API running at `http://localhost:8000`

#### Terminal 2 - Next.js App
```bash
npm run dev
```
✅ Web app running at `http://localhost:3000`

### Step 3: Upload Training Data

1. Navigate to http://localhost:3000/data-upload
2. Drag & drop files or click to upload:
   - **PDFs**: Product brochures, event flyers
   - **CSVs**: Feedback data with columns like `feedback_text`, `rating`
   - **Images**: Screenshots, scanned forms
   - **Documents**: Word docs, text files

3. Click **"Start Training"** button
4. Wait 5-15 minutes for training to complete

### Step 4: Generate Questions

1. Go to "Forms" → "Create New Form"
2. Enter form title and click "Create"
3. In the **AI Suggestion** panel on the right:
   - Try a quick prompt like **"Customer satisfaction survey"**
   - Or enter custom prompt: **"event registration for tech conference"**
4. Click send and watch AI generate questions!
5. Click questions to add them to your form

## 📊 Example Data Formats

### CSV Format
```csv
feedback_text,rating,category
"The dashboard is confusing and cluttered",2,ui
"Great customer service, very helpful!",5,support
"App crashes frequently on iPhone",1,bug
```

### JSON Format
```json
{
  "survey_type": "customer_feedback",
  "topics": ["usability", "performance", "support"],
  "target_audience": "mobile_app_users"
}
```

## 🎯 Quick Prompts Examples

Try these in the AI Suggestion panel:

- `"customer service feedback survey"`
- `"product review questionnaire"`
- `"event registration form for workshop"`
- `"employee satisfaction survey"`
- `"website usability feedback"`
- `"post-purchase experience"`

## 🔧 Troubleshooting

### NLP API not responding?
```bash
# Check if running
curl http://localhost:8000/health

# Restart if needed
cd nlp_model
python run_api.py
```

### Training stuck?
- Check console in Terminal 1 for error messages
- Ensure you have uploaded at least 1 file
- Check disk space for model storage

### No GPU detected (optional)?
```bash
# Check CUDA availability
python -c "import torch; print(torch.cuda.is_available())"
# If False, training will use CPU (slower but works fine)
```

## 📝 Pro Tips

1. **Upload diverse data** - Mix PDFs, CSVs, and images for better model
2. **Retrain periodically** - As more users upload data, retrain for improvements
3. **Use specific prompts** - Instead of "survey", try "customer satisfaction survey for SaaS product"
4. **Review & customize** - Always review AI-generated questions and adjust as needed

## 🎓 Understanding the System

```
[User Uploads Data] → [Files Stored & Processed] → [Train Model] 
                                                         ↓
[Anyone Can Use] ← [Global Trained Model] ← [Training Complete]
```

### What happens during training?
1. System reads all uploaded files
2. Extracts text (OCR for images, parsing for PDFs)
3. Analyzes patterns and feedback structures
4. Fine-tunes T5 model to generate relevant questions
5. Saves trained model for everyone to use

### What makes the model better?
- **More data** from diverse sources
- **Quality content**: Real feedback, actual survey examples
- **Variety**: Different topics and question styles
- **Regular retraining**: Incorporates new patterns

## 🚨 Common Issues

| Problem | Solution |
|---------|----------|
| "Cannot reach NLP server" | Start Python API: `cd nlp_model && python run_api.py` |
| "Training failed" | Check Terminal 1 logs, ensure adequate disk space |
| "Model not found" | Complete at least one training session |
| "OCR not working" | Install Tesseract OCR |
| Import errors | Run `pip install -r requirements.txt` |

## 🎉 Success Checklist

- [ ] Python API running on port 8000
- [ ] Next.js app running on port 3000
- [ ] At least 1 file uploaded
- [ ] Training completed successfully (100%)
- [ ] AI generates questions when you enter a prompt
- [ ] Questions can be added to forms

## 📞 Need Help?

- Check [Main Documentation](AI_TRAINING_SYSTEM_README.md)
- Review [nlp_model/README.md](nlp_model/README.md)
- Open an issue on GitHub

---

**Enjoy building intelligent surveys! 🎨✨**
