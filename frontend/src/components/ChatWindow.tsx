import { useEffect, useRef } from 'react'
import { Boxes, Database, Globe, Sparkles, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ResultsDisplay } from './ResultsDisplay'
import { ImproveDataForm } from './ImproveDataForm'
import type { ChatTurn } from '#/types'

const EXAMPLE_PROMPTS = [
  'Bosch GSB 18V-50 cordless drill',
  'Serial no. 4XK-99213',
  'Stainless steel cookware set',
]

function SourceBadge({ source }: { source: 'vector' | 'web' }) {
  const isVector = source === 'vector'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        isVector
          ? 'bg-accent-soft text-accent-soft-fg'
          : 'bg-web-soft text-web-fg'
      }`}
    >
      {isVector ? <Database size={12} /> : <Globe size={12} />}
      {isVector ? 'Local catalog' : 'Web'}
    </span>
  )
}

function ConfidenceMeter({
  value,
  source,
}: {
  value: number
  source: 'vector' | 'web'
}) {
  const pct = Math.round(value * 100)
  const fill = source === 'vector' ? 'bg-accent' : 'bg-web-fg'
  return (
    <span className="ml-auto inline-flex items-center gap-1.5">
      <span className="text-xs text-faint">confidence</span>
      <span
        className="h-1.5 w-12 overflow-hidden rounded-full bg-surface-2"
        role="meter"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Answer confidence"
      >
        <span
          className={`block h-full rounded-full transition-[width] duration-500 ${fill}`}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="text-xs font-medium tabular-nums text-muted">{pct}%</span>
    </span>
  )
}

function EmptyState({ onPrompt }: { onPrompt: (q: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent-soft-fg">
        <Boxes size={28} />
      </div>
      <h2 className="mt-4 text-lg font-semibold tracking-tight text-ink">
        Find any product
      </h2>
      <p className="mt-1 max-w-sm text-sm text-muted">
        Search by name or serial number, or upload a photo. We check the local
        catalog first, then the web.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {EXAMPLE_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPrompt(p)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-[color,background-color,border-color] duration-150 hover:border-border-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Sparkles size={13} className="text-faint" />
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}

function AssistantAvatar() {
  return (
    <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-muted ring-1 ring-border">
      <Boxes size={15} />
    </div>
  )
}

function LoadingBubble() {
  return (
    <div className="space-y-2 rounded-2xl rounded-tl-md border border-border bg-surface px-4 py-3 shadow-sm">
      <span className="block h-2.5 w-3/4 skeleton" />
      <span className="block h-2.5 w-full skeleton" />
      <span className="block h-2.5 w-2/3 skeleton" />
    </div>
  )
}

export function ChatWindow({
  turns,
  onPrompt,
}: {
  turns: ChatTurn[]
  onPrompt: (q: string) => void
}) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    bottomRef.current?.scrollIntoView({
      behavior: reduce ? 'auto' : 'smooth',
      block: 'end',
    })
  }, [turns])

  if (turns.length === 0) return <EmptyState onPrompt={onPrompt} />

  return (
    <div
      className="flex flex-1 flex-col gap-6 overflow-y-auto py-5"
      role="log"
      aria-live="polite"
      aria-label="Conversation"
    >
      {turns.map((turn) => (
        <div key={turn.id} className="msg-in space-y-3">
          {/* User question */}
          <div className="flex items-start justify-end gap-2">
            <div className="max-w-[80%] rounded-2xl rounded-tr-md bg-accent px-4 py-2.5 text-sm leading-relaxed text-accent-fg shadow-sm">
              {turn.imagePreview && (
                <img
                  src={turn.imagePreview}
                  alt="Uploaded product query"
                  className="mb-2 max-h-40 rounded-lg object-cover"
                />
              )}
              {turn.question || (
                <em className="opacity-80">Image search</em>
              )}
            </div>
            <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-soft-fg">
              <User size={15} />
            </div>
          </div>

          {/* Assistant response */}
          <div className="flex items-start gap-2">
            <AssistantAvatar />
            <div className="min-w-0 max-w-[85%] flex-1">
              {turn.pending ? (
                <LoadingBubble />
              ) : turn.error ? (
                <div className="rounded-2xl rounded-tl-md border border-danger-border bg-danger-soft px-4 py-2.5 text-sm text-danger-fg">
                  {turn.error}
                </div>
              ) : turn.response ? (
                <div>
                  <div className="rounded-2xl rounded-tl-md border border-border bg-surface px-4 py-3 shadow-sm">
                    <div className="mb-2 flex items-center gap-2">
                      <SourceBadge source={turn.response.source} />
                      <ConfidenceMeter
                        value={turn.response.confidence}
                        source={turn.response.source}
                      />
                    </div>
                    <div className="answer-prose prose prose-sm max-w-none text-sm leading-relaxed text-ink">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          a: ({ node: _node, ...props }) => (
                            <a target="_blank" rel="noreferrer" {...props} />
                          ),
                        }}
                      >
                        {turn.response.answer}
                      </ReactMarkdown>
                    </div>
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
      <div ref={bottomRef} />
    </div>
  )
}
