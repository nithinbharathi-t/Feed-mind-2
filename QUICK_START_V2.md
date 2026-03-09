# 🚀 Quick Start - NLP v2.0

## ⚡ 5-Minute Setup

### 1. Install Dependencies

```bash
# Install Python packages
cd nlp_model
pip install -r requirements.txt
```

### 2. Start the NLP API

```bash
python run_api.py
```

You should see:
```
================================================================================
  FeedMind NLP API v2.0 - BERT-based Question Generation
================================================================================

🧠 Using BERT for context understanding
📝 Using BART for question generation
🎯 Generates specific, context-aware questions

API will be available at: http://localhost:8000
Documentation at: http://localhost:8000/docs
```

### 3. Start Next.js (in another terminal)

```bash
npm run dev
```

### 4. Test It!

1. **Go to data upload page** (via navbar)
2. **Upload a document** (try a PDF about customer feedback, employee surveys, etc.)
3. **Go to form builder**
4. **Enter a prompt** in AI Suggestion panel: "customer satisfaction questions"
5. **Watch the magic!** 🎉

## 📝 Example Workflow

### Upload Training Data

**Example documents to upload:**
- Customer feedback reports (PDF)
- Survey results (CSV/Excel)
- Product reviews (TXT)
- Support tickets (DOCX)

### Generate Questions

**In Form Builder, try these prompts:**
- "customer satisfaction survey"
- "employee feedback questions"
- "product review questionnaire"
- "service quality assessment"

### See the Difference!

**Without uploaded data:**
```
❌ "How would you rate your experience?" (generic)
❌ "What can we improve?" (generic)
```

**With uploaded data:**
```
✅ "How would you rate the response time of our support team?" (specific!)
✅ "Which aspects of our service met your expectations?" (with options from your documents!)
✅ "Please describe your experience with our product return process" (context-specific!)
```

## 🎯 Pro Tips

1. **Upload before generating** - The system needs context from your documents
2. **Use multiple document types** - PDFs, CSVs, Word docs all work
3. **Be specific in prompts** - "employee onboarding survey" > "survey"
4. **Check the message** - It tells you how many documents were used
5. **Edit the questions** - AI provides great starting points, customize as needed

## 🐛 Troubleshooting

### "NLP API unavailable"
→ Make sure `python run_api.py` is running

### "Using fallback templates"
→ Upload some documents first! Go to Data Upload page

### Slow first request
→ Normal! Models are loading. Takes 10-20 seconds first time, then fast

### Questions still generic
→ Upload more relevant documents related to your prompt topic

## 🎨 What Makes v2.0 Different?

### Old System:
```typescript
prompt: "customer survey"
↓
❌ Generic questions (same every time)
```

### New System:
```typescript
prompt: "customer survey"
↓
📄 Analyze uploaded customer feedback docs
↓
🧠 Extract topics: "service", "quality", "support", "delivery"
↓
✅ Generate specific questions about YOUR business
```

## 📊 Monitoring API Health

Visit http://localhost:8000/docs for interactive API documentation

**Key endpoints:**
- `/api/health` - Check if API is running
- `/api/v1/questions/model-info` - See loaded models
- `/api/v1/questions/analyze-context` - Debug context analysis

## 🎓 Learning Resources

1. **Upload example data** - Find sample CSVs/PDFs online about surveys
2. **Try different prompts** - See how context changes questions
3. **Inspect API responses** - Check the "generated_from_context" field
4. **Read the README** - Full documentation in `nlp_model/README.md`

---

**Happy question generating! 🎉**

If you see "Generated from X documents using BERT context analysis" - you're using the new smart system! 🧠✨
