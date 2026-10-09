import { useEffect, useState } from 'react'
import { ArrowUpRight, Check, ExternalLink } from 'lucide-react'
import Section from './Section.jsx'
import Reveal from './Reveal.jsx'
import Spotlight from './Spotlight.jsx'
import ProjectModal from './ProjectModal.jsx'
import { GithubIcon } from './Icons.jsx'
import { projectFilters, projects } from '../data/content.js'

// Card cover: first screenshot when it loads, otherwise an abstract accent-coloured tile.
function Cover({ project }) {
  const [failed, setFailed] = useState(false)
  const first = project.screenshots[0]
  const Icon = project.icon

  return (
    <div className="project-cover" aria-hidden="true">
      <div className="shot-chrome">
        <i />
        <i />
        <i />
        <span>{project.name.toLowerCase().replace(/\s+/g, '-')}</span>
      </div>
      <div className="cover-media">
        {first && !failed ? (
          <img src={first.src} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
        ) : (
          <div className="cover-art">
            <Icon size={56} strokeWidth={1.4} />
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
      <Cover project={project} />
      <div className="project-body">
        <div className="project-top">
          <span className="icon-tile accent-tile" aria-hidden="true">
            <Icon size={20} />
          </span>
          <span className="mono project-num" aria-hidden="true">
            {String(number).padStart(2, '0')}
          </span>
        </div>
        <h3 id={`p-${project.id}`}>{name}</h3>
        <p className="tagline">{tagline}</p>
        <p className="project-desc">{description}</p>

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
      subtitle="AI/ML, real-time and full-stack work. Open a project for its screenshots and full feature list."
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
