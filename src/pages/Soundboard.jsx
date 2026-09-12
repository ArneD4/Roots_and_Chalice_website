import './Soundboard.css'

const jingles = [
  { name: 'Rueben Gondor', color: 'red' },
  { name: 'Lila Iké', color: 'red' },
  { name: 'Missing Link', color: 'red' },
  { name: 'Abakush', color: 'red' },
  { name: 'Jese Royal', color: 'orange' },
  { name: 'Marcus Gad', color: 'orange' },
  { name: 'Petah Sunday', color: 'orange' },
  { name: 'Macka B', color: 'orange' },
  { name: 'The Twinkle Brothers', color: 'teal' },
  { name: 'Cédrik Myhton', color: 'teal' },
  { name: 'Winston McAnuff', color: 'teal' },
  { name: 'Dazed', color: 'teal' },
]

const crossoverBands = ['High', 'Mid', 'Low', 'Sub']
const sirenKnobs = ['Frequency', 'LFO', 'Sine / Square', 'Siren volume']
const delayKnobs = ['Delay time', 'Feedback', 'Delay volume']

function Knob({ label }) {
  return (
    <div className="knob">
      <div className="knob__dial">
        <span className="knob__indicator" />
      </div>
      <span className="knob__label">{label}</span>
    </div>
  )
}

function Toggle({ label }) {
  return (
    <label className="toggle">
      {label && <span className="toggle__label">{label}</span>}
      <span className="toggle__track">
        <span className="toggle__thumb" />
      </span>
    </label>
  )
}

function Soundboard() {
  return (
    <div className="soundboard">
      <section className="soundboard__panel soundboard__jingles">
          <div className="screw screw-top-left"></div>
          <div className="screw screw-top-right"></div>
          <div className="screw screw-bottom-left"></div>
          <div className="screw screw-bottom-right"></div>
        <h2>Jingles</h2>
        <div className="soundboard__jingle-grid">
          {jingles.map((jingle) => (
            <button
              key={jingle.name}
              type="button"
              className={`soundboard__jingle soundboard__jingle--${jingle.color}`}
            >
              {jingle.name}
            </button>
          ))}
        </div>
      </section>

      <section className="soundboard__panel soundboard__crossover">
                  <div className="screw screw-top-left"></div>
          <div className="screw screw-top-right"></div>
          <div className="screw screw-bottom-left"></div>
          <div className="screw screw-bottom-right"></div>
        <h2>X-Over</h2>
        {crossoverBands.map((band) => (
          <Toggle key={band} label={band.toUpperCase()} />
        ))}
      </section>

      <div className="soundboard__side">
        <section className="soundboard__panel soundboard__siren">
          <div className="screw screw-top-left"></div>
          <div className="screw screw-top-right"></div>
          <div className="screw screw-bottom-left"></div>
          <div className="screw screw-bottom-right"></div>
          <h2>Siren</h2>
          <button type="button" className="soundboard__siren-btn" aria-label="Siren">
            ✻
          </button>
          <div className="soundboard__knobs">
            {sirenKnobs.map((label) => (
              <Knob key={label} label={label.toUpperCase()} />
            ))}
          </div>
        </section>

        <section className="soundboard__panel soundboard__delay">
          <div className="screw screw-top-left"></div>
          <div className="screw screw-top-right"></div>
          <div className="screw screw-bottom-left"></div>
          <div className="screw screw-bottom-right"></div>
          <h2>Delay</h2>
          <Toggle label="DELAY OFF/ONN" />
          <div className="soundboard__knobs">
            {delayKnobs.map((label) => (
              <Knob key={label} label={label.toUpperCase()} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Soundboard
