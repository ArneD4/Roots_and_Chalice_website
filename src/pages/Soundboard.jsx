import { useEffect, useRef, useState } from 'react'
import './Soundboard.css'


const jingles = [
  { name: 'Queen Omega', color: 'red', audioSrc: '/audio/Queen_Omega.mp3' },
  { name: 'Dub Judah', color: 'red', audioSrc: '/audio/Dub_Judah.mp3' },
  { name: 'Juli Jupter', color: 'red', audioSrc: '/audio/Juli_Jupter.mp3' },
  { name: 'Abakush', color: 'red', audioSrc: '/audio/Abakush.mp3' },
  { name: 'Rapha Pico', color: 'orange', audioSrc: '/audio/Rapha_Pico.mp3' },
  { name: 'Micah Shemaiah', color: 'orange', audioSrc: '/audio/Micah_Shemaiah.mp3' },
  { name: 'Hollie Cook', color: 'orange', audioSrc: '/audio/Hollie_Cook.mp3' },
  { name: 'Jah Mason', color: 'orange', audioSrc: '/audio/Jah_Mason.mp3' },
  { name: 'The Twinkle Brothers', color: 'teal', audioSrc: '/audio/Twinkle_Brothers.mp3' },
  { name: 'Sista Aisha', color: 'teal', audioSrc: '/audio/Sista_Aisha.mp3' },
  { name: 'Earl Sixteen', color: 'teal', audioSrc: '/audio/Earl_Sixteen.mp3' },
  { name: 'Black Uhuru', color: 'teal', audioSrc: '/audio/Black_Uhuru.mp3' },
]

const sirenKnobs = [
  { id: 'frequency', label: 'Frequency', min: 150, max: 1200, step: 1 },
  { id: 'lfoRate', label: 'LFO', min: 0.1, max: 12, step: 0.1 },
  { id: 'volume', label: 'Volume', min: 0, max: 100, step: 1 },
]

