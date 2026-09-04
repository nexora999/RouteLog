import { useLayoutEffect, useRef } from 'react'
import { ListIcon, PathIcon, STOP_COLORS, StopTypeIcon } from './Icons'
import type { PlanResponse } from '../types'

const RULE_LABELS: Record<string, string> = {
  cycle: 'Cycle',
  driving_limit: 'Driving',
  duty_window: 'Window',
  break: 'Break',
  daily_reset: 'Daily reset',
  restart: 'Restart',
  pickup_dropoff: 'Pickup / drop-off',
  fuel: 'Fuel',
}

function formatStopStamp(iso: string) {
  const date = new Date(iso)
  return {
    time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    day: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
  }
}

function durationLabel(hours: number) {
  if (!hours) return null
  if (hours < 1) return `${Math.round(hours * 60)} min`
  const rounded = hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)
  return `${rounded} hr`
}

export default function TripSummary({ plan }: { plan: PlanResponse }) {
  const itineraryRef = useRef<HTMLElement>(null)
  const legsRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const itinerary = itineraryRef.current
    const legs = legsRef.current
    if (!itinerary || !legs) return

    const syncHeight = () => {
      if (window.matchMedia('(max-width: 980px)').matches) {
        itinerary.style.height = ''
        return
      }
      itinerary.style.height = `${legs.getBoundingClientRect().height}px`
    }

    syncHeight()
    const observer = new ResizeObserver(syncHeight)
    observer.observe(legs)
    window.addEventListener('resize', syncHeight)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', syncHeight)
    }
  }, [plan])

  return (
    <div className="split">
      <section className="card card-pad itinerary-card" ref={itineraryRef}>
        <div className="panel-head">
          <span className="panel-icon">
            <ListIcon />
          </span>
          <div>
            <h2>Itinerary</h2>
            <p>
              {plan.route.stops.length} stop{plan.route.stops.length === 1 ? '' : 's'} required to
              stay within HOS limits
            </p>
          </div>
        </div>
        <ol className="itinerary">
          {plan.route.stops.map((stop, index) => {
            const stamp = formatStopStamp(stop.time)
            const duration = durationLabel(stop.duration_hours)
            return (
              <li className="itinerary-item" key={`${stop.type}-${stop.time}-${index}`}>
                <div className="itinerary-rail">
                  <span className="itinerary-dot" style={{ background: STOP_COLORS[stop.type] }}>
                    <StopTypeIcon type={stop.type} />
                  </span>
                </div>
                <div className="itinerary-body">
                  <div className="itinerary-top">
                    <span className={`badge ${stop.type}`}>{stop.title}</span>
                    <time dateTime={stop.time}>
                      <b>{stamp.time}</b>
                      <span>{stamp.day}</span>
                    </time>
                  </div>
                  <p>{stop.location}</p>
                  <div className="itinerary-meta">
                    {duration ? <span>{duration}</span> : null}
                    <span>Mile {stop.miles_from_start ? Math.round(stop.miles_from_start) : 0}</span>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="card card-pad legs-card" ref={legsRef}>
        <div className="panel-head">
          <span className="panel-icon">
            <PathIcon />
          </span>
          <div>
            <h2>Route legs</h2>
            <p>Property-carrying driver · 70-hour / 8-day cycle</p>
          </div>
        </div>
        <ol className="legs">
          {plan.route.legs.map((leg, index) => (
            <li className="leg" key={`${leg.label}-${index}`}>
              <span className="leg-index">{index + 1}</span>
              <div className="leg-copy">
                <strong>{leg.label}</strong>
                <p className="leg-path">
                  <span>{leg.from}</span>
                  <span className="leg-arrow" aria-hidden="true">
                    →
                  </span>
                  <span>{leg.to}</span>
                </p>
                <div className="leg-stats">
                  <span>{leg.distance_miles.toLocaleString()} mi</span>
                  <span>{leg.duration_hours.toFixed(1)} h driving</span>
                </div>
              </div>
            </li>
          ))}
        </ol>
        <div className="rules">
          <p>HOS assumptions</p>
          {Object.entries(plan.hos.rules).map(([key, value]) => (
            <div className="rule" key={key}>
              <b>{RULE_LABELS[key] ?? key}</b>
              <span>{value}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
