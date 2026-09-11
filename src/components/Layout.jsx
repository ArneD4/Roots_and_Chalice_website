import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import MixcloudPlayer from './MixcloudPlayer'
import { usePlayer } from '../context/PlayerContext'
import './Layout.css'

function Layout() {
  const { audioUnlocked, bootstrapKey } = usePlayer()

  return (
    <>
      <Navbar />
      <main className="page">
        <Outlet />
      </main>
      {bootstrapKey && (
        <div className="global-player">
          {!audioUnlocked && (
            <div className="global-player__activation">
              <p className="global-player__activation-text caption">Klik hier om audio te activeren</p>
            </div>
          )}
          <MixcloudPlayer initialKey={bootstrapKey} mini />
        </div>
      )}

      <Footer />
    </>
  )
}

export default Layout
