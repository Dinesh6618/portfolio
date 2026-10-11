import { useLayoutEffect } from 'react'

// Sizes `textRef` so its single line of text is exactly as wide as `boxRef`.
// Measures at a large probe size (precise), then scales; re-runs on resize and when web fonts finish loading.
// If the page is not laid out yet (zero width), it keeps the previous size and tries again on the next frame,
// so the text can never be left stuck at the probe size.
export default function useFitText(boxRef, textRef) {
  useLayoutEffect(() => {
    const box = boxRef.current
    const text = textRef.current
    if (!box || !text) return undefined

    const PROBE = 1000
    let lastWidth = -1
    let retry = 0
    let tries = 0

    const fit = (force = false) => {
      const available = box.clientWidth
      if (!force && available === lastWidth) return
      const previous = text.style.fontSize
      text.style.fontSize = `${PROBE}px`
      const natural = text.getBoundingClientRect().width
      if (natural > 0 && available > 0) {
        text.style.fontSize = `${((available / natural) * PROBE).toFixed(2)}px`
        lastWidth = available
        tries = 0
      } else {
        text.style.fontSize = previous
        if (tries++ < 20) {
          cancelAnimationFrame(retry)
          retry = requestAnimationFrame(() => fit(true))
        }
      }
    }

    const onFontsReady = () => fit(true)
    fit(true)

    const observer = new ResizeObserver(() => fit())
    observer.observe(box)
    document.fonts?.ready.then(onFontsReady)
    document.fonts?.addEventListener?.('loadingdone', onFontsReady)

    return () => {
      cancelAnimationFrame(retry)
      observer.disconnect()
      document.fonts?.removeEventListener?.('loadingdone', onFontsReady)
    }
  }, [boxRef, textRef])
}
