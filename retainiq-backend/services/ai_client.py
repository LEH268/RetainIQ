"""Thin wrapper around the Groq API (via OpenAI SDK) with caching, retries, and JSON helpers.

The public interface (generate_text, generate_json_list, is_configured,
AIClientError) is unchanged, so no calling code needs to be touched.
"""

import hashlib
import json
import logging
import os
import random
import re
import threading
import time

from openai import OpenAI
import openai

logger = logging.getLogger(__name__)

DEFAULT_MODEL = os.environ.get("OPENAI_MODEL", "llama-3.3-70b-versatile")
CACHE_TTL_SECONDS = int(os.environ.get("AI_CACHE_TTL", "1800"))

MAX_RETRIES = 3
BASE_BACKOFF_SECONDS = 1.5

# When the API reports a hard quota exhaustion (limit: 0, or a daily cap),
# stop calling out entirely for this window instead of retrying every request.
QUOTA_COOLDOWN_SECONDS = 300

_cache = {}
_cache_lock = threading.Lock()
_client = None
_client_lock = threading.Lock()

_quota_blocked_until = 0.0
_quota_reason = ""
_quota_lock = threading.Lock()


class AIClientError(Exception):
    """Raised when the AI backend is not configured or a call fails."""


def _api_key():
    """Return the configured Groq API key, if any."""
    return os.environ.get("GROQ_API_KEY")


def is_configured():
    """Return True when an API key is present in the environment."""
    return bool(_api_key())


def _get_client():
    """Return a lazily constructed Groq client."""
    global _client
    if _client is not None:
        return _client

    key = _api_key()
    if not key:
        raise AIClientError(
            "GROQ_API_KEY is not set. Add it to retainiq-backend/.env"
        )

    with _client_lock:
        if _client is None:
            _client = OpenAI(
                api_key=key,
                base_url="https://api.groq.com/openai/v1"
            )
    return _client


def _cache_key(system_prompt, user_prompt, max_tokens):
    """Return a stable hash key for a prompt triple."""
    payload = f"{DEFAULT_MODEL}|{max_tokens}|{system_prompt}|{user_prompt}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _cache_get(key):
    """Return a cached response if present and not expired."""
    with _cache_lock:
        entry = _cache.get(key)
        if entry is None:
            return None
        value, expires_at = entry
        if time.time() > expires_at:
            _cache.pop(key, None)
            return None
        return value


def _cache_set(key, value):
    """Store a response with a TTL."""
    with _cache_lock:
        _cache[key] = (value, time.time() + CACHE_TTL_SECONDS)


def clear_cache():
    """Drop all cached AI responses."""
    with _cache_lock:
        _cache.clear()


def _classify_error(exc):
    """Categorise an API exception.

    Returns one of: 'quota_exhausted', 'rate_limited', 'auth', 'other'.
    
    The distinction between the first two matters: a transient per-minute
    limit is worth retrying, but a zero or daily-capped quota is not — the
    same call will fail identically for hours.
    """
    text = str(exc).lower()

    if isinstance(exc, openai.AuthenticationError) or "401" in text or "403" in text or "invalid api key" in text:
        return "auth"

    if isinstance(exc, openai.RateLimitError) or "429" in text or "quota" in text or "insufficient_quota" in text:
        # Check for absolute zero quota or insufficient credits
        if "insufficient_quota" in text or "limit: 0" in text or "exceeded your current quota" in text:
            return "quota_exhausted"
        # A per-day cap will not reset within any reasonable retry window.
        if "perday" in text.replace("_", "").replace(" ", ""):
            return "quota_exhausted"
        return "rate_limited"

    return "other"


def _set_quota_block(reason):
    """Suppress outbound calls for a cooldown window after a hard quota failure."""
    global _quota_blocked_until, _quota_reason
    with _quota_lock:
        _quota_blocked_until = time.time() + QUOTA_COOLDOWN_SECONDS
        _quota_reason = reason
    logger.warning(
        "Groq quota exhausted; suppressing AI calls for %ds. %s",
        QUOTA_COOLDOWN_SECONDS, reason,
    )


def _quota_block_active():
    """Return the remaining cooldown seconds, or 0 if calls may proceed."""
    with _quota_lock:
        remaining = _quota_blocked_until - time.time()
    return max(0, int(remaining))


def clear_quota_block():
    """Manually lift the quota cooldown, e.g. after switching API keys."""
    global _quota_blocked_until, _quota_reason
    with _quota_lock:
        _quota_blocked_until = 0.0
        _quota_reason = ""


def ai_status():
    """Return a structured description of AI availability for the UI."""
    if not is_configured():
        return {
            "available": False,
            "state": "not_configured",
            "model": DEFAULT_MODEL,
            "message": (
                "GROQ_API_KEY is not set. Add it to retainiq-backend/.env "
                "and restart the server."
            ),
        }

    cooldown = _quota_block_active()
    if cooldown:
        return {
            "available": False,
            "state": "quota_exhausted",
            "model": DEFAULT_MODEL,
            "retryInSeconds": cooldown,
            "message": (
                f"Groq quota exhausted for {DEFAULT_MODEL}. {_quota_reason} "
                "All figures on screen are computed from the dataset and remain "
                "accurate; only AI-written narrative is unavailable."
            ),
        }

    return {
        "available": True,
        "state": "ready",
        "model": DEFAULT_MODEL,
        "message": f"Connected to {DEFAULT_MODEL}.",
    }


