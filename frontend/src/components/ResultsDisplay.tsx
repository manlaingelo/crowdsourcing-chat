import type { SearchResult } from '#/types'

function formatPrice(price?: number | null) {
  if (price == null) return null
  return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
}

export function ResultsDisplay({ results }: { results: SearchResult[] }) {
  if (results.length === 0) return null

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        Matched products
      </p>
      {results.map(({ product, score }) => (
        <div
          key={product.product_id}
          className="rounded-xl border border-slate-200 bg-white p-3"
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold text-slate-800">
              {product.name}
            </h4>
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              {(score * 100).toFixed(0)}% match
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
            {product.description}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600">
              {product.category}
            </span>
            {formatPrice(product.price) && (
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">
                {formatPrice(product.price)}
              </span>
            )}
            {Object.entries(product.attributes)
              .slice(0, 4)
              .map(([k, v]) => (
                <span
                  key={k}
                  className="rounded-md bg-slate-50 px-2 py-0.5 text-xs text-slate-500"
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
