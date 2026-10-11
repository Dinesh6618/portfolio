import { useEffect, useRef, useState } from 'react'
import { endIntro, introPending } from '../lib/intro.js'
import './IntroLoader.css'

// Golden text reveal. Pure black, then tiny gold particles gather into the real letter shapes of DINESH G one
// letter at a time (left to right), each letter is unmasked as its particles arrive, a metallic shimmer sweeps
// across the finished title, a few particles drift off the edges, and the glow keeps a soft pulse.
//
// Timeline (seconds from the moment the font is ready):
//   0.00 – 0.30  darkness (only a few sparks)
//   0.30 – 2.45  letters gather and unmask, one every 0.2 s
//   2.60 – 3.40  shimmer sweep (0.8 s)
//   3.40 +       glow pulse; the loader lifts once loading is complete (never before 4.2 s)

const TITLE = 'DINESH G'
const GATHER_AT = 0.3
const STEP = 0.2
const MIN_MS = 4200
const MIN_MS_REDUCED = 600
const MAX_MS = 9500 // never held longer than this, whatever is still loading
const FONT_WAIT_MS = 1500
const FADE_MS = 800

// Real progress: web fonts, the window load event (every script and image) and the first paint.
const WEIGHTS = { fonts: 40, load: 50, ready: 10 } // sums to 100

const rand = (a, b) => a + Math.random() * (b - a)
const LETTERS = [...TITLE]

// Shows once per session, on the first load. Home's entrance waits for it to lift (src/lib/intro.js).
export default function IntroLoader() {
  const [mounted, setMounted] = useState(() => introPending())
  if (!mounted) return null
  return <IntroScreen onGone={() => setMounted(false)} />
}

