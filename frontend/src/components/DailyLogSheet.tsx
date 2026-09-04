import type { DailyLog, DutyStatus } from '../types'

const BLUE = '#5B78BD'
const INK = '#111111'
const ROWS: { status: DutyStatus; label: string; line2?: string }[] = [
  { status: 'off_duty', label: '1: OFF DUTY' },
  { status: 'sleeper', label: '2: SLEEPER BERTH' },
  { status: 'driving', label: '3: DRIVING' },
  { status: 'on_duty', label: '4: ON DUTY', line2: '(NOT DRIVING)' },
]

const W = 1120
const LABEL_W = 168
const TOTAL_W = 70
const TOP = 20
const BOT = 20
const GRID_H = 176
const GRID_W = W - LABEL_W - TOTAL_W
const ROW_H = GRID_H / 4
const FONT = 'Arial, Helvetica, sans-serif'

function xAt(hour: number) {
  return LABEL_W + (hour / 24) * GRID_W
}

function yAt(status: DutyStatus) {
  const row = ROWS.findIndex((item) => item.status === status)
  return TOP + row * ROW_H + ROW_H / 2
}

function hourLabel(hour: number) {
  if (hour === 0) return 'Midnight'
  if (hour === 12) return 'noon'
  if (hour < 12) return String(hour)
  return String(hour - 12)
}

function wrapLabel(text: string, width = 18) {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > width && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines.slice(0, 3)
}

function remarkEvents(segments: DailyLog['segments']) {
  return segments.filter((segment) => {
    const text = (segment.remark || '').toLowerCase()
    if (!text || segment.status === 'driving') return false
    if (
      segment.status === 'off_duty' &&
      segment.duration_hours > 2 &&
      !text.includes('break') &&
      !text.includes('restart')
    ) {
      return false
    }
    return (
      text.includes('break') ||
      text.includes('pickup') ||
      text.includes('drop') ||
      text.includes('fuel') ||
      text.includes('sleeper') ||
      text.includes('restart') ||
      segment.status === 'on_duty' ||
      segment.status === 'sleeper'
    )
  })
}

function RemarkMarks({
  segments,
  y,
  height,
}: {
  segments: DailyLog['segments']
  y: number
  height: number
}) {
  const base = y + height
  const cap = height * 0.58
  const events = remarkEvents(segments)

  return (
    <>
      {events.map((segment, index) => {
        const start = Math.max(0, segment.start_hour)
        const rawEnd = segment.end_hour <= start ? start + segment.duration_hours : segment.end_hour
        const end = Math.min(rawEnd <= 0 ? 24 : rawEnd, 24)
        const x1 = xAt(start)
        const x2 = xAt(Math.max(end, start + 1 / 60))
        const mid = (x1 + x2) / 2
        const hh = Math.floor(start)
        const mm = Math.round((start - hh) * 60)
        const time = `${String(hh).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}`
        const lines = [time, ...wrapLabel(placeFromRemark(segment.remark))]
        return (
          <g key={`${segment.start_hour}-${index}`}>
            <polyline
              points={`${x1},${base - cap} ${x1},${base} ${x2},${base} ${x2},${base - cap}`}
              fill="none"
              stroke={INK}
              strokeWidth="2.8"
              strokeLinejoin="miter"
              strokeLinecap="butt"
            />
            {lines.map((line, lineIndex) => (
              <text
                key={lineIndex}
                x={mid}
                y={base + 36 + (index % 2) * 12 + lineIndex * 12}
                textAnchor="middle"
                fontSize="10"
                fontFamily={FONT}
                fill={INK}
              >
                {line}
              </text>
            ))}
          </g>
        )
      })}
    </>
  )
}

function placeFromRemark(text: string) {
  const at = text.split(' at ').at(-1)
  if (at && at.length < 48) return at
  const dash = text.split(' — ').at(-1)
  if (dash && dash.length < 48) return dash
  return text
}

function HourLabels({ y }: { y: number }) {
  return (
    <>
      {Array.from({ length: 24 }, (_, hour) => (
        <text
          key={hour}
          x={xAt(hour)}
          y={y}
          textAnchor="middle"
          fontSize={hour === 0 || hour === 12 ? 9 : 11}
          fontFamily={FONT}
          fontWeight={hour === 0 || hour === 12 ? 700 : 500}
          fill={BLUE}
        >
          {hourLabel(hour)}
        </text>
      ))}
    </>
  )
}

