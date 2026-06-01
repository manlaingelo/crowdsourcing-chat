import type { SearchResult } from '#/types'

function formatPrice(price?: number | null) {
  if (price == null) return null
  return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
}

export function ResultsDisplay({ results }: { results: SearchResult[] }) {
  if (results.length === 0) return null

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-faint">
        Matched products
      </p>
      {results.map(({ product, score }) => (
        <div
          key={product.product_id}
          className="rounded-xl border border-border bg-surface p-3 transition-colors hover:border-border-strong"
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold text-ink">{product.name}</h4>
            <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium tabular-nums text-muted">
              {(score * 100).toFixed(0)}% match
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-muted">
            {product.description}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent-soft-fg">
              {product.category}
            </span>
            {formatPrice(product.price) && (
              <span className="rounded-md bg-success-soft px-2 py-0.5 text-xs font-medium text-success-fg">
                {formatPrice(product.price)}
              </span>
            )}
            {Object.entries(product.attributes)
              .slice(0, 4)
              .map(([k, v]) => (
                <span
                  key={k}
                  className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted"
                >
                  {k}: {String(v)}
                </span>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
