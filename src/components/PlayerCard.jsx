import { usePlayer } from "../context/PlayerContext";
import "./PlayerCard.css";
import Button from "./Button";

function PlayerCard({ title = "Herbeluister de laatste show", show, shows }) {
  const { activeShow, playShow } = usePlayer();

  if (!show) return null;

  const displayedShow = activeShow ?? show;
  const isSelectedShow = activeShow && activeShow.key !== show.key;
  const cardTitle = isSelectedShow ? "Je luisterd naar:" : title;

  function playAdjacentShow(direction) {
    const currentIndex = shows.findIndex((item) => item.key === displayedShow.key);
    const nextIndex = (currentIndex + direction + shows.length) % shows.length;
    playShow(shows[nextIndex]);
  }

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
              content=""
              icon="Share"
              share={displayedShow.url}
            ></Button>
          </div>
          <div className="controls">
            <Button
              variant="tertiary"
              icon="Previous"
              onClick={() => playAdjacentShow(-1)}
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
              onClick={() => playAdjacentShow(1)}
            ></Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PlayerCard;
