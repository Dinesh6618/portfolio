import { useEffect, useRef } from 'react'
import { initTransitions } from '../lib/transitions.js'

// Full-screen canvas used by the section transitions (src/lib/transitions.js). It is hidden at rest, never takes
// pointer events and is removed by a watchdog if a transition is ever interrupted.
export default function PageTransitions() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    return initTransitions(canvas)
  }, [])

  return <canvas ref={canvasRef} className="pt-canvas" aria-hidden="true" />
}
