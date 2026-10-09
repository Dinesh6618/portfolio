import { useState } from 'react'
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'

// Screenshot viewer for the project detail dialog. Files that fail to load are skipped;
// if none load (or none are configured) a clearly labelled placeholder is shown.
export default function ShotGallery({ shots, name }) {
  const [index, setIndex] = useState(0)
  const [failed, setFailed] = useState({})

  const markFailed = (src) => setFailed((prev) => (prev[src] ? prev : { ...prev, [src]: true }))
  const available = shots.filter((s) => !failed[s.src])

  if (available.length === 0) {
    return (
      <div className="shot-placeholder" role="img" aria-label={`${name} screenshots are coming soon`}>
        <ImageOff size={28} aria-hidden="true" />
        <p>Screenshots coming soon</p>
      </div>
    )
  }

  const current = available[Math.min(index, available.length - 1)]
  const position = available.indexOf(current)
  const go = (delta) => setIndex((position + delta + available.length) % available.length)

  const onKeyDown = (event) => {
    if (available.length < 2) return
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      go(-1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      go(1)
    }
  }

  return (
    <div className="gallery" role="group" aria-roledescription="carousel" aria-label={`${name} screenshots`} onKeyDown={onKeyDown}>
      <div className="gallery-stage">
        <a href={current.src} target="_blank" rel="noopener noreferrer" className="gallery-link" aria-label="Open screenshot full size in a new tab">
          <img key={current.src} src={current.src} alt={current.caption} decoding="async" onError={() => markFailed(current.src)} />
        </a>
        {available.length > 1 && (
          <>
            <button type="button" className="gallery-nav gallery-prev" aria-label="Previous screenshot" onClick={() => go(-1)}>
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button type="button" className="gallery-nav gallery-next" aria-label="Next screenshot" onClick={() => go(1)}>
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      <p className="gallery-caption" aria-live="polite">
        <span className="mono">
          {position + 1} / {available.length}
        </span>
        {current.caption}
      </p>

      {available.length > 1 && (
        <ul className="gallery-thumbs">
          {available.map((shot, i) => (
            <li key={shot.src}>
              <button
                type="button"
                className={i === position ? 'is-current' : undefined}
                aria-label={`Show screenshot ${i + 1}: ${shot.caption}`}
                aria-current={i === position ? 'true' : undefined}
                onClick={() => setIndex(i)}
              >
                <img src={shot.src} alt="" loading="lazy" decoding="async" onError={() => markFailed(shot.src)} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
