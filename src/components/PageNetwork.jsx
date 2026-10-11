import { useEffect, useRef } from 'react'

const MIN_NODES = 30
const MAX_NODES = 80
const AREA_PER_NODE = 14000 // px² of viewport per node
const LINK_DISTANCE = 170 // px (scaled down on narrow screens)
const PULSES = 9
const SCROLL_PARALLAX = 0.16 // the network drifts a little as the page scrolls
const FRAME_MS = 1000 / 30 // a slow-moving background needs no more than 30 fps
const LINK_BUCKETS = 5 // links are stroked in a few batches by brightness, not one by one

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))

// A neural network behind the whole page: gold nodes wander slowly, link to near neighbours, pass signal
// pulses along the links and reach toward the pointer. One fixed canvas, purely decorative (aria-hidden, no
// pointer events, behind all content). It pauses when the tab is hidden and is drawn once, without motion,
// when the visitor prefers reduced motion.
export default function PageNetwork() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return undefined

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finePointer = window.matchMedia('(pointer: fine)').matches
    const pointer = { x: -9999, y: -9999, on: false }

    let w = 0
    let h = 0
    let link = LINK_DISTANCE
    let nodes = []
    let pulses = []
    let raf = 0
    let running = false
    let last = 0

    // where a node is drawn: its own position, shifted by the scroll with vertical wrap-around
    const drawY = (n) => (((n.y - window.scrollY * SCROLL_PARALLAX) % h) + h) % h

    const spawnPulse = () => {
      for (let tries = 0; tries < 12; tries++) {
        const a = Math.floor(Math.random() * nodes.length)
        const near = []
        for (let b = 0; b < nodes.length; b++) {
          if (b !== a && Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y) < link) near.push(b)
        }
        if (near.length) return { a, b: near[Math.floor(Math.random() * near.length)], t: 0, speed: 0.35 + Math.random() * 0.5 }
      }
      return { a: 0, b: 0, t: 1, speed: 1 }
    }

    const seed = () => {
      link = LINK_DISTANCE * clamp(w / 900, 0.62, 1)
      const cap = w < 600 ? 48 : MAX_NODES
      const count = clamp(Math.round((w * h) / AREA_PER_NODE), MIN_NODES, cap)
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 16, // px per second
        vy: (Math.random() - 0.5) * 16,
        r: 1 + Math.random() * 1.6,
        dy: 0,
      }))
      pulses = Array.from({ length: PULSES }, spawnPulse)
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const nw = Math.max(1, window.innerWidth)
      const nh = Math.max(1, window.innerHeight)
      // phones: the address bar changes innerHeight while scrolling; ignore small height changes
      if (nodes.length && nw === w && Math.abs(nh - h) < 160) return
      const first = !nodes.length
      const sx = first ? 1 : nw / w
      const sy = first ? 1 : nh / h
      w = nw
      h = nh
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (first) seed()
      else {
        for (const n of nodes) {
          n.x *= sx
          n.y *= sy
        }
      }
      draw()
    }

    const step = (dt) => {
      for (const n of nodes) {
        n.x += n.vx * dt
        n.y += n.vy * dt
        if (n.x < 0 || n.x > w) n.vx *= -1
        n.x = clamp(n.x, 0, w)
        n.y = ((n.y % h) + h) % h
      }
      for (let i = 0; i < pulses.length; i++) {
        const p = pulses[i]
        p.t += p.speed * dt
        if (p.t >= 1) pulses[i] = spawnPulse()
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h)
      for (const n of nodes) n.dy = drawY(n)

      // links: one path per brightness bucket
      const buckets = Array.from({ length: LINK_BUCKETS }, () => new Path2D())
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const dx = a.x - b.x
          const dy = a.dy - b.dy
          if (dx > link || dx < -link || dy > link || dy < -link) continue
          const d = Math.hypot(dx, dy)
          if (d >= link) continue
          const k = 1 - d / link
          const path = buckets[Math.min(LINK_BUCKETS - 1, Math.floor(k * k * LINK_BUCKETS * 1.15))]
          path.moveTo(a.x, a.dy)
          path.lineTo(b.x, b.dy)
        }
      }
      ctx.lineWidth = 1
      for (let q = 0; q < LINK_BUCKETS; q++) {
        ctx.strokeStyle = `rgba(212, 175, 55, ${0.06 + 0.26 * ((q + 0.5) / LINK_BUCKETS)})`
        ctx.stroke(buckets[q])
      }

      // links to the pointer
      if (pointer.on) {
        ctx.strokeStyle = 'rgba(255, 215, 106, 0.4)'
        ctx.beginPath()
        for (const n of nodes) {
          if (Math.hypot(n.x - pointer.x, n.dy - pointer.y) < link * 1.3) {
            ctx.moveTo(n.x, n.dy)
            ctx.lineTo(pointer.x, pointer.y)
          }
        }
        ctx.stroke()
      }

      for (const p of pulses) {
        if (p.t >= 1) continue
        const a = nodes[p.a]
        const b = nodes[p.b]
        if (Math.hypot(a.x - b.x, a.dy - b.dy) >= link * 1.2) continue
        const x = a.x + (b.x - a.x) * p.t
        const y = a.dy + (b.dy - a.dy) * p.t
        ctx.fillStyle = 'rgba(255, 233, 160, 0.9)'
        ctx.beginPath()
        ctx.arc(x, y, 2.2, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(242, 207, 91, 0.16)'
        ctx.beginPath()
        ctx.arc(x, y, 7, 0, Math.PI * 2)
        ctx.fill()
      }

      // nodes: all in one fill, the ones near the pointer a little brighter and larger
      ctx.fillStyle = 'rgba(242, 207, 91, 0.5)'
      ctx.beginPath()
      for (const n of nodes) {
        ctx.moveTo(n.x + n.r, n.dy)
        ctx.arc(n.x, n.dy, n.r, 0, Math.PI * 2)
      }
      ctx.fill()
      if (pointer.on) {
        ctx.fillStyle = 'rgba(255, 215, 106, 0.9)'
        ctx.beginPath()
        for (const n of nodes) {
          if (Math.hypot(n.x - pointer.x, n.dy - pointer.y) < link * 0.7) {
            ctx.moveTo(n.x + n.r * 1.6, n.dy)
            ctx.arc(n.x, n.dy, n.r * 1.6, 0, Math.PI * 2)
          }
        }
        ctx.fill()
      }
    }

    let acc = 0
    const tick = (now) => {
      raf = requestAnimationFrame(tick)
      const elapsed = now - last
      last = now
      acc += elapsed
      if (acc < FRAME_MS) return
      const dt = clamp(acc / 1000, 0.001, 0.1)
      acc = 0
      // keep the page transitions smooth: the background simply holds still while one plays
      if (document.documentElement.classList.contains('pt-running')) return
      step(dt)
      draw()
    }

    const start = () => {
      if (running || motion.matches || document.hidden) return
      running = true
      last = performance.now()
      acc = 0
      raf = requestAnimationFrame(tick)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    const onMove = (event) => {
      pointer.x = event.clientX
      pointer.y = event.clientY
      pointer.on = true
      if (motion.matches) draw()
    }
    const onLeave = () => {
      pointer.on = false
      if (motion.matches) draw()
    }
    const onScroll = () => {
      if (motion.matches) draw()
    }
    const onVisibility = () => (document.hidden ? stop() : start())
    const onMotion = () => {
      if (motion.matches) {
        stop()
        draw()
      } else {
        start()
      }
    }

    window.addEventListener('resize', resize)
    window.addEventListener('scroll', onScroll, { passive: true })
    if (finePointer) {
      window.addEventListener('pointermove', onMove, { passive: true })
      document.documentElement.addEventListener('pointerleave', onLeave)
    }
    document.addEventListener('visibilitychange', onVisibility)
    motion.addEventListener('change', onMotion)
    resize()
    start()

    return () => {
      stop()
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      motion.removeEventListener('change', onMotion)
    }
  }, [])

  return <canvas ref={canvasRef} className="page-network" aria-hidden="true" />
}
