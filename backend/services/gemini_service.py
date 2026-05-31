"""Gemini 2.5 Flash: multimodal OCR + conversational answer synthesis.

Three responsibilities:
  1. image_to_text         -> OCR/describe an uploaded product image as text
  2. synthesize_answer     -> turn retrieved context into a chat answer
  3. extract_product_attrs -> structure web snippets into a product record
"""

import json

from google import genai
from google.genai import types

from config import settings
from utils.rate_limiter import with_retry

_client: genai.Client | None = None


def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.google_api_key)
    return _client


_OCR_PROMPT = (
    "You are a product-identification assistant. Look at this image and produce a "
    "concise, search-friendly description in plain text. Transcribe any visible serial "
    "numbers, model numbers, brand names, and printed text EXACTLY. Then describe the "
    "product type, color, and notable visible attributes. Return only the description."
)


@with_retry()
def image_to_text(image_bytes: bytes, mime_type: str) -> str:
    """OCR + describe a product image, returning a text query string."""
    resp = _get_client().models.generate_content(
        model=settings.gemini_chat_model,
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            _OCR_PROMPT,
        ],
    )
    return (resp.text or "").strip()


@with_retry()
def synthesize_answer(query: str, context: str, source: str) -> str:
    """Generate a conversational answer grounded in the supplied context."""
    grounding = (
        "local product catalog" if source == "vector" else "live web search results"
    )
    prompt = (
        f"A user asked: {query!r}\n\n"
        f"Using the following {grounding} as your only source of truth, answer the "
        f"user helpfully and concisely. If the context is thin, say what is known and "
        f"avoid inventing specs.\n\n"
        f"--- CONTEXT ---\n{context}\n--- END CONTEXT ---"
    )
    resp = _get_client().models.generate_content(
        model=settings.gemini_chat_model, contents=prompt
    )
    return (resp.text or "").strip()


@with_retry()
def extract_product_attributes(query: str, web_context: str) -> dict:
    """Extract a structured product record from web text for the contribution form."""
    prompt = (
        "From the web search context below, extract a single product as JSON with keys: "
        "name (string), description (string), category (one of electronics, tools, "
        "furniture, appliances, other), price (number or null), attributes (object with "
        "any of brand, model, color, material, dimensions, weight). "
        f"The user was searching for: {query!r}.\n\n"
        f"--- WEB CONTEXT ---\n{web_context}\n--- END ---"
    )
    resp = _get_client().models.generate_content(
        model=settings.gemini_chat_model,
        contents=prompt,
        config=types.GenerateContentConfig(response_mime_type="application/json"),
    )
    try:
        return json.loads(resp.text or "{}")
    except json.JSONDecodeError:
        return {}
