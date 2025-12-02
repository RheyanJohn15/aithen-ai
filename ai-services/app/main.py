# ai-service/app/main.py

from fastapi import FastAPI, HTTPException
import os

from .personality_store import PersonalityStore
from .routes.chat_routes import router as chat_router
from .routes.training_routes import router as training_router

# Environment variables
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
MODEL = os.getenv("MODEL", "mistral")

app = FastAPI(
    title="AI Service (Mistral via Ollama)",
    description="A FastAPI microservice that connects to Ollama running Mistral 7B, with dynamic personalities.",
    version="1.0.0"
)

# Include routers
app.include_router(chat_router)
app.include_router(training_router)

store = PersonalityStore("personalities")

# ===============================
# Routes
# ===============================

@app.get("/")
def root():
    return {"message": "AI Service running successfully 🚀"}

@app.get("/personalities")
def list_personalities():
    """List all available personalities."""
    return store.list()

@app.get("/personalities/{pid}")
def get_personality(pid: str):
    """Get a specific personality by ID."""
    p = store.load(pid)
    if not p:
        raise HTTPException(status_code=404, detail="Personality not found")
    return p

@app.post("/personalities")
def save_personality(payload: dict):
    """Create or update a personality JSON file."""
    pid = payload.get("id")
    if not pid:
        raise HTTPException(status_code=400, detail="`id` field is required")
    store.save(pid, payload)
    return {"ok": True, "message": f"Personality '{pid}' saved."}

