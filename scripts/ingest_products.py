"""Embed every product in data/products/ and upsert it into Pinecone.

Run from the repo root after filling backend/.env:

    python scripts/ingest_products.py

Idempotent: the vector id is the product_id, so re-running updates in place.
Pinecone metadata cannot hold nested objects, so `attributes` is stored as a
JSON string and rehydrated on read (see pinecone_service._metadata_to_product).
"""

import json
import sys
from pathlib import Path

# Make the backend package importable and load its .env.
ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(BACKEND / ".env")

from services import embeddings_service, pinecone_service  # noqa: E402

PRODUCTS_DIR = ROOT / "data" / "products"


def build_embed_text(product: dict) -> str:
    """Compose the text that represents a product in the vector space."""
    parts = [product.get("name", ""), product.get("description", "")]
    attrs = product.get("attributes", {}) or {}
    if attrs:
        parts.append(", ".join(f"{k}: {v}" for k, v in attrs.items()))
    return ". ".join(p for p in parts if p)


def main() -> None:
    files = sorted(PRODUCTS_DIR.glob("*.json"))
    if not files:
        print(f"No product JSON files found in {PRODUCTS_DIR}")
        return

    print(f"Ensuring Pinecone index '{pinecone_service.settings.pinecone_index_name}' exists...")
    pinecone_service.ensure_index()

    batch: list[tuple[str, list[float], dict]] = []
    for path in files:
        product = json.loads(path.read_text(encoding="utf-8"))
        pid = product["product_id"]
        text = build_embed_text(product)
        print(f"  embedding {pid} — {product['name']}")
        vector = embeddings_service.embed_text(text, task_type="RETRIEVAL_DOCUMENT")

        metadata = {
            "product_id": pid,
            "name": product.get("name", ""),
            "description": product.get("description", ""),
            "category": product.get("category", "other"),
            # Pinecone metadata must be scalar/list — serialize nested fields.
            "attributes": json.dumps(product.get("attributes", {}) or {}),
        }
        if product.get("price") is not None:
            metadata["price"] = float(product["price"])

        batch.append((pid, vector, metadata))

    count = pinecone_service.upsert_products(batch)
    print(f"\nUpserted {count} product vectors into Pinecone.")


if __name__ == "__main__":
    main()
