import { Fragment, useEffect, useRef, useState } from 'react'
import { ArrowRight, BarChart3, Brain, Download, Mail, MapPin, ScanEye } from 'lucide-react'
import NeuralBackground from './NeuralBackground.jsx'
import NeuralGlobe from './NeuralGlobe.jsx'
import DecodeText from './DecodeText.jsx'
import { activeSocials, site } from '../data/site.js'
import { achievements, experience, projects } from '../data/content.js'

// Shown while the portrait loads, and if the image is missing or fails to load.
function PortraitFallback() {
  return (
    <svg className="portrait-fallback" viewBox="0 0 240 240" role="img" aria-label="Neural network graphic">
      <defs>
        <linearGradient id="orb" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f2cf5b" />
          <stop offset="1" stopColor="#a9831f" />
        </linearGradient>
      </defs>
      <g stroke="url(#orb)" strokeWidth="1.4" opacity="0.7" fill="none">
        <path d="M120 40 60 95 40 160 120 205 200 160 180 95Z" />
        <path d="M120 40 120 125 60 95M120 125 180 95M120 125 40 160M120 125 200 160M120 125 120 205" />
      </g>
      {[
        [120, 40],
        [60, 95],
        [180, 95],
        [40, 160],
        [200, 160],
        [120, 205],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="7" fill="url(#orb)" />
      ))}
      <circle cx="120" cy="125" r="16" fill="url(#orb)" />
    </svg>
  )
}

function Portrait() {
  const [state, setState] = useState('loading') // loading | loaded | error
  const { src, alt, width, height } = site.heroImage
  return (
    <div className="portrait" data-state={state}>
      <div className="portrait-frame">
        {state !== 'loaded' && <PortraitFallback />}
        {state !== 'error' && (
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            className="portrait-img"
            onLoad={() => setState('loaded')}
            onError={() => setState('error')}
            fetchPriority="high"
          />
        )}
      </div>
    </div>
  )
}

// Decorative "profile.json" readout, built only from details already on the page.
const profileLines = [
  [['p', '{']],
  [['k', '  "name"'], ['p', ': '], ['s', '"Dinesh G"'], ['p', ',']],
  [['k', '  "focus"'], ['p', ': ['], ['s', '"AI/ML"'], ['p', ', '], ['s', '"Web"'], ['p', '],']],
  [['k', '  "base"'], ['p', ': '], ['s', '"Chennai, IN"']],
  [['p', '}']],
]

const stats = [
  { value: projects.length, label: 'Projects built' },
  { value: achievements.length, label: 'Hackathon finals' },
  { value: experience.length, label: 'Internship' },
]

export default function Hero() {
  const visualRef = useRef(null)

  // 3D parallax: the portrait leans toward the pointer and the floating layers drift at different depths.
  useEffect(() => {
    const el = visualRef.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches || !window.matchMedia('(pointer: fine)').matches) {
      return undefined
    }
    let tx = 0
    let ty = 0
    let cx = 0
    let cy = 0
    let raf = 0
    const tick = () => {
      cx += (tx - cx) * 0.09
      cy += (ty - cy) * 0.09
      el.style.setProperty('--px', cx.toFixed(3))
      el.style.setProperty('--py', cy.toFixed(3))
      raf = Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002 ? requestAnimationFrame(tick) : 0
    }
    const onMove = (event) => {
      tx = (event.clientX / window.innerWidth - 0.5) * 2
      ty = (event.clientY / window.innerHeight - 0.5) * 2
      if (!raf) raf = requestAnimationFrame(tick)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section id="home" className="hero" aria-label="Introduction">
      <NeuralBackground />
      <div className="container hero-grid">
        <div className="hero-copy">
          <p className="eyebrow reveal-now" style={{ '--delay': '0ms' }}>
            <MapPin size={15} aria-hidden="true" /> {site.location}
            <span className="coords">{site.coords}</span>
          </p>
          <h1 className="hero-name reveal-now" style={{ '--delay': '80ms' }}>
            <DecodeText text="DINESH G" />
          </h1>
          <p className="hero-role reveal-now" style={{ '--delay': '160ms' }}>
            {site.roleParts.map((part, i) => (
              <Fragment key={part}>
                {i > 0 && ' '}
                <span>
                  {part}
                  {i < site.roleParts.length - 1 && (
                    <>
                      {' '}
                      <span className="sep" aria-hidden="true">
                        |
                      </span>
                    </>
                  )}
                </span>
              </Fragment>
            ))}
          </p>
          <p className="hero-intro reveal-now" style={{ '--delay': '240ms' }}>
            {site.intro}
          </p>

          <div className="hero-actions reveal-now" style={{ '--delay': '320ms' }}>
            <a className="btn btn-primary" href="#projects">
              Explore My Projects <ArrowRight size={18} aria-hidden="true" />
            </a>
            <a className="btn btn-secondary" href={site.resume.href} download={site.resume.filename}>
              <Download size={18} aria-hidden="true" /> Download Resume
            </a>
            <a className="btn btn-ghost" href="#contact">
              <Mail size={18} aria-hidden="true" /> Contact Me
            </a>
          </div>

          <div className="hero-foot reveal-now" style={{ '--delay': '400ms' }}>
            <ul className="stats" aria-label="At a glance">
              {stats.map((s) => (
                <li key={s.label}>
                  <strong>{s.value}</strong>
                  <span>{s.label}</span>
                </li>
              ))}
            </ul>
            {activeSocials.length > 0 && (
              <ul className="social-row" aria-label="Social links">
                {activeSocials.map(({ id, label, href, icon: Icon }) => (
                  <li key={id}>
                    <a className="icon-btn" href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} (opens in a new tab)`}>
                      <Icon size={18} />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div ref={visualRef} className="hero-visual reveal-now" style={{ '--delay': '200ms' }}>
          <div className="portrait-glow" aria-hidden="true" />
          <NeuralGlobe />
          <Portrait />
          <span className="float-chip chip-a" aria-hidden="true">
            <Brain size={15} /> Machine Learning
          </span>
          <span className="float-chip chip-b" aria-hidden="true">
            <ScanEye size={15} /> Computer Vision
          </span>
          <span className="float-chip chip-c" aria-hidden="true">
            <BarChart3 size={15} /> Data Analysis
          </span>
          <div className="code-panel" aria-hidden="true">
            <div className="code-bar">
              <i />
              <i />
              <i />
              <span>profile.json</span>
            </div>
            <div className="code-body">
              {profileLines.map((line, i) => (
                <div key={i}>
                  {line.map(([kind, text], j) => (
                    <span key={j} className={`c-${kind}`}>
                      {text}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <a className="scroll-cue" href="#about" aria-label="Scroll to About section">
        <span aria-hidden="true" />
      </a>
    </section>
  )
}
