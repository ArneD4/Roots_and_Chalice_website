import './Button.css'
import Icon from './Icon'

function Button({variant, content, icon, href, onClick, size, target, share}) {
  const Tag = href ? 'a' : 'button'

  return (
    <Tag
      className={`btn btn-${variant}`}
      href={href}
      onClick={onClick}
      target={target === 'blank' ? '_blank' : undefined}
      rel={href ? 'noopener noreferrer' : undefined}

    >
      {content}
      {icon && <Icon icon={icon} size={size} content={content}/>}
    </Tag>
  )
}

export default Button
