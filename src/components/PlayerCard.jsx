import { usePlayer } from "../context/PlayerContext";
import "./PlayerCard.css";

function PlayerCard({ title = "Herbeluister de laatste show", show }) {
  const { playShow } = usePlayer();

  if (!show) return null;

  return (
    <section className="player-card">
      <h2 className="player-card__title">{title}</h2>

      <div className="player-card__screen">
        <p className="player-card__show">{show.title}</p>
        <p className="player-card__date">{show.date}</p>
      </div>

      <div className="player-card__controls">
        <button
          type="button"
          className="player-card__play"
          onClick={() => playShow(show)}
        >
          play ▶
        </button>

        <div className="player-card__extra">
          <a
            className="player-card__mixcloud"
            href={show.url}
            target="_blank"
            rel="noreferrer"
          >
            Luister op Mixcloud ▶
          </a>
          <button type="button" className="player-card__share">
            Share ⬆
          </button>
          <button type="button" className="player-card__download">
            Download ⬇
          </button>
        </div>
      </div>
    </section>
  );
}

export default PlayerCard;
