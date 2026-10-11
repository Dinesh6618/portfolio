// "Decode" text effect engine: characters resolve left to right out of random glyphs.
// One shared rAF loop drives every running job, and it stops itself when nothing is left.
//
// A host element opts in with this structure (the real text is never removed from the DOM):
//   [data-decode]            host; gets data-s = pending | running | done
//     [data-decode-text]     the real text
//     [data-decode-r]        overlay: the already-resolved prefix
//     [data-decode-s]        overlay: the still-scrambling remainder

export const CODE_GLYPHS = '01<>/{}[]#*+=_-'
export const LETTER_GLYPHS = '01ABCDEFGHJKLMNPQRSTUVWXYZ'

const SCRAMBLEABLE = /[A-Za-z0-9]/
const SWAP_MS = 45

let jobs = []
let raf = 0

function scramble(text, charset) {
  let out = ''
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    out += SCRAMBLEABLE.test(ch) ? charset[(Math.random() * charset.length) | 0] : ch
  }
  return out
}

function finish(job) {
  job.r.textContent = ''
  job.s.textContent = ''
  job.host.dataset.s = 'done'
}

function tick(now) {
  const next = []
  for (const job of jobs) {
    if (job.cancelled) continue
    const t = (now - job.start) / job.duration
    if (t < 0) {
      next.push(job)
      continue
    }
    if (t >= 1) {
      finish(job)
      continue
    }
    if (job.host.dataset.s !== 'running') job.host.dataset.s = 'running'

    const len = job.text.length
    const locked = Math.min(len, Math.floor(Math.max(0, (t - 0.12) / 0.8) * (len + 1)))
    if (locked !== job.locked) {
      job.locked = locked
      job.r.textContent = job.text.slice(0, locked)
    }
    if (now - job.swap > SWAP_MS || locked === len) {
      job.swap = now
      job.s.textContent = locked >= len ? '' : scramble(job.text.slice(locked), job.charset)
    }
    next.push(job)
  }
  jobs = next
  raf = jobs.length ? requestAnimationFrame(tick) : 0
}

export function startDecode(host, { delay = 0, duration = 540, charset = CODE_GLYPHS } = {}) {
  const textEl = host.querySelector('[data-decode-text]')
  const r = host.querySelector('[data-decode-r]')
  const s = host.querySelector('[data-decode-s]')
  if (!textEl || !r || !s) {
    host.dataset.s = 'done'
    return
  }
  jobs.push({
    host,
    r,
    s,
    text: textEl.textContent,
    start: performance.now() + delay,
    duration,
    charset,
    swap: 0,
    locked: -1,
    cancelled: false,
  })
  if (!raf) raf = requestAnimationFrame(tick)
}

// Stops jobs for these hosts and puts them back to plain, fully visible text.
export function cancelDecode(hosts) {
  const set = new Set(hosts)
  for (const job of jobs) if (set.has(job.host)) job.cancelled = true
  for (const host of hosts) {
    delete host.dataset.s
    const r = host.querySelector('[data-decode-r]')
    const s = host.querySelector('[data-decode-s]')
    if (r) r.textContent = ''
    if (s) s.textContent = ''
  }
}
