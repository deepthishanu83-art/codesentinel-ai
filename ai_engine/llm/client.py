import os
import json
import logging
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("CodeSentinel.LLMClient")


class LLMClientError(Exception):
    """Base exception for LLM client communication errors."""
    pass


class LLMClient(ABC):
    """Abstract interface for LLM client interactions."""

    @abstractmethod
    def generate(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        """
        Generate text response for a given prompt.
        
        Args:
            prompt: User / task prompt.
            system_instruction: Optional system instruction.
            
        Returns:
            Raw response text from the LLM.
        """
        pass


class GeminiClient(LLMClient):
    """Google Gemini API client using standard HTTP REST."""

    def __init__(self, api_key: str, model: str = "gemini-2.0-flash"):
        self.api_key = api_key
        self.model = model
        self.endpoint = (
            f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"
        )

    def generate(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        import requests

        url = f"{self.endpoint}?key={self.api_key}"
        headers = {"Content-Type": "application/json"}
        
        contents = []
        if system_instruction:
            contents.append({"role": "user", "parts": [{"text": f"SYSTEM INSTRUCTION: {system_instruction}"}]})
            contents.append({"role": "model", "parts": [{"text": "Understood. I will strictly follow these instructions."}]})
        
        contents.append({"role": "user", "parts": [{"text": prompt}]})
        
        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json"
            }
        }

        try:
            resp = requests.post(url, headers=headers, json=payload, timeout=60)
            if resp.status_code != 200:
                raise LLMClientError(f"Gemini API error ({resp.status_code}): {resp.text}")
            
            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                raise LLMClientError(f"Gemini returned empty candidates: {data}")
            
            parts = candidates[0].get("content", {}).get("parts", [])
            if not parts:
                raise LLMClientError("Gemini returned candidate without parts")
            
            return parts[0].get("text", "")
        except requests.RequestException as e:
            raise LLMClientError(f"Network error contacting Gemini API: {str(e)}") from e


class OpenAIClient(LLMClient):
    """OpenAI API client using standard HTTP REST."""

    def __init__(self, api_key: str, model: str = "gpt-4o-mini"):
        self.api_key = api_key
        self.model = model
        self.endpoint = "https://api.openai.com/v1/chat/completions"

    def generate(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        import requests

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        messages = []
        if system_instruction:
            messages.append({"role": "system", "content": system_instruction})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.1
        }

        try:
            resp = requests.post(self.endpoint, headers=headers, json=payload, timeout=60)
            if resp.status_code != 200:
                raise LLMClientError(f"OpenAI API error ({resp.status_code}): {resp.text}")
            
            data = resp.json()
            choices = data.get("choices", [])
            if not choices:
                raise LLMClientError("OpenAI returned no choices")
            
            return choices[0].get("message", {}).get("content", "")
        except requests.RequestException as e:
            raise LLMClientError(f"Network error contacting OpenAI API: {str(e)}") from e


class AnthropicClient(LLMClient):
    """Anthropic Claude API client using standard HTTP REST."""

    def __init__(self, api_key: str, model: str = "claude-3-5-sonnet-20241022"):
        self.api_key = api_key
        self.model = model
        self.endpoint = "https://api.anthropic.com/v1/messages"

    def generate(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        import requests

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json"
        }
        
        payload: Dict[str, Any] = {
            "model": self.model,
            "max_tokens": 4096,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1
        }
        if system_instruction:
            payload["system"] = system_instruction

        try:
            resp = requests.post(self.endpoint, headers=headers, json=payload, timeout=60)
            if resp.status_code != 200:
                raise LLMClientError(f"Anthropic API error ({resp.status_code}): {resp.text}")
            
            data = resp.json()
            content = data.get("content", [])
            if not content:
                raise LLMClientError("Anthropic returned no content")
            
            return content[0].get("text", "")
        except requests.RequestException as e:
            raise LLMClientError(f"Network error contacting Anthropic API: {str(e)}") from e


class MockLLMClient(LLMClient):
    """
    Deterministic Mock LLM Client for unit testing and offline development.
    Can be configured with fixed responses or uses smart rule-based outputs.
    """

    def __init__(self, custom_responses: Optional[Dict[str, str]] = None):
        self.custom_responses = custom_responses or {}

    def set_response(self, key_fragment: str, response: str):
        self.custom_responses[key_fragment] = response

    def generate(self, prompt: str, system_instruction: Optional[str] = None) -> str:
        for key, resp in self.custom_responses.items():
            if key in prompt:
                return resp
        # Generic valid JSON response
        return json.dumps({
            "status": "success",
            "message": "Deterministic mock analysis completed.",
            "confidence": 0.9
        })


def get_llm_client(
    provider: Optional[str] = None,
    api_key: Optional[str] = None,
    model: Optional[str] = None
) -> LLMClient:
    """
    Factory to instantiate the appropriate LLM client based on configuration.
    Falls back gracefully to MockLLMClient if no API key is provided.
    """
    resolved_provider = (provider or os.getenv("AI_PROVIDER", "gemini")).lower()
    resolved_key = (
        api_key
        or os.getenv("AI_API_KEY")
        or os.getenv("GEMINI_API_KEY")
        or os.getenv("OPENAI_API_KEY")
        or os.getenv("ANTHROPIC_API_KEY")
        or ""
    )
    resolved_model = model or os.getenv("AI_MODEL")

    if resolved_provider == "mock" or not resolved_key:
        logger.info("Using MockLLMClient (no active API key or provider is mock)")
        return MockLLMClient()

    if resolved_provider in ("gemini", "google"):
        return GeminiClient(api_key=resolved_key, model=resolved_model or "gemini-2.0-flash")
    elif resolved_provider == "openai":
        return OpenAIClient(api_key=resolved_key, model=resolved_model or "gpt-4o-mini")
    elif resolved_provider in ("anthropic", "claude"):
        return AnthropicClient(api_key=resolved_key, model=resolved_model or "claude-3-5-sonnet-20241022")
    else:
        logger.warning(f"Unknown provider '{resolved_provider}', falling back to MockLLMClient")
        return MockLLMClient()
