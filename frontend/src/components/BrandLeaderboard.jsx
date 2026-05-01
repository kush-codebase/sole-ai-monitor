import { BRAND_COLOR_LIST } from '../utils/colors'

function ShareBar({ pct, color }) {
  return (
    <div className="h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}

export default function BrandLeaderboard({ totalMentions, firstMentions }) {
  const sorted = Object.entries(totalMentions)
    .map(([brand, mentions], i) => ({
      brand,
      mentions,
      firstMentions: firstMentions[brand] ?? 0,
      color: BRAND_COLOR_LIST[i % BRAND_COLOR_LIST.length],
    }))
    .sort((a, b) => b.mentions - a.mentions)

  const max = sorted[0]?.mentions ?? 1
  const total = sorted.reduce((s, e) => s + e.mentions, 0)

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 h-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Brand Rankings</h2>
        <span className="text-xs text-zinc-400">{total} total mentions</span>
      </div>

      {sorted.length === 0 ? (
        <p className="text-zinc-400 text-sm py-8 text-center">No brand mentions found.</p>
      ) : (
        <>
          {/* Column headers */}
          <div className="flex items-center justify-between mb-3 px-0">
            <span className="text-xs text-zinc-400 ml-6">Brand</span>
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <span className="w-10 text-right">1st</span>
              <span className="w-8 text-right">n</span>
              <span className="w-10 text-right">share</span>
            </div>
          </div>

          <div className="space-y-3.5">
            {sorted.map(({ brand, mentions, firstMentions: fm, color }, i) => {
              const pct = max > 0 ? (mentions / max) * 100 : 0
              const share = total > 0 ? ((mentions / total) * 100).toFixed(1) : '0.0'
              return (
                <div key={brand} className="group">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-zinc-400 dark:text-zinc-600 w-4 tabular-nums shrink-0">
                        {i + 1}
                      </span>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                        {brand}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs shrink-0 ml-3">
                      <span className="text-zinc-400 w-10 text-right tabular-nums">{fm}</span>
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 w-8 text-right tabular-nums">
                        {mentions}
                      </span>
                      <span className="text-zinc-400 w-10 text-right tabular-nums">{share}%</span>
                    </div>
                  </div>
                  <div className="ml-6">
                    <ShareBar pct={pct} color={color} />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
