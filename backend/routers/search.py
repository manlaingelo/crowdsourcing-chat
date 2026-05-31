"""Search + contribution endpoints."""

import uuid

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from models import ContributionRequest, ContributionResponse, SearchResponse
from services import github_service, orchestrator
from utils.image_processing import ImageValidationError, validate_image

router = APIRouter(tags=["search"])


@router.post("/search", response_model=SearchResponse)
async def search(
    query: str | None = Form(default=None),
    image: UploadFile | None = File(default=None),
) -> SearchResponse:
    """Multi-modal product search. Accepts a text `query`, an `image`, or both."""
    if not query and image is None:
        raise HTTPException(status_code=400, detail="Provide a text query or an image.")

    image_bytes: bytes | None = None
    mime_type: str | None = None
    if image is not None:
        raw = await image.read()
        try:
            mime_type = validate_image(raw, image.content_type)
        except ImageValidationError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        image_bytes = raw

    try:
        return orchestrator.run_search(query, image_bytes, mime_type)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001 - surface upstream failures cleanly
        raise HTTPException(status_code=502, detail=f"Search failed: {exc}") from exc


@router.post("/contribute", response_model=ContributionResponse)
def contribute(req: ContributionRequest) -> ContributionResponse:
    """Open a GitHub PR adding the supplied product to the data ledger."""
    product = req.product
    if not product.product_id:
        # Generate a stable-ish id for newly contributed products.
        product.product_id = f"CONTRIB-{uuid.uuid4().hex[:8].upper()}"
    try:
        pr_url, branch = github_service.open_contribution_pr(product)
    except github_service.GitHubServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return ContributionResponse(pr_url=pr_url, branch=branch)
