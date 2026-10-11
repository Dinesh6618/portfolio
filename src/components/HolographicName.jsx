import { useEffect, useRef } from 'react'
import useFitText from '../hooks/useFitText.js'
import useDecode from '../hooks/useDecode.js'
import { LETTER_GLYPHS } from '../lib/decode.js'
import './HolographicName.css'

const TITLE = 'DINESH G'
const TOUCH_HOLD_MS = 3400
const LENS_RADIUS = 0.5 // em: the light around the cursor (the spread itself is unlimited, see reachRadius)
const OPEN_SECONDS = 0.9 // the hologram spreads out from the cursor as a wave until it has filled the whole name
const CLOSE_SECONDS = 0.45 // and closes again
const RIPPLE_SECONDS = 1.7 // one ripple travels from the cursor to the edge of the circle

const BLOB_POINTS = 40 // vertices of the spreading blob outline
const BLOB_STRETCH = 1.25 // the blob spreads wider than it is tall, like a puddle of light
const RIM_EM = 0.012 // width of the glowing rim, in em (min 3px)

const easeOut = (t) => 1 - (1 - t) * (1 - t)

// radius of the living edge at angle theta: three slow waves of different frequency
const edge = (theta, t) =>
  1 + 0.08 * Math.sin(3 * theta + t * 1.3) + 0.05 * Math.sin(5 * theta - t * 1.9 + 1.7) + 0.03 * Math.sin(8 * theta + t * 2.6 + 0.6)

