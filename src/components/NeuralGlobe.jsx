import { useEffect, useRef } from 'react'

const NODES = 86
const LINK_DISTANCE = 0.56 // in unit-sphere units: roughly 3-5 neighbours per node
const CAMERA = 3.2
const PULSES = 7

// Points spread evenly over a sphere (Fibonacci lattice) and the links between near neighbours.
function buildGlobe() {
  const golden = Math.PI * (3 - Math.sqrt(5))
  const points = Array.from({ length: NODES }, (_, i) => {
    const y = 1 - (i / (NODES - 1)) * 2
    const r = Math.sqrt(1 - y * y)
    return { x: Math.cos(i * golden) * r, y, z: Math.sin(i * golden) * r }
  })
  const edges = []
  for (let i = 0; i < NODES; i++) {
    for (let j = i + 1; j < NODES; j++) {
      const a = points[i]
      const b = points[j]
      if (Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < LINK_DISTANCE) edges.push([i, j])
    }
  }
  return { points, edges }
}

// A small hand-rolled 3D renderer: a slowly rotating neural globe with perspective, depth shading
// and signal pulses. Scrolling spins it, the pointer tilts it. No WebGL or extra dependency.
export default function NeuralGlobe() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return undefined

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finePointer = window.matchMedia('(pointer: fine)').matches
    const { points, edges } = buildGlobe()
    const view = points.map(() => ({ x: 0, y: 0, s: 1, t: 0 }))
    const pulses = Array.from({ length: PULSES }, () => ({
      edge: Math.floor(Math.random() * edges.length),
      t: Math.random(),
      speed: 0.006 + Math.random() * 0.008,
      from: Math.random() < 0.5 ? 0 : 1,
    }))
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 }

    let width = 0
    let height = 0
    let spin = 0.6
    let frame = 0
    let running = false
    let inView = true

    const draw = (animate) => {
      if (animate) {
        spin += 0.0026
        mouse.x += (mouse.tx - mouse.x) * 0.05
        mouse.y += (mouse.ty - mouse.y) * 0.05
      }
      const yaw = spin + mouse.x * 0.55 + window.scrollY * 0.0011
      const pitch = 0.34 + mouse.y * 0.32
      const cy = Math.cos(yaw)
      const sy = Math.sin(yaw)
      const cp = Math.cos(pitch)
      const sp = Math.sin(pitch)
      const radius = Math.min(width, height) * 0.46

      for (let i = 0; i < NODES; i++) {
        const p = points[i]
        const x1 = p.x * cy + p.z * sy
        const z1 = -p.x * sy + p.z * cy
        const y2 = p.y * cp - z1 * sp
        const z2 = p.y * sp + z1 * cp
        const s = CAMERA / (CAMERA - z2)
        const v = view[i]
        v.x = width / 2 + x1 * radius * s
        v.y = height / 2 + y2 * radius * s
        v.s = s
        v.t = (z2 + 1) / 2 // 0 = far side, 1 = facing the viewer
      }

      ctx.clearRect(0, 0, width, height)

      ctx.lineWidth = 1
      for (const [i, j] of edges) {
        const a = view[i]
        const b = view[j]
        const t = (a.t + b.t) / 2
        ctx.strokeStyle = `rgba(212, 175, 55, ${0.03 + 0.3 * t * t})`
        ctx.beginPath()
        ctx.moveTo(a.x, a.y)
        ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }

      if (animate) {
        for (const pulse of pulses) {
          pulse.t += pulse.speed
          if (pulse.t >= 1) {
            pulse.edge = Math.floor(Math.random() * edges.length)
            pulse.t = 0
            pulse.from = Math.random() < 0.5 ? 0 : 1
          }
          const [i, j] = edges[pulse.edge]
          const a = view[pulse.from ? j : i]
          const b = view[pulse.from ? i : j]
          const t = (a.t + b.t) / 2
          ctx.fillStyle = `rgba(255, 233, 160, ${0.25 + 0.75 * t})`
          ctx.beginPath()
          ctx.arc(a.x + (b.x - a.x) * pulse.t, a.y + (b.y - a.y) * pulse.t, 1.4 + 1.8 * t, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      const order = view.map((_, i) => i).sort((a, b) => view[a].t - view[b].t)
      for (const i of order) {
        const v = view[i]
        const r = (0.9 + 2.3 * v.t) * v.s
        if (v.t > 0.72) {
          ctx.fillStyle = `rgba(242, 207, 91, ${(v.t - 0.72) * 0.45})`
          ctx.beginPath()
          ctx.arc(v.x, v.y, r * 2.6, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.fillStyle = `rgba(242, 207, 91, ${0.2 + 0.8 * v.t})`
        ctx.beginPath()
        ctx.arc(v.x, v.y, r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    const loop = () => {
      draw(true)
      frame = requestAnimationFrame(loop)
    }
    const start = () => {
      if (running || motion.matches || !inView || document.hidden) return
      running = true
      frame = requestAnimationFrame(loop)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(frame)
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      draw(false)
    }

    const onPointerMove = (event) => {
      mouse.tx = (event.clientX / window.innerWidth - 0.5) * 2
      mouse.ty = (event.clientY / window.innerHeight - 0.5) * 2
    }
    const onVisibility = () => (document.hidden ? stop() : start())
    const onMotionChange = () => {
      if (motion.matches) {
        stop()
        draw(false)
      } else {
        start()
      }
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    const viewObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      if (inView) start()
      else stop()
    })
    viewObserver.observe(canvas)

    if (finePointer) window.addEventListener('pointermove', onPointerMove, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    motion.addEventListener('change', onMotionChange)

    resize()
    start()

    return () => {
      stop()
      resizeObserver.disconnect()
      viewObserver.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('visibilitychange', onVisibility)
      motion.removeEventListener('change', onMotionChange)
    }
  }, [])

  return <canvas ref={canvasRef} className="globe-canvas" aria-hidden="true" />
}
