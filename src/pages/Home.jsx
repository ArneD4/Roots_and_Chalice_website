import { useEffect, useState } from "react";
import PlayerCard from "../components/PlayerCard";
import ShowList from "../components/ShowList";
import { fetchSheetData } from "../services/googleSheets";
import { useShows } from "../hooks/useShows";
import "./Home.css";
import Button from "../components/Button";

function useSheetData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSheetData()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

function Home() {
  const { shows, loading, error } = useShows();
  const { data: scheduleThisMonth, error: scheduleError } = useSheetData();

  useEffect(() => {
    if (!scheduleError) console.log("Current month's schedule:", scheduleThisMonth);
  }, [scheduleError, scheduleThisMonth]);

  if (loading) return <p>Loading shows...</p>;
  if (error) return <p>Something went wrong: {error.message}</p>;

  const latestShow = shows[0];
  const mostPlayed = [...shows]
    .sort((a, b) => b.playCount - a.playCount)
    .slice(0, 3);
    

  return (
    <div className="home">
      <section className="home__intro">
        <div className="home__intro_inner">
          <div className="intro">
            <img src="./logo/big.svg" alt="big_logo" className="big_logo"/>
            <p className="home__description">
              Jongeren uit België op een muzikale missie voor vrede, liefde,
              eenheid en begrip. We zenden wekelijks een{" "}
              <strong>roots-, reggae- en dub</strong>programma uit op het oudste
              onafhankelijke en reclamevrije radiostation van België: Radio
              Scorpio (106.00FM, regio Leuven en online).
            </p>
          </div>

          <div className="calendar">
            <h3>Deze maand op R&amp;C</h3>
            <ul className="calendar_inner">
              {scheduleThisMonth.map((item) => (
                <li key={item.date} className="caption">
                  {item.date} - {item.label.toUpperCase()}
                </li>
              ))}
            </ul>
          </div>

          <div className="home__cta">
            <Button
              variant="secondary"
              content="Ontedek het archief"
              icon="Right"
              href="/archief"
            ></Button>
            <Button
              variant="tertiary"
              content="Ga naar onze Mixcloud"
              icon="Right"
              href="https://www.mixcloud.com/Roots_and_Chalice"
               target='blank'
            ></Button>
          </div>
        </div>
      </section>

      <section className="home__player-section">
        <PlayerCard show={latestShow} />

        <div className="home__most-played">
          <h2>Meest beluisterde shows</h2>
          <ShowList shows={mostPlayed} />
          <Button
            variant="primary"
            content="Bekijk alle shows"
            icon="Right"
            href="/archief"
          ></Button>
        </div>
      </section>
    </div>
  );
}

export default Home;
