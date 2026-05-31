"""Pydantic models that define the backend's API contract."""

from typing import Literal, Optional

from pydantic import BaseModel, Field


class ProductMetadata(BaseModel):
    """A product record as stored in the data ledger / vector DB metadata."""

    product_id: str
    name: str
    description: str
    category: str = "other"
    price: Optional[float] = None
    attributes: dict = Field(default_factory=dict)


class SearchResult(BaseModel):
    """A single vector-search hit."""

    product: ProductMetadata
    score: float


class SearchResponse(BaseModel):
    """Unified response for both the retrieval and the web-fallback workflows."""

    answer: str
    source: Literal["vector", "web"]
    confidence: float
    query_text: str
    results: list[SearchResult] = Field(default_factory=list)
    needs_contribution: bool = False
    suggested_product: Optional[ProductMetadata] = None


class ContributionRequest(BaseModel):
    """Payload from the 'Improve Our Data' form -> opens a GitHub PR."""

    product: ProductMetadata


class ContributionResponse(BaseModel):
    pr_url: str
    branch: str
