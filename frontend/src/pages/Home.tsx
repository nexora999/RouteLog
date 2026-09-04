import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CalendarIcon, ClockIcon, CycleIcon, PinIcon, PlayIcon, RoadIcon } from '../components/Icons'

const RULES = [
  { label: 'Driving', value: '11 hours maximum after 10 hours off duty' },
  { label: 'Window', value: '14-hour on-duty window from first on-duty' },
  { label: 'Break', value: '30 minutes off duty after 8 hours of driving' },
  { label: 'Reset', value: '10 consecutive hours off duty / sleeper berth' },
  { label: 'Cycle', value: '70 hours in 8 days, with a 34-hour restart' },
  { label: 'Stops', value: '1 hour pickup, 1 hour drop-off, fuel every 1,000 miles' },
]

const FEATURES = [
  { title: 'Map the live route', note: 'Pickup, drop-off, and every required stop on the road.' },
  { title: 'Insert rest and fuel', note: '30-minute breaks, 10-hour resets, and 1,000-mile fuel.' },
  { title: 'Draw daily log sheets', note: 'Duty line, remarks, and totals that add up to 24 hours.' },
  { title: 'Watch the 70/8 clock', note: 'Cycle remaining, with a 34-hour restart when needed.' },
]

const ROW = 58
const SLOT = 1
const looped = [...FEATURES, ...FEATURES]

function Reveal({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  as?: ElementType
}) {
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true)
      },
      { threshold: 0.16, rootMargin: '0px 0px -40px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag ref={ref} className={`reveal ${visible ? 'is-in' : ''} ${className}`.trim()}>
      {children}
    </Tag>
  )
}

