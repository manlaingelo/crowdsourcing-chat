import { useState } from 'react'
import { CheckCircle2, GitPullRequest, Loader2 } from 'lucide-react'
import { contribute } from '#/lib/api'
import type { ProductMetadata } from '#/types'

const CATEGORIES = ['electronics', 'tools', 'furniture', 'appliances', 'other']

interface Props {
  suggested?: ProductMetadata | null
}

/** "Improve Our Data" form — pre-filled from the web-fallback extraction. */
export function ImproveDataForm({ suggested }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(suggested?.name ?? '')
  const [description, setDescription] = useState(suggested?.description ?? '')
  const [category, setCategory] = useState(suggested?.category ?? 'other')
  const [price, setPrice] = useState(
    suggested?.price != null ? String(suggested.price) : '',
  )
  const [status, setStatus] = useState<'idle' | 'sending'>('idle')
  const [prUrl, setPrUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    setError(null)
    try {
      const product: ProductMetadata = {
        product_id: '',
        name,
        description,
        category,
        price: price ? Number(price) : null,
        attributes: suggested?.attributes ?? {},
      }
      const res = await contribute(product)
      setPrUrl(res.pr_url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Contribution failed.')
    } finally {
      setStatus('idle')
    }
  }

  if (prUrl) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-xl border border-success-fg/25 bg-success-soft p-3 text-sm text-success-fg">
        <CheckCircle2 size={18} className="shrink-0" />
        <span>
          Thanks! A pull request was opened.{' '}
          <a
            href={prUrl}
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline underline-offset-2"
          >
            View PR
          </a>
        </span>
      </div>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 flex items-center gap-2 rounded-xl border border-warn-border bg-warn-soft px-3 py-2 text-sm font-medium text-warn-fg transition-[filter] duration-150 hover:brightness-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:brightness-110"
      >
        <GitPullRequest size={16} className="shrink-0" />
        This product is missing from our catalog — help us add it
      </button>
    )
  }

  return (
    <form
      onSubmit={submit}
      className="mt-3 space-y-3 rounded-xl border border-warn-border bg-warn-soft p-4"
    >
      <p className="text-sm font-semibold text-warn-fg">Improve our data</p>

      <Field label="Name">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
        />
      </Field>
      <Field label="Description">
        <textarea
          required
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input resize-none"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Price (USD)">
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="input"
          />
        </Field>
      </div>

      {error && <p className="text-sm text-danger-fg">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="flex items-center gap-1.5 rounded-lg bg-warn-accent px-4 py-2 text-sm font-medium text-white shadow-sm transition-[background-color,transform] duration-150 hover:bg-warn-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 disabled:opacity-50 disabled:active:scale-100"
        >
          {status === 'sending' ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <GitPullRequest size={16} />
          )}
          Open pull request
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg px-3 py-2 text-sm text-warn-fg transition-[filter] duration-150 hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:brightness-110"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-warn-fg">
        {label}
      </span>
      {children}
    </label>
  )
}
