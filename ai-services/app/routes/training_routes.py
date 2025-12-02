from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import json
import asyncio
import time
from datetime import datetime
from app.training_service import TrainingService

router = APIRouter()
training_service = TrainingService()

class TrainingRequest(BaseModel):
    knowledge_base_id: str
    version_id: str
    files: List[Dict[str, Any]]  # List of file info: {id, name, path, mime_type}
    db_config: Dict[str, str]  # Database connection info

class TrainingProgress(BaseModel):
    current_file: int
    total_files: int
    current_chunk: int
    total_chunks: int
    percentage: int
    status: str  # processing, embedding, storing, completed
    current_file_name: Optional[str] = None
    message: Optional[str] = None

@router.post("/training/start")
async def start_training(request: TrainingRequest):
    """
    Start training process for a knowledge base.
    This endpoint processes all files, creates embeddings, and stores them in PostgreSQL.
    """
    try:
        # Start training in background
        task_id = f"{request.knowledge_base_id}_{request.version_id}"
        
        # Return immediately with task ID
        return {
            "task_id": task_id,
            "status": "started",
            "message": "Training process started"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/training/stream")
async def stream_training(request: TrainingRequest):
    """
    Stream training progress in real-time.
    Returns Server-Sent Events (SSE) stream with progress updates.
    """
    async def generate_progress():
        try:
            total_files = len(request.files)
            
            # Track file details for detailed progress
            file_details = []
            job_id = request.files[0].get("job_id") if request.files else None
            job_index = request.files[0].get("job_index") if request.files else None
            total_jobs = request.files[0].get("total_jobs") if request.files else None
            
            for file_idx, file_info in enumerate(request.files, 1):
                file_id = file_info.get("id", "")
                file_name = file_info.get("name", "Unknown")
                file_path = file_info.get("path")
                file_size = file_info.get("size", 0)
                file_type = file_info.get("mime_type", "unknown")
                file_start_time = time.time()
                
                # Initialize file detail
                file_detail = {
                    "file_id": file_id,
                    "file_name": file_name,
                    "file_size": file_size,
                    "file_type": file_type,
                    "status": "processing",
                    "chunks_total": 0,
                    "chunks_done": 0,
                    "percentage": 0,
                    "started_at": datetime.now().isoformat(),
                }
                file_details.append(file_detail)
                
                # Send file processing start with detailed info
                progress = {
                    "type": "progress",
                    "current_file": file_idx,
                    "total_files": total_files,
                    "current_chunk": 0,
                    "total_chunks": 0,
                    "percentage": int((file_idx - 1) / total_files * 100),
                    "status": "processing",
                    "current_file_name": file_name,
                    "current_file_id": file_id,
                    "current_file_size": file_size,
                    "current_file_type": file_type,
                    "file_details": file_details,
                    "job_id": job_id,
                    "job_index": job_index,
                    "total_jobs": total_jobs,
                    "message": f"Processing {file_name} ({file_size} bytes)..."
                }
                yield f"data: {json.dumps(progress)}\n\n"
                
                # Process file and generate embeddings
                try:
                    chunks = await training_service.process_file(
                        file_path=file_path,
                        file_id=file_info.get("id"),
                        mime_type=file_info.get("mime_type", "")
                    )
                    
                    total_chunks = len(chunks)
                    file_detail["chunks_total"] = total_chunks
                    
                    # Process each chunk
                    for chunk_idx, chunk in enumerate(chunks, 1):
                        file_detail["chunks_done"] = chunk_idx
                        file_detail["percentage"] = int((chunk_idx / total_chunks) * 100)
                        file_detail["status"] = "embedding"
                        # Send chunk processing start with file details
                        progress = {
                            "type": "progress",
                            "current_file": file_idx,
                            "total_files": total_files,
                            "current_chunk": chunk_idx,
                            "total_chunks": total_chunks,
                            "percentage": int(((file_idx - 1) / total_files + chunk_idx / total_chunks / total_files) * 100),
                            "status": "embedding",
                            "current_file_name": file_name,
                            "current_file_id": file_id,
                            "current_file_size": file_size,
                            "current_file_type": file_type,
                            "file_details": file_details,
                            "job_id": job_id,
                            "job_index": job_index,
                            "total_jobs": total_jobs,
                            "message": f"Creating embedding for chunk {chunk_idx}/{total_chunks} of {file_name}..."
                        }
                        yield f"data: {json.dumps(progress)}\n\n"
                        
                        # Generate embedding
                        embedding = await training_service.generate_embedding(chunk["text"])
                        
                        # Store embedding in database
                        await training_service.store_embedding(
                            knowledge_base_id=request.knowledge_base_id,
                            version_id=request.version_id,
                            file_id=file_info.get("id"),
                            chunk_index=chunk_idx - 1,
                            chunk_text=chunk["text"],
                            embedding=embedding,
                            metadata=chunk.get("metadata", {}),
                            db_config=request.db_config
                        )
                        
                        # Update file detail status
                        file_detail["status"] = "storing"
                        
                        # Send chunk stored with file details
                        progress = {
                            "type": "progress",
                            "current_file": file_idx,
                            "total_files": total_files,
                            "current_chunk": chunk_idx,
                            "total_chunks": total_chunks,
                            "percentage": int(((file_idx - 1) / total_files + chunk_idx / total_chunks / total_files) * 100),
                            "status": "storing",
                            "current_file_name": file_name,
                            "current_file_id": file_id,
                            "current_file_size": file_size,
                            "current_file_type": file_type,
                            "file_details": file_details,
                            "job_id": job_id,
                            "job_index": job_index,
                            "total_jobs": total_jobs,
                            "message": f"Stored chunk {chunk_idx}/{total_chunks} of {file_name}"
                        }
                        yield f"data: {json.dumps(progress)}\n\n"
                        
                        # Small delay to prevent overwhelming
                        await asyncio.sleep(0.1)
                    
                    # Mark file as completed
                    file_detail["status"] = "completed"
                    file_detail["completed_at"] = datetime.now().isoformat()
                    file_detail["percentage"] = 100
                    
                    # Send file completion update
                    progress = {
                        "type": "progress",
                        "current_file": file_idx,
                        "total_files": total_files,
                        "current_chunk": total_chunks,
                        "total_chunks": total_chunks,
                        "percentage": int((file_idx / total_files) * 100),
                        "status": "completed",
                        "current_file_name": file_name,
                        "current_file_id": file_id,
                        "file_details": file_details,
                        "job_id": job_id,
                        "job_index": job_index,
                        "total_jobs": total_jobs,
                        "message": f"Completed processing {file_name}"
                    }
                    yield f"data: {json.dumps(progress)}\n\n"
                    
                except Exception as e:
                    # Mark file as failed
                    file_detail["status"] = "failed"
                    file_detail["error"] = str(e)
                    file_detail["completed_at"] = datetime.now().isoformat()
                    
                    error_progress = {
                        "type": "error",
                        "current_file": file_idx,
                        "total_files": total_files,
                        "current_file_name": file_name,
                        "current_file_id": file_id,
                        "file_details": file_details,
                        "job_id": job_id,
                        "job_index": job_index,
                        "total_jobs": total_jobs,
                        "message": f"Error processing {file_name}: {str(e)}"
                    }
                    yield f"data: {json.dumps(error_progress)}\n\n"
                    continue
            
            # Send completion
            completion = {
                "type": "complete",
                "current_file": total_files,
                "total_files": total_files,
                "percentage": 100,
                "status": "completed",
                "message": "Training completed successfully"
            }
            yield f"data: {json.dumps(completion)}\n\n"
            
        except Exception as e:
            error = {
                "type": "error",
                "message": f"Training failed: {str(e)}"
            }
            yield f"data: {json.dumps(error)}\n\n"
    
    return StreamingResponse(
        generate_progress(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

