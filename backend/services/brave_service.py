"""Brave Search API client — the web-intel fallback.

Free tier: 1 request/second, 10,000 queries/month. We make a single call per
fallback and return clean text snippets for Gemini to summarize.
"""

import httpx

from config import settings

_ENDPOINT = "https://api.search.brave.com/res/v1/web/search"


def search(query: str, count: int = 5) -> list[dict]:
    """Return a list of {title, description, url} web results.

    Returns an empty list on auth/network errors so the caller can degrade
    gracefully rather than 500.
    """
    if not settings.brave_api_key:
        return []

    headers = {
        "Accept": "application/json",
        "X-Subscription-Token": settings.brave_api_key,
    }
    params = {"q": query, "count": count}

    try:
        resp = httpx.get(_ENDPOINT, headers=headers, params=params, timeout=15.0)
        resp.raise_for_status()
        data = resp.json()
    except (httpx.HTTPError, ValueError):
        return []

    results = []
    for item in (data.get("web", {}) or {}).get("results", []):
        results.append(
            {
                "title": item.get("title", ""),
                "description": item.get("description", ""),
                "url": item.get("url", ""),
            }
        )
    return results


def results_to_context(results: list[dict]) -> str:
    """Flatten web results into a plain-text block for the LLM."""
    lines = []
    for r in results:
        lines.append(f"- {r['title']}: {r['description']} ({r['url']})")
    return "\n".join(lines)
