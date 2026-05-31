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

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
    >
      {preview && (
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-2">
          <img
            src={preview}
            alt="upload preview"
            className="h-16 w-16 rounded-lg object-cover"
          />
          <span className="flex-1 truncate text-sm text-slate-600">
            {image?.name}
          </span>
          <button
            type="button"
            onClick={clearImage}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
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
          className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50"
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

        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) submit(e)
          }}
          rows={1}
          placeholder="Search by product name, serial number, or upload a photo…"
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />

        <button
          type="submit"
          disabled={disabled || (!query.trim() && !image)}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Search size={18} />
          Search
        </button>
      </div>
    </form>
  )
}
