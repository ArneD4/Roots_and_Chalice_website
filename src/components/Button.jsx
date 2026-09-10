import './Button.css'
import Icon from './Icon'

function Button({variant, content, icon, href, onClick}) {
  const Tag = href ? 'a' : 'button'
  return (
    <Tag
      className={`btn btn-${variant}`}
      href={href}
      onClick={onClick}
      target={href ? '_blank' : undefined}
      rel={href ? 'noopener noreferrer' : undefined}
    >
      {content}
      {icon && <Icon icon={icon} />}
    </Tag>
  )
}

export default Button
