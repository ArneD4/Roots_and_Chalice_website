import PlayerCard from '../components/PlayerCard'
import ShowList from '../components/ShowList'
import { useShows } from '../hooks/useShows'
import './Home.css'

const scheduleThisMonth = [
  { date: '01/01', label: 'Leuvense festival special' },
  { date: '02/02', label: 'Concrete Bushman' },
  { date: '03/03', label: 'Word, sound, power' },
  { date: '04/04', label: 'Ruff & Tuff crew special' },
  { date: '05/05', label: 'Roots Vibration' },
]

function Home() {
  const { shows, loading, error } = useShows()

  if (loading) return <p>Loading shows...</p>
  if (error) return <p>Something went wrong: {error.message}</p>

  const latestShow = shows[0]
  const mostPlayed = [...shows].sort((a, b) => b.playCount - a.playCount).slice(0, 3)

  return (
    <div className="home">
      <section className="home__intro">
        <h1 className="home__logo">roots&amp;chalice</h1>
        <p className="home__tagline">Radio show</p>
        <p className="home__description">
          Jongeren uit België op een muzikale missie voor vrede, liefde, eenheid en begrip.
          We zenden wekelijks een <strong>roots-, reggae- en dub</strong>programma uit op het
          oudste onafhankelijke en reclamevrije radiostation van België: Radio Scorpio
          (106.00FM, regio Leuven en online).
        </p>

        <h2>Deze maand op R&amp;C</h2>
        <ul className="home__schedule">
          {scheduleThisMonth.map((item) => (
            <li key={item.date}>
              {item.date} - {item.label.toUpperCase()}
            </li>
          ))}
        </ul>

        <div className="home__cta">
          <a className="home__cta-btn home__cta-btn--orange" href="/archief">
            Ontdek het archief →
          </a>
          <a
            className="home__cta-btn home__cta-btn--red"
            href="https://www.mixcloud.com/"
            target="_blank"
            rel="noreferrer"
          >
            Naar onze Mixcloud →
          </a>
        </div>
      </section>

      <section className="home__player-section">
        <PlayerCard show={latestShow} />

        <div className="home__most-played">
          <h2>Meest beluisterde shows</h2>
          <ShowList shows={mostPlayed} />
          <a className="home__all-shows" href="/archief">
            Alle shows →
          </a>
        </div>
      </section>
    </div>
  )
}

export default Home
