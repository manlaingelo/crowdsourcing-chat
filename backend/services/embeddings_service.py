"""Text embeddings via Google AI Studio `gemini-embedding-001`.

Free-tier note: this model is TEXT-ONLY. Images are converted to text first
(see gemini_service.image_to_text) and then embedded here, so both text and
image queries land in the same vector space.
"""

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


@with_retry()
def embed_text(text: str, task_type: str = "RETRIEVAL_QUERY") -> list[float]:
    """Embed a single string.

    task_type:
      - "RETRIEVAL_QUERY"    for search-time queries
      - "RETRIEVAL_DOCUMENT" for catalog documents at ingestion time
    """
    if not text or not text.strip():
        raise ValueError("Cannot embed empty text.")

    resp = _get_client().models.embed_content(
        model=settings.gemini_embed_model,
        contents=text,
        config=types.EmbedContentConfig(
            task_type=task_type,
            output_dimensionality=settings.embed_dim,
        ),
    )
    return list(resp.embeddings[0].values)
