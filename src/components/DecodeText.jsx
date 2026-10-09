import { useEffect, useState } from 'react'

const GLYPHS = '01<>/{}[]#*+=-_'

// Resolves `text` out of random glyphs, left to right, once on mount.
// The real text is always in the DOM for assistive tech and layout (the live layer is overlaid).
export default function DecodeText({ text, duration = 950 }) {
  const [live, setLive] = useState(text)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const start = performance.now()
    let raf = 0
    const tick = (now) => {
      const progress = (now - start) / duration
      if (progress >= 1) {
        setLive(text)
        return
      }
      let out = ''
      for (let i = 0; i < text.length; i++) {
        const char = text[i]
        const lockAt = 0.12 + (i / text.length) * 0.72
        out += char === ' ' || progress >= lockAt ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
      }
      setLive(out)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [text, duration])

  return (
    <span className="decode">
      <span className="decode-final" aria-hidden="true">
        {text}
      </span>
      <span className="decode-live" aria-hidden="true">
        {live}
      </span>
      <span className="sr-only">{text}</span>
    </span>
  )
}