function RowTicks({ rowY }: { rowY: number }) {
  return (
    <>
      {Array.from({ length: 24 }, (_, hour) =>
        [1, 2, 3].map((tick) => {
          const x = xAt(hour + tick / 4)
          const len = tick === 2 ? ROW_H * 0.55 : ROW_H * 0.28
          return (
            <line
              key={`${hour}-${tick}`}
              x1={x}
              y1={rowY}
              x2={x}
              y2={rowY + len}
              stroke={BLUE}
              strokeWidth={tick === 2 ? 1 : 0.8}
            />
          )
        }),
      )}
    </>
  )
}

function Ruler({ y, height }: { y: number; height: number }) {
  return (
    <g>
      <line x1={LABEL_W} y1={y} x2={LABEL_W + GRID_W} y2={y} stroke={BLUE} strokeWidth={1.2} />
      <line
        x1={LABEL_W}
        y1={y + height}
        x2={LABEL_W + GRID_W}
        y2={y + height}
        stroke={BLUE}
        strokeWidth={1.2}
      />
      {Array.from({ length: 25 }, (_, hour) => (
        <line
          key={hour}
          x1={xAt(hour)}
          y1={y}
          x2={xAt(hour)}
          y2={y + height}
          stroke={BLUE}
          strokeWidth={1}
        />
      ))}
      {Array.from({ length: 24 }, (_, hour) =>
        [1, 2, 3].map((tick) => {
          const x = xAt(hour + tick / 4)
          const len = tick === 2 ? height * 0.7 : height * 0.4
          return (
            <line
              key={`${hour}-${tick}`}
              x1={x}
              y1={y}
              x2={x}
              y2={y + len}
              stroke={BLUE}
              strokeWidth={tick === 2 ? 1 : 0.8}
            />
          )
        }),
      )}
    </g>
  )
}

