import { Bot, Globe, Loader2, Database, User } from 'lucide-react'
import { ResultsDisplay } from './ResultsDisplay'
import { ImproveDataForm } from './ImproveDataForm'
import type { ChatTurn } from '#/types'

function SourceBadge({ source }: { source: 'vector' | 'web' }) {
  const isVector = source === 'vector'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        isVector
          ? 'bg-indigo-50 text-indigo-600'
          : 'bg-sky-50 text-sky-600'
      }`}
    >
      {isVector ? <Database size={12} /> : <Globe size={12} />}
      {isVector ? 'Local catalog' : 'Web'}
    </span>
  )
}

export function ChatWindow({ turns }: { turns: ChatTurn[] }) {
  if (turns.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-400">
        <Bot size={40} className="mb-3" />
        <p className="text-sm">
          Ask about a product by name or serial number, or upload a photo.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto pb-4">
      {turns.map((turn) => (
        <div key={turn.id} className="space-y-3">
          {/* User question */}
          <div className="flex items-start justify-end gap-2">
            <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-indigo-600 px-4 py-2.5 text-sm text-white">
              {turn.imagePreview && (
                <img
                  src={turn.imagePreview}
                  alt="query"
                  className="mb-2 max-h-40 rounded-lg object-cover"
                />
              )}
              {turn.question || <em className="opacity-80">Image search</em>}
            </div>
            <div className="mt-1 rounded-full bg-indigo-100 p-1.5 text-indigo-600">
              <User size={16} />
            </div>
          </div>

          {/* Assistant response */}
          <div className="flex items-start gap-2">
            <div className="mt-1 rounded-full bg-slate-100 p-1.5 text-slate-600">
              <Bot size={16} />
            </div>
            <div className="max-w-[85%] flex-1">
              {turn.pending ? (
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 text-sm text-slate-400 shadow-sm">
                  <Loader2 size={16} className="animate-spin" />
                  Searching…
                </div>
              ) : turn.error ? (
                <div className="rounded-2xl rounded-tl-sm border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                  {turn.error}
                </div>
              ) : turn.response ? (
                <div>
                  <div className="rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm">
                    <div className="mb-1.5 flex items-center gap-2">
                      <SourceBadge source={turn.response.source} />
                      <span className="text-xs text-slate-400">
                        confidence {(turn.response.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{turn.response.answer}</p>
                  </div>
                  <ResultsDisplay results={turn.response.results} />
                  {turn.response.needs_contribution && (
                    <ImproveDataForm suggested={turn.response.suggested_product} />
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
