import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Boxes } from 'lucide-react'
import { SearchPanel } from '#/components/SearchPanel'
import { ChatWindow } from '#/components/ChatWindow'
import { ThemeToggle } from '#/components/ThemeToggle'
import { searchProducts } from '#/lib/api'
import type { ChatTurn } from '#/types'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [busy, setBusy] = useState(false)

  async function handleSearch(query: string, image: File | null) {
    const id = `${turns.length}-${query.slice(0, 8)}`
    const imagePreview = image ? URL.createObjectURL(image) : undefined
    const turn: ChatTurn = { id, question: query, imagePreview, pending: true }
    setTurns((prev) => [...prev, turn])
    setBusy(true)

    try {
      const response = await searchProducts({ query, image })
      setTurns((prev) =>
        prev.map((t) => (t.id === id ? { ...t, response, pending: false } : t)),
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed.'
      setTurns((prev) =>
        prev.map((t) => (t.id === id ? { ...t, error: message, pending: false } : t)),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex h-screen max-w-3xl flex-col px-4 sm:px-6">
      <header className="flex items-center gap-3 border-b border-border py-4">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-fg shadow-sm">
          <Boxes size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold tracking-tight text-ink">
            Crowd-RAG Product Search
          </h1>
          <p className="truncate text-xs text-muted">
            Vector retrieval with web fallback &amp; community contributions
          </p>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex flex-1 flex-col overflow-hidden" role="main">
        <ChatWindow turns={turns} onPrompt={(q) => handleSearch(q, null)} />
      </main>

      <footer className="py-4">
        <SearchPanel disabled={busy} onSearch={handleSearch} />
      </footer>
    </div>
  )
}
