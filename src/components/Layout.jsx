import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import MixcloudPlayer from './MixcloudPlayer'
import { usePlayer } from '../context/PlayerContext'
import './Layout.css'

function Layout() {
  const { bootstrapKey } = usePlayer()

  return (
    <>
      <Navbar />
      <main className="page">
        <Outlet />
      </main>
      {bootstrapKey && (
        <div className="global-player">
          <MixcloudPlayer initialKey={bootstrapKey} mini />
        </div>
      )}

      <Footer />
    </>
  )
}

export default Layout
