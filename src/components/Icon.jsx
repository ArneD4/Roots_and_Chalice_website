import './Icon.css'

function Icon({icon}) {
  return (
    <div className="icon-wrapper">
      <img src={`./icons/${icon}.svg`} alt={icon} />
    </div>

  )
}

export default Icon
