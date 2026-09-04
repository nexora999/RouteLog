import { useState, type FormEvent } from 'react'
import LocationField from './LocationField'
import { BoxIcon, FlagIcon, PinIcon } from './Icons'
import { planTrip } from '../api'
import type { PlanResponse } from '../types'

const EXAMPLES = [
  {
    name: 'Dallas — Memphis — Atlanta',
    current_location: 'Dallas, TX',
    pickup_location: 'Memphis, TN',
    dropoff_location: 'Atlanta, GA',
    current_cycle_used: 18,
  },
  {
    name: 'Chicago — Indianapolis — Columbus',
    current_location: 'Chicago, IL',
    pickup_location: 'Indianapolis, IN',
    dropoff_location: 'Columbus, OH',
    current_cycle_used: 12,
  },
  {
    name: 'Newark — Chicago — Los Angeles',
    current_location: 'Newark, NJ',
    pickup_location: 'Chicago, IL',
    dropoff_location: 'Los Angeles, CA',
    current_cycle_used: 8,
  },
]

interface Props {
  loading: boolean
  error: string
  onLoading: (value: boolean) => void
  onError: (value: string) => void
  onResult: (plan: PlanResponse) => void
}

export default function TripForm({ loading, error, onLoading, onError, onResult }: Props) {
  const [current, setCurrent] = useState('Dallas, TX')
  const [pickup, setPickup] = useState('Memphis, TN')
  const [dropoff, setDropoff] = useState('Atlanta, GA')
  const [cycle, setCycle] = useState(18)

  async function submit(event: FormEvent) {
    event.preventDefault()
    onError('')
    onLoading(true)
    try {
      const plan = await planTrip({
        current_location: current,
        pickup_location: pickup,
        dropoff_location: dropoff,
        current_cycle_used: cycle,
      })
      onResult(plan)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not plan this trip.')
    } finally {
      onLoading(false)
    }
  }

  return (
    <form className="card card-pad" onSubmit={submit}>
      <h2 className="card-title">Trip details</h2>
      <p className="card-copy">
        Enter the vehicle’s current position, then pickup and drop-off. Remaining cycle hours
        control whether a 34-hour restart is inserted.
      </p>

      <div className="field">
        <label htmlFor="example">Example trip</label>
        <select
          id="example"
          defaultValue=""
          onChange={(event) => {
            const selected = EXAMPLES[Number(event.target.value)]
            if (!selected) return
            setCurrent(selected.current_location)
            setPickup(selected.pickup_location)
            setDropoff(selected.dropoff_location)
            setCycle(selected.current_cycle_used)
          }}
        >
          <option value="" disabled>
            Load a sample route
          </option>
          {EXAMPLES.map((item, index) => (
            <option key={item.name} value={index}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <LocationField
        id="current"
        label="Current location"
        placeholder="City, state, or address"
        value={current}
        icon={<PinIcon className="icon" />}
        onChange={setCurrent}
      />
      <LocationField
        id="pickup"
        label="Pickup location"
        placeholder="Shipper city or address"
        value={pickup}
        icon={<BoxIcon className="icon" />}
        onChange={setPickup}
      />
      <LocationField
        id="dropoff"
        label="Drop-off location"
        placeholder="Receiver city or address"
        value={dropoff}
        icon={<FlagIcon className="icon" />}
        onChange={setDropoff}
      />

      <div className="field">
        <label htmlFor="cycle">
          Current cycle used
          <span className="hint"> · {(70 - cycle).toFixed(1)} hrs remaining of 70</span>
        </label>
        <div className="cycle-row">
          <input
            type="range"
            min={0}
            max={70}
            step={0.5}
            value={cycle}
            aria-label="Current cycle used in hours"
            onChange={(event) => setCycle(Number(event.target.value))}
          />
          <input
            id="cycle"
            type="number"
            min={0}
            max={70}
            step={0.5}
            value={cycle}
            onChange={(event) => setCycle(Number(event.target.value))}
          />
        </div>
      </div>

      <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
        {loading ? <span className="spinner" aria-hidden="true" /> : null}
        {loading ? 'Calculating…' : 'Generate route and logs'}
      </button>
      {error ? <div className="error">{error}</div> : null}
    </form>
  )
}
