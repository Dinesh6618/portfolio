import { skillGroups } from '../data/content.js'

const names = skillGroups.flatMap((group) => group.skills.map((skill) => skill.name))

// Decorative skills ticker. Two identical rows scroll -50% for a seamless loop.
export default function Marquee() {
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {[0, 1].map((copy) => (
          <ul className="marquee-row" key={copy}>
            {names.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}
