import os
from anthropic import Anthropic, APIError

class AIClientError(Exception):
    """Raised when the AI backend is not configured or the call fails."""
    pass

_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-3-5-sonnet-20240620")

def _get_client():
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise AIClientError("ANTHROPIC_API_KEY is not set.")
    return Anthropic(api_key=api_key)

def generate_text(system_prompt: str, user_prompt: str, max_tokens: int = 500) -> str:
    client = _get_client()
    try:
        response = client.messages.create(
            model=_MODEL,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        return "".join([block.text for block in response.content if block.type == "text"]).strip()
    except Exception as exc:
        raise AIClientError(f"Anthropic API call failed: {exc}")