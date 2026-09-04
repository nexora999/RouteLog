import { useEffect, useMemo } from 'react'
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { STOP_COLORS, StopTypeIcon } from './Icons'
import type { PlanResponse, RouteStop, StopType } from '../types'

const LABELS: Record<StopType, string> = {
  current: 'C',
  pickup: 'P',
  dropoff: 'D',
  fuel: 'F',
  break: 'B',
  rest: 'R',
  restart: '34',
}

const LEGEND: [StopType, string][] = [
  ['current', 'Current'],
  ['pickup', 'Pickup'],
  ['dropoff', 'Drop-off'],
  ['fuel', 'Fuel'],
  ['break', 'Break'],
  ['rest', '10-hour rest'],
  ['restart', '34-hour restart'],
]

function markerIcon(type: StopType) {
  return L.divIcon({
    className: 'marker-wrap',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
    html: `<div class="marker" style="background:${STOP_COLORS[type]}">${LABELS[type]}</div>`,
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function durationLabel(hours: number) {
  if (!hours) return null
  if (hours < 1) return `${Math.round(hours * 60)} min`
  return `${hours.toFixed(hours % 1 === 0 ? 0 : 1)} hr`
}

function StopPopup({ stop }: { stop: RouteStop }) {
  const color = STOP_COLORS[stop.type]
  const duration = durationLabel(stop.duration_hours)

  return (
    <div className="stop-card">
      <div className="stop-card-head" style={{ background: color }}>
        <span className="stop-card-icon">
          <StopTypeIcon type={stop.type} />
        </span>
        <div>
          <strong>{stop.title}</strong>
          <em>{stop.type.replace('_', '-')}</em>
        </div>
      </div>
      <dl className="stop-card-body">
        <div>
          <dt>Location</dt>
          <dd>{stop.location}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{formatTime(stop.time)}</dd>
        </div>
        {duration ? (
          <div>
            <dt>Duration</dt>
            <dd>{duration}</dd>
          </div>
        ) : null}
        <div>
          <dt>Mile</dt>
          <dd>{Math.round(stop.miles_from_start)}</dd>
        </div>
        {stop.remark ? (
          <div className="stop-card-note">
            <dt>Note</dt>
            <dd>{stop.remark}</dd>
          </div>
        ) : null}
      </dl>
    </div>
  )
}

function FitRoute({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length < 2) return
    map.invalidateSize()
    map.fitBounds(positions, { padding: [36, 36], maxZoom: 10 })
  }, [map, positions])
  return null
}

function MapResize() {
  const map = useMap()
  useEffect(() => {
    const redraw = () => map.invalidateSize()
    redraw()
    window.addEventListener('resize', redraw)
    const frame = window.requestAnimationFrame(redraw)
    return () => {
      window.removeEventListener('resize', redraw)
      window.cancelAnimationFrame(frame)
    }
  }, [map])
  return null
}

export default function RouteMap({
  plan,
  loading,
}: {
  plan: PlanResponse | null
  loading: boolean
}) {
  const positions = useMemo<[number, number][]>(
    () => (plan ? plan.route.geometry.map(([lng, lat]) => [lat, lng]) : []),
    [plan],
  )
  const stops = plan?.route.stops.filter((stop) => stop.lat && stop.lng) ?? []

  return (
    <section className="card map-shell">
      <div className="map-toolbar">
        <div>
          <h2>Route</h2>
          <p>
            {plan
              ? `${plan.inputs.current_location.label} to ${plan.inputs.dropoff_location.label} · ${plan.route.distance_miles.toLocaleString()} miles`
              : 'No route generated yet'}
          </p>
        </div>
      </div>
      <div className="map-stage">
        <MapContainer center={[39.5, -98.35]} zoom={4} scrollWheelZoom className="map-root">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url={
              import.meta.env.VITE_CARTO_API_KEY
                ? `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=${import.meta.env.VITE_CARTO_API_KEY}`
                : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
            }
          />
          <MapResize />
          {positions.length > 1 ? (
            <>
              <Polyline
                positions={positions}
                pathOptions={{ color: '#1f4e79', weight: 4, opacity: 0.92 }}
              />
              <FitRoute positions={positions} />
            </>
          ) : null}
          {stops.map((stop, index) => (
            <Marker
              key={`${stop.type}-${stop.time}-${index}`}
              position={[stop.lat, stop.lng]}
              icon={markerIcon(stop.type)}
            >
              <Popup className={`stop-popup stop-popup--${stop.type}`} closeButton>
                <StopPopup stop={stop} />
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        {loading ? (
          <div className="map-overlay map-overlay-loading" role="status" aria-live="polite">
            <div className="map-loader">
              <div className="map-spinner" aria-hidden="true">
                <span />
                <span />
              </div>
              <strong>Building route and logs</strong>
              <span>Geocoding stops, requesting directions, and applying HOS rules.</span>
            </div>
          </div>
        ) : null}
        {!plan && !loading ? (
          <div className="map-overlay">
            <div>
              <strong>Awaiting trip details</strong>
              <span>Generate a route to plot the path, rest locations, and fuel stops.</span>
            </div>
          </div>
        ) : null}
        {plan ? (
          <div className="map-legend">
            <p>Map key</p>
            {LEGEND.map(([key, label]) => (
              <span key={key}>
                <i className="swatch" style={{ background: STOP_COLORS[key] }} />
                {label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
