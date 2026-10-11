// Shared state of the intro loader.
//
// The loader shows once per browser session, on the first load only (never when moving between sections).
// Home's entrance animations wait for it: they call whenIntroDone() and start when the loader lifts.
//   ?nointro   skips it (used by automated tests)       ?intro=1   forces it, even if already seen

const SEEN_KEY = 'dg-intro-seen'

let pending = false
let waiting = new Set()

export function initIntro() {
  let show = true
  try {
    const query = new URLSearchParams(window.location.search)
    if (query.has('nointro') || query.get('intro') === '0') show = false
    else if (query.get('intro') === '1') show = true
    else if (window.sessionStorage.getItem(SEEN_KEY)) show = false
  } catch {
    /* storage or URL access blocked: just show it */
  }
  pending = show
  if (show) document.documentElement.classList.add('is-intro')
  return show
}

export const introPending = () => pending

// Runs `callback` now, or as soon as the loader has lifted. Returns a function that cancels it.
export function whenIntroDone(callback) {
  if (!pending) {
    callback()
    return () => {}
  }
  waiting.add(callback)
  return () => waiting.delete(callback)
}

export function endIntro() {
  if (!pending) return
  pending = false
  document.documentElement.classList.remove('is-intro')
  try {
    window.sessionStorage.setItem(SEEN_KEY, '1')
  } catch {
    /* ignore */
  }
  const callbacks = [...waiting]
  waiting = new Set()
  callbacks.forEach((callback) => callback())
}
