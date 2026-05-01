const BASE = '/api'

async function request(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `Request failed: ${res.status}`)
  }
  const json = await res.json()
  // Unwrap the { data, meta } envelope; fall back to raw shape for /stages
  return json.data !== undefined ? json.data : json
}

export const fetchStages  = ()             => request('/stages')
export const fetchMetrics = (stage = 'All', runId = null) => {
  const p = new URLSearchParams({ stage })
  if (runId) p.append('run_id', runId)
  return request(`/metrics?${p}`)
}
export const fetchRuns       = ()                          => request('/runs')
export const fetchClusters   = (runId = null)              => request(`/clusters${runId ? `?run_id=${runId}` : ''}`)
export const fetchRAGSearch  = (q, n = 5, stage = null)    => {
  const p = new URLSearchParams({ q, n })
  if (stage) p.append('stage', stage)
  return request(`/rag/search?${p}`)
}
export const fetchBrandExplain = (brand, runId = null)     => {
  const p = runId ? `?run_id=${runId}` : ''
  return request(`/brands/${encodeURIComponent(brand)}/explain${p}`)
}
