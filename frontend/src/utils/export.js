function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
}

export function exportAsCSV(totalMentions, firstMentions, stageMentions) {
  const stages = Object.keys(stageMentions)
  const headers = ['Brand', 'Total Mentions', 'First Mentions', ...stages]
  const rows = Object.keys(totalMentions).map((brand) => [
    brand,
    totalMentions[brand] ?? 0,
    firstMentions[brand] ?? 0,
    ...stages.map((s) => stageMentions[s]?.[brand] ?? 0),
  ])

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
  triggerDownload(new Blob([csv], { type: 'text/csv' }), `sole_metrics_${timestamp()}.csv`)
}

export function exportAsJSON(metrics, toneData, selectedStage, activeBrands) {
  const payload = {
    exported_at: new Date().toISOString(),
    filters: { stage: selectedStage, brands: activeBrands },
    metrics,
    tone: toneData,
  }
  triggerDownload(
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    `sole_metrics_${timestamp()}.json`
  )
}
