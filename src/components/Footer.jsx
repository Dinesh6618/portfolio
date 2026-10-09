import { useEffect, useState } from 'react'
import { Mail } from 'lucide-react'
import { activeSocials, navLinks, site } from '../data/site.js'

const clock = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: site.timeZone })

export default function Footer() {
  const [time, setTime] = useState(() => clock.format(new Date()))

  useEffect(() => {
    const id = setInterval(() => setTime(clock.format(new Date())), 30000)
    return () => clearInterval(id)
  }, [])

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <a href="#home" className="brand" aria-label="Dinesh G, back to top">
            <span className="brand-mark" aria-hidden="true">
              DG
            </span>
            <span className="brand-name">Dinesh G</span>
          </a>
          <p>AI &amp; Data Science student building practical technology.</p>
        </div>

        <nav className="footer-nav" aria-label="Footer">
          <ul>
            {navLinks.slice(1).map((link) => (
              <li key={link.id}>
                <a href={`#${link.id}`}>{link.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <ul className="social-row" aria-label="Social links">
          <li>
            <a className="icon-btn" href={`mailto:${site.email}`} aria-label="Email Dinesh">
              <Mail size={18} aria-hidden="true" />
            </a>
          </li>
          {activeSocials.map(({ id, label, href, icon: Icon }) => (
            <li key={id}>
              <a className="icon-btn" href={href} target="_blank" rel="noopener noreferrer" aria-label={`${label} (opens in a new tab)`}>
                <Icon size={18} />
              </a>
            </li>
          ))}
        </ul>
      </div>
      <div className="container footer-base">
        <p>© {new Date().getFullYear()} Dinesh G. All rights reserved.</p>
        <p className="mono">
          {site.location.split(',')[0]} · {time} IST
        </p>
      </div>
      <div className="footer-mark" aria-hidden="true">
        DINESH G
      </div>
    </footer>
  )
}
