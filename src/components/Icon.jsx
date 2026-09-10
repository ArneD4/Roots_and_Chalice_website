import './Icon.css'

function Icon({ icon, size, content }) {
  const isLarge = size === 'large'
  const hasContent = !!content && !!icon || !!icon;

  return (
    <div className={`icon-wrapper ${isLarge ? 'large' : ''} ${hasContent ? 'has-content' : ''}`}>
      <img
        src={`./icons/${icon}.svg`}
        alt={icon}
      />
    </div>
  )
}

export default Icon
