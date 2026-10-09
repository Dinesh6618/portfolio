import Section from './Section.jsx'
import Reveal from './Reveal.jsx'
import Spotlight from './Spotlight.jsx'
import { skillGroups } from '../data/content.js'

export default function Skills() {
  return (
    <Section
      id="skills"
      index={2}
      label="Skills"
      title={<>Technical <em>skills</em></>}
      subtitle="The languages, tools and platforms I build with, grouped by area."
    >
      <ul className="skills-grid">
        {skillGroups.map(({ id, title, icon: GroupIcon, skills }, i) => (
          <Reveal as="li" key={id} delay={(i % 3) * 80}>
            <Spotlight className="skill-card">
              <div className="skill-head">
                <span className="icon-tile" aria-hidden="true">
                  <GroupIcon size={20} />
                </span>
                <h3>{title}</h3>
              </div>
              <ul className="chip-list">
                {skills.map(({ name, icon: Icon }) => (
                  <li key={name} className="chip">
                    <Icon size={15} aria-hidden="true" />
                    {name}
                  </li>
                ))}
              </ul>
            </Spotlight>
          </Reveal>
        ))}
      </ul>
    </Section>
  )
}
