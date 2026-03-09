"""Process different document types and extract text with context."""
import os
import json
import pandas as pd
from pathlib import Path
from typing import List, Dict, Any
import PyPDF2
import docx
from PIL import Image
import pytesseract

class DocumentProcessor:
    """Extract text and structure from various document types."""
    
    @staticmethod
    def process_file(file_path: str) -> Dict[str, Any]:
        """
        Process a file and extract structured information.
        
        Returns:
            Dict with 'text', 'metadata', and 'sections'
        """
        file_path = Path(file_path)
        extension = file_path.suffix.lower()
        
        processors = {
            '.pdf': DocumentProcessor._process_pdf,
            '.docx': DocumentProcessor._process_docx,
            '.doc': DocumentProcessor._process_docx,
            '.txt': DocumentProcessor._process_txt,
            '.csv': DocumentProcessor._process_csv,
            '.xlsx': DocumentProcessor._process_excel,
            '.xls': DocumentProcessor._process_excel,
            '.json': DocumentProcessor._process_json,
            '.jpg': DocumentProcessor._process_image,
            '.jpeg': DocumentProcessor._process_image,
            '.png': DocumentProcessor._process_image,
        }
        
        processor = processors.get(extension, DocumentProcessor._process_txt)
        return processor(file_path)
    
    @staticmethod
    def _process_pdf(file_path: Path) -> Dict[str, Any]:
        """Extract text from PDF with page structure."""
        sections = []
        full_text = []
        
        try:
            with open(file_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                for i, page in enumerate(reader.pages):
                    text = page.extract_text()
                    if text.strip():
                        sections.append({
                            'type': 'page',
                            'number': i + 1,
                            'content': text.strip()
                        })
                        full_text.append(text.strip())
        except Exception as e:
            return {'text': '', 'metadata': {'error': str(e)}, 'sections': []}
        
        return {
            'text': '\n\n'.join(full_text),
            'metadata': {
                'type': 'pdf',
                'pages': len(sections),
                'filename': file_path.name
            },
            'sections': sections
        }
    
    @staticmethod
    def _process_docx(file_path: Path) -> Dict[str, Any]:
        """Extract text from Word documents with paragraph structure."""
        sections = []
        full_text = []
        
        try:
            doc = docx.Document(file_path)
            for i, para in enumerate(doc.paragraphs):
                text = para.text.strip()
                if text:
                    sections.append({
                        'type': 'paragraph',
                        'number': i + 1,
                        'content': text
                    })
                    full_text.append(text)
        except Exception as e:
            return {'text': '', 'metadata': {'error': str(e)}, 'sections': []}
        
        return {
            'text': '\n\n'.join(full_text),
            'metadata': {
                'type': 'docx',
                'paragraphs': len(sections),
                'filename': file_path.name
            },
            'sections': sections
        }
    
    @staticmethod
    def _process_txt(file_path: Path) -> Dict[str, Any]:
        """Extract text from plain text files."""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
            
            # Split into sections by double newlines
            sections = []
            for i, section in enumerate(text.split('\n\n')):
                if section.strip():
                    sections.append({
                        'type': 'section',
                        'number': i + 1,
                        'content': section.strip()
                    })
            
            return {
                'text': text,
                'metadata': {
                    'type': 'txt',
                    'sections': len(sections),
                    'filename': file_path.name
                },
                'sections': sections
            }
        except Exception as e:
            return {'text': '', 'metadata': {'error': str(e)}, 'sections': []}
    
    @staticmethod
    def _process_csv(file_path: Path) -> Dict[str, Any]:
        """Extract structured data from CSV."""
        try:
            df = pd.read_csv(file_path)
            
            # Create text representation
            text_parts = []
            text_parts.append(f"Dataset with {len(df)} rows and {len(df.columns)} columns")
            text_parts.append(f"Columns: {', '.join(df.columns)}")
            
            # Add sample data
            for col in df.columns:
                unique_values = df[col].dropna().unique()
                if len(unique_values) <= 10:
                    text_parts.append(f"{col}: {', '.join(map(str, unique_values[:10]))}")
            
            # Create sections from data patterns
            sections = []
            for col in df.columns:
                sections.append({
                    'type': 'column',
                    'name': col,
                    'content': f"{col} has {df[col].notna().sum()} values",
                    'sample': df[col].dropna().head(5).tolist()
                })
            
            return {
                'text': '\n'.join(text_parts),
                'metadata': {
                    'type': 'csv',
                    'rows': len(df),
                    'columns': list(df.columns),
                    'filename': file_path.name
                },
                'sections': sections,
                'dataframe': df.to_dict('records')[:100]  # Sample data
            }
        except Exception as e:
            return {'text': '', 'metadata': {'error': str(e)}, 'sections': []}
    
    @staticmethod
    def _process_excel(file_path: Path) -> Dict[str, Any]:
        """Extract structured data from Excel."""
        try:
            dfs = pd.read_excel(file_path, sheet_name=None)
            
            text_parts = []
            sections = []
            
            for sheet_name, df in dfs.items():
                text_parts.append(f"Sheet '{sheet_name}': {len(df)} rows, {len(df.columns)} columns")
                text_parts.append(f"Columns: {', '.join(df.columns)}")
                
                sections.append({
                    'type': 'sheet',
                    'name': sheet_name,
                    'content': f"{len(df)} rows with columns: {', '.join(df.columns)}",
                    'columns': list(df.columns)
                })
            
            return {
                'text': '\n'.join(text_parts),
                'metadata': {
                    'type': 'excel',
                    'sheets': list(dfs.keys()),
                    'filename': file_path.name
                },
                'sections': sections
            }
        except Exception as e:
            return {'text': '', 'metadata': {'error': str(e)}, 'sections': []}
    
    @staticmethod
    def _process_json(file_path: Path) -> Dict[str, Any]:
        """Extract structured data from JSON."""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
            
            # Create text representation
            text = json.dumps(data, indent=2)
            
            # Extract structure
            sections = []
            if isinstance(data, dict):
                for key, value in data.items():
                    sections.append({
                        'type': 'key',
                        'name': key,
                        'content': str(value)[:200]
                    })
            
            return {
                'text': text,
                'metadata': {
                    'type': 'json',
                    'keys': list(data.keys()) if isinstance(data, dict) else [],
                    'filename': file_path.name
                },
                'sections': sections,
                'data': data
            }
        except Exception as e:
            return {'text': '', 'metadata': {'error': str(e)}, 'sections': []}
    
    @staticmethod
    def _process_image(file_path: Path) -> Dict[str, Any]:
        """Extract text from images using OCR."""
        try:
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image)
            
            sections = []
            for i, line in enumerate(text.split('\n')):
                if line.strip():
                    sections.append({
                        'type': 'line',
                        'number': i + 1,
                        'content': line.strip()
                    })
            
            return {
                'text': text,
                'metadata': {
                    'type': 'image',
                    'size': image.size,
                    'filename': file_path.name
                },
                'sections': sections
            }
        except Exception as e:
            return {
                'text': '',
                'metadata': {
                    'type': 'image',
                    'error': str(e),
                    'filename': file_path.name
                },
                'sections': []
            }
