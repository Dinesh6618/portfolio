// Cinematic section transitions for the single-page portfolio.
//
// Every in-page navigation (nav links, hero buttons, scroll cue, logo, command palette, browser Back/Forward)
// goes through goToSection(). The outgoing section fades out, a full-screen canvas covers the page with the
// effect that belongs to the destination, the page jumps to the destination while it is covered, and the same
// effect then uncovers it while the destination section drifts in. About 700 ms in total.
//
//   Home / About   expanding golden circle
//   Skills         horizontal golden light sweep
//   Projects       pixel and particle assembly
//   Research       flowing gold wave
//   Experience     sliding vertical panels
//   Achievements   expanding concentric rings
//   Contact        golden particle dissolve
//
// Palette: #050505 background, #D4AF37 gold, #FFD76A highlight. Respects prefers-reduced-motion (plain jump, no
// overlay). The canvas never takes pointer events and a watchdog always removes it, so it cannot get stuck.

const BG = '#050505'
const GOLD = '#D4AF37'
const HI = '#FFD76A'

export const SECTION_ORDER = ['home', 'about', 'skills', 'projects', 'research', 'experience', 'achievements', 'contact']

const EFFECT_FOR = {
  home: 'circle',
  about: 'circle',
  skills: 'sweep',
  projects: 'pixels',
  research: 'wave',
  experience: 'panels',
  achievements: 'rings',
  contact: 'dissolve',
}

const COVER_MS = 320 // the page is covered (the outgoing section leaves)
const REVEAL_MS = 380 // the destination is uncovered (and drifts in)
const WATCHDOG_MS = COVER_MS + REVEAL_MS + 700

const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v))
const lerp = (a, b, t) => a + (b - a) * t
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - (2 - 2 * t) * (2 - 2 * t) / 2)
const easeOut = (t) => 1 - (1 - t) * (1 - t)

// ---- drawing helpers ---------------------------------------------------------------------------------
function glowRing(ctx, x, y, r, color, width, alpha, blur) {
  if (r <= 0) return
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.strokeStyle = color
  ctx.lineWidth = width
  ctx.shadowColor = GOLD
  ctx.shadowBlur = blur
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function paintBlack(ctx, w, h) {
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, w, h)
}

// fill the whole screen black, then punch a hole with `shape` (a function that builds a path and fills it)
function blackWithHole(ctx, w, h, shape) {
  paintBlack(ctx, w, h)
  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = '#000'
  shape(ctx)
  ctx.restore()
}

