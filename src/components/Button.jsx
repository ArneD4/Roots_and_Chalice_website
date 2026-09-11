import { useEffect, useRef, useState } from 'react'
import './Button.css'
import { Link } from 'react-router-dom'
import Icon from './Icon'

async function copyToClipboard(text) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textArea = document.createElement('textarea')
  textArea.value = text
  textArea.style.position = 'fixed'
  textArea.style.opacity = '0'
  document.body.append(textArea)
  textArea.select()
  const copied = document.execCommand('copy')
  textArea.remove()

  if (!copied) throw new Error('Unable to copy link')
}

function Button({variant, content, icon, href, onClick, size, target, share, className, ...props}) {
  const [copied, setCopied] = useState(false)
  const copiedTimeoutRef = useRef(null)
  const isInternalLink = href?.startsWith('/')
  const Tag = share ? 'button' : isInternalLink ? Link : href ? 'a' : 'button'

  useEffect(() => {
    return () => window.clearTimeout(copiedTimeoutRef.current)
  }, [])

  async function handleShare() {
    try {
      await copyToClipboard(share)
      setCopied(true)
      window.clearTimeout(copiedTimeoutRef.current)
      copiedTimeoutRef.current = window.setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy show link', error)
    }
  }

  return (
    <Tag
      className={`btn btn-${variant} ${copied ? 'btn--copied' : ''} ${className ?? ''}`}
      {...(share ? {} : isInternalLink ? { to: href } : { href })}
      onClick={share ? handleShare : onClick}
      target={target === 'blank' ? '_blank' : undefined}
      rel={href ? 'noopener noreferrer' : undefined}
      title={share ? (copied ? 'Link gekopieerd' : 'Kopieer link') : undefined}
      aria-label={share ? (copied ? 'Link gekopieerd' : 'Kopieer link') : undefined}
      {...props}

    >
      {content}
      {icon && <Icon icon={icon} size={size} content={content}/>}
    </Tag>
  )
}

export default Button
