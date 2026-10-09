import { useEffect, useMemo, useRef, useState } from 'react'
import { CornerDownLeft, Copy, Download, Hash, Mail, Search } from 'lucide-react'
import { activeSocials, navLinks, site } from '../data/site.js'
import { projects } from '../data/content.js'

function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text)
  const temp = document.createElement('textarea')
  temp.value = text
  temp.setAttribute('readonly', '')
  temp.style.position = 'fixed'
  temp.style.opacity = '0'
  document.body.appendChild(temp)
  temp.select()
  document.execCommand('copy')
  temp.remove()
  return Promise.resolve()
}

// Ctrl/Cmd + K launcher. Components talk to it through window events:
//   'open-palette'  -> opens it (navbar button)
//   'open-project'  -> dispatched by it, handled in Projects
export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const [toast, setToast] = useState('')
  const dialogRef = useRef(null)
  const inputRef = useRef(null)

  const items = useMemo(() => {
    const go = (id) => () => {
      document.getElementById(id)?.scrollIntoView()
      window.history.replaceState(null, '', `#${id}`)
    }
    const notify = (message) => {
      setToast(message)
      setTimeout(() => setToast(''), 2200)
    }
    return [
      ...navLinks.map((link) => ({
        id: `go-${link.id}`,
        group: 'Go to',
        label: link.label,
        hint: `#${link.id}`,
        icon: Hash,
        run: go(link.id),
      })),
      ...projects.map((project) => ({
        id: `project-${project.id}`,
        group: 'Projects',
        label: project.name,
        hint: project.tagline,
        keywords: project.tech.join(' '),
        icon: project.icon,
        run: () => window.dispatchEvent(new CustomEvent('open-project', { detail: project.id })),
      })),
      {
        id: 'resume',
        group: 'Actions',
        label: 'Download resume',
        hint: site.resume.filename,
        icon: Download,
        run: () => {
          const link = document.createElement('a')
          link.href = site.resume.href
          link.download = site.resume.filename
          link.click()
        },
      },
      {
        id: 'copy-email',
        group: 'Actions',
        label: 'Copy email address',
        hint: site.email,
        icon: Copy,
        run: () => copyText(site.email).then(() => notify('Email address copied')),
      },
      {
        id: 'send-email',
        group: 'Actions',
        label: 'Send an email',
        hint: site.email,
        icon: Mail,
        run: () => {
          window.location.href = `mailto:${site.email}`
        },
      },
      ...activeSocials.map((social) => ({
        id: `social-${social.id}`,
        group: 'Links',
        label: `Open ${social.label}`,
        hint: social.href.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''),
        icon: social.icon,
        run: () => window.open(social.href, '_blank', 'noopener,noreferrer'),
      })),
    ]
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => `${item.label} ${item.hint ?? ''} ${item.keywords ?? ''} ${item.group}`.toLowerCase().includes(q))
  }, [items, query])

  // Open / close wiring: shortcut, navbar button, native dialog.
  useEffect(() => {
    const onKey = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-palette', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-palette', onOpen)
    }
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      setQuery('')
      setIndex(0)
      dialog.showModal()
      document.body.style.overflow = 'hidden'
      inputRef.current?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  useEffect(() => {
    document.getElementById(`cmd-${index}`)?.scrollIntoView({ block: 'nearest' })
  }, [index])

  const run = (item) => {
    setOpen(false)
    // Let the dialog finish closing (and restore focus) before acting.
    setTimeout(() => item.run(), 40)
  }

  const onKeyDown = (event) => {
    if (!results.length) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setIndex((i) => (i + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setIndex((i) => (i - 1 + results.length) % results.length)
    } else if (event.key === 'Home') {
      event.preventDefault()
      setIndex(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setIndex(results.length - 1)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      run(results[Math.min(index, results.length - 1)])
    }
  }

  let lastGroup = ''
  return (
    <>
      <dialog
        ref={dialogRef}
        className="palette"
        aria-label="Command menu"
        onClose={() => {
          setOpen(false)
          document.body.style.overflow = ''
        }}
        onClick={(event) => event.target === event.currentTarget && setOpen(false)}
      >
        <div className="palette-search">
          <Search size={18} aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            placeholder="Type a command or search…"
            autoComplete="off"
            spellCheck="false"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={results.length ? `cmd-${Math.min(index, results.length - 1)}` : undefined}
            aria-label="Search commands"
            onChange={(event) => {
              setQuery(event.target.value)
              setIndex(0)
            }}
            onKeyDown={onKeyDown}
          />
          <kbd>Esc</kbd>
        </div>

        <ul id="palette-list" className="palette-list" role="listbox" aria-label="Commands">
          {results.map((item, i) => {
            const header = item.group !== lastGroup
            lastGroup = item.group
            const Icon = item.icon
            return (
              <li key={item.id} role="presentation">
                {header && <p className="palette-group">{item.group}</p>}
                <div
                  id={`cmd-${i}`}
                  role="option"
                  aria-selected={i === index}
                  className="palette-item"
                  onPointerMove={() => i !== index && setIndex(i)}
                  onClick={() => run(item)}
                >
                  <span className="palette-icon" aria-hidden="true">
                    <Icon size={16} />
                  </span>
                  <span className="palette-label">{item.label}</span>
                  {item.hint && <span className="palette-hint">{item.hint}</span>}
                  {i === index && <CornerDownLeft size={14} aria-hidden="true" className="palette-enter" />}
                </div>
              </li>
            )
          })}
          {results.length === 0 && <li className="palette-empty">No results for “{query}”</li>}
        </ul>

        <p className="palette-foot" aria-hidden="true">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> navigate
          </span>
          <span>
            <kbd>↵</kbd> select
          </span>
          <span>
            <kbd>Esc</kbd> close
          </span>
        </p>
      </dialog>

      <div className={`toast${toast ? ' is-visible' : ''}`} role="status" aria-live="polite">
        {toast}
      </div>
    </>
  )
}
