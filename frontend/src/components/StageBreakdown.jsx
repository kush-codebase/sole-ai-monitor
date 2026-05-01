import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { BRAND_COLOR_LIST } from '../utils/colors'
import { useTheme, chartColors } from '../utils/theme'

function CustomTooltip({ active, payload, label, ct }) {
  if (!active || !payload?.length) return null
  const filtered = payload.filter((p) => p.value > 0)
  if (!filtered.length) return null

  return (
    <div
      className="rounded-xl px-3 py-2.5 text-xs shadow-xl min-w-36"
      style={{ background: ct.tooltip.bg, border: `1px solid ${ct.tooltip.border}` }}
    >
      <p className="font-semibold mb-2" style={{ color: ct.tooltip.text }}>{label}</p>
      <div className="space-y-1">
        {filtered.sort((a, b) => b.value - a.value).map((p) => (
          <div key={p.name} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p.fill }} />
              <span style={{ color: ct.tooltip.muted }}>{p.name}</span>
            </div>
            <span className="font-semibold tabular-nums" style={{ color: ct.tooltip.text }}>{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function StageBreakdown({ stageMentions }) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const ct = chartColors(isDark)

  const allBrands = [
    ...new Set(Object.values(stageMentions).flatMap((b) => Object.keys(b))),
  ]

  const data = Object.entries(stageMentions).map(([stage, brands]) => ({
    stage,
    ...brands,
  }))

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Stage Dominance</h2>
        <span className="text-xs text-zinc-400">{allBrands.length} brands · {data.length} stages</span>
      </div>

      {data.length === 0 ? (
        <p className="text-zinc-400 text-sm py-8 text-center">No stage data found.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: -10 }} barGap={2}>
            <CartesianGrid strokeDasharray="2 4" stroke={ct.grid} vertical={false} />
            <XAxis
              dataKey="stage"
              tick={{ fill: ct.tick, fontSize: 12, fontFamily: 'Inter, sans-serif' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: ct.tick, fontSize: 11, fontFamily: 'Inter, sans-serif' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={(props) => <CustomTooltip {...props} ct={ct} />}
              cursor={{ fill: ct.cursor }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: ct.tick, paddingTop: 16, fontFamily: 'Inter, sans-serif' }}
              iconType="circle"
              iconSize={8}
            />
            {allBrands.map((brand, i) => (
              <Bar
                key={brand}
                dataKey={brand}
                fill={BRAND_COLOR_LIST[i % BRAND_COLOR_LIST.length]}
                radius={[3, 3, 0, 0]}
                maxBarSize={24}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
