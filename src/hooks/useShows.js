import { useState, useEffect } from 'react'
import { fetchShows } from '../services/mixcloud'

// module-level cache so all components share a single fetch across the app's lifetime
let showsCache = null
let showsPromise = null

function getShows() {
  if (!showsPromise) {
    showsPromise = fetchShows().then(shows => {
      const cleaned = shows.map(show => ({
        ...show,
        title: show.title.replace(/^.*?:\s*/, '')
      }))
      showsCache = cleaned
      return cleaned
    })
  }
  return showsPromise
}

export function useShows() {
  const [shows, setShows] = useState(showsCache ?? [])
  const [loading, setLoading] = useState(showsCache === null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (showsCache) return

    let cancelled = false
    getShows()
      .then(cleaned => {
        if (cancelled) return
        setShows(cleaned)
        setLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        showsPromise = null
        setError(err)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { shows, loading, error }
}