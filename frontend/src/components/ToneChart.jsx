import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { TONE_COLORS } from '../utils/colors'
import { useTheme, chartColors } from '../utils/theme'

function CustomTooltip({ active, payload, ct }) {
  if (!active || !payload?.length) return null
  const { name, value } = payload[0]
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs shadow-lg"
      style={{ background: ct.tooltip.bg, border: `1px solid ${ct.tooltip.border}` }}
    >
      <span className="font-semibold" style={{ color: TONE_COLORS[name] }}>{name}</span>
      <span className="ml-2" style={{ color: ct.tooltip.muted }}>{value} responses</span>
    </div>
  )
}

export default function ToneChart({ stageTone }) {
  const { theme } = useTheme()
  const ct = chartColors(theme === 'dark')

  const totals = {}
  Object.values(stageTone).forEach((tones) => {
    Object.entries(tones).forEach(([tone, count]) => {
      totals[tone] = (totals[tone] ?? 0) + count
    })
  })

  const pieData = Object.entries(totals).map(([tone, value]) => ({ name: tone, value }))
  const grandTotal = pieData.reduce((s, d) => s + d.value, 0)
  const stages = Object.entries(stageTone)

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 flex flex-col h-full">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-5">Tone Distribution</h2>

      {pieData.length === 0 ? (
        <p className="text-zinc-400 text-sm py-8 text-center">No tone data found.</p>
      ) : (
        <>
          {/* Donut */}
          <div className="relative">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={2} dataKey="value" strokeWidth={0}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={TONE_COLORS[entry.name] ?? '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip content={(props) => <CustomTooltip {...props} ct={ct} />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 leading-none">{grandTotal}</span>
              <span className="text-xs text-zinc-400 mt-0.5">total</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-4 mb-5">
            {pieData.map(({ name, value }) => (
              <div key={name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: TONE_COLORS[name] }} />
                <span className="text-xs text-zinc-500 dark:text-zinc-400">{name}</span>
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{((value / grandTotal) * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>

          {/* Per-stage stacked bars */}
          <div className="space-y-3 border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-auto">
            {stages.map(([stage, tones]) => {
              const stageTotal = Object.values(tones).reduce((a, b) => a + b, 0)
              return (
                <div key={stage}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{stage}</span>
                    <span className="text-zinc-400 tabular-nums">{stageTotal}</span>
                  </div>
                  <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
                    {['Positive', 'Neutral', 'Cautious'].map((tone) => {
                      const pct = stageTotal > 0 ? ((tones[tone] ?? 0) / stageTotal) * 100 : 0
                      return pct > 0 ? (
                        <div
                          key={tone}
                          style={{ width: `${pct}%`, background: TONE_COLORS[tone] }}
                          title={`${tone}: ${pct.toFixed(1)}%`}
                        />
                      ) : null
                    })}
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
