# conftest.py — project root
# Makes `ai_engine` and `backend` importable in ALL test suites
# without needing to set PYTHONPATH manually.

import sys
from pathlib import Path

# Insert project root at the front of sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))
