import { useState, useEffect } from 'react' // 1. Added useEffect
import { NavLink } from 'react-router-dom'
import './Navbar.css'
import Button from './Button'

const links = [
  { to: '/', label: 'Home' },
  { to: '/archief', label: 'Archief' },
  { to: '/soundboard', label: 'Soundboard' },
]

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  // 2. Track width in state so React reacts to changes
  const [windowWidth, setWindowWidth] = useState(window.innerWidth) 

  // 3. Listen for window resize events
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    
    window.addEventListener('resize', handleResize)
    
    // Clean up listener when component unmounts
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <header className="navbar">
      <a href="/" className="navbar__logo">
        <span className="navbar__logo-icon" aria-hidden="true">
          {/* 4. Use windowWidth state instead of direct window.innerWidth */}
          {windowWidth >= 768 && (
            <img src="./logo/horizontal.svg" alt="logo_horizontal" srcSet="./logo/horizontal.svg" />
          )}
          {windowWidth < 768 && (
            <img src="./logo/Icon.svg" alt="logo_vertical" srcSet="./logo/Icon.svg" />
          )}
        </span>
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
        <Button variant="secondary" icon="Mixcloud" href="https://www.mixcloud.com/Roots_and_Chalice/" aria-label="Mixcloud" />
        <Button variant="secondary" icon="Instagram" href="https://www.instagram.com/rootsandchalice_radioshow/" aria-label="Instagram" />
        <Button variant="secondary" icon="Facebook" href="https://www.facebook.com/profile.php?id=100063773671400" aria-label="Facebook" />
        <Button variant="secondary" icon="Mail" href="mailto:contact@rootsandchalice.be" aria-label="Mail ons" />
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