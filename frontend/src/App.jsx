import { useState, useEffect, useRef } from 'react'
import { fetchStages, fetchMetrics } from './utils/api'
import { useTheme } from './utils/theme'
import { exportAsCSV, exportAsJSON } from './utils/export'
import KPICards       from './components/KPICards'
import BrandLeaderboard from './components/BrandLeaderboard'
import StageBreakdown  from './components/StageBreakdown'
import ToneChart       from './components/ToneChart'
import ClusterPanel    from './components/ClusterPanel'
import RAGSearch       from './components/RAGSearch'
import ExplainPanel    from './components/ExplainPanel'

// ─── Icons ────────────────────────────────────────────────────────────────────

function LogoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="white">
      <rect x="0" y="8" width="3" height="6" rx="0.5" />
      <rect x="4" y="4" width="3" height="10" rx="0.5" />
      <rect x="8" y="1" width="3" height="13" rx="0.5" />
      <rect x="12" y="5" width="2" height="9" rx="0.5" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1"  x2="12" y2="3"  />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22"  y1="4.22"  x2="5.64"  y2="5.64"  />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1"  y1="12" x2="3"  y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36" />
      <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"  />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function ChevronDown({ open }) {
  return (
    <svg
      width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
      className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────

function Dropdown({ trigger, children }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  return (
    <div ref={ref} className="relative">
      <div onClick={() => setOpen((o) => !o)}>{trigger(open)}</div>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg shadow-zinc-200/60 dark:shadow-none z-30 min-w-40 py-1">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  )
}

// ─── Brand filter ──────────────────────────────────────────────────────────────

function BrandFilter({ allBrands, selectedBrands, onChange }) {
  const active = selectedBrands ?? new Set(allBrands)
  const isAll  = selectedBrands === null

  const toggle = (brand) => {
    const next = new Set(active)
    next.has(brand) ? next.delete(brand) : next.add(brand)
    onChange(next.size === allBrands.length ? null : next)
  }

  return (
    <Dropdown
      trigger={(open) => (
        <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
          open
            ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100'
            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
        }`}>
          Brands
          {!isAll && (
            <span className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-md px-1.5 py-0.5 text-xs font-semibold leading-none">
              {active.size}
            </span>
          )}
          <ChevronDown open={open} />
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
            <span className="text-xs text-zinc-400">Filter brands</span>
            <button onClick={() => { onChange(null); close() }} className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
              All
            </button>
          </div>
          {allBrands.map((brand) => (
            <label key={brand} className="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={active.has(brand)}
                onChange={() => toggle(brand)}
                className="accent-indigo-600 w-3.5 h-3.5 shrink-0"
              />
              {brand}
            </label>
          ))}
        </>
      )}
    </Dropdown>
  )
}

// ─── Export menu ──────────────────────────────────────────────────────────────

function ExportMenu({ metrics, selectedStage, activeBrands }) {
  const handle = (type, close) => {
    type === 'csv'
      ? exportAsCSV(metrics.total_mentions, metrics.first_mentions, metrics.stage_mentions)
      : exportAsJSON(metrics, { stage_tone: metrics.stage_tone }, selectedStage, [...activeBrands])
    close()
  }

  return (
    <Dropdown
      trigger={(open) => (
        <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
          open
            ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100'
            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
        }`}>
          Export <ChevronDown open={open} />
        </button>
      )}
    >
      {(close) => (
        <>
          <button onClick={() => handle('csv', close)} className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
            Download CSV
          </button>
          <button onClick={() => handle('json', close)} className="w-full text-left px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
            Download JSON
          </button>
        </>
      )}
    </Dropdown>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonBlock({ className }) {
  return <div className={`bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse ${className}`} />
}

function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 space-y-3">
            <SkeletonBlock className="h-3 w-20" />
            <SkeletonBlock className="h-8 w-14" />
            <SkeletonBlock className="h-2.5 w-24" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4">
          <SkeletonBlock className="h-4 w-32" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <SkeletonBlock className="h-3 w-full" />
              <SkeletonBlock className="h-1.5 w-full" />
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="h-40 w-40 rounded-full mx-auto" />
        </div>
      </div>
    </div>
  )
}

// ─── Page tab definition ──────────────────────────────────────────────────────

