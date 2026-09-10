import { usePlayer } from '../context/PlayerContext'
import './ShowList.css'

function ShowList({ shows }) {
  const { playShow } = usePlayer()

  return (
    <ul className="show-list">
      {shows.map((show) => (
        <li key={show.key} className="show-list__item">
          <div className="show-list__info">
            <p className="show-list__title">{show.title}</p>
            <p className="show-list__date">{show.date}</p>
          </div>
          <div className="show-list__actions">
            <button type="button" className="show-list__play" onClick={() => playShow(show)}>
              play ▶
            </button>
            <button type="button" className="show-list__share" aria-label="Share">
              ⬆
            </button>
            <button type="button" className="show-list__download" aria-label="Download">
              ⬇
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default ShowList
