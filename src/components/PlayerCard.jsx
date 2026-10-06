import { usePlayer } from "../context/PlayerContext";
import "./PlayerCard.css";
import Button from "./Button";
import { useLiveShow } from "../hooks/useLiveShow";

function PlayerCard({ title = "Herbeluister de laatste show", show, shows }) {
  const { activeShow, playShow, livePlaying, toggleLive, startLive } = usePlayer();
  const { isLive, liveShow } = useLiveShow();

  if (!show) return null;

  const displayedShow = activeShow ?? show;
  const isSelectedShow = activeShow && activeShow.key !== show.key;
  const showLive = isLive && (!activeShow || livePlaying);
  const cardTitle = showLive
    ? "Nu live op Radio Scorpio"
    : isSelectedShow
      ? "Je luistert naar:"
      : title;

  function playAdjacentShow(direction) {
    const currentIndex = shows.findIndex(
      (item) => item.key === displayedShow.key,
    );
    const nextIndex = (currentIndex + direction + shows.length) % shows.length;
    playShow(shows[nextIndex]);
  }

  return (
    <section className="player-card">
      <div className="player-card_header">
        <div className="screw screw-top-left"></div>
        <div className="screw screw-top-right"></div>
        <div className="screw screw-bottom-left"></div>
        <div className="screw screw-bottom-right"></div>
        <h2 className="player-card__title">{cardTitle}</h2>
        {showLive && (
          <button type="button" className="navbar__live player-card__live" onClick={startLive}>
            Live on air
          </button>
        )}
      </div>
      <div className="player-card_content">
        <div className="screw screw-top-left"></div>
        <div className="screw screw-top-right"></div>
        <div className="screw screw-bottom-left"></div>
        <div className="screw screw-bottom-right"></div>
        <div className="player-card__screen">
          <h2 className="player-card__show h2--alt">
            {showLive ? (liveShow?.title ?? "Roots & Chalice") : displayedShow.title}
          </h2>
          <h4 className="player-card__date h4--alt">
            {showLive ? "Live: 21:00 - 22:30" : displayedShow.date}
          </h4>
        </div>

        <div className="player-card__controls">
          <div className="player-card__extra">
            {isLive ? (
              <Button
                variant="secondary"
                onClick={toggleLive}
                content={livePlaying ? "Stop live" : "Luister nu live"}
                icon="Play"
              ></Button>
            ) : (
              <Button
                variant="secondary"
                href={displayedShow.url}
                target="blank"
                rel="noreferrer"
                content="Luister op Mixcloud"
                icon="Play"
              ></Button>
            )}
            <Button
              variant="tertiary"
              content=""
              icon="Share"
              share={showLive ? window.location.origin : displayedShow.url}
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
