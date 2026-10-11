import { useLayoutEffect } from 'react'
import { cancelDecode, startDecode } from '../lib/decode.js'
import { whenIntroDone } from '../lib/intro.js'

// Decodes every [data-decode] host under `ref` once, when the block first scrolls into view.
// Hosts stay plain visible text if reduced motion is on or the effect is torn down.
export default function useDecode(ref, { delay = 0, step, duration = 540, charset, threshold = 0.15 } = {}) {
  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const hosts = [...root.querySelectorAll('[data-decode]')]
    if (!hosts.length) return undefined

    // Set before the first paint so there is no flash of final text.
    for (const host of hosts) host.dataset.s = 'pending'

    let started = false
    let observer = null
    let cancelWait = () => {}
    const run = () => {
      started = true
      const gap = step ?? Math.min(48, 1500 / hosts.length)
      // the words stay hidden while the intro loader is up, and decode in as it lifts
      cancelWait = whenIntroDone(() => {
        hosts.forEach((host, i) => startDecode(host, { delay: delay + i * gap, duration, charset }))
      })
    }

    if (typeof IntersectionObserver === 'undefined') {
      run()
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          if (!started && entries.some((entry) => entry.isIntersecting)) {
            observer.disconnect()
            run()
          }
        },
        { threshold },
      )
      observer.observe(root)
    }

    return () => {
      observer?.disconnect()
      cancelWait()
      cancelDecode(hosts)
    }
  }, [ref, delay, step, duration, charset, threshold])
}
