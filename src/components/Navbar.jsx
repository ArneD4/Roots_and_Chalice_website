import { useState, useEffect } from 'react' // 1. Added useEffect
import { NavLink } from 'react-router-dom'
import './Navbar.css'
import Button from './Button'

const links = [
  { to: '/', label: 'Home' },
  { to: '/archief', label: 'Archief' },
  { to: '/soundboard', label: 'Soundboard' },
]

function isLiveOnAir(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Brussels',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now)
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]))
  const minutes = Number(values.hour) * 60 + Number(values.minute)

  return values.weekday === 'Tue' && minutes >= 21 * 60 && minutes < 22 * 60 + 30
}

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [liveOnAir, setLiveOnAir] = useState(() => isLiveOnAir())
  // 2. Track width in state so React reacts to changes
  const [windowWidth, setWindowWidth] = useState(window.innerWidth) 

  // 3. Listen for window resize events
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    
    window.addEventListener('resize', handleResize)
    
    // Clean up listener when component unmounts
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const updateLiveStatus = () => setLiveOnAir(isLiveOnAir())
    const delayUntilNextMinute = 60_000 - (Date.now() % 60_000)
    let intervalId
    const timeoutId = window.setTimeout(() => {
      updateLiveStatus()
      intervalId = window.setInterval(updateLiveStatus, 60_000)
    }, delayUntilNextMinute)

    return () => {
      window.clearTimeout(timeoutId)
      window.clearInterval(intervalId)
    }
  }, [])

  return (
    <header className="navbar">
      <div className="screw screw-top-left"></div>
      <div className="screw screw-top-right"></div>
      <div className="screw screw-bottom-left"></div>
      <div className="screw screw-bottom-right"></div>
      <a href="/" className="navbar__logo">
        <span className="navbar__logo-icon" aria-hidden="true">
          {/* 4. Use windowWidth state instead of direct window.innerWidth */}
          {windowWidth >= 1000 && (
            <img src="/logo/horizontal.svg" alt="logo_horizontal" srcSet="/logo/horizontal.svg" />
          )}
          {windowWidth < 1000 && (
            <img src="/logo/Icon.svg" alt="logo_vertical" srcSet="/logo/Icon.svg" />
          )}
        </span>
      </a>

      <div className={`navbar__menu ${menuOpen ? 'navbar__menu--open' : ''}`}>
        <nav className="navbar__links">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `navbar__link ${isActive ? 'navbar__link--active' : ''}`
              }
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
          {liveOnAir && (
            <a href="https://www.radioscorpio.be/" className="navbar__live">Live on air</a>
          )}
        </nav>

        <div className="navbar__actions">
          <Button variant="secondary" icon="Mixcloud" href="https://www.mixcloud.com/Roots_and_Chalice/" aria-label="Mixcloud" target='blank'/>
          <Button variant="secondary" icon="Instagram" href="https://www.instagram.com/rootsandchalice_radioshow/" aria-label="Instagram" target='blank'/>
          <Button variant="secondary" icon="Facebook" href="https://www.facebook.com/profile.php?id=100063773671400" aria-label="Facebook" target='blank'/>
          <Button variant="secondary" icon="Mail" href="mailto:contact@rootsandchalice.be" aria-label="Mail ons" />
        </div>
      </div>

      <button
        type="button"
        className="navbar__toggle"
        aria-label="Menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>
    </header>
  )
}

export default Navbar