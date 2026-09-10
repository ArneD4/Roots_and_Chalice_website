import { useState, useEffect } from 'react'
import { fetchShows } from '../services/mixcloud'

export function useShows() {
  // 1. declare shows/loading/error state
  const [shows, setShows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchShows()
      .then(shows => {
        setShows(shows)
        setLoading(false)
      })
      .catch(err => {
        setError(err)
        setLoading(false)
      })
    // 2. call fetchShows(), handle success/failure, set loading false in both cases
    // careful: don't forget try/catch since fetchShows can throw
  }, [])

  // 3. return the three values
  return { shows, loading, error }
}