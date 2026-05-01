import { useEffect, useState } from 'react'
import { fetchClusters } from '../utils/api'
import { TONE_COLORS } from '../utils/colors'

const CLUSTER_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

function ToneBar({ dist }) {
  const total = Object.values(dist).reduce((a, b) => a + b, 0) || 1
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden gap-px mt-1">
      {['Positive', 'Neutral', 'Cautious'].map((tone) => {
        const pct = ((dist[tone] ?? 0) / total) * 100
        return pct > 0 ? (
          <div key={tone} style={{ width: `${pct}%`, background: TONE_COLORS[tone] }} title={`${tone}: ${pct.toFixed(1)}%`} />
        ) : null
      })}
    </div>
  )
}

function TonePill({ tone }) {
  const colors = {
    Positive: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    Neutral:  'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
    Cautious: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[tone] ?? colors.Neutral}`}>
      {tone}
    </span>
  )
}

export default function ClusterPanel() {
  const [clusters, setClusters] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    fetchClusters()
      .then(setClusters)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3 animate-pulse">
          <div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 rounded" />
          <div className="h-6 w-10 bg-zinc-100 dark:bg-zinc-800 rounded" />
          <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full" />
        </div>
      ))}
    </div>
  )

  if (error) return <p className="text-red-500 text-sm">{error}</p>
  if (!clusters?.length) return <p className="text-zinc-400 text-sm">No clusters found. Run the clustering step first.</p>

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Response Clusters</h2>
          <p className="text-xs text-zinc-400 mt-0.5">K-means clustering on OpenAI embeddings · {clusters.length} clusters</p>
        </div>
        <span className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg">
          {clusters.reduce((s, c) => s + c.size, 0)} responses
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {clusters.map((c, i) => {
          const color = CLUSTER_COLORS[i % CLUSTER_COLORS.length]
          const total = Object.values(c.tone_distribution).reduce((a, b) => a + b, 0) || 1
          return (
            <div key={c.cluster_id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 relative overflow-hidden">
              {/* accent strip */}
              <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: color }} />

              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest">Cluster {c.cluster_id}</span>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-0.5 leading-none">{c.size}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">responses</p>
                </div>
                {c.dominant_tone && <TonePill tone={c.dominant_tone} />}
              </div>

              {/* tone bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Tone split</span>
                  <span>{Object.entries(c.tone_distribution).map(([t, v]) => `${t[0]}:${v}`).join(' · ')}</span>
                </div>
                <ToneBar dist={c.tone_distribution} />
              </div>

              {/* top brands */}
              {c.top_brands?.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-400 mb-2">Top brands</p>
                  <div className="flex flex-wrap gap-1.5">
                    {c.top_brands.map((brand) => (
                      <span
                        key={brand}
                        className="text-xs px-2 py-0.5 rounded-md font-medium"
                        style={{ background: `${color}18`, color }}
                      >
                        {brand}
                        {c.brand_counts?.[brand] != null && (
                          <span className="ml-1 opacity-60">×{c.brand_counts[brand]}</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* stage spread */}
              {Object.keys(c.stage_distribution ?? {}).length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {Object.entries(c.stage_distribution).map(([stage, cnt]) => (
                      <span key={stage} className="text-xs text-zinc-400">
                        <span className="font-medium text-zinc-600 dark:text-zinc-300">{stage}</span> {cnt}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
