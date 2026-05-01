import { useState } from 'react'
import { fetchRAGSearch } from '../utils/api'
import { TONE_COLORS } from '../utils/colors'

function SearchIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function StagePill({ stage }) {
  const colors = {
    Trigger:  'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    Criteria: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
    Evaluate: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
    Commit:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[stage] ?? 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
      {stage}
    </span>
  )
}

function ToneDot({ tone }) {
  return (
    <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: TONE_COLORS[tone] ?? '#a1a1aa' }} />
      {tone}
    </span>
  )
}

export default function RAGSearch() {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchRAGSearch(query.trim(), 8)
      setResults(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const onKey = (e) => { if (e.key === 'Enter') search() }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Semantic Search</h2>
        <p className="text-xs text-zinc-400 mt-0.5">Find responses semantically similar to your query using RAG</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
            <SearchIcon />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="e.g. best running shoes under 5000 rupees..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition"
          />
        </div>
        <button
          onClick={search}
          disabled={loading || !query.trim()}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Results */}
      {results !== null && (
        results.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 text-sm">
            No results found. Try a different query or index responses first.
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400">{results.length} results</p>
            {results.map((r, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  {/* similarity badge */}
                  <span className="text-xs font-semibold tabular-nums px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                    {(r.similarity * 100).toFixed(1)}% match
                  </span>
                  {r.stage && <StagePill stage={r.stage} />}
                  {r.tone  && <ToneDot  tone={r.tone}  />}
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed line-clamp-4">
                  {r.response}
                </p>
              </div>
            ))}
          </div>
        )
      )}

      {results === null && !loading && (
        <div className="text-center py-16 text-zinc-300 dark:text-zinc-700 text-sm select-none">
          Enter a query above to search across all AI responses
        </div>
      )}
    </div>
  )
}
