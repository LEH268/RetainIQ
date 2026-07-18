"""
Thin wrapper around the real Anthropic Messages API.

Every function here makes an actual network call to an LLM. There is no
rule-based / templated fallback baked into this module on purpose: if the
API key isn't configured or the call fails, callers should surface that
as a real error (see api/ai.py) instead of silently returning fake
"AI-generated" text.
"""
import os

from anthropic import Anthropic, APIError

_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5")

_client = None


class AIClientError(Exception):
    """Raised when the AI backend is not configured or the call fails."""


def _get_client():
    global _client
    if _client is None:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise AIClientError(
                "ANTHROPIC_API_KEY is not set on the server. "
                "Set it in retainiq-backend/.env to enable AI features."
            )
        _client = Anthropic(api_key=api_key)
    return _client


def generate_text(system_prompt: str, user_prompt: str, max_tokens: int = 500) -> str:
    """Calls the LLM and returns the concatenated text of the response."""
    client = _get_client()
    try:
        response = client.messages.create(
            model=_MODEL,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
    except APIError as exc:
        raise AIClientError(f"Anthropic API call failed: {exc}") from exc

    text_blocks = [block.text for block in response.content if block.type == "text"]
    result = "\n".join(text_blocks).strip()

    if not result:
        raise AIClientError("The AI model returned an empty response.")

    return result