import { CalendarDays } from 'lucide-react'
import Section from './Section.jsx'
import Reveal from './Reveal.jsx'
import Spotlight from './Spotlight.jsx'
import { experience } from '../data/content.js'

export default function Experience() {
  return (
    <Section
      id="experience"
      index={4}
      label="Experience"
      title={<>Internship <em>experience</em></>}
    >
      <ol className="timeline timeline-wide">
        {experience.map(({ role, company, icon: Icon, start, end, points }) => (
          <Reveal as="li" key={`${company}-${role}`} className="timeline-item">
            <span className="timeline-dot" aria-hidden="true" />
            <Spotlight className="experience-card">
              <div className="experience-head">
                <span className="icon-tile icon-tile-lg" aria-hidden="true">
                  <Icon size={24} />
                </span>
                <div>
                  <h3>{role}</h3>
                  <p className="company">{company}</p>
                </div>
                <p className="date-range">
                  <CalendarDays size={15} aria-hidden="true" />
                  <time dateTime={start.iso}>{start.label}</time> – <time dateTime={end.iso}>{end.label}</time>
                </p>
              </div>
              <ul className="bullets">
                {points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </Spotlight>
          </Reveal>
        ))}
      </ol>
    </Section>
  )
}
