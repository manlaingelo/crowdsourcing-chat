"""Smoke-test connectivity to all four external services.

    python scripts/verify_setup.py

Prints PASS/FAIL per service. Safe to run repeatedly — read-only except for a
single tiny embedding call and a Pinecone index existence check.
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / "backend"
sys.path.insert(0, str(BACKEND))

from dotenv import load_dotenv  # noqa: E402

load_dotenv(BACKEND / ".env")


def _check(name: str, fn) -> bool:
    try:
        detail = fn()
        print(f"  PASS  {name}: {detail}")
        return True
    except Exception as exc:  # noqa: BLE001
        print(f"  FAIL  {name}: {exc}")
        return False


def check_gemini() -> str:
    from services import embeddings_service

    vec = embeddings_service.embed_text("connectivity test", task_type="RETRIEVAL_QUERY")
    return f"embedding dim={len(vec)}"


def check_pinecone() -> str:
    from pinecone import Pinecone

    from config import settings

    pc = Pinecone(api_key=settings.pinecone_api_key)
    names = [i["name"] for i in pc.list_indexes()]
    return f"indexes={names}"


def check_tavily() -> str:
    from services import tavily_service

    results = tavily_service.search("cordless drill", count=1)
    return f"{len(results)} result(s)"


def check_github() -> str:
    from github import Github

    from config import settings

    gh = Github(settings.github_token)
    repo = gh.get_repo(f"{settings.github_repo_owner}/{settings.github_repo_name}")
    return f"repo={repo.full_name}, default_branch={repo.default_branch}"


def main() -> None:
    print("Verifying external service connectivity...\n")
    results = [
        _check("Google AI Studio (Gemini)", check_gemini),
        _check("Pinecone", check_pinecone),
        _check("Tavily Search", check_tavily),
        _check("GitHub", check_github),
    ]
    print()
    if all(results):
        print("All services reachable. You're ready to ingest and run.")
    else:
        print("Some checks failed — fix the credentials above before running.")
        sys.exit(1)


if __name__ == "__main__":
    main()
