import { useEffect, useRef } from 'react'
import { Check, ExternalLink, X } from 'lucide-react'
import ShotGallery from './ShotGallery.jsx'
import { GithubIcon } from './Icons.jsx'

// Project detail view built on the native <dialog>: focus trap, Escape and focus return come for free.
export default function ProjectModal({ project, onClose }) {
  const ref = useRef(null)
  const { name, tagline, icon: Icon, accent, categories, tech, description, features, links, screenshots } = project

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="project-modal-title"
      style={{ '--accent': accent }}
      onClose={onClose}
      onClick={(event) => event.target === event.currentTarget && event.currentTarget.close()}
    >
      <div className="modal-inner">
        <header className="modal-head">
          <span className="icon-tile icon-tile-lg accent-tile" aria-hidden="true">
            <Icon size={24} />
          </span>
          <div>
            <h3 id="project-modal-title">{name}</h3>
            <p className="tagline">{tagline}</p>
          </div>
          <button type="button" className="icon-btn modal-close" aria-label="Close project details" onClick={() => ref.current?.close()}>
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <ShotGallery shots={screenshots} name={name} />

        <div className="modal-body">
          <p>{description}</p>

          <h4>Technologies</h4>
          <ul className="tech-list">
            {tech.map((t) => (
              <li key={t} className="tech-badge">
                {t}
              </li>
            ))}
          </ul>

          <h4>Key features</h4>
          <ul className="feature-list feature-list-lg">
            {features.map((f) => (
              <li key={f}>
                <Check size={16} aria-hidden="true" />
                {f}
              </li>
            ))}
          </ul>

          <div className="modal-foot">
            <ul className="tech-list" aria-label="Categories">
              {categories.map((c) => (
                <li key={c} className="tag">
                  {c}
                </li>
              ))}
            </ul>
            <div className="project-actions">
              {links.repo ? (
                <a className="btn btn-secondary btn-sm" href={links.repo} target="_blank" rel="noopener noreferrer">
                  <GithubIcon size={16} /> GitHub
                </a>
              ) : (
                <button type="button" className="btn btn-ghost btn-sm" disabled>
                  <GithubIcon size={16} /> GitHub link coming soon
                </button>
              )}
              {links.live ? (
                <a className="btn btn-primary btn-sm" href={links.live} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={16} aria-hidden="true" /> Live demo
                </a>
              ) : (
                <button type="button" className="btn btn-ghost btn-sm" disabled>
                  <ExternalLink size={16} aria-hidden="true" /> Live demo coming soon
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </dialog>
  )
}