function IntroScreen({ onGone }) {
  const rootRef = useRef(null)
  const canvasRef = useRef(null)
  const nameRef = useRef(null)
  const letterRefs = useRef([])
  const fillRef = useRef(null)
  const pctRef = useRef(null)
  const trackRef = useRef(null)
  const [go, setGo] = useState(false) // the font is ready: the animation starts
  const [leaving, setLeaving] = useState(false)
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const nameEl = nameRef.current
    if (!root || !canvas || !nameEl) return undefined
    const ctx = canvas.getContext('2d')
    const minMs = reduced ? MIN_MS_REDUCED : MIN_MS
    const done = { fonts: false, load: false, ready: true }
    const t0 = performance.now()
    let startAt = 0 // performance.now() when the animation started

    // the page underneath cannot be tabbed into or read while the loader is up
    const hidden = []
    for (const el of document.getElementById('root')?.children ?? []) {
      if (el !== root && !el.inert) {
        el.inert = true
        hidden.push(el)
      }
    }

    // ---- real loading signals
    const start = () => {
      if (startAt) return
      startAt = performance.now()
      done.fonts = true
      setGo(true)
    }
    if (document.fonts?.load) {
      document.fonts.load('700 100px "Space Grotesk"').then(start, start)
      document.fonts.ready.then(start, start)
    } else start()
    const fontTimer = window.setTimeout(start, FONT_WAIT_MS)
    if (document.readyState === 'complete') done.load = true
    const onLoad = () => (done.load = true)
    window.addEventListener('load', onLoad)

    // ---- canvas
    let W = 1
    let H = 1
    let dpr = 1
    const resize = () => {
      W = window.innerWidth
      H = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
    }
    resize()

    const sparks = Array.from({ length: reduced ? 0 : 60 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: rand(0.6, 1.5),
      sp: rand(0.004, 0.014),
      ph: Math.random() * 6.28,
    }))
    let particles = [] // gather into letters: { x0,y0,tx,ty,t0,dur,r,i }
    let edges = [] // letter edge pixels the drifters leave from: { x,y,i }
    let drifters = []
    let sampled = false
    let unit = 1 // font size / 100

    // Sample the real glyph shapes: draw the title offscreen with the very same font at the very same place,
    // and use the pixels that are inside the letters as particle targets.
    const sample = () => {
      sampled = true
      if (reduced) return
      const fs = parseFloat(getComputedStyle(nameEl).fontSize) || 100
      unit = fs / 100
      const fontFamily = getComputedStyle(nameEl).fontFamily
      const off = document.createElement('canvas')
      off.width = W
      off.height = H
      const o = off.getContext('2d', { willReadFrequently: true })
      o.font = `700 ${fs}px ${fontFamily}`
      o.textBaseline = 'alphabetic'
      const m = o.measureText('H')
      const fa = m.fontBoundingBoxAscent
      const fd = m.fontBoundingBoxDescent
      let n = 0
      letterRefs.current.forEach((el, i) => {
        if (!el) return
        const r = el.getBoundingClientRect()
        // CSS puts the font's content area in the middle of a line box that is one font-size tall
        const baseline = r.top + (fs - (fa + fd)) / 2 + fa
        o.clearRect(0, 0, W, H)
        o.fillStyle = '#fff'
        o.fillText(LETTERS[i], r.left, baseline)
        const x0 = Math.max(0, Math.floor(r.left - 6))
        const y0 = Math.max(0, Math.floor(r.top - 6))
        const w = Math.min(W - x0, Math.ceil(r.width + 12))
        const h = Math.min(H - y0, Math.ceil(r.height + 12))
        const data = o.getImageData(x0, y0, w, h).data
        const inside = []
        const edge = []
        const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : data[(y * w + x) * 4 + 3])
        const step = Math.max(2, Math.round(fs / 60))
        for (let y = 0; y < h; y += step) {
          for (let x = 0; x < w; x += step) {
            if (at(x, y) < 140) continue
            inside.push([x0 + x, y0 + y])
            if (at(x - step * 2, y) < 60 || at(x + step * 2, y) < 60 || at(x, y - step * 2) < 60 || at(x, y + step * 2) < 60) {
              edge.push({ x: x0 + x, y: y0 + y, i: n })
            }
          }
        }
        const count = Math.min(inside.length, Math.round(170 * Math.max(0.7, Math.min(1.6, unit * 0.9))))
        for (let k = 0; k < count; k++) {
          const [tx, ty] = inside[(Math.random() * inside.length) | 0]
          const a = Math.random() * 6.28
          const d = rand(0.5, 2.2) * fs
          const t0g = GATHER_AT + n * STEP + rand(0, 0.16)
          particles.push({
            x0: tx + Math.cos(a) * d,
            y0: ty + Math.sin(a) * d * 0.65,
            tx,
            ty,
            t0: t0g,
            dur: rand(0.5, 0.75),
            r: rand(0.8, 1.9),
            i: n,
          })
        }
        edges.push(...edge)
        n += 1
      })
    }

    const draw = (T) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'lighter'

      // phase 1: a few tiny sparks in the dark
      ctx.fillStyle = '#FFD76A'
      const fade = Math.min(1, Math.max(0, T / 0.6))
      for (const p of sparks) {
        const y = (((p.y - T * p.sp) % 1) + 1) % 1
        ctx.globalAlpha = fade * (0.18 + 0.4 * Math.abs(Math.sin(T * 1.5 + p.ph)))
        ctx.fillRect(p.x * W, y * H, p.r * 1.3, p.r * 1.3)
      }

      // phase 3: particles gather into the letters, then dissolve into the real text
      for (const p of particles) {
        const k = (T - p.t0) / p.dur
        if (k < 0 || k > 1.5) continue
        const e = 1 - Math.pow(1 - Math.min(1, k), 3)
        const x = p.x0 + (p.tx - p.x0) * e
        const y = p.y0 + (p.ty - p.y0) * e
        ctx.globalAlpha = k < 1 ? 0.25 + 0.7 * k : 0.95 * (1 - (k - 1) / 0.5)
        ctx.fillStyle = k < 0.85 ? '#FFD76A' : '#FF9D00'
        const s = p.r * (unit > 0.5 ? unit : 1) * 1.05
        ctx.fillRect(x - s / 2, y - s / 2, s, s)
      }

      // phase 6: a few particles drift away from the edges of letters that are already drawn
      if (edges.length && T > 1) {
        if (Math.random() < 0.55 && drifters.length < 34) {
          const e = edges[(Math.random() * edges.length) | 0]
          if (T > GATHER_AT + e.i * STEP + 0.9) {
            drifters.push({ x: e.x, y: e.y, vx: rand(6, 30) * unit, vy: rand(-34, -6) * unit, life: 0, span: rand(1.1, 2.1), r: rand(0.7, 1.5) })
          }
        }
        drifters = drifters.filter((d) => d.life < 1)
        for (const d of drifters) {
          d.x += d.vx / 60
          d.y += d.vy / 60
          d.life += 1 / 60 / d.span
          ctx.globalAlpha = Math.sin(Math.PI * Math.min(1, d.life)) * 0.8
          ctx.fillStyle = '#FFD76A'
          ctx.fillRect(d.x, d.y, d.r * Math.max(1, unit), d.r * Math.max(1, unit))
        }
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }

    // ---- the loop: particles + the real progress bar
    let raf = 0
    let last = performance.now()
    let shown = 0
    let finished = false
    let fadeTimer = 0
    let lastPct = -1
    const frame = (now) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.1, Math.max(0.001, (now - last) / 1000))
      last = now
      const elapsed = now - t0
      if (startAt && !sampled) sample()
      if (!reduced) draw(startAt ? (now - startAt) / 1000 : 0)

      let real = 0
      for (const key of Object.keys(WEIGHTS)) if (done[key]) real += WEIGHTS[key]
      real /= 100
      if (elapsed > MAX_MS) real = 1 // a stuck resource never keeps the page hidden
      const timed = startAt ? Math.min(1, (now - startAt) / minMs) : 0
      const target = elapsed > MAX_MS ? 1 : Math.min(real, timed)
      shown += (target - shown) * (1 - Math.exp(-dt / (reduced ? 0.04 : 0.16)))
      if (target >= 1 && shown > 0.995) shown = 1

      const pct = Math.floor(shown * 100)
      if (pct !== lastPct) {
        lastPct = pct
        if (fillRef.current) fillRef.current.style.width = `${shown * 100}%`
        if (pctRef.current) pctRef.current.textContent = `${pct}%`
        trackRef.current?.setAttribute('aria-valuenow', String(pct))
      }

      if (!finished && shown >= 1) {
        finished = true
        endIntro() // Home starts its own entrance as the loader fades
        setLeaving(true)
        fadeTimer = window.setTimeout(onGone, FADE_MS + 60)
      }
    }
    raf = requestAnimationFrame(frame)
    window.addEventListener('resize', resize)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(fadeTimer)
      clearTimeout(fontTimer)
      window.removeEventListener('load', onLoad)
      window.removeEventListener('resize', resize)
      for (const el of hidden) el.inert = false
    }
  }, [onGone, reduced])

  // index of each character among the letters (the space is not one)
  let n = -1

  return (
    <div
      ref={rootRef}
      className={`intro${go ? ' is-go' : ''}${leaving ? ' is-leaving' : ''}${reduced ? ' is-still' : ''}`}
      role="status"
      aria-label="Loading the portfolio"
    >
      <canvas ref={canvasRef} className="intro-canvas" aria-hidden="true" />

      <div className="intro-title" aria-hidden="true">
        <p ref={nameRef} className="intro-name">
          {LETTERS.map((ch, i) => {
            if (ch === ' ') return <span key={i} className="intro-gap" />
            n += 1
            const idx = n
            return (
              <span key={i} ref={(el) => (letterRefs.current[idx] = el)} className="intro-ch" style={{ '--n': idx }}>
                {ch}
              </span>
            )
          })}
        </p>
      </div>

      <div className="intro-bar">
        <div
          ref={trackRef}
          className="intro-track"
          role="progressbar"
          aria-label="Loading"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
        >
          <div ref={fillRef} className="intro-fill" />
        </div>
        <span ref={pctRef} className="intro-pct" aria-hidden="true">
          0%
        </span>
      </div>
    </div>
  )
}
