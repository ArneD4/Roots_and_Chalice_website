import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { fetchBootstrapKey } from '../services/mixcloud'

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const [activeShow, setActiveShow] = useState(null)
  const [bootstrapKey, setBootstrapKey] = useState(null)
  const widgetRef = useRef(null)

  // silently mount a widget on page load so it's already ready by the first play click
  useEffect(() => {
    fetchBootstrapKey().then(setBootstrapKey)
  }, [])

  function registerWidget(widget) {
    widgetRef.current = widget
  }

  function playShow(show) {
    setActiveShow(show)
    // calling load() synchronously here (inside the click handler) keeps the browser's autoplay gesture intact
    widgetRef.current?.load(show.key, true)
  }

  return (
    <PlayerContext.Provider value={{ activeShow, playShow, registerWidget, bootstrapKey }}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider')
  }
  return context
}