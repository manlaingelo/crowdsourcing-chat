import { useRef, useState } from 'react'
import { ImagePlus, Search, X } from 'lucide-react'

interface Props {
  disabled: boolean
  onSearch: (query: string, image: File | null) => void
}

export function SearchPanel({ disabled, onSearch }: Props) {
  const [query, setQuery] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function pickImage(file: File | null) {
    setImage(file)
    setPreview(file ? URL.createObjectURL(file) : null)
  }

  function clearImage() {
    pickImage(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (disabled) return
    if (!query.trim() && !image) return
    onSearch(query.trim(), image)
    setQuery('')
    clearImage()
  }

  const canSubmit = !disabled && (query.trim().length > 0 || image !== null)

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-border bg-surface p-2.5 shadow-sm transition-colors focus-within:border-border-strong"
    >
      {preview && (
        <div className="mb-2.5 flex items-center gap-3 rounded-xl bg-surface-2 p-2">
          <img
            src={preview}
            alt="Upload preview"
            className="size-14 rounded-lg object-cover"
          />
          <span className="flex-1 truncate text-sm text-muted">
            {image?.name}
          </span>
          <button
            type="button"
            onClick={clearImage}
            className="grid size-8 place-items-center rounded-full text-faint transition-colors hover:bg-border hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Remove image"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          className="grid size-11 shrink-0 place-items-center rounded-xl border border-border text-muted transition-[color,background-color,border-color] duration-150 hover:border-border-strong hover:bg-surface-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          aria-label="Upload product image"
        >
          <ImagePlus size={20} />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pickImage(e.target.files?.[0] ?? null)}
        />

        <div className="relative flex-1">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) submit(e)
            }}
            rows={1}
            placeholder="Search by product name, serial number, or upload a photo…"
            className="max-h-32 min-h-11 w-full resize-none rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-faint focus-visible:border-accent focus-visible:ring-[3px] focus-visible:ring-ring"
          />
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-medium text-accent-fg shadow-sm transition-[background-color,transform,opacity] duration-150 hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
        >
          <Search size={18} />
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>
    </form>
  )
}
