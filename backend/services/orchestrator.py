"""Confidence-based routing across the two MVP workflows.

    text query ─┐
                ├─► embed ─► Pinecone query ─► top score >= threshold ?
    image ─OCR ─┘                                   │
                                          yes ◄──────┴──────► no
                                           │                   │
                              WORKFLOW 1   │                   │  WORKFLOW 2
                        (vector retrieval) │                   │ (web fallback +
                                           ▼                   ▼  crowdsourcing)
                              Gemini answer from        Brave search ─► Gemini
                              catalog metadata          answer + extract product
                                                        ─► flag for contribution
"""

import json

from config import settings
from models import ProductMetadata, SearchResponse
from services import brave_service, embeddings_service, gemini_service, pinecone_service


def _catalog_context(results) -> str:
    """Serialize the top catalog hits as JSON context for the LLM."""
    payload = [
        {"score": round(r.score, 4), **r.product.model_dump()} for r in results
    ]
    return json.dumps(payload, indent=2, ensure_ascii=False)


def run_search(query: str | None, image_bytes: bytes | None, mime_type: str | None) -> SearchResponse:
    """Execute the multi-modal retrieval loop with web fallback."""
    # 1. Resolve a text query (OCR the image when present).
    if image_bytes is not None:
        query_text = gemini_service.image_to_text(image_bytes, mime_type or "image/jpeg")
    else:
        query_text = (query or "").strip()

    if not query_text:
        raise ValueError("No usable query text (empty input or OCR returned nothing).")

    # 2. Embed and 3. retrieve.
    vector = embeddings_service.embed_text(query_text, task_type="RETRIEVAL_QUERY")
    results = pinecone_service.query(vector, top_k=settings.top_k)
    top_score = results[0].score if results else 0.0

    # 4. WORKFLOW 1 — high-confidence catalog hit.
    if results and top_score >= settings.confidence_threshold:
        answer = gemini_service.synthesize_answer(
            query_text, _catalog_context(results), source="vector"
        )
        return SearchResponse(
            answer=answer,
            source="vector",
            confidence=top_score,
            query_text=query_text,
            results=results,
            needs_contribution=False,
        )

    # WORKFLOW 2 — web fallback + crowdsourcing flag.
    if not settings.fallback_to_web:
        return SearchResponse(
            answer="No confident match found in the catalog, and web fallback is disabled.",
            source="vector",
            confidence=top_score,
            query_text=query_text,
            results=results,
            needs_contribution=settings.enable_data_contribution,
        )

    web_results = brave_service.search(query_text)
    web_context = brave_service.results_to_context(web_results)
    answer = gemini_service.synthesize_answer(query_text, web_context, source="web")

    suggested = None
    if settings.enable_data_contribution and web_context:
        extracted = gemini_service.extract_product_attributes(query_text, web_context)
        if extracted.get("name"):
            suggested = ProductMetadata(
                product_id="",  # assigned at contribution time
                name=extracted.get("name", ""),
                description=extracted.get("description", ""),
                category=extracted.get("category", "other"),
                price=extracted.get("price"),
                attributes=extracted.get("attributes", {}) or {},
            )

    return SearchResponse(
        answer=answer,
        source="web",
        confidence=top_score,
        query_text=query_text,
        results=results,
        needs_contribution=settings.enable_data_contribution,
        suggested_product=suggested,
    )
