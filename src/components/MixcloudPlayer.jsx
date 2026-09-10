import { useEffect, useRef, useState } from 'react'
import { usePlayer } from '../context/PlayerContext'

function MixcloudPlayer({ initialKey, mini = false }) {
  const iframeRef = useRef(null)
  const { registerWidget } = usePlayer()

  // locked in once on mount: later show switches go through widget.load(), not a new src
  const [src] = useState(
    () =>
      `https://www.mixcloud.com/widget/iframe/?hide_cover=1&feed=${encodeURIComponent(initialKey)}${mini ? '&mini=1' : ''}`,
  )

  useEffect(() => {
    const widget = window.Mixcloud.PlayerWidget(iframeRef.current)
    widget.ready.then(() => registerWidget(widget))
  }, [registerWidget])

  const height = mini ? 60 : 120

  return (
    <iframe
      ref={iframeRef}
      title="Mixcloud player"
      src={src}
      width="100%"
      height={height}
      frameBorder="0"
      allow="autoplay; encrypted-media"
    />
  )
}

export default MixcloudPlayer