
import base64
from PIL import Image
import io

# 1. Load your local image
main_image = Image.open("input.png").convert("RGB")

# 2. Convert to base64 (to satisfy the 'messages' structure)
buffered = io.BytesIO()
main_image.save(buffered, format="PNG")
image_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

# 3. The rest of your 'messages' and 'processor' code remains the same
import torch
import base64
import urllib.request
import io
from PIL import Image
from transformers import AutoProcessor, Qwen2_5_VLForConditionalGeneration

# These are the specific olmOCR imports that were likely missing:
from olmocr.data.renderpdf import render_pdf_to_base64png
from olmocr.prompts import build_no_anchoring_v4_yaml_prompt
import torch
import base64
import urllib.request
import io
from PIL import Image
from transformers import AutoProcessor, Qwen2_5_VLForConditionalGeneration

# These are the specific olmOCR imports that were likely missing:
from olmocr.data.renderpdf import render_pdf_to_base64png
from olmocr.prompts import build_no_anchoring_v4_yaml_prompt

import torch
import base64
import urllib.request
import io
from io import BytesIO
from PIL import Image
from transformers import AutoProcessor, Qwen2_5_VLForConditionalGeneration

# 1. IMPORT OLMOCR SPECIFIC TOOLS
try:
    from olmocr.data.renderpdf import render_pdf_to_base64png
    from olmocr.prompts import build_no_anchoring_v4_yaml_prompt
except ImportError:
    print("Error: olmocr library not found. Run: pip install olmocr")

# 2. CONFIGURATION & MODEL LOADING
model_id = "allenai/olmOCR-2-7B-1025"
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print(f"Loading model to {device}... (This may take a minute)")

# Load the processor (using the base Qwen2.5-VL instruct processor)
processor = AutoProcessor.from_pretrained("Qwen/Qwen2.5-VL-7B-Instruct")

# Load the model
model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
    model_id,
    torch_dtype=torch.bfloat16
).eval().to(device)

# 3. PREPARE THE INPUT
# Option A: From a PDF (uncomment if using a PDF)
# urllib.request.urlretrieve("https://olmocr.allenai.org/papers/olmocr.pdf", "./paper.pdf")
# image_base64 = render_pdf_to_base64png("./paper.pdf", 1, target_longest_image_dim=1288)

# Option B: From a local Image file (e.g., "my_page.png")
# Let's assume you have an image; we convert it to base64 for the prompt format
image_path = "input.png" # <--- CHANGE THIS to your filename
main_image = Image.open(image_path).convert("RGB")

buffered = io.BytesIO()
main_image.save(buffered, format="PNG")
image_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

# 4. BUILD THE MULTIMODAL PROMPT
messages = [
    {
        "role": "user",
        "content": [
            {"type": "text", "text": build_no_anchoring_v4_yaml_prompt()},
            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_base64}"}},
        ],
    }
]

# 5. PROCESSING & GENERATION
# Apply chat template
text_prompt = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)

# Prepare inputs for the model
inputs = processor(
    text=[text_prompt],
    images=[main_image],
    padding=True,
    return_tensors="pt",
).to(device)

print("Generating OCR output...")

with torch.no_grad():
    output = model.generate(
        **inputs,
        temperature=0.1,
        max_new_tokens=1000, # Increased to capture more text
        num_return_sequences=1,
        do_sample=True,
    )

# 6. DECODE AND PRINT
prompt_length = inputs["input_ids"].shape[1]
new_tokens = output[:, prompt_length:]
text_output = processor.tokenizer.batch_decode(
    new_tokens, skip_special_tokens=True
)

print("\n--- OCR RESULT ---")
print(text_output[0])
import torch
import base64
import urllib.request
import io
from PIL import Image
from transformers import AutoProcessor, Qwen2_5_VLForConditionalGeneration

# These are the specific olmOCR imports that were likely missing:
from olmocr.data.renderpdf import render_pdf_to_base64png
from olmocr.prompts import build_no_anchoring_v4_yaml_prompt
# Build the full prompt
messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": build_no_anchoring_v4_yaml_prompt()},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_base64}"}},
                ],
            }
        ]

# Apply the chat template and processor
text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
main_image = Image.open(BytesIO(base64.b64decode(image_base64)))

inputs = processor(
    text=[text],
    images=[main_image],
    padding=True,
    return_tensors="pt",
)
inputs = {key: value.to(device) for (key, value) in inputs.items()}


# Generate the output
output = model.generate(
    **inputs,
    temperature=0.1,
    max_new_tokens=2000, # Increased for full page transcription
    do_sample=True,
)

# Decode the output
prompt_length = inputs["input_ids"].shape[1]
new_tokens = output[:, prompt_length:]
text_output = processor.tokenizer.batch_decode(
    new_tokens, skip_special_tokens=True
)


print(text_output)
# ['---\nprimary_language: en\nis_rotation_valid: True\nrotation_correction: 0\nis_table: False\nis_diagram: False\n---\nolmOCR: Unlocking Trillions of Tokens in PDFs with Vision Language Models\n\nJake Poz']