export default function Home() {
  const [offset, setOffset] = useState(FEATURES.length - SLOT)
  const [instant, setInstant] = useState(false)
  const paused = useRef(false)
  const offsetRef = useRef(FEATURES.length - SLOT)
  offsetRef.current = offset

  useEffect(() => {
    document.title = 'RouteLog | Hours of service planner'
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => {
      if (paused.current) return
      setInstant(false)
      setOffset((value) => (value >= FEATURES.length ? value : value + 1))
    }, 3000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (offset < FEATURES.length) return
    const timer = window.setTimeout(() => {
      setInstant(true)
      setOffset(offset % FEATURES.length)
    }, 560)
    return () => window.clearTimeout(timer)
  }, [offset])

  function selectFeature(index: number) {
    const current = (offsetRef.current + SLOT) % FEATURES.length
    const delta = (index - current + FEATURES.length) % FEATURES.length
    if (!delta) return
    setInstant(false)
    setOffset(offsetRef.current + delta)
  }

  return (
    <main className="home">
      <section className="home-hero">
        <div className="home-hero-bg" aria-hidden="true">
          <div className="home-hero-photo" />
          <div className="home-hero-shade" />
        </div>
        <div className="home-inner home-hero-grid">
          <div className="home-hero-copy">
            <h1>
              Plan the route.
              <br />
              Keep the clock.
              <br />
              <em>Draw the logs.</em>
            </h1>
            <p>
              One trip plan for the road, the required stops, and FMCSA-style daily log sheets with
              the duty line already drawn.
            </p>
            <div className="home-actions">
              <Link className="btn btn-hero-primary" to="/plan">
                Plan a trip
              </Link>
              <Link className="btn btn-hero-ghost" to={{ pathname: '/', hash: 'how' }}>
                <PlayIcon className="btn-icon" />
                How it works
              </Link>
            </div>
          </div>
          <div
            className="home-hero-ticker"
            onMouseEnter={() => {
              paused.current = true
            }}
            onMouseLeave={() => {
              paused.current = false
            }}
          >
            <span className="home-hero-caret" aria-hidden="true">
              ▸
            </span>
            <div className="home-hero-ticker-window">
              <ul
                className={instant ? 'home-hero-list is-instant' : 'home-hero-list'}
                style={{ transform: `translateY(${-offset * ROW}px)` }}
              >
                {looped.map((item, index) => (
                  <li key={`m-${item.title}-${index}`}>
                    <button type="button" onClick={() => selectFeature(index % FEATURES.length)}>
                      {item.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="home-hero-ticker-focus" aria-hidden="true">
              <ul
                className={instant ? 'home-hero-list is-instant' : 'home-hero-list'}
                style={{ transform: `translateY(${-(offset + SLOT) * ROW}px)` }}
              >
                {looped.map((item, index) => (
                  <li key={`f-${item.title}-${index}`}>
                    <span>{item.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="home-trust">
          <span>Built for property-carrying operations</span>
          <b>11h driving</b>
          <b>14h window</b>
          <b>70 / 8 cycle</b>
          <b>1,000 mi fuel</b>
        </div>
      </section>

      <section className="home-section">
        <div className="home-inner">
          <Reveal>
            <div className="home-intro">
              <h2>One plan. Route, rests, and logs.</h2>
              <p>The same outputs a dispatcher would check before the truck leaves the yard.</p>
            </div>
          </Reveal>
          <div className="home-features">
            <Reveal>
              <article className="home-feature">
                <span className="panel-icon">
                  <RoadIcon />
                </span>
                <h3>Route and required stops</h3>
                <p>
                  Driving directions with pickup, drop-off, 30-minute breaks, 10-hour rests, and fuel
                  when the trip crosses 1,000 miles.
                </p>
              </article>
            </Reveal>
            <Reveal>
              <article className="home-feature">
                <span className="panel-icon">
                  <CalendarIcon />
                </span>
                <h3>Drawn daily log sheets</h3>
                <p>
                  Each calendar day is a Drivers Daily Log grid. The duty line, remarks, and 24-hour
                  totals are filled in for print or review.
                </p>
              </article>
            </Reveal>
            <Reveal>
              <article className="home-feature">
                <span className="panel-icon">
                  <CycleIcon />
                </span>
                <h3>Cycle hours remaining</h3>
                <p>
                  The 70-hour / 8-day clock is applied from hours already used. A 34-hour restart is
                  inserted when the cycle is exhausted.
                </p>
              </article>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="home-section home-section-alt" id="how">
        <div className="home-inner">
          <Reveal>
            <div className="home-intro">
              <h2>How it works</h2>
              <p>Three inputs beyond the cycle slider. The rest is calculated.</p>
            </div>
          </Reveal>
          <ol className="home-steps">
            <Reveal as="li">
              <span className="home-step-num">1</span>
              <div>
                <h3>
                  <PinIcon /> Enter the trip
                </h3>
                <p>Current location, pickup, drop-off, and hours already used in the current cycle.</p>
              </div>
            </Reveal>
            <Reveal as="li">
              <span className="home-step-num">2</span>
              <div>
                <h3>
                  <RoadIcon /> Review the map
                </h3>
                <p>Inspect the itinerary, rest locations, and remaining cycle hours before you leave the yard.</p>
              </div>
            </Reveal>
            <Reveal as="li">
              <span className="home-step-num">3</span>
              <div>
                <h3>
                  <CalendarIcon /> Open the logs
                </h3>
                <p>Switch days, check remarks against the grid, and print the sheets if you need a paper copy.</p>
              </div>
            </Reveal>
          </ol>
        </div>
      </section>

      <section className="home-section" id="rules">
        <div className="home-inner">
          <Reveal>
            <div className="home-intro">
              <h2>Rules on every plan</h2>
              <p>
                Built for property-carrying drivers. No adverse-driving exception. The shift starts at
                06:00 after 10 hours off duty.
              </p>
            </div>
          </Reveal>
          <div className="home-rules">
            {RULES.map((rule) => (
              <Reveal key={rule.label}>
                <div className="home-rule">
                  <ClockIcon />
                  <div>
                    <b>{rule.label}</b>
                    <span>{rule.value}</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="home-cta-band">
        <div className="home-inner home-cta-grid">
          <div>
            <h2>Start with a live route.</h2>
            <p>
              Change the cities, set cycle hours,
              and generate the map and logs.
            </p>
          </div>
          <Link className="btn btn-hero-primary" to="/plan">
            Open the trip planner
          </Link>
        </div>
      </section>
    </main>
  )
}