// ---- effects ------------------------------------------------------------------------------------------
// prepare(w, h, origin) -> state; cover(ctx, s, p, t) draws the page being covered at progress p (0..1);
// reveal(ctx, s, p, t) draws the destination being uncovered (p 0 = still fully black, 1 = clear).
const effects = {
  // ---- expanding golden circle, from the click point
  circle: {
    prepare: (w, h, o) => {
      const ox = o?.x ?? w / 2
      const oy = o?.y ?? h / 2
      return { w, h, ox, oy, max: Math.hypot(Math.max(ox, w - ox), Math.max(oy, h - oy)) + 40 }
    },
    cover(ctx, s, p) {
      const r = s.max * p
      ctx.fillStyle = BG
      ctx.beginPath()
      ctx.arc(s.ox, s.oy, r, 0, Math.PI * 2)
      ctx.fill()
      glowRing(ctx, s.ox, s.oy, r, HI, 3, 1, 26)
      glowRing(ctx, s.ox, s.oy, r * 0.93, GOLD, 1.5, 0.55, 0)
    },
    reveal(ctx, s, p) {
      const r = s.max * p
      blackWithHole(ctx, s.w, s.h, (c) => {
        c.beginPath()
        c.arc(s.ox, s.oy, r, 0, Math.PI * 2)
        c.fill()
      })
      if (p < 1) {
        glowRing(ctx, s.ox, s.oy, r, HI, 3, 1 - p * 0.6, 26)
        glowRing(ctx, s.ox, s.oy, r * 1.06, GOLD, 1.5, 0.5 * (1 - p), 0)
      }
    },
  },

  // ---- horizontal light sweep, left to right
  sweep: {
    prepare: (w, h) => ({ w, h, bar: Math.max(140, w * 0.16) }),
    cover(ctx, s, p) {
      const x = (s.w + s.bar) * p
      ctx.fillStyle = BG
      ctx.fillRect(0, 0, x, s.h)
      this.bar(ctx, s, x, -1)
    },
    reveal(ctx, s, p) {
      const x = (s.w + s.bar) * p
      ctx.fillStyle = BG
      ctx.fillRect(x, 0, s.w - x + 1, s.h)
      this.bar(ctx, s, x, 1)
    },
    // a soft gold light band on the leading edge; dir -1 fades to the left, 1 to the right
    bar(ctx, s, x, dir) {
      const x0 = dir < 0 ? x - s.bar : x
      const g = ctx.createLinearGradient(x0, 0, x0 + s.bar, 0)
      if (dir < 0) {
        g.addColorStop(0, 'rgba(212,175,55,0)')
        g.addColorStop(0.7, 'rgba(212,175,55,0.35)')
        g.addColorStop(1, 'rgba(255,215,106,0.95)')
      } else {
        g.addColorStop(0, 'rgba(255,215,106,0.95)')
        g.addColorStop(0.3, 'rgba(212,175,55,0.35)')
        g.addColorStop(1, 'rgba(212,175,55,0)')
      }
      ctx.fillStyle = g
      ctx.fillRect(x0, 0, s.bar, s.h)
      ctx.save()
      ctx.fillStyle = HI
      ctx.shadowColor = GOLD
      ctx.shadowBlur = 24
      ctx.fillRect(x - 1.5, 0, 3, s.h)
      ctx.restore()
    },
  },

  // ---- pixel and particle assembly: blocks flash gold and settle into black in a diagonal, noisy order
  pixels: {
    prepare(w, h) {
      const size = clamp(w / 26, 34, 70)
      const cols = Math.ceil(w / size)
      const rows = Math.ceil(h / size)
      const th = new Float32Array(cols * rows)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          th[r * cols + c] = Math.random() * 0.4 + ((c / cols + r / rows) / 2) * 0.35
        }
      }
      return { w, h, size, cols, rows, th }
    },
    cover(ctx, s, p) {
      for (let r = 0; r < s.rows; r++) {
        for (let c = 0; c < s.cols; c++) {
          const local = clamp((p - s.th[r * s.cols + c]) / 0.25)
          if (local <= 0) continue
          const x = c * s.size
          const y = r * s.size
          if (local >= 1) {
            ctx.fillStyle = BG
            ctx.fillRect(x, y, s.size + 0.5, s.size + 0.5)
            continue
          }
          const k = s.size * easeOut(local)
          const off = (s.size - k) / 2
          ctx.fillStyle = BG
          ctx.fillRect(x, y, s.size + 0.5, s.size + 0.5)
          ctx.fillStyle = local < 0.5 ? HI : GOLD
          ctx.globalAlpha = 1 - local * 0.9
          ctx.fillRect(x + off, y + off, k, k)
          ctx.globalAlpha = 1
        }
      }
    },
    reveal(ctx, s, p) {
      for (let r = 0; r < s.rows; r++) {
        for (let c = 0; c < s.cols; c++) {
          const local = clamp((p - s.th[r * s.cols + c]) / 0.25)
          if (local >= 1) continue
          const x = c * s.size
          const y = r * s.size
          if (local <= 0) {
            ctx.fillStyle = BG
            ctx.fillRect(x, y, s.size + 0.5, s.size + 0.5)
            continue
          }
          const k = s.size * (1 - local)
          const off = (s.size - k) / 2
          ctx.fillStyle = BG
          ctx.fillRect(x + off, y + off, k, k)
          ctx.strokeStyle = HI
          ctx.globalAlpha = 1 - local
          ctx.lineWidth = 1.5
          ctx.strokeRect(x + off + 0.5, y + off + 0.5, Math.max(0, k - 1), Math.max(0, k - 1))
          ctx.globalAlpha = 1
        }
      }
    },
  },

  // ---- flowing gold wave, rising from the bottom
  wave: {
    prepare: (w, h) => ({ w, h, amp: h * 0.055, k: (Math.PI * 2) / Math.max(320, w * 0.5) }),
    edge(s, x, p, t, lag = 0) {
      const base = lerp(s.h + s.amp * 3, -s.amp * 3, p) + lag
      const ph = t * 0.011
      return base + Math.sin(x * s.k + ph) * s.amp + Math.sin(x * s.k * 2.1 - ph * 1.4) * s.amp * 0.35
    },
    path(ctx, s, p, t, lag, close) {
      ctx.beginPath()
      ctx.moveTo(0, close)
      for (let x = 0; x <= s.w + 12; x += 16) ctx.lineTo(x, this.edge(s, x, p, t, lag))
      ctx.lineTo(s.w + 12, close)
      ctx.closePath()
    },
    // one wave line; glow is a wider, fainter stroke underneath (a canvas shadow over a full-width path is slow)
    line(ctx, s, p, t, lag, color, width, alpha, glow) {
      ctx.save()
      ctx.strokeStyle = color
      ctx.lineJoin = 'round'
      ctx.beginPath()
      for (let x = 0; x <= s.w + 12; x += 16) {
        const y = this.edge(s, x, p, t, lag)
        if (x === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      if (glow) {
        ctx.globalAlpha = alpha * 0.22
        ctx.lineWidth = width + 12
        ctx.stroke()
        ctx.globalAlpha = alpha * 0.4
        ctx.lineWidth = width + 5
        ctx.stroke()
      }
      ctx.globalAlpha = alpha
      ctx.lineWidth = width
      ctx.stroke()
      ctx.restore()
    },
    cover(ctx, s, p, t) {
      ctx.fillStyle = BG
      this.path(ctx, s, p, t, 0, s.h + 40)
      ctx.fill()
      this.line(ctx, s, p, t, 0, HI, 3, 1, true)
      this.line(ctx, s, p, t, 22, GOLD, 1.5, 0.55, false)
      this.line(ctx, s, p, t, 44, GOLD, 1, 0.3, false)
    },
    reveal(ctx, s, p, t) {
      ctx.fillStyle = BG
      this.path(ctx, s, p, t, 0, -40)
      ctx.fill()
      this.line(ctx, s, p, t, 0, HI, 3, 1, true)
      this.line(ctx, s, p, t, -22, GOLD, 1.5, 0.55, false)
      this.line(ctx, s, p, t, -44, GOLD, 1, 0.3, false)
    },
  },

  // ---- sliding vertical panels, staggered left to right
  panels: {
    prepare: (w, h) => ({ w, h, n: w < 640 ? 5 : 8 }),
    local(s, i, p) {
      return easeInOut(clamp((p - (i / s.n) * 0.4) / 0.6))
    },
    cover(ctx, s, p) {
      const cw = s.w / s.n
      for (let i = 0; i < s.n; i++) {
        const l = this.local(s, i, p)
        if (l <= 0) continue
        const y = -s.h + s.h * l
        ctx.fillStyle = BG
        ctx.fillRect(i * cw - 0.5, y, cw + 1, s.h)
        if (l < 1) {
          ctx.save()
          ctx.fillStyle = HI
          ctx.shadowColor = GOLD
          ctx.shadowBlur = 18
          ctx.fillRect(i * cw, y + s.h - 3, cw, 3)
          ctx.restore()
        }
        ctx.fillStyle = 'rgba(212,175,55,0.45)'
        ctx.fillRect(i * cw, y, 1, s.h)
      }
    },
    reveal(ctx, s, p) {
      const cw = s.w / s.n
      for (let i = 0; i < s.n; i++) {
        const l = this.local(s, i, p)
        if (l >= 1) continue
        const y = s.h * l
        ctx.fillStyle = BG
        ctx.fillRect(i * cw - 0.5, y, cw + 1, s.h)
        if (l > 0) {
          ctx.save()
          ctx.fillStyle = HI
          ctx.shadowColor = GOLD
          ctx.shadowBlur = 18
          ctx.fillRect(i * cw, y, cw, 3)
          ctx.restore()
        }
        ctx.fillStyle = 'rgba(212,175,55,0.45)'
        ctx.fillRect(i * cw, y, 1, s.h)
      }
    },
  },

  // ---- expanding concentric rings, from the centre
  rings: {
    prepare: (w, h) => ({ w, h, cx: w / 2, cy: h / 2, max: Math.hypot(w / 2, h / 2) + 60 }),
    set(ctx, s, r, fade) {
      const gap = s.max * 0.075
      for (let i = 0; i < 6; i++) {
        const rr = r - i * gap
        if (rr <= 0) break
        glowRing(ctx, s.cx, s.cy, rr, i === 0 ? HI : GOLD, i === 0 ? 3 : 1.6, (1 - i / 6) * 0.95 * fade, i === 0 ? 24 : 0)
      }
    },
    cover(ctx, s, p) {
      const r = s.max * p
      ctx.fillStyle = BG
      ctx.beginPath()
      ctx.arc(s.cx, s.cy, r, 0, Math.PI * 2)
      ctx.fill()
      this.set(ctx, s, r, 1)
    },
    reveal(ctx, s, p) {
      const r = s.max * p
      blackWithHole(ctx, s.w, s.h, (c) => {
        c.beginPath()
        c.arc(s.cx, s.cy, r, 0, Math.PI * 2)
        c.fill()
      })
      if (p < 1) this.set(ctx, s, r, 1 - p * 0.5)
    },
  },

  // ---- golden particle dissolve: a noise threshold eats the page, edges glow gold, sparks drift up
  dissolve: {
    prepare(w, h) {
      const q = 7 // low-res noise grid, scaled up (soft grain)
      const gw = Math.ceil(w / q)
      const gh = Math.ceil(h / q)
      const noise = new Float32Array(gw * gh)
      for (let i = 0; i < noise.length; i++) noise[i] = Math.random()
      const off = document.createElement('canvas')
      off.width = gw
      off.height = gh
      const octx = off.getContext('2d')
      const img = octx.createImageData(gw, gh)
      const count = Math.round(clamp((w * h) / 7000, 70, 220))
      const sparks = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vy: 30 + Math.random() * 90,
        vx: (Math.random() - 0.5) * 40,
        r: 0.8 + Math.random() * 2.2,
        d: Math.random() * 0.4,
      }))
      return { w, h, gw, gh, noise, off, octx, img, sparks }
    },
    grain(ctx, s, p, covering) {
      const d = s.img.data
      const front = p * 1.3
      for (let i = 0; i < s.noise.length; i++) {
        const v = front - s.noise[i] // > 0 once the front has passed this cell
        const o = i * 4
        let a = clamp(v * 7)
        if (!covering) a = 1 - a
        const band = v > 0 && v < 0.16
        if (band) {
          const k = 1 - v / 0.16
          d[o] = lerp(5, 255, k)
          d[o + 1] = lerp(5, 215, k)
          d[o + 2] = lerp(5, 106, k)
          d[o + 3] = 255 * clamp(Math.max(a, k * 0.9))
        } else {
          d[o] = 5
          d[o + 1] = 5
          d[o + 2] = 5
          d[o + 3] = 255 * a
        }
      }
      s.octx.putImageData(s.img, 0, 0)
      ctx.save()
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(s.off, 0, 0, s.w, s.h)
      ctx.restore()
    },
    sparks(ctx, s, p, covering) {
      const sweep = covering ? p : 1 + p
      ctx.save()
      ctx.shadowColor = GOLD
      ctx.shadowBlur = 8
      for (const q of s.sparks) {
        const life = clamp((sweep - q.d) / 0.7)
        if (life <= 0 || life >= 1) continue
        ctx.globalAlpha = Math.sin(Math.PI * life) * 0.95
        ctx.fillStyle = life < 0.5 ? HI : GOLD
        ctx.beginPath()
        ctx.arc(q.x + q.vx * life, q.y - q.vy * life, q.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    },
    cover(ctx, s, p) {
      this.grain(ctx, s, p, true)
      this.sparks(ctx, s, p, true)
    },
    reveal(ctx, s, p) {
      this.grain(ctx, s, p, false)
      this.sparks(ctx, s, p, false)
    },
  },
}

