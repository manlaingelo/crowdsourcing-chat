# Crowd-RAG Chatbot

An open-source, **zero-cost** multi-modal product search engine. Search by product
name, serial number, or **photo**. Answers are grounded in a vector catalog; when a
product is missing, the app falls back to live web search **and** lets users contribute
the missing record back to the data ledger via an automatic GitHub Pull Request.

> See [`PRODUCT.md`](./PRODUCT.md) for the original spec and [`architecture.md`](./architecture.md)
> for design decisions (including why embeddings are text-only on the free tier).

## Stack

| Layer | Service | Role |
| :-- | :-- | :-- |
| Frontend | **TanStack Start** → Vercel | Search panel, chat, image upload, contribute form |
| Backend | **FastAPI** → Hugging Face Spaces | Orchestrator (confidence routing) |
| Vector DB | **Pinecone** (serverless) | Product vector storage & similarity search |
| LLM + OCR | **Gemini 2.5 Flash** | Image OCR + conversational answers |
| Embeddings | **gemini-embedding-001** | Text embeddings (3072-dim) |
| Web fallback | **Tavily API** | Real-world data when the catalog misses |
| Data ledger | **GitHub repo** + PyGithub | `data/products/*.json`, auto-PR contributions |

## Repository layout

```
backend/    FastAPI orchestrator + service clients (Gemini, Pinecone, Tavily, GitHub)
frontend/   TanStack Start app (chat UI)
data/       Product JSON catalog + JSON Schema
scripts/    ingest_products.py · verify_setup.py
```

## Prerequisites

API keys (all free tier): [Google AI Studio](https://aistudio.google.com/apikey),
[Pinecone](https://www.pinecone.io/), [Tavily](https://app.tavily.com/),
and a GitHub Personal Access Token with `repo` scope for the data-ledger repo.

## Quick start (local)

### 1. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # then fill in your keys
```

```bash
# from the repo root, with backend/.venv active:
python scripts/verify_setup.py      # confirm all 4 services are reachable
python scripts/ingest_products.py   # embed seed products into Pinecone
```

```bash
cd backend
uvicorn main:app --reload --port 7860   # API at http://localhost:7860/docs
```

### 2. Frontend

```bash
cd frontend
pnpm install
cp .env.example .env          # VITE_BACKEND_URL=http://localhost:7860
pnpm dev                      # http://localhost:3000
```

## How it works

### Workflow 1 — Multi-modal retrieval
1. User submits text and/or an image.
2. An image is OCR'd/described by Gemini vision into a text query.
3. The text is embedded and queried against Pinecone.
4. If the top score ≥ `CONFIDENCE_THRESHOLD` (default 0.70), Gemini answers from the
   matched catalog metadata. Source badge: **Local catalog**.

### Workflow 2 — Web fallback & crowdsourcing
1. On low confidence / no match, the backend queries Tavily.
2. Gemini answers from the web results (badge: **Web**) and extracts a draft product record.
3. The UI shows an **"Improve Our Data"** form pre-filled with the extracted attributes.
4. On submit, the backend opens a GitHub PR adding `data/products/<slug>.json`.

## Deployment

- **Backend → Hugging Face Spaces:** create a *Docker* Space, push `backend/` (it ships a
  `Dockerfile` exposing `:7860`), and set the env vars from `backend/.env.example` as Space secrets.
- **Frontend → Vercel:** import `frontend/`, set `VITE_BACKEND_URL` to the Space URL
  (`https://<user>-<space>.hf.space`), and add that URL to the backend's `ALLOWED_ORIGINS`.

## Free-tier limits to keep in mind

- Gemini: 15 requests/min, 1,500/day (image queries use 2 calls; text catalog hits use 1).
- Pinecone serverless free index; Tavily: 1,000 searches/month.

## Contributing

Product data lives in `data/products/` as JSON validated against `data/seed_schema.json`.
The chatbot opens contribution PRs automatically; you can also add files by hand and run
`python scripts/ingest_products.py` to index them.

## License

MIT (open-source).
