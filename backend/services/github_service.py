"""Open a data-contribution Pull Request against the public product ledger.

Workflow #2 (crowdsourcing): when a product is missing from the catalog, the
extracted record is committed to a new branch under data/products/ and a PR is
opened automatically via the GitHub API (PyGithub).
"""

import json
import re

from github import Github, GithubException

from config import settings
from models import ProductMetadata


class GitHubServiceError(RuntimeError):
    pass


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "product"


def open_contribution_pr(product: ProductMetadata) -> tuple[str, str]:
    """Commit a product JSON to a new branch and open a PR.

    Returns (pr_url, branch_name). Raises GitHubServiceError on failure.
    """
    if not settings.github_token:
        raise GitHubServiceError("GITHUB_TOKEN is not configured.")
    if not (settings.github_repo_owner and settings.github_repo_name):
        raise GitHubServiceError("GitHub repo owner/name not configured.")

    gh = Github(settings.github_token)
    try:
        repo = gh.get_repo(f"{settings.github_repo_owner}/{settings.github_repo_name}")
        base = repo.default_branch
        base_sha = repo.get_branch(base).commit.sha

        slug = _slugify(product.product_id or product.name)
        branch = f"contribute/{slug}"
        # Make the branch name unique-ish if it already exists.
        try:
            repo.create_git_ref(ref=f"refs/heads/{branch}", sha=base_sha)
        except GithubException:
            branch = f"{branch}-{base_sha[:7]}"
            repo.create_git_ref(ref=f"refs/heads/{branch}", sha=base_sha)

        path = f"data/products/{slug}.json"
        content = json.dumps(product.model_dump(), indent=2, ensure_ascii=False)
        repo.create_file(
            path=path,
            message=f"Add product: {product.name}",
            content=content,
            branch=branch,
        )

        pr = repo.create_pull(
            title=f"Add product: {product.name}",
            body=(
                "Crowdsourced contribution from the Crowd-RAG chatbot.\n\n"
                f"- **Product:** {product.name}\n"
                f"- **Category:** {product.category}\n\n"
                "This product was missing from the catalog; details were extracted "
                "from a live web search. Please review before merging."
            ),
            head=branch,
            base=base,
        )
        return pr.html_url, branch
    except GithubException as exc:
        raise GitHubServiceError(f"GitHub API error: {exc.data or exc}") from exc
