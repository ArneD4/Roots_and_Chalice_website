import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import './Navbar.css'

const links = [
  { to: '/', label: 'Home' },
  { to: '/archief', label: 'Archief' },
  { to: '/soundboard', label: 'Soundboard' },
]

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="navbar">
      <a href="/" className="navbar__logo">
        <span className="navbar__logo-icon" aria-hidden="true">
          ⌒
        </span>
        roots&amp;chalice
      </a>

      <nav className={`navbar__links ${menuOpen ? 'navbar__links--open' : ''}`}>
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
        <span className="navbar__live">Live on air</span>
      </nav>

      <div className="navbar__actions">
        <a className="navbar__icon-btn navbar__icon-btn--mixcloud" href="#" aria-label="Mixcloud">
          M-x
        </a>
        <a className="navbar__icon-btn" href="#" aria-label="Instagram">
          IG
        </a>
        <a className="navbar__icon-btn" href="#" aria-label="Facebook">
          f
        </a>
        <a className="navbar__icon-btn" href="#" aria-label="Mail ons">
          @
        </a>
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
