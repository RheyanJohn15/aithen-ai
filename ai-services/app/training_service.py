"""
Training Service for Knowledge Base Embeddings

Handles file processing, text chunking, embedding generation, and storage.
"""

import os
import json
import asyncio
from typing import List, Dict, Any, Optional
import httpx
from pathlib import Path
import mimetypes

# File processing libraries
try:
    import PyPDF2
    HAS_PDF = True
except ImportError:
    HAS_PDF = False

try:
    from docx import Document
    HAS_DOCX = True
except ImportError:
    HAS_DOCX = False

try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

try:
    import openpyxl
    HAS_XLSX = True
except ImportError:
    HAS_XLSX = False

# Embedding generation
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")  # Default to Ollama embedding model
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "1000"))  # Characters per chunk
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "200"))  # Overlap between chunks

class TrainingService:
    def __init__(self):
        self.ollama_url = OLLAMA_URL
        self.embedding_model = EMBEDDING_MODEL
        self.chunk_size = CHUNK_SIZE
        self.chunk_overlap = CHUNK_OVERLAP
    
    async def process_file(self, file_path: str, file_id: str, mime_type: str) -> List[Dict[str, Any]]:
        """
        Process a file and extract text content.
        Returns list of text chunks with metadata.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Determine file type
        file_ext = Path(file_path).suffix.lower()
        
        # Extract text based on file type
        text = ""
        metadata = {"file_id": file_id, "file_path": file_path, "mime_type": mime_type}
        
        try:
            if file_ext == ".pdf" or mime_type == "application/pdf":
                text = await self._extract_pdf_text(file_path)
            elif file_ext in [".docx", ".doc"] or "wordprocessingml" in mime_type or mime_type == "application/msword":
                text = await self._extract_docx_text(file_path)
            elif file_ext in [".xlsx", ".xls"] or "spreadsheetml" in mime_type or mime_type in ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]:
                text = await self._extract_excel_text(file_path)
            elif file_ext == ".csv" or mime_type == "text/csv":
                text = await self._extract_csv_text(file_path)
            elif file_ext == ".json" or mime_type == "application/json":
                text = await self._extract_json_text(file_path)
            elif file_ext in [".txt", ".md"] or mime_type in ["text/plain", "text/markdown"]:
                text = await self._extract_text_file(file_path)
            else:
                # Try as plain text
                text = await self._extract_text_file(file_path)
        except Exception as e:
            raise Exception(f"Error extracting text from {file_path}: {str(e)}")
        
        if not text.strip():
            raise ValueError(f"No text content extracted from {file_path}")
        
        # Chunk the text
        chunks = self._chunk_text(text, metadata)
        
        return chunks
    
    async def _extract_pdf_text(self, file_path: str) -> str:
        """Extract text from PDF file."""
        if not HAS_PDF:
            raise ImportError("PyPDF2 is required for PDF processing. Install with: pip install PyPDF2")
        
        text = ""
        with open(file_path, "rb") as f:
            pdf_reader = PyPDF2.PdfReader(f)
            for page_num, page in enumerate(pdf_reader.pages):
                page_text = page.extract_text()
                text += f"\n\n--- Page {page_num + 1} ---\n\n{page_text}"
        return text
    
    async def _extract_docx_text(self, file_path: str) -> str:
        """Extract text from DOCX file."""
        if not HAS_DOCX:
            raise ImportError("python-docx is required for DOCX processing. Install with: pip install python-docx")
        
        doc = Document(file_path)
        paragraphs = []
        for para in doc.paragraphs:
            if para.text.strip():
                paragraphs.append(para.text)
        return "\n\n".join(paragraphs)
    
    async def _extract_excel_text(self, file_path: str) -> str:
        """Extract text from Excel file."""
        if not HAS_PANDAS:
            raise ImportError("pandas and openpyxl are required for Excel processing. Install with: pip install pandas openpyxl")
        
        try:
            df = pd.read_excel(file_path, sheet_name=None)  # Read all sheets
            text_parts = []
            for sheet_name, sheet_df in df.items():
                text_parts.append(f"\n\n--- Sheet: {sheet_name} ---\n\n")
                text_parts.append(sheet_df.to_string())
            return "\n".join(text_parts)
        except Exception as e:
            raise Exception(f"Error reading Excel file: {str(e)}")
    
    async def _extract_csv_text(self, file_path: str) -> str:
        """Extract text from CSV file."""
        if not HAS_PANDAS:
            raise ImportError("pandas is required for CSV processing. Install with: pip install pandas")
        
        try:
            df = pd.read_csv(file_path)
            return df.to_string()
        except Exception as e:
            raise Exception(f"Error reading CSV file: {str(e)}")
    
    async def _extract_json_text(self, file_path: str) -> str:
        """Extract text from JSON file."""
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return json.dumps(data, indent=2, ensure_ascii=False)
    
    async def _extract_text_file(self, file_path: str) -> str:
        """Extract text from plain text file."""
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()
    
    def _chunk_text(self, text: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Split text into overlapping chunks.
        """
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = start + self.chunk_size
            chunk_text = text[start:end]
            
            if chunk_text.strip():
                chunk_metadata = metadata.copy()
                chunk_metadata["chunk_start"] = start
                chunk_metadata["chunk_end"] = end
                
                chunks.append({
                    "text": chunk_text,
                    "metadata": chunk_metadata
                })
            
            # Move start position with overlap
            start = end - self.chunk_overlap
        
        return chunks
    
    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding vector for text using Ollama.
        """
        url = f"{self.ollama_url}/api/embeddings"
        payload = {
            "model": self.embedding_model,
            "input": text
        }
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
                return data.get("embedding", [])
            except Exception as e:
                raise Exception(f"Error generating embedding: {str(e)}")
    
    async def store_embedding(
        self,
        knowledge_base_id: str,
        version_id: str,
        file_id: str,
        chunk_index: int,
        chunk_text: str,
        embedding: List[float],
        metadata: Dict[str, Any],
        db_config: Dict[str, str]
    ):
        """
        Store embedding in PostgreSQL using pgvector.
        """
        try:
            import psycopg2
            from psycopg2.extras import Json
        except ImportError:
            raise ImportError("psycopg2 is required for database storage. Install with: pip install psycopg2-binary")
        
        # Build connection string
        conn_str = (
            f"host={db_config['host']} "
            f"port={db_config['port']} "
            f"user={db_config['user']} "
            f"password={db_config['password']} "
            f"dbname={db_config['dbname']}"
        )
        
        try:
            conn = psycopg2.connect(conn_str)
            cur = conn.cursor()
            
            # Generate ID (simple approach - in production use proper ID generation)
            import time
            import random
            embedding_id = int(time.time() * 1000000) + random.randint(0, 999999)
            
            # Convert embedding to PostgreSQL vector format
            embedding_str = "[" + ",".join(str(f) for f in embedding) + "]"
            
            # Insert embedding
            query = """
                INSERT INTO knowledge_base_embeddings (
                    id, knowledge_base_id, knowledge_base_version_id, knowledge_base_file_id,
                    chunk_index, chunk_text, embedding, metadata, created_at, updated_at
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s::vector, %s::jsonb, NOW(), NOW())
                ON CONFLICT (knowledge_base_version_id, knowledge_base_file_id, chunk_index) 
                DO UPDATE SET
                    chunk_text = EXCLUDED.chunk_text,
                    embedding = EXCLUDED.embedding,
                    metadata = EXCLUDED.metadata,
                    updated_at = NOW()
            """
            
            cur.execute(query, (
                embedding_id,
                int(knowledge_base_id),
                int(version_id),
                int(file_id),
                chunk_index,
                chunk_text,
                embedding_str,
                Json(metadata)
            ))
            
            conn.commit()
            cur.close()
            conn.close()
            
        except Exception as e:
            raise Exception(f"Error storing embedding: {str(e)}")

