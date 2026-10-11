import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight, Check, ExternalLink } from 'lucide-react'
import Section from './Section.jsx'
import Reveal from './Reveal.jsx'
import Spotlight from './Spotlight.jsx'
import ProjectModal from './ProjectModal.jsx'
import Words from './Words.jsx'
import { GithubIcon } from './Icons.jsx'
import { projectFilters, projects } from '../data/content.js'
import './ProjectCoverVideo.css'

// Card cover. It plays like a short video: the project's screenshots crossfade one after another, each with a
// slow pan and zoom, and a thin progress bar shows where it is. Playback runs only while the card is on screen and
// the tab is visible, starts at a different moment on each card, and is a still first frame with reduced motion.
// With no screenshots (or none that load) it is an abstract accent-coloured tile.
const SLIDE_MS = 3600

function Cover({ project, index = 0 }) {
  const [failed, setFailed] = useState({})
  const [current, setCurrent] = useState(0)
  const [previous, setPrevious] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const hostRef = useRef(null)
  const slides = project.screenshots.filter((shot) => !failed[shot.src])
  const count = slides.length
  const Icon = project.icon

  // play only while the card is on screen and the tab is visible
  useEffect(() => {
    const host = hostRef.current
    if (!host || count < 2) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    let visible = false
    const update = () => setPlaying(visible && !document.hidden)
    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              visible = entry.isIntersecting
              update()
            },
            { threshold: 0.25 },
          )
    if (observer) observer.observe(host)
    else visible = true
    document.addEventListener('visibilitychange', update)
    update()
    return () => {
      observer?.disconnect()
      document.removeEventListener('visibilitychange', update)
    }
  }, [count])

  // the clock: one slide every SLIDE_MS, each card a little out of step with its neighbours
  useEffect(() => {
    if (!playing || count < 2) return undefined
    let interval = 0
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setCurrent((c) => {
          setPrevious(c)
          return (c + 1) % count
        })
      }, SLIDE_MS)
    }, (index % 4) * 450)
    return () => {
      clearTimeout(start)
      clearInterval(interval)
    }
  }, [playing, count, index])

  const active = Math.min(current, Math.max(0, count - 1))

  return (
    <div ref={hostRef} className="project-cover" aria-hidden="true" data-playing={playing ? 'true' : 'false'}>
      <div className="shot-chrome">
        <i />
        <i />
        <i />
        <span>{project.name.toLowerCase().replace(/\s+/g, '-')}</span>
      </div>
      <div className="cover-media">
        {count > 0 ? (
          slides.map((shot, i) => (
            <img
              key={shot.src}
              className={`cover-slide${i === active ? ' is-on' : ''}${i === previous && i !== active ? ' is-leaving' : ''}${i % 2 ? ' is-alt' : ''}`}
              src={shot.src}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setFailed((f) => ({ ...f, [shot.src]: true }))}
            />
          ))
        ) : (
          <div className="cover-art">
            <Icon size={56} strokeWidth={1.4} />
          </div>
        )}
        {count > 1 && (
          <div className="cover-progress" style={{ '--slide-ms': `${SLIDE_MS}ms` }}>
            {slides.map((shot, i) => (
              <span key={shot.src} className={i < active ? 'is-done' : i === active ? 'is-now' : undefined}>
                {i === active && playing && <b key={`${i}-${previous}`} />}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ProjectCard({ project, number, onOpen }) {
  const { name, tagline, icon: Icon, accent, tech, description, features, links } = project

  return (
    <Spotlight as="article" tilt className="project-card" style={{ '--accent': accent }} aria-labelledby={`p-${project.id}`}>
      <Cover project={project} index={number} />
      <div className="project-body">
        <div className="project-top">
          <span className="icon-tile accent-tile" aria-hidden="true">
            <Icon size={20} />
          </span>
          <span className="mono project-num" aria-hidden="true">
            {String(number).padStart(2, '0')}
          </span>
        </div>
        <h3 id={`p-${project.id}`}>
          <Words>{name}</Words>
        </h3>
        <p className="tagline">
          <Words>{tagline}</Words>
        </p>
        <p className="project-desc">
          <Words step={14}>{description}</Words>
        </p>

        <ul className="tech-list" aria-label="Technologies">
          {tech.map((t) => (
            <li key={t} className="tech-badge">
              {t}
            </li>
          ))}
        </ul>

        <ul className="feature-list" aria-label="Key features">
          {features.slice(0, 4).map((f) => (
            <li key={f}>
              <Check size={15} aria-hidden="true" />
              {f}
            </li>
          ))}
        </ul>

        <div className="project-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onOpen(project.id)}>
            View details <ArrowUpRight size={16} aria-hidden="true" />
          </button>
          {links.repo ? (
            <a className="btn btn-secondary btn-sm" href={links.repo} target="_blank" rel="noopener noreferrer">
              <GithubIcon size={16} /> GitHub
            </a>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" disabled title="Repository link will be added soon">
              <GithubIcon size={16} /> GitHub · soon
            </button>
          )}
          {links.live ? (
            <a className="btn btn-secondary btn-sm" href={links.live} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={16} aria-hidden="true" /> Live demo
            </a>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" disabled title="Live demo link will be added soon">
              <ExternalLink size={16} aria-hidden="true" /> Live demo · soon
            </button>
          )}
        </div>
      </div>
    </Spotlight>
  )
}

export default function Projects() {
  const [filter, setFilter] = useState('All')
  const [activeId, setActiveId] = useState(null)

  // The command palette asks for a project by id.
  useEffect(() => {
    const onOpen = (event) => {
      setFilter('All')
      setActiveId(event.detail)
    }
    window.addEventListener('open-project', onOpen)
    return () => window.removeEventListener('open-project', onOpen)
  }, [])

  const visible = projects.filter((p) => filter === 'All' || p.categories.includes(filter))
  const countFor = (f) => (f === 'All' ? projects.length : projects.filter((p) => p.categories.includes(f)).length)
  const active = projects.find((p) => p.id === activeId)

  return (
    <Section
      id="projects"
      index={3}
      label="Projects"
      title={<>Selected <em>projects</em></>}
      subtitle="AI/DS, real-time and full-stack work. Open a project for its screenshots and full feature list."
    >
      <Reveal className="filter-bar" role="group" aria-label="Filter projects by category">
        {projectFilters.map((f) => (
          <button key={f} type="button" className="filter-chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f}
            <span className="count">{countFor(f)}</span>
          </button>
        ))}
      </Reveal>
      <p className="sr-only" role="status">
        Showing {visible.length} {visible.length === 1 ? 'project' : 'projects'}
        {filter !== 'All' ? ` in ${filter}` : ''}
      </p>

      <ul className="project-grid" key={filter}>
        {visible.map((project, i) => (
          <Reveal as="li" key={project.id} delay={i * 70}>
            <ProjectCard project={project} number={projects.indexOf(project) + 1} onOpen={setActiveId} />
          </Reveal>
        ))}
      </ul>

      {active && <ProjectModal key={active.id} project={active} onClose={() => setActiveId(null)} />}
    </Section>
  )
}
