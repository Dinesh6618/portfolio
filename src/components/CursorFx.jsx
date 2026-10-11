import { useEffect, useRef, useState } from 'react'
import './CursorFx.css'

// Combined cursor effects, drawn on top of the page and never in the way of it (pointer-events: none):
//   trail    tiny glowing gold particles behind the pointer, with the odd brighter spark
//   orbit    during sustained movement, a few particles swirl around the pointer
//   click    expanding golden rings, a brief flash at the centre and a small particle burst
//   glow     the hovered interactive element is lit by one soft gold frame that glides between elements
//
// The golden cursor itself (ring + dot) is CursorRing. Everything here is desktop with a real mouse only; touch
// devices are left alone. With prefers-reduced-motion there is no trail, orbit or ripple: only the hover glow,
// without gliding. One requestAnimationFrame loop draws particles and stops itself when nothing is left to draw.

const GLOW_TARGETS =
  'a[href], button:not(:disabled), summary, [role="button"], [role="option"], .spotlight, .project-card, .filter-chip, .float-chip, .icon-btn'
const TEXT_FIELD = 'input, textarea, select, [contenteditable="true"]'
const MAX_PARTICLES = 170
const MAX_ORBIT = 6
const GOLD = '#D4AF37'
const BRIGHT = '#FFD76A'
const GLOW = 'rgba(255, 190, 50, 0.6)'

const rand = (a, b) => a + Math.random() * (b - a)
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t)

