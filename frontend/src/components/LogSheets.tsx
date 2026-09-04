import { useState } from 'react'
import DailyLogSheet from './DailyLogSheet'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon, PrinterIcon } from './Icons'
import type { DailyLog } from '../types'

function formatSheetDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) return date
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export default function LogSheets({ logs }: { logs: DailyLog[] }) {
  const [sheet, setSheet] = useState(1)
  const current = logs.find((item) => item.sheet === sheet) ?? logs[0]
  if (!current) return null

  const index = logs.findIndex((item) => item.sheet === current.sheet)
  const canPrev = index > 0
  const canNext = index < logs.length - 1

  return (
    <section className="section logs-section">
      <div className="section-head logs-head">
        <span className="logs-head-icon">
          <CalendarIcon />
        </span>
        <div>
          <p className="logs-head-kicker">Record of duty status</p>
          <h2>Daily logs</h2>
          <p>
            {logs.length} calendar day{logs.length === 1 ? '' : 's'} · duty status drawn on the
            24-hour grid
          </p>
        </div>
      </div>
      <div className="card">
        <div className="log-toolbar">
          <div className="log-days" role="tablist" aria-label="Log days">
            {logs.length > 1 ? (
              <button
                type="button"
                className="log-day-nav"
                disabled={!canPrev}
                aria-label="Previous day"
                onClick={() => canPrev && setSheet(logs[index - 1].sheet)}
              >
                <ChevronLeftIcon />
              </button>
            ) : null}
            {logs.map((item) => {
              const active = item.sheet === current.sheet
              return (
                <button
                  key={item.sheet}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={active ? 'log-day is-active' : 'log-day'}
                  onClick={() => setSheet(item.sheet)}
                >
                  <span className="log-day-icon">
                    <CalendarIcon />
                  </span>
                  <span className="log-day-copy">
                    <strong>Day {item.sheet}</strong>
                    <span>{formatSheetDate(item.date)}</span>
                    <em>{item.totals.driving.toFixed(1)} h driving</em>
                  </span>
                </button>
              )
            })}
            {logs.length > 1 ? (
              <button
                type="button"
                className="log-day-nav"
                disabled={!canNext}
                aria-label="Next day"
                onClick={() => canNext && setSheet(logs[index + 1].sheet)}
              >
                <ChevronRightIcon />
              </button>
            ) : null}
          </div>
          <div className="log-toolbar-actions">
            <span className="log-sheet-count">
              Sheet {current.sheet} of {logs.length}
            </span>
            <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
              <PrinterIcon className="btn-icon" />
              Print
            </button>
          </div>
        </div>
        <div className="log-frame">
          {logs.map((item) => (
            <div
              key={item.sheet}
              className={item.sheet === current.sheet ? 'sheet-active' : 'sheet-hidden'}
            >
              <DailyLogSheet log={item} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
