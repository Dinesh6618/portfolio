import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const pad = (n) => String(n).padStart(2, '0')

// A deck of framed photos in the About section. The deck is pinned while the page scrolls past it, and scrolling
// down turns to the next photo (scrolling up goes back). The photo that leaves flies off to the right, the next
// one to the left, and so on. Once the last photo has been shown the page carries on as normal, so the deck can
// never trap the scroll. The buttons below the deck do the same thing for keyboard and mouse users.
export default function MomentsDeck({ photos }) {
  const wrapRef = useRef(null)
  const stageRef = useRef(null)
  const [active, setActive] = useState(0)
  const count = photos.length

  // one photo per STEP of scrolling (a fraction of the screen height)
  const stepPx = () => Math.max(220, Math.round(window.innerHeight * 0.62))

  useEffect(() => {
    const wrap = wrapRef.current
    const stage = stageRef.current
    if (!wrap || !stage || count < 2) return undefined
    let raf = 0

    const layout = () => {
      wrap.style.setProperty('--step', `${stepPx()}px`)
    }
    const read = () => {
      raf = 0
      const top = parseFloat(getComputedStyle(stage).top) || 0
      const progress = top - wrap.getBoundingClientRect().top // px scrolled since the deck pinned
      const next = Math.min(count - 1, Math.max(0, Math.floor(progress / stepPx())))
      setActive((current) => (current === next ? current : next))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read)
    }
    const onResize = () => {
      layout()
      onScroll()
    }

    layout()
    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
  }, [count])

  const go = useCallback(
    (index) => {
      const wrap = wrapRef.current
      const stage = stageRef.current
      if (!wrap || !stage) return
      const clamped = Math.min(count - 1, Math.max(0, index))
      const top = parseFloat(getComputedStyle(stage).top) || 0
      const wrapTop = wrap.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top: wrapTop - top + clamped * stepPx() + stepPx() * 0.5, behavior: 'smooth' })
    },
    [count],
  )

  return (
    <div ref={wrapRef} className="deck-wrap" style={{ '--count': count }}>
      <div ref={stageRef} className="deck-stage">
        <div className="deck" role="group" aria-roledescription="photo stack" aria-label={`Photos, ${active + 1} of ${count}`}>
          {photos.map((photo, i) => {
            const offset = i - active
            const state = offset === 0 ? 'front' : offset > 0 ? 'behind' : 'gone'
            const way = i % 2 === 0 ? 'to-right' : 'to-left'
            return (
              <figure
                key={photo.src}
                className={`deck-card is-${state} ${way}`}
                style={{ '--k': Math.max(0, offset), zIndex: 10 - Math.abs(offset) }}
                aria-hidden={state === 'front' ? undefined : 'true'}
              >
                <div className="deck-photo">
                  <img
                    src={photo.src}
                    alt={state === 'front' ? photo.alt : ''}
                    width={photo.width}
                    height={photo.height}
                    loading="lazy"
                    decoding="async"
                    style={{ objectPosition: photo.position }}
                  />
                </div>
                <figcaption>
                  <span className="deck-fig">FIG. {pad(i + 1)}</span> <span className="deck-text">{photo.caption}</span>
                </figcaption>
              </figure>
            )
          })}
        </div>

        <div className="deck-story" aria-live="polite" aria-atomic="true">
          <span className="deck-story-label">Project / {pad(active + 1)}</span>
          <h4>{photos[active].title}</h4>
          <p>{photos[active].description}</p>
        </div>

        {/* tick marks: one per photo, the current one lit */}
        <div className="deck-ticks" aria-hidden="true">
          {photos.map((photo, i) => (
            <span key={photo.src} className={i === active ? 'is-on' : undefined} />
          ))}
        </div>

        <div className="deck-bar">
          <div className="deck-buttons">
            <button type="button" onClick={() => go(active - 1)} disabled={active === 0} aria-label="Previous photo">
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => go(active + 1)} disabled={active === count - 1} aria-label="Next photo">
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
          <span className="deck-hint" aria-hidden="true">
            {active < count - 1 ? 'Scroll to see the next' : 'That is all of them'}
          </span>
          <span className="deck-count" aria-live="polite">
            {pad(active + 1)} / {pad(count)}
          </span>
        </div>
      </div>
    </div>
  )
}