// ---- engine -------------------------------------------------------------------------------------------
let engine = null

// Plain navigation, used when the engine is not mounted or motion is reduced.
function plainGo(id, { push = true } = {}) {
  const el = document.getElementById(id)
  if (!el) return
  window.scrollTo({ top: targetTop(el, id), left: 0, behavior: 'auto' })
  if (push) setHash(id)
  focusSection(el)
}

function setHash(id) {
  try {
    if (window.location.hash !== `#${id}`) window.history.pushState(null, '', `#${id}`)
  } catch {
    /* ignore (sandboxed iframes) */
  }
}

// Where the section's top sits in the document, ignoring any transform the transition itself has put on it.
function targetTop(el, id) {
  if (id === 'home') return 0
  const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0
  const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
  const tf = getComputedStyle(el).transform
  const shift = tf && tf !== 'none' ? new DOMMatrixReadOnly(tf).m42 : 0
  return clamp(el.getBoundingClientRect().top + window.scrollY - shift - pad, 0, max)
}

function focusSection(el) {
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
  try {
    el.focus({ preventScroll: true })
  } catch {
    /* ignore */
  }
}

// the section that is crossing the upper-middle of the viewport
function currentSectionId() {
  let found = SECTION_ORDER[0]
  for (const id of SECTION_ORDER) {
    const el = document.getElementById(id)
    if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.4) found = id
  }
  return found
}

