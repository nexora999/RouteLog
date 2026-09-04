import { useEffect, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import TripForm from '../components/TripForm'
import RouteMap from '../components/RouteMap'
import TripMetrics from '../components/TripMetrics'
import TripSummary from '../components/TripSummary'
import LogSheets from '../components/LogSheets'
import { RoadIcon } from '../components/Icons'
import type { PlanResponse } from '../types'

export default function Planner() {
  const [plan, setPlan] = useState<PlanResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = 'Plan a trip | RouteLog'
  }, [])

  return (
    <main className="page">
      <div className="page-head">
        <span className="page-head-icon">
          <RoadIcon />
        </span>
        <div>
          <p className="page-head-kicker">Trip planner</p>
          <h1>Plan a trip</h1>
          <p>
            Produce a road route, required rest and fuel stops, and completed daily log sheets from
            current location, pickup, drop-off, and cycle hours already used.
          </p>
        </div>
      </div>

      <div className="workspace">
        <TripForm
          loading={loading}
          error={error}
          onLoading={setLoading}
          onError={setError}
          onResult={setPlan}
        />
        <RouteMap plan={plan} loading={loading} />
      </div>

      {plan ? (
        <div className="results">
          <TripMetrics plan={plan} />
          <div className="section">
            <TripSummary plan={plan} />
          </div>
          <LogSheets logs={plan.logs} />
        </div>
      ) : null}
    </main>
  )
}
