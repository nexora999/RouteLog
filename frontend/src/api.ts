import type { PlanResponse, TripPayload } from './types'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string }
    return data.error || `Request failed (${response.status})`
  } catch {
    return `Request failed (${response.status})`
  }
}

export async function suggestLocations(query: string) {
  const url = `${API_BASE}/geocode/?q=${encodeURIComponent(query)}`
  const response = await fetch(url)
  if (!response.ok) throw new Error(await readError(response))
  const data = (await response.json()) as {
    results: { label: string; display_name: string; lat: number; lng: number }[]
  }
  return data.results
}

export async function planTrip(payload: TripPayload): Promise<PlanResponse> {
  const response = await fetch(`${API_BASE}/plan/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(await readError(response))
  return response.json() as Promise<PlanResponse>
}
