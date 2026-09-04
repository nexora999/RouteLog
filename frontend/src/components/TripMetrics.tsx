import { CalendarIcon, ClockIcon, CycleIcon, DutyIcon, RoadIcon } from './Icons'
import type { PlanResponse } from '../types'

function shortPlace(label: string) {
  return label.split(',')[0]
}

export default function TripMetrics({ plan }: { plan: PlanResponse }) {
  const cycleUsed = plan.hos.cycle_used_end
  const cycleLeft = plan.hos.hours_available_end
  const cycleLow = cycleLeft < 11

  const items = [
    {
      label: 'Distance',
      value: `${plan.route.distance_miles.toLocaleString()} mi`,
      hint: `${shortPlace(plan.inputs.current_location.label)} → ${shortPlace(plan.inputs.dropoff_location.label)}`,
      icon: <RoadIcon />,
    },
    {
      label: 'Log days',
      value: String(plan.hos.days),
      hint: plan.hos.days === 1 ? '1 daily log sheet' : `${plan.hos.days} daily log sheets`,
      icon: <CalendarIcon />,
    },
    {
      label: 'Driving',
      value: `${plan.hos.driving_hours.toFixed(1)} h`,
      hint: `${plan.route.duration_hours.toFixed(1)} h of road time`,
      icon: <ClockIcon />,
    },
    {
      label: 'On duty',
      value: `${plan.hos.on_duty_hours.toFixed(1)} h`,
      hint: 'Includes pickup, fuel, and drop-off',
      icon: <DutyIcon />,
    },
    {
      label: 'Cycle remaining',
      value: `${cycleLeft.toFixed(1)} h`,
      hint: `${cycleUsed.toFixed(1)} h used of 70`,
      icon: <CycleIcon />,
      warn: cycleLow,
      bar: Math.min(100, (cycleUsed / 70) * 100),
    },
  ]

  return (
    <section className="card metrics" aria-label="Trip summary">
      {items.map((item) => (
        <div className={item.warn ? 'metric is-warn' : 'metric'} key={item.label}>
          <span className="metric-icon">{item.icon}</span>
          <div className="metric-copy">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <em>{item.hint}</em>
            {item.bar != null ? (
              <span className="metric-bar" aria-hidden="true">
                <i style={{ width: `${item.bar}%` }} />
              </span>
            ) : null}
          </div>
        </div>
      ))}
    </section>
  )
}
