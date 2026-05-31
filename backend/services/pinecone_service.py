"""Pinecone serverless vector store: index management, upsert, and query."""

from pinecone import Pinecone, ServerlessSpec

from config import settings
from models import ProductMetadata, SearchResult

_pc: Pinecone | None = None


def _client() -> Pinecone:
    global _pc
    if _pc is None:
        _pc = Pinecone(api_key=settings.pinecone_api_key)
    return _pc


def ensure_index() -> None:
    """Create the serverless index if it does not already exist."""
    pc = _client()
    existing = {idx["name"] for idx in pc.list_indexes()}
    if settings.pinecone_index_name not in existing:
        pc.create_index(
            name=settings.pinecone_index_name,
            dimension=settings.embed_dim,
            metric="cosine",
            spec=ServerlessSpec(
                cloud=settings.pinecone_cloud, region=settings.pinecone_region
            ),
        )


def _index():
    return _client().Index(settings.pinecone_index_name)


def upsert_products(items: list[tuple[str, list[float], dict]]) -> int:
    """Upsert (id, vector, metadata) tuples. Returns the count upserted."""
    vectors = [{"id": pid, "values": vec, "metadata": meta} for pid, vec, meta in items]
    if not vectors:
        return 0
    _index().upsert(vectors=vectors)
    return len(vectors)


def _metadata_to_product(pid: str, meta: dict) -> ProductMetadata:
    attrs = meta.get("attributes")
    if isinstance(attrs, str):  # Pinecone flattens nested dicts; tolerate JSON strings.
        import json

        try:
            attrs = json.loads(attrs)
        except json.JSONDecodeError:
            attrs = {}
    return ProductMetadata(
        product_id=meta.get("product_id", pid),
        name=meta.get("name", ""),
        description=meta.get("description", ""),
        category=meta.get("category", "other"),
        price=meta.get("price"),
        attributes=attrs or {},
    )


def query(vector: list[float], top_k: int | None = None) -> list[SearchResult]:
    """Nearest-neighbor search; returns results sorted by descending score."""
    res = _index().query(
        vector=vector,
        top_k=top_k or settings.top_k,
        include_metadata=True,
    )
    results: list[SearchResult] = []
    for match in res.get("matches", []):
        results.append(
            SearchResult(
                product=_metadata_to_product(match["id"], match.get("metadata") or {}),
                score=float(match.get("score", 0.0)),
            )
        )
    return results