function Knob({ control, value, onChange }) {
  const rotation = ((value - control.min) / (control.max - control.min)) * 270 - 135

  return (
    <label className="knob">
      <input
        className="knob__input"
        type="range"
        min={control.min}
        max={control.max}
        step={control.step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={control.label}
      />
      <span className="knob__dial" style={{ '--knob-rotation': `${rotation}deg` }} aria-hidden="true">
        <span className="knob__indicator" />
      </span>
      <span className="knob__label">{control.label.toUpperCase()}</span>
    </label>
  )
}

function Soundboard({ onClose }) {
  const audioRef = useRef(null)
  const sirenRef = useRef(null)
  const [isSirenPlaying, setIsSirenPlaying] = useState(false)
  const [siren, setSiren] = useState({
    frequency: 440,
    lfoRate: 2,
    waveform: 'sine',
    volume: 65,
  })

  function stopSiren() {
    const sirenNodes = sirenRef.current
    if (!sirenNodes) return

    const { context, oscillator, lfo, volumeGain } = sirenNodes
    const now = context.currentTime
    volumeGain.gain.cancelScheduledValues(now)
    volumeGain.gain.setTargetAtTime(0, now, 0.015)
    oscillator.stop(now + 0.08)
    lfo.stop(now + 0.08)
    sirenRef.current = null
    setIsSirenPlaying(false)
  }

  function startSiren() {
    const AudioContext = window.AudioContext || window.webkitAudioContext
    const context = new AudioContext()
    const oscillator = context.createOscillator()
    const lfo = context.createOscillator()
    const sweepGain = context.createGain()
    const volumeGain = context.createGain()

    oscillator.type = siren.waveform
    oscillator.frequency.value = siren.frequency
    lfo.frequency.value = siren.lfoRate
    sweepGain.gain.value = siren.frequency * 0.45
    volumeGain.gain.value = siren.volume / 100

    lfo.connect(sweepGain)
    sweepGain.connect(oscillator.frequency)
    oscillator.connect(volumeGain)
    volumeGain.connect(context.destination)
    lfo.start()
    oscillator.start()
    sirenRef.current = { context, oscillator, lfo, sweepGain, volumeGain }
    setIsSirenPlaying(true)
  }

  function handleSirenPress(event) {
    event.currentTarget.setPointerCapture(event.pointerId)
    if (!sirenRef.current) startSiren()
  }

  function handleSirenRelease() {
    stopSiren()
  }

  function handleSirenKeyDown(event) {
    if ((event.key === 'Enter' || event.key === ' ') && !event.repeat && !sirenRef.current) {
      event.preventDefault()
      startSiren()
    }
  }

  function handleSirenKeyUp(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      stopSiren()
    }
  }

  function updateSiren(control, value) {
    setSiren((currentSiren) => ({ ...currentSiren, [control]: value }))

    const sirenNodes = sirenRef.current
    if (!sirenNodes) return

    const now = sirenNodes.context.currentTime
    if (control === 'frequency') {
      sirenNodes.oscillator.frequency.setTargetAtTime(value, now, 0.02)
      sirenNodes.sweepGain.gain.setTargetAtTime(value * 0.45, now, 0.02)
    } else if (control === 'lfoRate') {
      sirenNodes.lfo.frequency.setTargetAtTime(value, now, 0.02)
    } else if (control === 'volume') {
      sirenNodes.volumeGain.gain.setTargetAtTime(value / 100, now, 0.02)
    } else if (control === 'waveform') {
      sirenNodes.oscillator.type = value
    }
  }

  useEffect(() => () => stopSiren(), [])

  function playJingle(audioSrc) {
    const audio = audioRef.current
    if (!audio) return

    audio.src = audioSrc
    audio.currentTime = 0
    audio.play().catch((error) => console.error('Unable to play jingle', error))
  }

  return (
    <div className="soundboard">
      <audio ref={audioRef} preload="none" />
      <section className="soundboard__panel">
        <div className="screw screw-top-left"></div>
        <div className="screw screw-top-right"></div>
        <div className="screw screw-bottom-left"></div>
        <div className="screw screw-bottom-right"></div>
        <div className="soundboard__header">
          <h2>Siren</h2>
          <button type="button" className="soundboard__close" aria-label="Close soundboard" onClick={onClose}>
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="siren-controls">
          <button
            type="button"
            className={`btn soundboard__siren-btn${isSirenPlaying ? ' soundboard__siren-btn--active' : ''}`}
            aria-label={isSirenPlaying ? 'Stop siren' : 'Start siren'}
            aria-pressed={isSirenPlaying}
            onPointerDown={handleSirenPress}
            onPointerUp={handleSirenRelease}
            onPointerCancel={handleSirenRelease}
            onLostPointerCapture={handleSirenRelease}
            onKeyDown={handleSirenKeyDown}
            onKeyUp={handleSirenKeyUp}
          >
            <img src="/icons/Siren.svg" alt="siren_btn" />
          </button>
          <div className="soundboard__knobs">
            {sirenKnobs.map((control) => (
              <Knob
                key={control.id}
                control={control}
                value={siren[control.id]}
                onChange={(value) => updateSiren(control.id, value)}
              />
            ))}
            <label className="soundboard__waveform">
              <span className="soundboard__waveform-label">SINE / SQUARE</span>
              <input
                className="soundboard__waveform-input"
                type="checkbox"
                checked={siren.waveform === 'square'}
                onChange={(event) => updateSiren('waveform', event.target.checked ? 'square' : 'sine')}
              />
              <span className="soundboard__waveform-toggle" aria-hidden="true">
                <span className="soundboard__waveform-thumb" />
              </span>
            </label>
          </div>
        </div>
        <div className="soundboard__jingles">
          <h2>Jingles</h2>
          <div className="soundboard__jingle-grid">
            {jingles.map((jingle) => (
              <button
                key={jingle.name}
                type="button"
                className={`btn soundboard__jingle soundboard__jingle--${jingle.color}`}
                onClick={() => playJingle(jingle.audioSrc)}
              >
                {jingle.name}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Soundboard