export function goToSection(id, options = {}) {
  if (engine) engine.go(id, options)
  else plainGo(id, options)
}

export function isSectionId(id) {
  return SECTION_ORDER.includes(id)
}

// Mount the engine on a canvas. Returns a cleanup function.
export function initTransitions(canvas) {
  const ctx = canvas.getContext('2d')
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const root = document.documentElement
  let busy = false
  let raf = 0
  let watchdog = 0
  let queued = null // { id, options } received while a reveal was running
  let lastId = null // the section the visitor was last taken to (direction for Back/Forward)
  let job = null

  const clearClasses = () => {
    document.querySelectorAll('.pt-leave, .pt-enter').forEach((n) => n.classList.remove('pt-leave', 'pt-enter'))
    root.classList.remove('pt-running')
  }

  const hide = () => {
    cancelAnimationFrame(raf)
    clearTimeout(watchdog)
    raf = 0
    canvas.style.display = 'none'
    canvas.removeAttribute('data-effect')
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const finish = () => {
    hide()
    clearClasses()
    busy = false
    job = null
    if (queued) {
      const next = queued
      queued = null
      go(next.id, next.options)
    }
  }

  // jump to the destination while the page is covered
  const jump = () => {
    const el = document.getElementById(job.id)
    if (!el) return
    window.scrollTo({ top: targetTop(el, job.id), left: 0, behavior: 'instant' })
    job.from?.classList.remove('pt-leave')
    el.style.setProperty('--pt-dir', String(job.dir))
    el.classList.add('pt-enter')
    focusSection(el)
    const done = () => el.classList.remove('pt-enter')
    el.addEventListener('animationend', done, { once: true })
    setTimeout(done, REVEAL_MS + 400)
    job.jumped = true
  }

  const frame = (now) => {
    if (!job) return
    const t = now - job.start
    const dpr = job.dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, job.w, job.h)
    if (t < COVER_MS && !job.revealOnly) {
      job.fx.cover(ctx, job.state, easeInOut(clamp(t / COVER_MS)), now)
    } else {
      if (!job.jumped) jump()
      if (job.revealOnly) {
        // Back / Forward: the browser scrolls to the fragment after our handler, so hold the position for a moment
        if (t < 160) window.scrollTo({ top: targetTop(document.getElementById(job.id), job.id), left: 0, behavior: 'instant' })
        if (!job.entered && t > 60) {
          job.entered = true
          const el = document.getElementById(job.id)
          el.style.setProperty('--pt-dir', String(job.dir))
          el.classList.add('pt-enter')
          const done = () => el.classList.remove('pt-enter')
          el.addEventListener('animationend', done, { once: true })
          setTimeout(done, REVEAL_MS + 400)
        }
      }
      const rt = job.revealOnly ? t : t - COVER_MS
      const p = clamp(rt / REVEAL_MS)
      job.fx.reveal(ctx, job.state, easeInOut(p), now)
      if (p >= 1) {
        finish()
        return
      }
    }
    raf = requestAnimationFrame(frame)
  }

  // revealOnly: the page has already jumped (browser Back/Forward), so start fully covered and just uncover
  function go(id, options = {}) {
    const el = document.getElementById(id)
    if (!el || !isSectionId(id)) return
    const { origin = null, push = true, revealOnly = false } = options

    if (busy) {
      // Still covering: retarget. Revealing already: run the new one right after.
      if (job && !job.jumped && !revealOnly) {
        job.id = id
        job.dir = SECTION_ORDER.indexOf(id) >= SECTION_ORDER.indexOf(job.fromId) ? 1 : -1
        job.state = effects[EFFECT_FOR[id]].prepare(job.w, job.h, origin)
        job.fx = effects[EFFECT_FOR[id]]
        canvas.setAttribute('data-effect', EFFECT_FOR[id])
        if (push) setHash(id)
      } else {
        queued = { id, options }
      }
      return
    }

    const fromId = currentSectionId()
    const distance = Math.abs(targetTop(el, id) - window.scrollY)

    if (push) setHash(id)

    // nothing to animate: reduced motion, hidden tab, or already there
    if (motion.matches || document.hidden || (!revealOnly && fromId === id && distance < 40)) {
      window.scrollTo({ top: targetTop(el, id), left: 0, behavior: 'auto' })
      focusSection(el)
      lastId = id
      return
    }

    busy = true
    const fx = effects[EFFECT_FOR[id]]
    const w = window.innerWidth
    const h = window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    canvas.style.display = 'block'
    canvas.setAttribute('data-effect', EFFECT_FOR[id])
    root.classList.add('pt-running')

    const fromEl = document.getElementById(fromId)
    const prevId = revealOnly ? lastId || 'home' : fromId
    const dir = SECTION_ORDER.indexOf(id) >= SECTION_ORDER.indexOf(prevId) ? 1 : -1
    lastId = id
    job = {
      id,
      fromId,
      from: revealOnly ? null : fromEl,
      dir,
      fx,
      state: fx.prepare(w, h, origin),
      w,
      h,
      dpr,
      revealOnly,
      jumped: false,
      start: performance.now(),
    }
    if (job.from) {
      job.from.style.setProperty('--pt-dir', String(dir))
      job.from.classList.add('pt-leave')
    }
    clearTimeout(watchdog)
    watchdog = setTimeout(() => {
      // safety net: if frames stopped (throttled tab), land on the destination and remove the overlay
      if (job && !job.jumped) jump()
      finish()
    }, WATCHDOG_MS)

    if (revealOnly) {
      // draw the first (fully covered) frame synchronously so the jumped page is never painted uncovered
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      fx.reveal(ctx, job.state, 0, job.start)
      job.jumped = true
      job.from = null
      focusSection(document.getElementById(id))
    }
    raf = requestAnimationFrame(frame)
  }

  engine = { go }

  // ---- inputs ------------------------------------------------------------------------------------
  const onClick = (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const a = event.target.closest?.('a[href^="#"]')
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return
    const id = decodeURIComponent(a.getAttribute('href').slice(1))
    if (!isSectionId(id)) return
    event.preventDefault()
    go(id, { origin: event.clientX || event.clientY ? { x: event.clientX, y: event.clientY } : null })
  }

  // Back / Forward and edited URLs: the browser has already moved; cover at once, then uncover
  const onPop = () => {
    const id = decodeURIComponent(window.location.hash.slice(1)) || 'home'
    if (!isSectionId(id)) return
    const el = document.getElementById(id)
    if (!el) return
    window.scrollTo({ top: targetTop(el, id), left: 0, behavior: 'instant' }) // cancels the browser's smooth scroll
    if (busy) {
      queued = null
      if (job && !job.jumped) {
        job.id = id
        return
      }
    }
    go(id, { push: false, revealOnly: true })
  }

  // no scrolling by the user while the page is covered (it would land next to the destination)
  const block = (event) => {
    if (busy && job && !job.jumped) event.preventDefault()
  }
  const onVisibility = () => {
    if (document.hidden && busy) {
      if (job && !job.jumped) jump()
      finish()
    }
  }

  document.addEventListener('click', onClick)
  window.addEventListener('popstate', onPop)
  window.addEventListener('wheel', block, { passive: false })
  window.addEventListener('touchmove', block, { passive: false })
  document.addEventListener('visibilitychange', onVisibility)

  return () => {
    document.removeEventListener('click', onClick)
    window.removeEventListener('popstate', onPop)
    window.removeEventListener('wheel', block)
    window.removeEventListener('touchmove', block)
    document.removeEventListener('visibilitychange', onVisibility)
    hide()
    clearClasses()
    engine = null
  }
}
