import type {
  ContributionResponse,
  ProductMetadata,
  SearchResponse,
} from '#/types'

const BACKEND_URL =
  (import.meta.env.VITE_BACKEND_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:7860'

async function asError(res: Response): Promise<never> {
  let detail = `Request failed (${res.status})`
  try {
    const body = await res.json()
    if (body?.detail) detail = body.detail
  } catch {
    /* non-JSON error body */
  }
  throw new Error(detail)
}

/** POST /search — multipart with optional text query and/or image. */
export async function searchProducts(opts: {
  query?: string
  image?: File | null
}): Promise<SearchResponse> {
  const form = new FormData()
  if (opts.query) form.append('query', opts.query)
  if (opts.image) form.append('image', opts.image)

  const res = await fetch(`${BACKEND_URL}/search`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) return asError(res)
  return res.json()
}

/** POST /contribute — opens a GitHub PR with the supplied product. */
export async function contribute(
  product: ProductMetadata,
): Promise<ContributionResponse> {
  const res = await fetch(`${BACKEND_URL}/contribute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product }),
  })
  if (!res.ok) return asError(res)
  return res.json()
}