// closed polygon (as an SVG path piece) of the blob, in the coordinates of one letter box
function blobPath(cx, cy, rad, t) {
  let d = ''
  for (let i = 0; i < BLOB_POINTS; i++) {
    const a = (i / BLOB_POINTS) * Math.PI * 2
    const r = rad * edge(a, t)
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * r * BLOB_STRETCH).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`
  }
  return `${d}Z`
}

// The hero name as a holographic code lens.
//
// The name is always real, selectable ivory text. Where the cursor is, a round area opens (as a wave spreading
// out from the pointer) and inside that circle the letters become a gold hologram filled with scrolling code,
// with scanlines, a thin gold outline and ripple rings travelling out to the edge of the circle. Outside the
// circle the name stays plain ivory. Everything is drawn by aria-hidden duplicate layers of the same glyph,
// masked by the circle and clipped to the glyph (background-clip: text), so it never leaves the letter shapes:
//   .ch-holo--code   code texture + scanlines
//   .ch-holo--edge   a very thin gold outline
//   .ch-holo--beam   the ripple rings
//   .ch-holo--spot   a soft light at the cursor
//
// The circle follows the pointer smoothly. One small requestAnimationFrame loop does this and only runs while
// the circle is open or closing. The hover target is the heading itself, so the gap between DINESH and G is
// not a dead zone.
export default function HolographicName() {
  const boxRef = useRef(null)
  const textRef = useRef(null)

  // the name spans its column at every viewport, and its letters decode in on load
  useFitText(boxRef, textRef)
  useDecode(boxRef, { delay: 250, step: 95, duration: 760, charset: LETTER_GLYPHS })

  useEffect(() => {
    const box = boxRef.current
    const text = textRef.current
    if (!box || !text) return undefined
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')

    const src = { hover: false, focus: false, touch: false }
    const pointer = { x: 0, y: 0, mode: 'none' } // client coords; 'auto' = self-sweeping (keyboard)
    let touchTimer = 0
    let raf = 0
    let running = false
    let last = 0
    let open = 0 // 0 closed .. 1 fully open (linear; eased when applied)
    let lit = 0
    let phase = 0
    let curX = 0
    let curY = 0
    let hasCursor = false
    let autoT0 = 0
    let lastMode = 'none'
    let W = 1
    let H = 1
    let fs = 100
    let clock = 0 // seconds, drives the slow wobble of the edge
    let letters = [] // { el, x, w } per letter, x = left offset inside the name

    const on = () => src.hover || src.focus || src.touch
    const setVar = (name, value) => box.style.setProperty(name, value)
    // Unlimited spread: the radius that carries the (wavy, stretched) edge past the farthest corner of the name from
    // the cursor, wherever the cursor is. The thinnest part of the edge is about 0.84 of the mean radius.
    const radiusMax = () => {
      const dx = Math.max(curX, W - curX)
      const dy = Math.max(curY, H - curY)
      return Math.max(56, dx / (BLOB_STRETCH * 0.84), dy / 0.84) + 10
    }
    const lightRadius = () => Math.max(56, fs * LENS_RADIUS)

    function measure() {
      const base = text.getBoundingClientRect()
      W = Math.max(1, base.width)
      H = Math.max(1, base.height)
      fs = parseFloat(getComputedStyle(text).fontSize) || 100
      letters = [...text.querySelectorAll('.ch')].map((el) => {
        const r = el.getBoundingClientRect()
        const x = r.left - base.left
        el.style.setProperty('--lx', `${x.toFixed(1)}px`)
        return { el, x, w: r.width }
      })
      setVar('--spot-r', `${(lightRadius() * 0.8).toFixed(0)}px`)
    }

    // The spreading blob, as clip paths per letter (each letter box has its own origin):
    //   --cp-in    the blob: the hologram layers are clipped to it
    //   --cp-out   everything except the blob: the real ivory letter is clipped to it
    //   --cp-rim   a thin band along the blob's edge: the glowing gold rim
    // Letters the blob does not touch keep the defaults (hologram hidden, ivory letter whole).
    function shape(rad, t) {
      const rim = Math.max(3, fs * RIM_EM)
      const reach = rad * 1.2 * BLOB_STRETCH + 4
      for (const { el, x, w } of letters) {
        const s = el.style
        if (rad < 1 || x > curX + reach || x + w < curX - reach) {
          s.removeProperty('--cp-in')
          s.removeProperty('--cp-out')
          s.removeProperty('--cp-rim')
          continue
        }
        const cx = curX - x
        const outer = blobPath(cx, curY, rad, t)
        s.setProperty('--cp-in', `path("${outer}")`)
        s.setProperty('--cp-out', `path(evenodd,"M-9000 -9000H9000V9000H-9000Z${outer}")`)
        s.setProperty('--cp-rim', `path(evenodd,"${outer}${blobPath(cx, curY, Math.max(0.5, rad - rim), t)}")`)
      }
    }

    function paint(withRipples) {
      const e = easeOut(open)
      const rad = e <= 0.0005 ? -14 : e * radiusMax()
      shape(rad, clock)
      setVar('--mx', `${curX.toFixed(1)}px`)
      setVar('--my', `${curY.toFixed(1)}px`)
      setVar('--rad', `${rad.toFixed(1)}px`)
      setVar('--lit', lit.toFixed(3))
      setVar('--spot', (lit * e).toFixed(3))
      if (withRipples) {
        const p1 = phase
        const p2 = (phase + 0.5) % 1
        setVar('--w1', `${(p1 * rad).toFixed(1)}px`)
        setVar('--w2', `${(p2 * rad).toFixed(1)}px`)
        setVar('--a1', ((1 - p1) * 0.85 * e).toFixed(3))
        setVar('--a2', ((1 - p2) * 0.85 * e).toFixed(3))
      } else {
        setVar('--a1', '0')
        setVar('--a2', '0')
      }
      box.classList.toggle('is-holo', open > 0.001 || lit > 0.004)
    }

    // cursor position inside the name for the current input mode
    function followCursor(now, dt) {
      const base = text.getBoundingClientRect()
      if (pointer.mode !== lastMode) {
        lastMode = pointer.mode
        autoT0 = now
      }
      let tx = curX
      let ty = curY
      if (pointer.mode === 'mouse') {
        tx = pointer.x - base.left
        ty = pointer.y - base.top
      } else if (pointer.mode === 'auto') {
        tx = W * (0.06 + 0.88 * (0.5 - 0.5 * Math.cos((now - autoT0) / 2300)))
        ty = H * 0.5
      }
      if (!hasCursor) {
        curX = tx
        curY = ty
        hasCursor = true
      }
      const follow = 1 - Math.exp(-dt / 0.06)
      curX += (tx - curX) * follow
      curY += (ty - curY) * follow
    }

    // reduced motion: the circle is shown at once where the pointer is, with no waves, scrolling or easing
    function settleStatic() {
      const base = text.getBoundingClientRect()
      if (pointer.mode === 'mouse') {
        curX = pointer.x - base.left
        curY = pointer.y - base.top
      } else if (pointer.mode !== 'none') {
        curX = W / 2
        curY = H / 2
      }
      open = on() ? 1 : 0
      lit = open
      const e = open
      setVar('--mx', `${curX.toFixed(1)}px`)
      setVar('--my', `${curY.toFixed(1)}px`)
      setVar('--rad', `${(e ? radiusMax() : -14).toFixed(1)}px`)
      setVar('--lit', lit.toFixed(0))
      setVar('--spot', '0')
      setVar('--a1', '0')
      setVar('--a2', '0')
      shape(open ? radiusMax() : 0, 0)
      box.classList.toggle('is-holo', open > 0)
    }

    function tick(now) {
      raf = 0
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000))
      last = now
      const active = on()

      followCursor(now, dt)
      open += Math.max(-dt / CLOSE_SECONDS, Math.min(dt / OPEN_SECONDS, (active ? 1 : 0) - open))
      lit += ((active ? 1 : 0) - lit) * (1 - Math.exp(-dt / (active ? 0.18 : 0.14)))
      phase = (phase + dt / RIPPLE_SECONDS) % 1
      clock += dt

      // fully closed: stop the loop (nothing runs while idle)
      if (!active && open <= 0.0005 && lit < 0.004) {
        open = 0
        lit = 0
        paint(false)
        running = false
        return
      }
      paint(true)
      raf = requestAnimationFrame(tick)
    }

    function wake() {
      if (motion.matches) {
        settleStatic()
        return
      }
      if (!running) {
        running = true
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }

    // ---- inputs: all on the heading, so the space between DINESH and G is not a dead zone
    const track = (e) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
    }
    const settleMode = () => {
      if (!src.hover && !src.touch) pointer.mode = src.focus ? 'auto' : 'none'
    }
    const onEnter = (e) => {
      if (e.pointerType === 'touch') return
      track(e)
      pointer.mode = 'mouse'
      src.hover = true
      wake()
    }
    const onMove = (e) => {
      if (e.pointerType === 'touch') return
      track(e)
      if (pointer.mode !== 'mouse') pointer.mode = 'mouse'
      if (motion.matches) settleStatic()
    }
    const onLeave = (e) => {
      if (e.pointerType === 'touch') return
      src.hover = false
      settleMode()
      wake()
    }
    const onDown = (e) => {
      if (e.pointerType !== 'touch') return
      track(e)
      pointer.mode = 'mouse'
      src.touch = true
      clearTimeout(touchTimer)
      touchTimer = setTimeout(() => {
        src.touch = false
        settleMode()
        wake()
      }, TOUCH_HOLD_MS)
      wake()
    }
    // only keyboard focus counts: a tap or click also focuses the heading but must not pin the effect on
    const onFocus = (e) => {
      if (!e.currentTarget.matches(':focus-visible')) return
      src.focus = true
      if (!src.hover && !src.touch) pointer.mode = 'auto'
      wake()
    }
    const onBlur = () => {
      src.focus = false
      settleMode()
      wake()
    }

    box.addEventListener('pointerenter', onEnter)
    box.addEventListener('pointermove', onMove, { passive: true })
    box.addEventListener('pointerleave', onLeave)
    box.addEventListener('pointerdown', onDown, { passive: true })
    box.addEventListener('focus', onFocus)
    box.addEventListener('blur', onBlur)

    measure()
    paint(false)
    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(text)
    document.fonts?.ready.then(measure)
    const onMotion = () => {
      if (motion.matches) {
        running = false
        cancelAnimationFrame(raf)
        settleStatic()
      } else if (on() || open > 0 || lit > 0.004) {
        wake()
      }
    }
    motion.addEventListener('change', onMotion)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(touchTimer)
      resizeObserver.disconnect()
      motion.removeEventListener('change', onMotion)
      box.removeEventListener('pointerenter', onEnter)
      box.removeEventListener('pointermove', onMove)
      box.removeEventListener('pointerleave', onLeave)
      box.removeEventListener('pointerdown', onDown)
      box.removeEventListener('focus', onFocus)
      box.removeEventListener('blur', onBlur)
    }
  }, [])

  return (
    <h1 ref={boxRef} className="hero-title holographic" tabIndex={0}>
      <span className="sr-only">{TITLE}</span>
      <span ref={textRef} className="title-fit" aria-hidden="true">
        {[...TITLE].map((char, i) =>
          char === ' ' ? (
            <span key={i} className="ch-gap" />
          ) : (
            <span key={i} className="ch" style={{ '--i': i }} data-decode>
              <span className="ch-face" data-decode-text>
                {char}
              </span>
              <span className="ch-holo ch-holo--code">{char}</span>
              <span className="ch-holo ch-holo--edge">{char}</span>
              <span className="ch-holo ch-holo--beam">{char}</span>
              <span className="ch-holo ch-holo--rim">{char}</span>
              <span className="ch-holo ch-holo--spot">{char}</span>
              <span className="ch-x" aria-hidden="true">
                <span data-decode-r />
                <span className="ch-xs" data-decode-s />
              </span>
            </span>
          ),
        )}
      </span>
    </h1>
  )
}