def _quota_message():
    """Return an actionable message for a hard quota failure."""
    return (
        f"Groq reported zero available quota for {DEFAULT_MODEL}. This is not "
        "a temporary rate limit. Check your billing details or set OPENAI_MODEL "
        "to a different model, then restart the backend."
    )


def _extract_text(response):
    """Pull plain text out of a Groq/OpenAI response object."""
    try:
        return response.choices[0].message.content.strip()
    except (AttributeError, IndexError):
        return ""


def _call_model(client, messages, max_tokens):
    """Execute one generation with retries, honouring the quota cooldown.

    Retries only transient per-minute limits. Hard quota exhaustion and auth
    failures fail immediately rather than burning attempts on a wall.
    """
    cooldown = _quota_block_active()
    if cooldown:
        raise AIClientError(
            f"{_quota_reason} Retrying in {cooldown}s."
        )

    last_error = None

    for attempt in range(MAX_RETRIES):
        try:
            response = client.chat.completions.create(
                model=DEFAULT_MODEL,
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.7
            )
            text = _extract_text(response)
            
            if not text:
                raise AIClientError("Groq returned an empty response.")
            return text

        except AIClientError:
            raise
        except Exception as exc:
            last_error = exc
            category = _classify_error(exc)

            if category == "quota_exhausted":
                message = _quota_message()
                _set_quota_block(message)
                raise AIClientError(message) from exc

            if category == "auth":
                raise AIClientError(
                    "Groq rejected the API key. Verify GROQ_API_KEY in "
                    "retainiq-backend/.env is correct and not expired."
                ) from exc

            if category == "rate_limited" and attempt < MAX_RETRIES - 1:
                delay = BASE_BACKOFF_SECONDS * (2 ** attempt) + random.uniform(0, 0.5)
                logger.warning(
                    "Groq rate limited, retrying in %.1fs (attempt %d/%d)",
                    delay, attempt + 1, MAX_RETRIES,
                )
                time.sleep(delay)
                continue

            break

    if _classify_error(last_error) == "rate_limited":
        raise AIClientError(
            "Groq rate limit reached after several retries. Wait about a "
            "minute before trying again."
        ) from last_error

    raise AIClientError(f"Groq API call failed: {last_error}") from last_error


def generate_text(system_prompt, user_prompt, max_tokens=500, use_cache=True):
    """Return generated text for the given prompts.

    Identical prompts are served from an in-process TTL cache.
    """
    key = _cache_key(system_prompt, user_prompt, max_tokens)
    if use_cache:
        cached = _cache_get(key)
        if cached is not None:
            return cached

    client = _get_client()
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    text = _call_model(client, messages, max_tokens)

    if use_cache:
        _cache_set(key, text)
    return text


def _extract_json(raw):
    """Pull the first JSON array or object out of a model response."""
    cleaned = re.sub(r"^```(?:json)?|```$", "", raw.strip(), flags=re.MULTILINE).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    match = re.search(r"(\[.*\]|\{.*\})", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            return None
    return None


def generate_json_list(system_prompt, user_prompt, max_tokens=500, fallback=None):
    """Return a list parsed from the model response, or `fallback` on failure.

    Never raises. Callers get usable output whether or not the AI is reachable.
    Uses regex extraction allowing Groq to output JSON without forcing response_format.
    """
    fallback = fallback or []

    key = _cache_key(system_prompt, user_prompt + "|json", max_tokens)
    cached = _cache_get(key)
    if cached is not None:
        try:
            return json.loads(cached)
        except json.JSONDecodeError:
            pass

    try:
        client = _get_client()
    except AIClientError as exc:
        logger.info("AI unavailable, returning fallback: %s", exc)
        return list(fallback)

    json_system_prompt = system_prompt + "\n\nIMPORTANT: You must output a valid JSON array or object containing the results."
    
    messages = [
        {"role": "system", "content": json_system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    try:
        raw = _call_model(client, messages, max_tokens)
    except AIClientError as exc:
        logger.info("AI call failed, returning fallback: %s", exc)
        return list(fallback)

    parsed = _extract_json(raw)

    if isinstance(parsed, list) and parsed:
        result = [str(item) for item in parsed]
        _cache_set(key, json.dumps(result))
        return result

    if isinstance(parsed, dict):
        for value in parsed.values():
            if isinstance(value, list) and value:
                result = [str(item) for item in value]
                _cache_set(key, json.dumps(result))
                return result

    lines = [
        line.strip("-• \t")
        for line in raw.splitlines()
        if line.strip() and len(line.strip()) > 12
    ]
    return lines[:6] if lines else list(fallback)