export default function DailyLogSheet({ log }: { log: DailyLog }) {
  const points: string[] = []
  log.segments.forEach((segment) => {
    const y = yAt(segment.status)
    const x1 = xAt(segment.start_hour)
    const x2 = xAt(Math.min(segment.end_hour, 24))
    if (points.length === 0) points.push(`${x1},${y}`)
    else points.push(`${x1},${y}`)
    points.push(`${x2},${y}`)
  })

  const bol = `BOL-${log.year}${log.month}${log.day}`
  const gridBottom = TOP + GRID_H
  const svgH = gridBottom + BOT + 8

  return (
    <article className="log-sheet">
      <div className="log-top">
        <div>
          <div className="log-kicker">Drivers Daily Log</div>
          <div className="log-hours-label">(24 hours)</div>
        </div>
        <div className="log-date-line">
          <span>Date</span>
          <span className="log-u">
            {log.month}
            <small>(month)</small>
          </span>
          <span>/</span>
          <span className="log-u">
            {log.day}
            <small>(day)</small>
          </span>
          <span>/</span>
          <span className="log-u">
            {log.year}
            <small>(year)</small>
          </span>
        </div>
        <div className="log-dup">
          Original — File at home terminal
          <br />
          Duplicate — Driver retains in his/her possession for 8 days
        </div>
      </div>

      <div className="log-fromto">
        <div>
          <span>From:</span>
          <u>{log.from}</u>
        </div>
        <div>
          <span>To:</span>
          <u>{log.to}</u>
        </div>
      </div>

      <div className="log-info">
        <div className="log-miles">
          <div>
            Total Miles Driving Today
            <b>{log.total_miles_driving.toLocaleString()}</b>
          </div>
          <div>
            Total Mileage Today
            <b>{log.total_mileage.toLocaleString()}</b>
          </div>
        </div>
        <div className="log-units">
          Truck/Tractor and Trailer Numbers or License Plate(s)/State (show each unit)
          <b>{log.carrier.truck}</b>
        </div>
        <div className="log-carrier">
          <div>
            <span>Name of Carrier or Carriers</span>
            <u>{log.carrier.name}</u>
          </div>
          <div>
            <span>Main Office Address</span>
            <u>{log.carrier.main_office}</u>
          </div>
          <div>
            <span>Home Terminal Address</span>
            <u>{log.carrier.home_terminal}</u>
          </div>
        </div>
      </div>

      <svg className="log-grid" viewBox={`0 0 ${W} ${svgH}`} role="img" aria-label="Duty status grid">
        <rect
          x={LABEL_W}
          y={TOP}
          width={GRID_W}
          height={GRID_H}
          fill="#fff"
          stroke={BLUE}
          strokeWidth={1.4}
        />

        <HourLabels y={14} />

        {ROWS.map((row, index) => {
          const y = TOP + index * ROW_H
          return (
            <g key={row.status}>
              <line x1={LABEL_W} y1={y} x2={LABEL_W + GRID_W} y2={y} stroke={BLUE} strokeWidth={1.1} />
              <text x={6} y={y + ROW_H / 2 - (row.line2 ? 4 : -4)} fontSize="11" fontFamily={FONT} fontWeight={700} fill={BLUE}>
                {row.label}
              </text>
              {row.line2 ? (
                <text x={28} y={y + ROW_H / 2 + 10} fontSize="10" fontFamily={FONT} fontWeight={700} fill={BLUE}>
                  {row.line2}
                </text>
              ) : null}
              <RowTicks rowY={y} />
              <text
                x={LABEL_W + GRID_W + TOTAL_W / 2}
                y={y + ROW_H / 2 + 4}
                textAnchor="middle"
                fontSize="12"
                fontFamily={FONT}
                fill={INK}
              >
                {log.totals[row.status].toFixed(2)}
              </text>
            </g>
          )
        })}

        {Array.from({ length: 25 }, (_, hour) => (
          <line
            key={`h-${hour}`}
            x1={xAt(hour)}
            y1={TOP}
            x2={xAt(hour)}
            y2={gridBottom}
            stroke={BLUE}
            strokeWidth={1}
          />
        ))}

        <line x1={LABEL_W} y1={gridBottom} x2={LABEL_W + GRID_W} y2={gridBottom} stroke={BLUE} strokeWidth={1.4} />

        <text
          x={LABEL_W + GRID_W + TOTAL_W / 2}
          y={14}
          textAnchor="middle"
          fontSize="8"
          fontFamily={FONT}
          fill={BLUE}
        >
          Total Hours
        </text>

        <HourLabels y={gridBottom + 16} />

        {points.length > 1 ? (
          <polyline
            fill="none"
            stroke={INK}
            strokeWidth="3.4"
            strokeLinejoin="miter"
            strokeLinecap="square"
            points={points.join(' ')}
          />
        ) : null}
      </svg>

      <div className="log-bottom">
        <div className="log-remarks-block">
          <div className="log-remarks-title">REMARKS</div>
          <svg className="log-ruler" viewBox={`0 0 ${W} 128`}>
            <Ruler y={4} height={28} />
            <RemarkMarks segments={log.segments} y={4} height={28} />
            <HourLabels y={50} />
            <text
              x={LABEL_W + GRID_W + TOTAL_W / 2}
              y={4 + 18}
              textAnchor="middle"
              fontSize="12"
              fontFamily={FONT}
              fill={INK}
            >
              ={(
                log.totals.off_duty +
                log.totals.sleeper +
                log.totals.driving +
                log.totals.on_duty
              ).toFixed(2)}
            </text>
          </svg>
          <div className="log-shipping-inline">
            <span>Shipping Documents</span>
            <em>DVL or Manifest No. / Shipper &amp; Commodity</em>
            <u>{bol}</u>
          </div>
        </div>

        <div className="log-recap">
          <div className="log-recap-col">
            <h4>Recap</h4>
            <p>Complete at end of day</p>
            <div className="log-recap-stat">
              <span>On duty hours today</span>
              <small>Total of lines 3 &amp; 4</small>
              <strong>{log.recap.on_duty_today.toFixed(2)}</strong>
            </div>
            <p className="log-restart-note">
              If you took 34 consecutive hours off duty you have 60/70 hours available.
            </p>
          </div>

          <div className="log-recap-col">
            <h4>70 hour / 8 day</h4>
            <table>
              <thead>
                <tr>
                  <th>A</th>
                  <th>B</th>
                  <th>C</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{log.recap.a.toFixed(2)}</td>
                  <td>{log.recap.b.toFixed(2)}</td>
                  <td>{log.recap.c.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            <ul>
              <li>
                <b>A</b> Hours on duty last 7 days including today
              </li>
              <li>
                <b>B</b> Hours available tomorrow (70 − A)
              </li>
              <li>
                <b>C</b> Hours on duty last 8 days including today
              </li>
            </ul>
          </div>

          <div className="log-recap-col">
            <h4>60 hour / 7 day</h4>
            <table>
              <thead>
                <tr>
                  <th>A</th>
                  <th>B</th>
                  <th>C</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>—</td>
                  <td>—</td>
                  <td>—</td>
                </tr>
              </tbody>
            </table>
            <ul>
              <li>
                <b>A</b> Hours on duty last 6 days including today
              </li>
              <li>
                <b>B</b> Hours available tomorrow (60 − A)
              </li>
              <li>
                <b>C</b> Hours on duty last 7 days including today
              </li>
            </ul>
          </div>
        </div>
      </div>
    </article>
  )
}
