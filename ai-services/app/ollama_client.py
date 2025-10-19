import httpx
import json
import asyncio

class OllamaClient:
    def __init__(self):
        self.base_url = "http://localhost:11434"

    async def generate_chat(self, model, messages, max_tokens=512):
        """Generate a non-streaming chat response."""
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": model, 
            "messages": messages, 
            "stream": False,
            "options": {
                "num_predict": max_tokens
            }
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            return data.get("message", {}).get("content", "")

    async def stream_chat(self, model, messages):
        url = f"{self.base_url}/api/chat"
        payload = {"model": model, "messages": messages, "stream": True}

        async with httpx.AsyncClient(timeout=None) as client:
            async with client.stream("POST", url, json=payload) as response:
                async for line in response.aiter_lines():
                    if not line or not line.strip():
                        continue

                    # 🧹 clean up Ollama SSE-style lines
                    line = line.strip()
                    if line.startswith("data: "):
                        line = line.replace("data: ", "")

                    # 🔒 ignore non-JSON fragments (like [DONE])
                    if line in ("[DONE]", "done", "DONE"):
                        break

                    try:
                        data = json.loads(line)
                    except json.JSONDecodeError:
                        print("⚠️ Skipping bad line:", line)
                        continue

                    if "message" in data and "content" in data["message"]:
                        yield data["message"]["content"]

                    await asyncio.sleep(0)
