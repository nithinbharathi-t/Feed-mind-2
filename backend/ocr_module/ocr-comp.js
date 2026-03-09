import express from 'express';
import multer from 'multer';
import { createWorker } from 'tesseract.js';
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

const app = express();
const port = 3000;
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
const model = "gemini-2.5-flash";

const upload = multer({ storage: multer.memoryStorage() });

const ocrAndRefine = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided.' });

    const worker = await createWorker('eng');
    const { data: { text: rawText } } = await worker.recognize(req.file.buffer);
    await worker.terminate();

    if (!rawText.trim()) {
      return res.status(422).json({ error: "Could not detect any text in image." });
    }

    const prompt = `
      The following text was extracted from an image using OCR. 
      It may contain typos or formatting errors. 
      Please clean it up, correct any obvious spelling mistakes, 
      and return a structured, readable version of the content.
      
      RAW TEXT:
      "${rawText}"
    `;

    const result = await ai.models.generateContent({
      model: model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    res.status(200).json({
      success: true,
      original_ocr: rawText,
      refined_text: result.text,
    });

  } catch (error) {
    console.error('Processing Error:', error);
    res.status(500).json({ error: 'Failed to process image and refine data.' });
  }
};

app.post('/api/process-image', upload.single('image'), ocrAndRefine);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});