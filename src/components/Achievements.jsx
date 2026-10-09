import { Medal, Trophy } from 'lucide-react'
import Section from './Section.jsx'
import Reveal from './Reveal.jsx'
import Spotlight from './Spotlight.jsx'
import { achievements } from '../data/content.js'

export default function Achievements() {
  return (
    <Section
      id="achievements"
      index={5}
      label="Achievements"
      title={<>Hackathons &amp; <em>achievements</em></>}
    >
      <ul className="award-grid">
        {achievements.map(({ event, badge, text }, i) => (
          <Reveal as="li" key={event} delay={i * 90}>
            <Spotlight className="award-card">
              <span className="award-icon" aria-hidden="true">
                <Trophy size={26} />
              </span>
              <div>
                <span className="badge">
                  <Medal size={14} aria-hidden="true" /> {badge}
                </span>
                <h3>{event}</h3>
                <p>{text}</p>
              </div>
            </Spotlight>
          </Reveal>
        ))}
      </ul>
    </Section>
  )
}
