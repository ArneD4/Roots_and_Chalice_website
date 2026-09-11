import './Icon.css'

function Icon({ icon, size, content }) {
  const isLarge = size === 'large'
  const noContent = !content;

  return (
    <div className={`icon-wrapper ${isLarge ? 'large' : ''} ${noContent ? 'noContent' : 'hasContent'}`}>
      <img
        src={`./icons/${icon}.svg`}
        alt={icon}
      />
    </div>
  )
}

export default Icon
