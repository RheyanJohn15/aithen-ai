# ai-service/app/personality_store.py

import json
from pathlib import Path
from typing import List, Optional

class PersonalityStore:
    """
    Handles reading and writing personality JSON files
    stored in the 'personalities' directory.
    """

    def __init__(self, dirpath: str = "personalities"):
        self.dir = Path(dirpath)
        self.dir.mkdir(parents=True, exist_ok=True)

    def list(self) -> List[str]:
        """Return a list of all available personality IDs."""
        return [p.stem for p in self.dir.glob("*.json")]

    def load(self, pid: str) -> Optional[dict]:
        """Load a personality JSON file by ID."""
        path = self.dir / f"{pid}.json"
        if not path.exists():
            return None
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception as e:
            print(f"Failed to load personality {pid}: {e}")
            return None

    def save(self, pid: str, data: dict) -> None:
        """Save or update a personality JSON file."""
        path = self.dir / f"{pid}.json"
        try:
            path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        except Exception as e:
            print(f"Failed to save personality {pid}: {e}")
            raise
