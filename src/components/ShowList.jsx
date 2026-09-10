import { usePlayer } from '../context/PlayerContext'
import './ShowList.css'
import Button from './Button'

function ShowList({ shows }) {
  const { playShow } = usePlayer()

  return (
    <ul className="show-list">
      {shows.map((show) => (
        <li key={show.key} className="show-list__item">
          <div className="show-list__info">
            <h4 className="show-list__title">{show.title}</h4>
            <p className="show-list__date label">{show.date}</p>
          </div>
          <div className="show-list__actions">
            <Button variant="tertiary" content="Play" icon="Play" onClick={() => playShow(show)}></Button>
            <Button variant="secondary" content="Share" icon="Share" onClick={() => playShow(show)}></Button>
          </div>
        </li>
      ))}
    </ul>
  )
}

export default ShowList
