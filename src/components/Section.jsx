import Reveal from './Reveal.jsx'

// Shared section shell: numbered kicker, heading and optional subtitle.
export default function Section({ id, index, label, title, subtitle, className = '', children }) {
  return (
    <section
      id={id}
      className={`section${className ? ` ${className}` : ''}`}
      data-index={String(index).padStart(2, '0')}
      aria-labelledby={`${id}-title`}
    >
      <div className="container">
        <Reveal className="section-head">
          <p className="kicker">
            <span>{String(index).padStart(2, '0')}</span> / {label}
          </p>
          <h2 id={`${id}-title`}>{title}</h2>
          {subtitle && <p className="section-sub">{subtitle}</p>}
        </Reveal>
        {children}
      </div>
    </section>
  )
}
