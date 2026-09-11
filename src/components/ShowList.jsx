import { usePlayer } from "../context/PlayerContext";
import "./ShowList.css";
import Button from "./Button";

function ShowList({ shows }) {
  const { playShow } = usePlayer();

  return (
    <ul className="show-list">
      {shows.map((show) => (
        <li key={show.key} className="show-list__item">
        <div className="screw screw-top-left"></div>
        <div className="screw screw-top-right"></div>
        <div className="screw screw-bottom-left"></div>
        <div className="screw screw-bottom-right"></div>
          <div className="show-list__info">
            <h4 className="show-list__title">{show.title}</h4>
            <p className="show-list__date label">{show.date}</p>
          </div>
          <div className="show-list__actions">
            <div className="show-list__actions__top">
              <Button
                variant="tertiary"
                content="Play"
                icon="Play"
                onClick={() => playShow(show)}
              ></Button>
              <Button
                variant="secondary"
                content=""
                icon="Share"
                share={show.url}
              ></Button>
            </div>
            <Button
              variant="primary"
              content="Luister op  Mixcloud"
              icon="Play"
              onClick={() => playShow(show)}
              href={`${show.url}`}
              target="blank"
            ></Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default ShowList;
