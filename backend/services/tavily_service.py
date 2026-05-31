"""Tavily Search API client — the web-intel fallback.

Free tier: 1,000 search queries/month. We make a single call per fallback and
return clean text snippets for Gemini to summarize.
"""

import httpx

from config import settings

_ENDPOINT = "https://api.tavily.com/search"


def search(query: str, count: int = 5) -> list[dict]:
    """Return a list of {title, description, url} web results.

    Returns an empty list on auth/network errors so the caller can degrade
    gracefully rather than 500.
    """
    if not settings.tavily_api_key:
        return []

    headers = {
        "Authorization": f"Bearer {settings.tavily_api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "query": query,
        "max_results": count,
        "search_depth": "basic",
    }

    try:
        resp = httpx.post(_ENDPOINT, headers=headers, json=payload, timeout=15.0)
        resp.raise_for_status()
        data = resp.json()
    except (httpx.HTTPError, ValueError):
        return []

    results = []
    for item in data.get("results", []) or []:
        results.append(
            {
                "title": item.get("title", ""),
                "description": item.get("content", ""),
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
