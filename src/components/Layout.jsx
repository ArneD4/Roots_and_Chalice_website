import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import MixcloudPlayer from './MixcloudPlayer'
import Soundboard from '../pages/Soundboard'
import { usePlayer } from '../context/PlayerContext'
import { useShows } from '../hooks/useShows'
import './Layout.css'

function Layout() {
  const { audioUnlocked, bootstrapKey } = usePlayer()
  const { loading: showsLoading } = useShows()
  // shows the navbar/player/soundboard button only once the shows have
  // finished loading, sliding them in instead of having them appear instantly
  const appReady = !showsLoading
  const [soundboardOpen, setSoundboardOpen] = useState(false)

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') setSoundboardOpen(false)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <>
      <Navbar ready={appReady} />
      <main className="page">
        <Outlet />
      </main>
      {bootstrapKey && (
        <div className={`global-player${appReady ? ' global-player--ready' : ''}`}>
          {!audioUnlocked && (
            <div className="global-player__activation">
              <p className="global-player__activation-text caption">Klik hier om audio te activeren</p>
            </div>
          )}
          <MixcloudPlayer initialKey={bootstrapKey} mini />
        </div>
      )}

      <Footer />
      <button
        type="button"
        className={`soundboard-launcher${appReady ? ' soundboard-launcher--ready' : ''}${soundboardOpen ? ' soundboard-launcher--open' : ''}`}
        aria-label={soundboardOpen ? 'Close soundboard' : 'Open soundboard'}
        aria-expanded={soundboardOpen}
        aria-controls="soundboard-drawer"
        aria-hidden={!appReady}
        tabIndex={appReady ? undefined : -1}
        onClick={() => setSoundboardOpen((open) => !open)}
      >
        <p className="label soundboard-launcher__label">Soundboard &amp; Siren</p>
      </button>
      <div
        className={`soundboard-backdrop${soundboardOpen ? ' soundboard-backdrop--visible' : ''}`}
        aria-hidden="true"
        onClick={() => setSoundboardOpen(false)}
      />
      <aside
        id="soundboard-drawer"
        className={`soundboard-drawer${soundboardOpen ? ' soundboard-drawer--open' : ''}`}
        aria-label="Soundboard"
        aria-hidden={!soundboardOpen}
        inert={!soundboardOpen}
      >
        <Soundboard onClose={() => setSoundboardOpen(false)} />
      </aside>
    </>
  )
}

export default Layout