export default function CursorFx() {
  const canvasRef = useRef(null)
  const glowRef = useRef(null)
  const [enabled] = useState(() => window.matchMedia('(hover: hover) and (pointer: fine)').matches)

  useEffect(() => {
    if (!enabled) return undefined
    const canvas = canvasRef.current
    const glow = glowRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !glow || !ctx) return undefined
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

    let W = window.innerWidth
    let H = window.innerHeight
    let dpr = 1
    const resize = () => {
      W = window.innerWidth
      H = window.innerHeight
      dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
    }
    resize()

    // ---- state
    let particles = [] // trail, sparks, burst: { x, y, vx, vy, life, span, r, kind }
    let orbiters = [] // { a, w, r, life, span, size }
    let rings = [] // { x, y, t, span, max, color, width }
    let flashes = [] // { x, y, t }
    let raf = 0
    let last = 0
    let px = -1
    let py = -1
    let pointerX = -100
    let pointerY = -100
    let moving = 0 // seconds of sustained movement
    let lastMoveAt = 0
    let orbitCool = 0
    let inField = false

    const hasWork = () => particles.length || orbiters.length || rings.length || flashes.length

    // ---- drawing
    const draw = (dt) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'lighter'

      // rings
      for (const r of rings) {
        r.t += dt
        if (r.t < 0) continue // a delayed ring has not started yet
        const k = Math.min(1, r.t / r.span)
        const radius = r.max * easeOut(k)
        ctx.globalAlpha = (1 - k) * 0.9
        ctx.strokeStyle = r.color
        ctx.lineWidth = Math.max(0.6, r.width * (1 - k * 0.7))
        ctx.beginPath()
        ctx.arc(r.x, r.y, radius, 0, Math.PI * 2)
        ctx.stroke()
      }
      rings = rings.filter((r) => r.t < r.span)

      // flash
      for (const f of flashes) {
        f.t += dt
        const k = Math.min(1, f.t / 0.3)
        const R = 14 + 34 * easeOut(k)
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, R)
        g.addColorStop(0, 'rgba(255, 244, 200, 0.95)')
        g.addColorStop(0.35, 'rgba(255, 215, 106, 0.55)')
        g.addColorStop(1, 'rgba(255, 190, 50, 0)')
        ctx.globalAlpha = 1 - k
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(f.x, f.y, R, 0, Math.PI * 2)
        ctx.fill()
      }
      flashes = flashes.filter((f) => f.t < 0.3)

      // particles: trail, sparks, burst
      for (const p of particles) {
        p.life += dt / p.span
        const damp = p.kind === 'burst' ? Math.pow(0.04, dt) : Math.pow(0.18, dt)
        p.vx *= damp
        p.vy *= damp
        p.x += p.vx * dt
        p.y += p.vy * dt
        const k = Math.min(1, p.life)
        const a = (1 - k) * (1 - k * 0.3)
        const size = Math.max(0.2, p.r * (1 - k * 0.85))
        if (p.kind === 'spark') {
          ctx.globalAlpha = a
          ctx.strokeStyle = BRIGHT
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05)
          ctx.stroke()
        } else {
          ctx.globalAlpha = a * 0.28
          ctx.fillStyle = GLOW
          ctx.beginPath()
          ctx.arc(p.x, p.y, size * 3, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = a
          ctx.fillStyle = k < 0.45 ? BRIGHT : GOLD
          ctx.beginPath()
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      particles = particles.filter((p) => p.life < 1)

      // orbit: particles circling the pointer
      for (const o of orbiters) {
        o.life += dt / o.span
        o.a += o.w * dt
        const k = Math.min(1, o.life)
        const r = o.r * (1 + 0.25 * Math.sin(k * Math.PI))
        const x = pointerX + Math.cos(o.a) * r
        const y = pointerY + Math.sin(o.a) * r
        const a = Math.sin(Math.PI * k)
        ctx.globalAlpha = a * 0.3
        ctx.fillStyle = GLOW
        ctx.beginPath()
        ctx.arc(x, y, o.size * 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = a
        ctx.fillStyle = BRIGHT
        ctx.beginPath()
        ctx.arc(x, y, o.size, 0, Math.PI * 2)
        ctx.fill()
      }
      orbiters = orbiters.filter((o) => o.life < 1)

      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }

    const tick = (now) => {
      raf = 0
      const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000))
      last = now
      // sustained movement ends when the pointer rests for a moment
      if (now - lastMoveAt > 160) moving = Math.max(0, moving - dt * 2)
      orbitCool -= dt
      draw(dt)
      if (hasWork()) raf = requestAnimationFrame(tick)
      else ctx.clearRect(0, 0, W, H)
    }
    const wake = () => {
      if (!raf) {
        last = performance.now()
        raf = requestAnimationFrame(tick)
      }
    }

    // ---- emitters
    const addParticle = (p) => {
      if (particles.length >= MAX_PARTICLES) particles.shift()
      particles.push(p)
    }

    const onMove = (e) => {
      if (e.pointerType === 'touch') return
      pointerX = e.clientX
      pointerY = e.clientY
      if (reducedQuery.matches || inField) {
        px = e.clientX
        py = e.clientY
        return
      }
      const now = performance.now()
      if (px < 0) {
        px = e.clientX
        py = e.clientY
      }
      const dx = e.clientX - px
      const dy = e.clientY - py
      const dist = Math.hypot(dx, dy)
      if (dist > 0.5) {
        const n = Math.min(3, Math.ceil(dist / 11))
        for (let i = 0; i < n; i++) {
          const t = (i + 1) / n
          const x = px + dx * t
          const y = py + dy * t
          if (Math.random() < 0.07) {
            const a = Math.random() * Math.PI * 2
            const v = rand(70, 170)
            addParticle({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, span: rand(0.28, 0.5), r: 1, kind: 'spark' })
          } else {
            addParticle({
              x: x + rand(-2, 2),
              y: y + rand(-2, 2),
              vx: rand(-16, 16),
              vy: rand(-12, 22),
              life: 0,
              span: rand(0.45, 0.85),
              r: rand(0.9, 2.5),
              kind: 'trail',
            })
          }
        }
        // sustained movement -> an occasional small swirl around the pointer
        const dtMove = Math.min(0.1, (now - lastMoveAt) / 1000)
        moving += dtMove
        lastMoveAt = now
        if (moving > 0.9 && orbitCool <= 0 && orbiters.length < MAX_ORBIT) {
          orbitCool = rand(0.9, 1.7)
          const count = 2 + ((Math.random() * 2) | 0)
          const dir = Math.random() < 0.5 ? 1 : -1
          const a0 = Math.random() * Math.PI * 2
          for (let i = 0; i < count && orbiters.length < MAX_ORBIT; i++) {
            orbiters.push({
              a: a0 + (i * Math.PI * 2) / count,
              w: dir * rand(4.5, 7),
              r: rand(18, 30),
              life: 0,
              span: rand(0.9, 1.35),
              size: rand(1.1, 1.9),
            })
          }
        }
        wake()
      }
      px = e.clientX
      py = e.clientY
    }

    const onDown = (e) => {
      if (e.pointerType === 'touch' || e.button > 0) return
      const target = e.target instanceof Element ? e.target : null
      if (target?.closest(TEXT_FIELD) || reducedQuery.matches) return
      const x = e.clientX
      const y = e.clientY
      flashes.push({ x, y, t: 0 })
      rings.push({ x, y, t: 0, span: 0.7, max: 70, color: BRIGHT, width: 2.2 })
      rings.push({ x, y, t: -0.08, span: 0.85, max: 120, color: GOLD, width: 1.6 })
      rings.push({ x, y, t: -0.17, span: 1, max: 175, color: GLOW, width: 1.1 })
      // negative t delays a ring: it starts drawing at t = 0
      const burst = 14
      for (let i = 0; i < burst; i++) {
        const a = (i / burst) * Math.PI * 2 + rand(-0.2, 0.2)
        const v = rand(90, 230)
        addParticle({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0, span: rand(0.5, 0.9), r: rand(1, 2.3), kind: 'burst' })
      }
      // and a small swirl
      for (let i = 0; i < 3 && orbiters.length < MAX_ORBIT; i++) {
        orbiters.push({ a: (i * Math.PI * 2) / 3, w: 6, r: 20, life: 0, span: 0.8, size: 1.5 })
      }
      pointerX = x
      pointerY = y
      wake()
    }

    // ---- hover glow: one soft gold frame that glides to the hovered interactive element
    let glowTarget = null
    let glowRaf = 0
    const placeGlow = () => {
      glowRaf = 0
      if (!glowTarget || !glowTarget.isConnected) {
        glow.dataset.on = 'false'
        glowTarget = null
        return
      }
      const r = glowTarget.getBoundingClientRect()
      if (r.width < 1 || r.height < 1 || r.bottom < 0 || r.top > H) {
        glow.dataset.on = 'false'
      } else {
        const cs = getComputedStyle(glowTarget)
        glow.style.width = `${r.width}px`
        glow.style.height = `${r.height}px`
        glow.style.transform = `translate3d(${r.left}px, ${r.top}px, 0)`
        glow.style.borderRadius = cs.borderTopLeftRadius === '0px' ? '4px' : cs.borderRadius
        glow.dataset.on = 'true'
      }
      glowRaf = requestAnimationFrame(placeGlow) // follows the element while it moves (hover lift, scroll)
    }
    const setGlowTarget = (el) => {
      if (el === glowTarget) return
      glowTarget = el
      if (!el) {
        glow.dataset.on = 'false'
        cancelAnimationFrame(glowRaf)
        glowRaf = 0
        return
      }
      // the very first placement should not glide in from the corner
      glow.dataset.fresh = glow.dataset.on === 'true' ? 'false' : 'true'
      cancelAnimationFrame(glowRaf)
      placeGlow()
    }
    const onOver = (e) => {
      if (e.pointerType === 'touch') return
      const target = e.target instanceof Element ? e.target : null
      inField = !!target?.closest(TEXT_FIELD)
      if (!target || document.querySelector('dialog[open]')) return setGlowTarget(null)
      let el = target.closest(GLOW_TARGETS)
      // very large containers (the whole hero grid, etc.) are not glow targets
      if (el) {
        const r = el.getBoundingClientRect()
        if (r.width > W * 0.82 && r.height > H * 0.7) el = null
      }
      setGlowTarget(el)
    }
    const onOut = (e) => {
      if (!e.relatedTarget) setGlowTarget(null)
    }

    const onReducedChange = () => {
      if (reducedQuery.matches) {
        particles = []
        orbiters = []
        rings = []
        flashes = []
        ctx.clearRect(0, 0, W, H)
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerover', onOver, { passive: true })
    document.addEventListener('pointerout', onOut)
    window.addEventListener('resize', resize)
    reducedQuery.addEventListener('change', onReducedChange)

    return () => {
      cancelAnimationFrame(raf)
      cancelAnimationFrame(glowRaf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerout', onOut)
      window.removeEventListener('resize', resize)
      reducedQuery.removeEventListener('change', onReducedChange)
    }
  }, [enabled])

  if (!enabled) return null
  return (
    <>
      <div ref={glowRef} className="hover-glow" aria-hidden="true" data-on="false" data-fresh="true" />
      <canvas ref={canvasRef} className="cursor-fx" aria-hidden="true" />
    </>
  )
}
