// Mirrors the backend Pydantic models in backend/models.py.

export interface ProductMetadata {
  product_id: string
  name: string
  description: string
  category: string
  price?: number | null
  attributes: Record<string, unknown>
}

export interface SearchResult {
  product: ProductMetadata
  score: number
}

export interface SearchResponse {
  answer: string
  source: 'vector' | 'web'
  confidence: number
  query_text: string
  results: SearchResult[]
  needs_contribution: boolean
  suggested_product?: ProductMetadata | null
}

export interface ContributionResponse {
  pr_url: string
  branch: string
}

// A single turn in the chat transcript.
export interface ChatTurn {
  id: string
  question: string
  imagePreview?: string
  response?: SearchResponse
  error?: string
  pending: boolean
}
