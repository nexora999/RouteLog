import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'

function ScrollToLocation() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
      return
    }

    const id = decodeURIComponent(hash.slice(1))
    let cancelled = false
    let attempts = 0

    const tryScroll = () => {
      if (cancelled) return
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'instant', block: 'start' })
        return
      }
      if (attempts++ < 24) {
        window.requestAnimationFrame(tryScroll)
      }
    }

    tryScroll()
    return () => {
      cancelled = true
    }
  }, [pathname, hash])

  return null
}

export default function Layout() {
  const { pathname, hash } = useLocation()
  const onHome = pathname === '/'
  const onOverview = onHome && hash !== '#how'
  const onHow = onHome && hash === '#how'

  return (
    <div className={onHome ? 'app app-home' : 'app'}>
      <ScrollToLocation />
      <header className="topbar">
        <Link className="brand" to="/" aria-label="RouteLog">
          <img className="logo-mark" src="/logo.png" alt="" />
          <span className="brand-name">
            Route<span>Log</span>
          </span>
        </Link>
        <nav className="top-nav-center" aria-label="Product">
          <Link to="/" className={onOverview ? 'active' : undefined}>
            Overview
          </Link>
          <NavLink to="/plan">Trip planner</NavLink>
          <Link to={{ pathname: '/', hash: 'how' }} className={onHow ? 'active' : undefined}>
            How it works
          </Link>
        </nav>
        <div className="top-nav-end">
          <span className="top-nav-meta">70-hour / 8-day</span>
          <Link className="btn btn-nav" to="/plan">
            Plan a trip
          </Link>
        </div>
      </header>
      <Outlet />
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Link className="brand" to="/" aria-label="RouteLog">
              <img className="logo-mark" src="/logo.png" alt="" />
              <span className="brand-name">
                Route<span>Log</span>
              </span>
            </Link>
            <p>
              Hours-of-service trip planning for property-carrying drivers.
            </p>
          </div>
          <div>
            <h3>Product</h3>
            <ul>
              <li>
                <Link to="/">Overview</Link>
              </li>
              <li>
                <Link to="/plan">Trip planner</Link>
              </li>
              <li>
                <Link to="/#how">How it works</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3>Hours of service</h3>
            <ul>
              <li>11-hour driving limit</li>
              <li>14-hour duty window</li>
              <li>70 hours in 8 days</li>
              <li>Fuel at least every 1,000 miles</li>
            </ul>
          </div>
          <div>
            <h3>Map data</h3>
            <ul>
              <li>OpenStreetMap Nominatim</li>
              <li>OSRM directions</li>
              <li>CARTO / OpenStreetMap tiles</li>
            </ul>
          </div>
        </div>
        <div className="legal">
          <span>© {new Date().getFullYear()} RouteLog</span>
        </div>
      </footer>
    </div>
  )
}
