import { useEffect, useRef } from 'react'

const LINK_DISTANCE = 150
const POINTER_DISTANCE = 170

// Subtle "neural network" of drifting, connected nodes behind the hero.
// Pauses when off-screen / tab hidden and renders a single static frame for reduced motion.
export default function NeuralBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return undefined

    const host = canvas.parentElement
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const pointer = { x: -9999, y: -9999 }
    let nodes = []
    let width = 0
    let height = 0
    let frame = 0
    let running = false
    let inView = true

    const seed = () => {
      const count = Math.max(22, Math.min(64, Math.round((width * height) / 20000)))
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: 1 + Math.random() * 1.8,
        blue: Math.random() < 0.45,
      }))
    }

    const draw = (animate) => {
      ctx.clearRect(0, 0, width, height)

      if (animate) {
        for (const n of nodes) {
          n.x += n.vx
          n.y += n.vy
          if (n.x < 0 || n.x > width) n.vx *= -1
          if (n.y < 0 || n.y > height) n.vy *= -1
        }
      }

      ctx.lineWidth = 1
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < LINK_DISTANCE) {
            ctx.strokeStyle = `rgba(212, 175, 55, ${(1 - d / LINK_DISTANCE) * 0.26})`
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
        const pd = Math.hypot(a.x - pointer.x, a.y - pointer.y)
        if (pd < POINTER_DISTANCE) {
          ctx.strokeStyle = `rgba(242, 207, 91, ${(1 - pd / POINTER_DISTANCE) * 0.6})`
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(pointer.x, pointer.y)
          ctx.stroke()
        }
      }

      for (const n of nodes) {
        ctx.fillStyle = n.blue ? 'rgba(242, 207, 91, 0.9)' : 'rgba(212, 175, 55, 0.8)'
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
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
      const rect = host.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      seed()
      draw(false)
    }

    const onPointerMove = (event) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
      if (motion.matches) draw(false)
    }
    const onPointerLeave = () => {
      pointer.x = -9999
      pointer.y = -9999
      if (motion.matches) draw(false)
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
    resizeObserver.observe(host)
    const viewObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      if (inView) start()
      else stop()
    })
    viewObserver.observe(host)

    host.addEventListener('pointermove', onPointerMove)
    host.addEventListener('pointerleave', onPointerLeave)
    document.addEventListener('visibilitychange', onVisibility)
    motion.addEventListener('change', onMotionChange)

    resize()
    start()

    return () => {
      stop()
      resizeObserver.disconnect()
      viewObserver.disconnect()
      host.removeEventListener('pointermove', onPointerMove)
      host.removeEventListener('pointerleave', onPointerLeave)
      document.removeEventListener('visibilitychange', onVisibility)
      motion.removeEventListener('change', onMotionChange)
    }
  }, [])

  return <canvas ref={canvasRef} className="neural-canvas" aria-hidden="true" />
}
