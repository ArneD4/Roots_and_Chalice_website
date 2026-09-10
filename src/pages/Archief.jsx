import { useState } from 'react'
import PlayerCard from '../components/PlayerCard'
import ShowList from '../components/ShowList'
import { useShows } from '../hooks/useShows'
import './Archief.css'

function sortShows(shows, sortBy) {
  const sorted = [...shows]
  switch (sortBy) {
    case 'oldest':
      return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    case 'trending':
    case 'popular':
      return sorted.sort((a, b) => b.playCount - a.playCount)
    case 'latest':
    default:
      return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }
}

function Archief() {
  const { shows, loading, error } = useShows()
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('latest')

  if (loading) return <p>Loading shows...</p>
  if (error) return <p>Something went wrong: {error.message}</p>

  const filteredShows = sortShows(shows, sortBy).filter((show) =>
    show.title.toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="archief">
      <section className="archief__list">
        <div className="archief__list-header">
          <h1>Onze Shows</h1>
          <div className="archief__controls">
            <select
              className="archief__sort"
              aria-label="Sorteren"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              <option value="latest">Latest</option>
              <option value="oldest">Oudste</option>
              <option value="trending">Trending</option>
              <option value="popular">Populair</option>
            </select>
            <input
              className="archief__search"
              type="search"
              placeholder="Search..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        <ShowList shows={filteredShows} />

        <button type="button" className="archief__load-more">
          Meer laden ...
        </button>
      </section>

      <PlayerCard show={shows[0]} />
    </div>
  )
}

export default Archief

