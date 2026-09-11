import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { fetchBootstrapKey } from '../services/mixcloud'

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const [activeShow, setActiveShow] = useState(null)
  const [bootstrapKey, setBootstrapKey] = useState(null)
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const [pendingShow, setPendingShow] = useState(null)
  const widgetRef = useRef(null)

  // silently mount a widget on page load so it's already ready by the first play click
  useEffect(() => {
    fetchBootstrapKey().then(setBootstrapKey)
  }, [])

  const registerWidget = useCallback((widget) => {
    widgetRef.current = widget
  }, [])

  const unlockAudio = useCallback(() => {
    setAudioUnlocked(true)
  }, [])

  useEffect(() => {
    if (!audioUnlocked || !pendingShow) return

    widgetRef.current?.load(pendingShow.key, true)
    setPendingShow(null)
  }, [audioUnlocked, pendingShow])

  async function playShow(show) {
    const widget = widgetRef.current
    console.log(show)
    if (activeShow?.key === show.key) {
      const isPaused = await widget?.getIsPaused()
      if (isPaused) widget?.play()
      return
    }

    setActiveShow(show)
    await widget?.load(show.key, false)
    await widget?.seek(0)
    widget?.play()
  }

  return (
    <PlayerContext.Provider value={{ activeShow, audioUnlocked, bootstrapKey, playShow, registerWidget, unlockAudio }}>
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