const PAGE_TABS = [
  { id: 'overview',      label: 'Overview'       },
  { id: 'clusters',      label: 'Clusters'        },
  { id: 'search',        label: 'Search'          },
  { id: 'explainability',label: 'Explainability'  },
]

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  const [page, setPage]                   = useState('overview')
  const [stages, setStages]               = useState([])
  const [selectedStage, setSelectedStage] = useState('All')
  const [selectedBrands, setSelectedBrands] = useState(null)
  const [metrics, setMetrics]             = useState(null)
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(null)

  useEffect(() => {
    fetchStages()
      .then((d) => setStages(d.stages))
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    if (page !== 'overview') return
    setLoading(true)
    setError(null)
    setSelectedBrands(null)
    fetchMetrics(selectedStage)
      .then((m) => setMetrics(m))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [selectedStage, page])

  const allBrands    = metrics ? Object.keys(metrics.total_mentions) : []
  const activeBrands = selectedBrands ?? new Set(allBrands)

  const filteredMetrics = metrics ? (() => {
    const tm = Object.fromEntries(Object.entries(metrics.total_mentions).filter(([b]) => activeBrands.has(b)))
    const fm = Object.fromEntries(Object.entries(metrics.first_mentions).filter(([b]) => activeBrands.has(b)))
    const sm = Object.fromEntries(
      Object.entries(metrics.stage_mentions).map(([stage, brands]) => [
        stage,
        Object.fromEntries(Object.entries(brands).filter(([b]) => activeBrands.has(b))),
      ])
    )
    const topBrand = Object.entries(tm).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
    return { ...metrics, total_mentions: tm, first_mentions: fm, stage_mentions: sm, kpis: { ...metrics.kpis, brands_detected: Object.keys(tm).length, top_brand: topBrand } }
  })() : null

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">

        {/* ── Header ── */}
        <header className="bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-7xl mx-auto px-6">

            {/* Top bar */}
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                  <LogoIcon />
                </div>
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">SOLE</span>
                <span className="text-zinc-300 dark:text-zinc-700 select-none">·</span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">AI Monitor</span>
              </div>

              <div className="flex items-center gap-2">
                {page === 'overview' && allBrands.length > 0 && (
                  <BrandFilter allBrands={allBrands} selectedBrands={selectedBrands} onChange={setSelectedBrands} />
                )}
                {page === 'overview' && filteredMetrics && (
                  <ExportMenu metrics={filteredMetrics} selectedStage={selectedStage} activeBrands={activeBrands} />
                )}
                <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />
                <button
                  onClick={toggle}
                  title="Toggle theme"
                  className="p-2 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {isDark ? <SunIcon /> : <MoonIcon />}
                </button>
              </div>
            </div>

            {/* Page tabs */}
            <div className="flex items-center gap-0 -mb-px overflow-x-auto scrollbar-none">
              {PAGE_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setPage(tab.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    page === tab.id
                      ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
                      : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* ── Stage sub-tabs (Overview only) ── */}
        {page === 'overview' && stages.length > 0 && (
          <div className="bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-900">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex items-center gap-0 overflow-x-auto scrollbar-none">
                {['All', ...stages].map((stage) => (
                  <button
                    key={stage}
                    onClick={() => setSelectedStage(stage)}
                    className={`px-4 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                      selectedStage === stage
                        ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                        : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300'
                    }`}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Main ── */}
        <main className="max-w-7xl mx-auto px-6 py-7">

          {/* Error banner */}
          {error && (
            <div className="flex items-start gap-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 mb-6 text-sm">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* ── Overview ── */}
          {page === 'overview' && (
            loading ? <Skeleton /> : filteredMetrics ? (
              <>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400 mb-6">
                  <span className="font-medium text-zinc-600 dark:text-zinc-300">{filteredMetrics.kpis.total_responses}</span>
                  <span>responses</span>
                  <span className="text-zinc-300 dark:text-zinc-700">·</span>
                  <span className="font-medium text-zinc-600 dark:text-zinc-300">{stages.length}</span>
                  <span>stages</span>
                  <span className="text-zinc-300 dark:text-zinc-700">·</span>
                  <span className="font-medium text-zinc-600 dark:text-zinc-300">{allBrands.length}</span>
                  <span>brands tracked</span>
                  {selectedBrands && (
                    <>
                      <span className="text-zinc-300 dark:text-zinc-700">·</span>
                      <span className="text-indigo-500 font-medium">{activeBrands.size} filtered</span>
                      <button onClick={() => setSelectedBrands(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 underline ml-0.5">
                        clear
                      </button>
                    </>
                  )}
                </div>
                <KPICards kpis={filteredMetrics.kpis} />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                  <div className="lg:col-span-2">
                    <BrandLeaderboard totalMentions={filteredMetrics.total_mentions} firstMentions={filteredMetrics.first_mentions} />
                  </div>
                  <ToneChart stageTone={filteredMetrics.stage_tone ?? {}} />
                </div>
                <div className="mt-6">
                  <StageBreakdown stageMentions={filteredMetrics.stage_mentions} />
                </div>
              </>
            ) : null
          )}

          {/* ── Clusters ── */}
          {page === 'clusters' && <ClusterPanel />}

          {/* ── Search ── */}
          {page === 'search' && <RAGSearch />}

          {/* ── Explainability ── */}
          {page === 'explainability' && <ExplainPanel />}

        </main>
      </div>
    </div>
  )
}
