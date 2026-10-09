import { GraduationCap } from 'lucide-react'
import Section from './Section.jsx'
import Reveal from './Reveal.jsx'
import Spotlight from './Spotlight.jsx'
import { education, focusAreas, summary } from '../data/content.js'

export default function About() {
  return (
    <Section
      id="about"
      index={1}
      label="About"
      title={<>Building practical technology with <em>AI</em> and software</>}
    >
      <div className="about-grid">
        <div className="about-main">
          <Reveal as="p" className="lead">
            {summary}
          </Reveal>
          <ul className="focus-grid">
            {focusAreas.map(({ icon: Icon, title, text }, i) => (
              <Reveal as="li" key={title} delay={i * 70}>
                <Spotlight className="focus-card">
                  <span className="icon-tile" aria-hidden="true">
                    <Icon size={20} />
                  </span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </Spotlight>
              </Reveal>
            ))}
          </ul>
        </div>

        <div className="about-edu">
          <Reveal as="h3" className="subhead">
            <GraduationCap size={18} aria-hidden="true" /> Education
          </Reveal>
          <ol className="timeline">
            {education.map((item, i) => (
              <Reveal as="li" key={item.school} className="timeline-item" delay={i * 100}>
                <span className="timeline-dot" aria-hidden="true" />
                <Spotlight className="timeline-card">
                  <div className="timeline-meta">
                    <span className="mono">{item.period}</span>
                    <span className="tag">{item.tag}</span>
                  </div>
                  <h4>{item.school}</h4>
                  <p>{item.program}</p>
                </Spotlight>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </Section>
  )
}
