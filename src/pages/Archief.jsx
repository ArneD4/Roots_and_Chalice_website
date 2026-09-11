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
  const [visibleCount, setVisibleCount] = useState(12)

  if (loading) return <p>Loading shows...</p>
  if (error) return <p>Something went wrong: {error.message}</p>

  const filteredShows = sortShows(shows, sortBy).filter((show) =>
    show.title.toLowerCase().includes(query.toLowerCase()),
  )
  const visibleShows = filteredShows.slice(0, visibleCount)

  function handleSortChange(event) {
    setSortBy(event.target.value)
    setVisibleCount(12)
  }

  function handleQueryChange(event) {
    setQuery(event.target.value)
    setVisibleCount(12)
  }

  return (
    <div className="archief">
      <section className="archief__list">
        <div className="archief__list-header">
          <h1>Meer Vibes!</h1>
          <div className="archief__controls">
            <select
              className="archief__sort label"
              aria-label="Sorteren"
              value={sortBy}
              onChange={handleSortChange}
            >
              <option value="latest">Recent</option>
              <option value="oldest">Oudste</option>
              <option value="trending">Trending</option>
              <option value="popular">Populair</option>
            </select>
            <input
              className="archief__search label"
              type="search"
              placeholder="Search..."
              value={query}
              onChange={handleQueryChange}
            />
          </div>
        </div>

        <ShowList shows={visibleShows} />

        {visibleCount < filteredShows.length && (
          <button
            type="button"
            className="archief__load-more"
            onClick={() => setVisibleCount((count) => count + 12)}
          >
            Meer laden ...
          </button>
        )}
      </section>
      <section className="player-card__wrapper">
        <PlayerCard show={shows[0]} shows={shows} className="player-card" />
      </section>
    </div>
  )
}

export default Archief

