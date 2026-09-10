import { usePlayer } from "../context/PlayerContext";
import "./PlayerCard.css";
import Button from "./Button";

function PlayerCard({ title = "Herbeluister de laatste show", show }) {
  const { playShow } = usePlayer();

  if (!show) return null;

  return (
    <section className="player-card">
      <div className="player-card_header">
        <h2 className="player-card__title">{title}</h2>
      </div>
      <div className="player-card_content">
        <div className="player-card__screen">
          <h2 className="player-card__show h2--alt">{show.title}</h2>
          <h4 className="player-card__date h4--alt">{show.date}</h4>
        </div>

        <div className="player-card__controls">
          <div className="player-card__extra">
            <Button
              variant="secondary"
              href={show.url}
              target="blank"
              rel="noreferrer"
              content="Luister op Mixcloud"
              icon="Play"
            ></Button>
            <Button
              variant="tertiary"
              href={show.url}
              target="_blank"
              rel="noreferrer"
              content="Share"
              icon="Share"
              share={show.url}
            ></Button>
          </div>
          <div className="controls">
            <Button
              variant="tertiary"
              icon="Previous"
              // size="large"
            ></Button>
            <Button
              className="player-card__play"
              variant="bigPlayButton"
              onClick={() => playShow(show)}
              icon="Play"
              size="large"
            ></Button>
                        <Button
              variant="tertiary"
              icon="Next"
              // size="large"
            ></Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PlayerCard;
