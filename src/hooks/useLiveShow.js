import { useEffect, useState } from 'react'
import { fetchTodaysShow, isLiveNow } from '../services/googleSheets'

// module-level so every consumer shares one planning fetch per live session
let todaysShowPromise = null

export function useLiveShow() {
  const [isLive, setIsLive] = useState(() => isLiveNow())
  const [liveShow, setLiveShow] = useState(null)

  useEffect(() => {
    const interval = window.setInterval(() => setIsLive(isLiveNow()), 15000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!isLive) {
      todaysShowPromise = null
      return
    }

    let cancelled = false
    todaysShowPromise ??= fetchTodaysShow().catch(() => {
      todaysShowPromise = null
      return null
    })
    todaysShowPromise.then((show) => {
      if (!cancelled) setLiveShow(show)
    })

    return () => {
      cancelled = true
    }
  }, [isLive])

  return { isLive, liveShow: isLive ? liveShow : null }
}
