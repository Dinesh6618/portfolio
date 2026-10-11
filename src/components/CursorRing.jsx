import { useEffect, useRef } from 'react'
import './CursorRing.css'

// What the ring grows over.
const INTERACTIVE = 'a[href], button, summary, label[for], [role="button"], [role="option"], .project-card, .filter-chip'
const TEXT_FIELD = 'input, textarea, select, [contenteditable="true"]'

// A thin round gold ring that follows the mouse. Desktop with a real hover-capable mouse only; touch devices
// are left alone. The native pointer is hidden while the ring is active, except over text fields and while a
// dialog is open (dialogs live in the browser's top layer, above anything this component could draw).
export default function CursorRing() {
  const ringRef = useRef(null)
  const dotRef = useRef(null)

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)')
    const ring = ringRef.current
    const dot = dotRef.current
    if (!ring || !dot || !fine.matches) return undefined
    const root = document.documentElement
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

    let x = -100
    let y = -100
    let rx = -100
    let ry = -100
    let scale = 1
    let raf = 0
    let seen = false
    let state = 'idle' // idle | link | name | field

    const apply = () => {
      ring.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0) scale(${scale})`
    }

    const loop = () => {
      raf = 0
      const k = reduced.matches ? 1 : 0.28
      rx += (x - rx) * k
      ry += (y - ry) * k
      apply()
      if (Math.abs(x - rx) > 0.1 || Math.abs(y - ry) > 0.1) raf = requestAnimationFrame(loop)
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop)
    }

    const classify = (target) => {
      if (!(target instanceof Element)) return 'idle'
      if (target.closest(TEXT_FIELD)) return 'field'
      if (target.closest('.hero-title')) return 'name'
      if (target.closest(INTERACTIVE)) return 'link'
      return 'idle'
    }

    const setState = (next) => {
      if (next === state) return
      state = next
      ring.dataset.state = next
      dot.dataset.state = next
      scale = next === 'link' ? 1.55 : next === 'name' ? 1.3 : 1
      apply()
    }

    const onMove = (e) => {
      if (e.pointerType === 'touch') return
      x = e.clientX
      y = e.clientY
      // the dot sits exactly on the pointer, with no delay; the ring eases after it
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`
      if (!seen) {
        seen = true
        rx = x
        ry = y
        root.classList.add('has-cursor-ring')
        ring.dataset.visible = 'true'
        dot.dataset.visible = 'true'
      }
      setState(classify(e.target))
      kick()
    }
    const onLeave = () => {
      ring.dataset.visible = 'false'
      dot.dataset.visible = 'false'
    }
    const onEnter = () => {
      if (seen) {
        ring.dataset.visible = 'true'
        dot.dataset.visible = 'true'
      }
    }
    const onDown = () => {
      ring.dataset.pressed = 'true'
      dot.dataset.pressed = 'true'
    }
    const onUp = () => {
      ring.dataset.pressed = 'false'
      dot.dataset.pressed = 'false'
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    document.addEventListener('pointerenter', onEnter)
    window.addEventListener('pointerdown', onDown, { passive: true })
    window.addEventListener('pointerup', onUp, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      root.classList.remove('has-cursor-ring')
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
      document.removeEventListener('pointerenter', onEnter)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  return (
    <>
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" data-visible="false" data-state="idle" />
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" data-visible="false" data-state="idle" />
    </>
  )
}
