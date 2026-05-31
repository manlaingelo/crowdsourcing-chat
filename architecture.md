# Architecture & Design Decisions

This document records the design of the Crowd-RAG chatbot and the key deviations
from the original `PRODUCT.md` spec, with the reasoning behind them.

## System diagram

```
┌─────────────────────────────┐
│  TanStack Start (Vercel)    │  search panel · chat · image uploader · contribute form
└─────────────┬───────────────┘
              │ HTTPS (multipart /search, JSON /contribute)
              ▼
┌─────────────────────────────┐
│  FastAPI (Hugging Face)     │  orchestrator.run_search()  → confidence routing
└──┬───────────┬───────────┬──┘
   │           │           │
   ▼           ▼           ▼
Pinecone   Gemini 2.5   Tavily Search
(vectors)  Flash +      (web fallback)
           embeddings
                          │ low-confidence path
                          ▼
                     GitHub API → opens data-contribution PR
```

## Request flow

```
/search(query?, image?)
  │
  ├─ image present?  ── yes ─► Gemini vision OCR → text query
  │                   no ───► use text query
  ▼
embed text (gemini-embedding-001, RETRIEVAL_QUERY)
  ▼
Pinecone query (cosine, top_k)
  ▼
top score >= CONFIDENCE_THRESHOLD ?
  ├─ yes → WORKFLOW 1: Gemini answers from catalog metadata
  └─ no  → WORKFLOW 2: Tavily search → Gemini answers from web
                       → extract product attrs → flag needs_contribution
                       → user submits → /contribute → GitHub PR
```

## Key deviation from PRODUCT.md: embeddings are text-only

`PRODUCT.md` describes a single model (`gemini-embedding-2`) that maps **both text
and image bytes** into one unified vector space on the free AI Studio tier.

That model/capability is **not available on the free AI Studio tier**. The real
free-tier embedding model, `gemini-embedding-001`, is **text-only**. True multimodal
(image) embeddings require Vertex AI's `multimodalembedding@001`, which is a paid,
separately-provisioned service.

**Our approach (keeps everything free and in one vector space):**

```
image bytes ─► Gemini 2.5 Flash vision (OCR + describe) ─► text ─┐
text query ──────────────────────────────────────────────────────┼─► gemini-embedding-001 ─► vector
                                                                  ┘
```

Because both modalities are reduced to text before embedding, text queries and image
queries share the same vector space and the same Pinecone index. This also matches the
spec's own description of Gemini's vision acting as the OCR engine.

Real model IDs used (vs the spec's aspirational names):
- LLM + OCR: `gemini-2.5-flash`  (spec: same)
- Embeddings: `gemini-embedding-001`, 3072 dims  (spec: `gemini-embedding-2`)

## Confidence threshold

`CONFIDENCE_THRESHOLD` (default `0.70`) is compared against the **top** Pinecone cosine
score. At/above → catalog answer (Workflow 1). Below, or zero results → web fallback +
crowdsourcing (Workflow 2). Tune in `backend/.env` without code changes.

## Pinecone metadata note

Pinecone metadata values must be scalars or string lists — not nested objects. The
ingestion script serializes the product `attributes` dict to a JSON string on write,
and `pinecone_service` rehydrates it on read.

## Free-tier guardrails
- **Gemini:** 15 RPM / 1500 RPD. `utils/rate_limiter.with_retry` backs off on 429s.
  Image queries cost 2 Gemini calls (OCR + answer); text catalog hits cost 1.
- **Pinecone:** serverless free index, cosine metric, 3072-dim.
- **Tavily:** 1,000 searches/mo — one call per fallback only.
- **HF Spaces:** app binds `:7860`; Pinecone is the source of truth, so no local disk
  persistence is assumed.
