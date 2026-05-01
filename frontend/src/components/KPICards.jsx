const CARDS = [
  {
    key: 'total_responses',
    label: 'Responses',
    sub: 'total analyzed',
    accent: '#6366f1',
  },
  {
    key: 'brands_detected',
    label: 'Brands Active',
    sub: 'in current view',
    accent: '#10b981',
  },
  {
    key: 'top_brand',
    label: 'Top Brand',
    sub: 'most mentioned',
    accent: '#f59e0b',
  },
  {
    key: 'dominant_stage',
    label: 'Lead Stage',
    sub: 'highest activity',
    accent: '#8b5cf6',
  },
]

export default function KPICards({ kpis }) {
  if (!kpis) return null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {CARDS.map(({ key, label, sub, accent }) => (
        <div
          key={key}
          className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 overflow-hidden"
        >
          {/* Top accent line */}
          <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: accent }} />

          <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">
            {label}
          </p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 truncate leading-none mb-1.5">
            {kpis[key] ?? '—'}
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600">{sub}</p>
        </div>
      ))}
    </div>
  )
}
