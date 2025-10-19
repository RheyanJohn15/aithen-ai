from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from app.ollama_client import OllamaClient
from app.personality_store import PersonalityStore
from app.schema import ChatRequest
import json
import asyncio
import os

router = APIRouter()
ollama = OllamaClient()
store = PersonalityStore("personalities")

# Environment variables
MODEL = os.getenv("MODEL", "mistral")

@router.post("/chat")
async def chat(req: ChatRequest):
    """Send a conversation to the AI model and return the response."""
    system_prompt = None
    if req.personality:
        p = store.load(req.personality)
        if not p:
            raise HTTPException(status_code=404, detail="Personality not found")
        system_prompt = p.get("system_prompt")

    # Build messages for Ollama
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    for m in req.messages:
        messages.append({"role": m.role, "content": m.content})

    # If streaming is requested, return streaming response
    if req.stream:
        return StreamingResponse(
            stream_chat_response(messages, req.max_tokens),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/plain; charset=utf-8"
            }
        )

    # Non-streaming response
    try:
        response = await ollama.generate_chat(model=MODEL, messages=messages, max_tokens=req.max_tokens)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"response": response}

@router.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    """Stream a conversation to the AI model and return the response as Server-Sent Events."""
    system_prompt = None
    if req.personality:
        p = store.load(req.personality)
        if not p:
            raise HTTPException(status_code=404, detail="Personality not found")
        system_prompt = p.get("system_prompt")

    # Build messages for Ollama
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    for m in req.messages:
        messages.append({"role": m.role, "content": m.content})

    return StreamingResponse(
        stream_chat_sse(messages, req.max_tokens),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control"
        }
    )

@router.post("/api/chat/stream")
async def legacy_chat_stream(request: Request):
    """Legacy endpoint for backward compatibility."""
    body = await request.json()
    model = body.get("model", MODEL)
    messages = body.get("messages", [])

    async def generate():
        async for chunk in ollama.stream_chat(model, messages):
            # Stream plain text chunks — Laravel can easily read these
            yield chunk + "\n"
            await asyncio.sleep(0)

    return StreamingResponse(generate(), media_type="text/plain")

async def stream_chat_response(messages: list, max_tokens: int):
    """Stream chat response as plain text for Laravel backend consumption."""
    try:
        async for chunk in ollama.stream_chat(model=MODEL, messages=messages):
            yield chunk
    except Exception as e:
        yield f"Error: {str(e)}"

async def stream_chat_sse(messages: list, max_tokens: int):
    """Stream chat response as Server-Sent Events."""
    try:
        async for chunk in ollama.stream_chat(model=MODEL, messages=messages):
            # Format as Server-Sent Events
            yield f"data: {json.dumps({'content': chunk})}\n\n"
        # Send end signal
        yield "data: [DONE]\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
