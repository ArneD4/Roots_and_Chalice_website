import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Archief from './pages/Archief'
import Soundboard from './pages/Soundboard'
import { PlayerProvider } from './context/PlayerContext'
// import './App.css'

function App() {
  return (
    <PlayerProvider>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="archief" element={<Archief />} />
          <Route path="soundboard" element={<Soundboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </PlayerProvider>
  )
}

export default App
