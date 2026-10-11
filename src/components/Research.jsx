import { Fragment } from 'react'
import Section from './Section.jsx'
import Reveal from './Reveal.jsx'
import Words from './Words.jsx'
import { papers } from '../data/research.js'
import './ResearchFormat.css'

// Status badge. Plain text first, so it stays readable and accessible.
function Stamp({ status, reference }) {
  return (
    <div className="paper-status">
      <p className={`stamp stamp--${status.tone}`}>
        <span className="sr-only">Status: </span>
        <strong className="stamp-label">{status.label}</strong>
        {status.sub && (
          <>
            {' '}
            <span className="stamp-sub">{status.sub}</span>
          </>
        )}
      </p>
      {reference && <p className="paper-ref">{reference}</p>}
    </div>
  )
}

function Paper({ paper }) {
  const { id, number, meta, status, reference, title, authors, affiliation, abstract, figure, caption, contributions, description } = paper
  const titleId = `${id}-title`

  return (
    <Reveal as="article" className="paper" aria-labelledby={titleId}>
      {/* left rail: paper number, status and where it was submitted */}
      <aside className="paper-rail">
        <p className="paper-no">{number}</p>
        <Stamp status={status} reference={reference} />
        <header className="paper-meta">
          <p className="paper-conf">
            {meta.map((item, i) => (
              <Fragment key={item.text}>
                {i > 0 && (
                  <>
                    {' '}
                    <span className="dot" aria-hidden="true">
                      ·
                    </span>{' '}
                  </>
                )}
                <span className={item.strong ? 'conf-strong' : undefined}>{item.text}</span>
              </Fragment>
            ))}
          </p>
        </header>
      </aside>

      {/* main column: title, authors, then the abstract, figure and contributions */}
      <div className="paper-main">
        <h3 id={titleId} className="paper-title">
          <Words>{title}</Words>
        </h3>

        {authors && (
          <p className="paper-authors">
            <Words>
              {authors.map((author, i) => (
                <Fragment key={author.name}>
                  {i > 0 && ', '}
                  {author.highlight ? <strong className="me">{author.name}</strong> : author.name}
                </Fragment>
              ))}
              {' · '}
              {affiliation}
            </Words>
          </p>
        )}

        {description && (
          <p className="paper-desc">
            <Words step={16}>{description}</Words>
          </p>
        )}

        {abstract && (
          <div className="paper-body">
            <section aria-labelledby={`${id}-abstract`}>
              <h4 id={`${id}-abstract`} className="paper-label">
                Abstract
              </h4>
              <p className="paper-abstract">
                <span className="dropcap">{abstract[0]}</span>
                <Words step={16}>{abstract.slice(1)}</Words>
              </p>
            </section>

            {caption &&
              (figure?.src ? (
                <figure className="paper-figure">
                  <img src={figure.src} alt={figure.alt} width={figure.width} height={figure.height} loading="lazy" decoding="async" />
                  <figcaption>
                    <span className="fig-no">{caption.label}</span> — {caption.text}
                  </figcaption>
                </figure>
              ) : (
                <p className="paper-caption">
                  <span className="fig-no">{caption.label}</span> — {caption.text}
                </p>
              ))}

            {contributions && (
              <section aria-labelledby={`${id}-contrib`}>
                <h4 id={`${id}-contrib`} className="paper-label">
                  Contributions
                </h4>
                <ol className="contrib">
                  {contributions.map((text, i) => (
                    <li key={text}>
                      <span className="contrib-no" aria-hidden="true">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="contrib-text">
                        <Words>{text}</Words>
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
        )}
      </div>
    </Reveal>
  )
}

export default function Research() {
  return (
    <Section
      id="research"
      index={4}
      label="Research"
      title={
        <>
          Research <em>papers</em>
        </>
      }
      subtitle="One manuscript, currently under review."
    >
      <div className="papers">
        {papers.map((paper) => (
          <Paper key={paper.id} paper={paper} />
        ))}
      </div>
    </Section>
  )
}
