import { usePlayer } from "../context/PlayerContext";
import "./PlayerCard.css";
import Button from "./Button";

function PlayerCard({ title = "Herbeluister de laatste show", show }) {
  const { activeShow, playShow } = usePlayer();

  if (!show) return null;

  const displayedShow = activeShow ?? show;
  const isSelectedShow = activeShow && activeShow.key !== show.key;
  const cardTitle = isSelectedShow ? "Je luisterd naar:" : title;

  return (
    <section className="player-card">
      <div className="player-card_header">
        <h2 className="player-card__title">{cardTitle}</h2>
      </div>
      <div className="player-card_content">
        <div className="player-card__screen">
          <h2 className="player-card__show h2--alt">{displayedShow.title}</h2>
          <h4 className="player-card__date h4--alt">{displayedShow.date}</h4>
        </div>

        <div className="player-card__controls">
          <div className="player-card__extra">
            <Button
              variant="secondary"
              href={displayedShow.url}
              target="blank"
              rel="noreferrer"
              content="Luister op Mixcloud"
              icon="Play"
            ></Button>
            <Button
              variant="tertiary"
              href={displayedShow.url}
              target="_blank"
              rel="noreferrer"
              content="Share"
              icon="Share"
              share={displayedShow.url}
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
              onClick={() => playShow(displayedShow)}
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
