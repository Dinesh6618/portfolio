import { useEffect, useRef, useState } from 'react'
import { Download, Menu, Search, X } from 'lucide-react'
import { navLinks, sectionIds, site } from '../data/site.js'
import useActiveSection from '../hooks/useActiveSection.js'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const toggleRef = useRef(null)
  const headerRef = useRef(null)
  const active = useActiveSection(sectionIds)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12)
      // Reading progress drives the thin gold line under the bar (no re-render needed).
      const max = document.documentElement.scrollHeight - window.innerHeight
      headerRef.current?.style.setProperty('--progress', max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : '0')
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Mobile menu: Escape closes, body scroll locks, desktop resize resets.
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    const onResize = () => window.innerWidth >= 900 && setOpen(false)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <header ref={headerRef} className={`navbar${scrolled || open ? ' is-solid' : ''}`}>
      <div className="container navbar-inner">
        <a href="#home" className="brand" aria-label="Dinesh G, back to top" onClick={() => setOpen(false)}>
          <span className="brand-mark" aria-hidden="true">
            DG
          </span>
          <span className="brand-name">Dinesh G</span>
        </a>

        <nav id="primary-nav" className={`nav${open ? ' is-open' : ''}`} aria-label="Primary">
          <ul>
            {navLinks.map((link) => (
              <li key={link.id}>
                <a
                  href={`#${link.id}`}
                  className={active === link.id ? 'is-active' : undefined}
                  aria-current={active === link.id ? 'location' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            className="btn btn-secondary btn-sm nav-resume"
            href={site.resume.href}
            download={site.resume.filename}
            onClick={() => setOpen(false)}
          >
            <Download size={16} aria-hidden="true" /> Resume
          </a>
        </nav>

        <button
          type="button"
          className="palette-btn"
          aria-label="Open command menu"
          aria-keyshortcuts="Control+K Meta+K"
          onClick={() => window.dispatchEvent(new Event('open-palette'))}
        >
          <Search size={16} aria-hidden="true" />
          <kbd aria-hidden="true">{/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl K'}</kbd>
        </button>

        <button
          ref={toggleRef}
          type="button"
          className="nav-toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="primary-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
        </button>
      </div>
      <span className="scroll-progress" aria-hidden="true" />
    </header>
  )
}
