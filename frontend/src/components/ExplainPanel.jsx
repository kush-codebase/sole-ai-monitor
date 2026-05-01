import { useState } from 'react'
import { fetchBrandExplain } from '../utils/api'

const BRANDS = ['Nike', 'Adidas', 'Puma', 'Asics', 'The Souled Store', 'Comet', 'Gully Labs', 'Bonkers']

const ATTRIBUTE_COLORS = {
  price:        'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  quality:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  style:        'bg-pink-100 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400',
  performance:  'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  availability: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
  trust:        'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
  other:        'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
}

function AttributePill({ attr }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${ATTRIBUTE_COLORS[attr] ?? ATTRIBUTE_COLORS.other}`}>
      {attr}
    </span>
  )
}

export default function ExplainPanel() {
  const [selected, setSelected]   = useState(null)
  const [results, setResults]     = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  const load = async (brand) => {
    if (selected === brand) { setSelected(null); setResults(null); return }
    setSelected(brand)
    setLoading(true)
    setError(null)
    try {
      const data = await fetchBrandExplain(brand)
      setResults(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Group by overall_theme
  const grouped = results?.reduce((acc, e) => {
    const theme = e.overall_theme ?? 'General'
    ;(acc[theme] = acc[theme] ?? []).push(e)
    return acc
  }, {})

  // Attribute frequency
  const attrCount = results?.reduce((acc, e) => {
    if (e.attribute) acc[e.attribute] = (acc[e.attribute] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Brand Explainability</h2>
        <p className="text-xs text-zinc-400 mt-0.5">Why each brand appears in AI responses — context, reasoning, and attributes</p>
      </div>

      {/* Brand selector */}
      <div className="flex flex-wrap gap-2">
        {BRANDS.map((brand) => (
          <button
            key={brand}
            onClick={() => load(brand)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              selected === brand
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:border-zinc-400'
            }`}
          >
            {brand}
          </button>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-2 animate-pulse">
              <div className="h-3 w-48 bg-zinc-100 dark:bg-zinc-800 rounded" />
              <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded" />
              <div className="h-3 w-3/4 bg-zinc-100 dark:bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      )}

      {!loading && results !== null && (
        results.length === 0 ? (
          <p className="text-zinc-400 text-sm text-center py-8">No explanations found for {selected}. Run the explainability step first.</p>
        ) : (
          <div className="space-y-6">

            {/* Summary row */}
            <div className="flex flex-wrap gap-3">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-center">
                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{results.length}</p>
                <p className="text-xs text-zinc-400 mt-0.5">mentions</p>
              </div>
              {attrCount && Object.entries(attrCount).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([attr, cnt]) => (
                <div key={attr} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-center">
                  <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{cnt}</p>
                  <AttributePill attr={attr} />
                </div>
              ))}
            </div>

            {/* Grouped by theme */}
            {Object.entries(grouped).map(([theme, items]) => (
              <div key={theme}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Theme</span>
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{theme}</span>
                  <span className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">{items.length}</span>
                </div>
                <div className="space-y-3">
                  {items.slice(0, 6).map((e, i) => (
                    <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-snug">{e.reason}</p>
                        {e.attribute && <AttributePill attr={e.attribute} />}
                      </div>
                      {e.context_sentence && (
                        <blockquote className="mt-2 pl-3 border-l-2 border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 dark:text-zinc-400 italic leading-relaxed">
                          {e.context_sentence}
                        </blockquote>
                      )}
                    </div>
                  ))}
                  {items.length > 6 && (
                    <p className="text-xs text-zinc-400 text-center">+{items.length - 6} more in this theme</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {!loading && results === null && (
        <div className="text-center py-16 text-zinc-300 dark:text-zinc-700 text-sm select-none">
          Select a brand above to see why it appears in AI responses
        </div>
      )}
    </div>
  )
}
