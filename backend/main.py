"""FastAPI entry point for the Crowd-RAG orchestrator.

Run locally:  uvicorn main:app --reload --port 7860
On HF Spaces:  the Dockerfile runs uvicorn on port 7860.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import health, search
from services import pinecone_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Best-effort: ensure the Pinecone index exists on boot. Don't crash the
    # app if Pinecone is unreachable — /health should still respond.
    try:
        pinecone_service.ensure_index()
    except Exception as exc:  # noqa: BLE001
        print(f"[startup] Pinecone index check skipped: {exc}")
    yield


app = FastAPI(
    title="Crowd-RAG Chatbot API",
    description="Multi-modal product search with vector retrieval and web-fallback crowdsourcing.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(search.router)


@app.get("/")
def root() -> dict:
    return {"service": "crowd-rag-chatbot", "docs": "/docs"}
