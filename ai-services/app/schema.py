# ai-service/app/schemas.py

from pydantic import BaseModel
from typing import List, Optional

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    personality: Optional[str] = None
    max_tokens: Optional[int] = 512
    stream: Optional[bool] = False
