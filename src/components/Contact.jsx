import { useRef, useState } from 'react'
import { CircleAlert, CircleCheck, Copy, Check, LoaderCircle, Mail, MapPin, Phone, Send } from 'lucide-react'
import Section from './Section.jsx'
import Reveal from './Reveal.jsx'
import Spotlight from './Spotlight.jsx'
import { activeSocials, site } from '../data/site.js'

const EMPTY = { name: '', email: '', subject: '', message: '', website: '' } // `website` is a honeypot
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function validate(values) {
  const errors = {}
  if (values.name.trim().length < 2) errors.name = 'Please enter your name.'
  if (!EMAIL_RE.test(values.email.trim())) errors.email = 'Please enter a valid email address.'
  if (values.subject.trim().length < 3) errors.subject = 'Please add a short subject (at least 3 characters).'
  if (values.message.trim().length < 10) errors.message = 'Your message should be at least 10 characters.'
  return errors
}

function CopyEmail() {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email)
    } catch {
      const temp = document.createElement('textarea')
      temp.value = site.email
      temp.setAttribute('readonly', '')
      temp.style.position = 'fixed'
      temp.style.opacity = '0'
      document.body.appendChild(temp)
      temp.select()
      document.execCommand('copy')
      temp.remove()
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button type="button" className="copy-btn" onClick={copy} aria-label="Copy email address">
      {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
      <span aria-live="polite">{copied ? 'Copied!' : 'Copy'}</span>
    </button>
  )
}

function Field({ id, label, error, children }) {
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}

function ContactForm() {
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | sending | sent | opened | error
  const formRef = useRef(null)

  const update = (event) => {
    const { name, value } = event.target
    setValues((v) => ({ ...v, [name]: value }))
    if (errors[name]) setErrors((e) => ({ ...e, [name]: undefined }))
  }

  const mailtoHref = () => {
    const body = `${values.message.trim()}\n\n— ${values.name.trim()} (${values.email.trim()})`
    return `mailto:${site.email}?subject=${encodeURIComponent(values.subject.trim())}&body=${encodeURIComponent(body)}`
  }

  const submit = async (event) => {
    event.preventDefault()
    if (values.website) return // honeypot filled: almost certainly a bot

    const found = validate(values)
    setErrors(found)
    const firstInvalid = ['name', 'email', 'subject', 'message'].find((key) => found[key])
    if (firstInvalid) {
      setStatus('idle')
      formRef.current?.elements[firstInvalid]?.focus()
      return
    }

    // No backend configured: be upfront and hand the message to the visitor's email app.
    if (!site.contactEndpoint) {
      window.location.href = mailtoHref()
      setStatus('opened')
      return
    }

    setStatus('sending')
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12000)
    try {
      const response = await fetch(site.contactEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          subject: values.subject.trim(),
          message: values.message.trim(),
        }),
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(`Request failed (${response.status})`)
      setStatus('sent')
      setValues(EMPTY)
    } catch {
      setStatus('error')
    } finally {
      clearTimeout(timer)
    }
  }

  const describe = (key) => (errors[key] ? `${key}-error` : undefined)
  const sending = status === 'sending'

  return (
    <form ref={formRef} className="contact-form" onSubmit={submit} noValidate>
      <div className="form-row">
        <Field id="name" label="Name" error={errors.name}>
          <input id="name" name="name" type="text" autoComplete="name" maxLength={80} value={values.name} onChange={update} aria-invalid={Boolean(errors.name)} aria-describedby={describe('name')} />
        </Field>
        <Field id="email" label="Email" error={errors.email}>
          <input id="email" name="email" type="email" autoComplete="email" maxLength={120} value={values.email} onChange={update} aria-invalid={Boolean(errors.email)} aria-describedby={describe('email')} />
        </Field>
      </div>
      <Field id="subject" label="Subject" error={errors.subject}>
        <input id="subject" name="subject" type="text" maxLength={120} value={values.subject} onChange={update} aria-invalid={Boolean(errors.subject)} aria-describedby={describe('subject')} />
      </Field>
      <Field id="message" label="Message" error={errors.message}>
        <textarea id="message" name="message" rows={6} maxLength={2000} value={values.message} onChange={update} aria-invalid={Boolean(errors.message)} aria-describedby={describe('message')} />
      </Field>

      {/* Honeypot: hidden from people and assistive tech, bots tend to fill it. */}
      <div className="hp" aria-hidden="true">
        <label htmlFor="website">Leave this field empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={values.website} onChange={update} />
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={sending}>
          {sending ? <LoaderCircle size={18} className="spin" aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
          {sending ? 'Sending…' : 'Send message'}
        </button>
        {!site.contactEndpoint && (
          <p className="form-hint">Submitting opens your email app with this message pre-filled.</p>
        )}
      </div>

      <div className="form-status" role="status" aria-live="polite">
        {status === 'sent' && (
          <p className="notice notice-success">
            <CircleCheck size={18} aria-hidden="true" /> Thanks! Your message was sent. I will get back to you soon.
          </p>
        )}
        {status === 'opened' && (
          <p className="notice notice-info">
            <Mail size={18} aria-hidden="true" />
            <span>
              Your email app should open with the message ready. Nothing is sent until you press send there.{' '}
              <a href={mailtoHref()}>Open it again</a> or write to <a href={`mailto:${site.email}`}>{site.email}</a>.
            </span>
          </p>
        )}
        {status === 'error' && (
          <p className="notice notice-error">
            <CircleAlert size={18} aria-hidden="true" />
            <span>
              Sorry, the message could not be sent. Please try again or email <a href={`mailto:${site.email}`}>{site.email}</a> directly.
            </span>
          </p>
        )}
      </div>
    </form>
  )
}

export default function Contact() {
  return (
    <Section
      id="contact"
      index={6}
      label="Contact"
      title={<>Let&apos;s build something <em>together</em></>}
      subtitle="Reach out about internships, hackathons or software projects. Email is the quickest way to get me."
    >
      <div className="contact-grid">
        <Reveal className="contact-info">
          <Spotlight className="contact-card">
            <span className="icon-tile" aria-hidden="true">
              <Mail size={20} />
            </span>
            <div className="contact-text">
              <p className="contact-label">Email</p>
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </div>
            <CopyEmail />
          </Spotlight>
          <Spotlight className="contact-card">
            <span className="icon-tile" aria-hidden="true">
              <Phone size={20} />
            </span>
            <div className="contact-text">
              <p className="contact-label">Phone</p>
              <a href={`tel:${site.phoneHref}`}>{site.phone}</a>
            </div>
          </Spotlight>
          <Spotlight className="contact-card">
            <span className="icon-tile" aria-hidden="true">
              <MapPin size={20} />
            </span>
            <div className="contact-text">
              <p className="contact-label">Location</p>
              <p>{site.location}</p>
            </div>
          </Spotlight>
          {activeSocials.map(({ id, label, href, icon: Icon }) => (
            <Spotlight key={id} className="contact-card">
              <span className="icon-tile" aria-hidden="true">
                <Icon size={20} />
              </span>
              <div className="contact-text">
                <p className="contact-label">{label}</p>
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {href.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </div>
            </Spotlight>
          ))}
          <p className="terminal-line mono" aria-hidden="true">
            <span>dinesh@portfolio</span>:~$ say hello<span className="caret" />
          </p>
        </Reveal>

        <Reveal delay={100}>
          <Spotlight className="form-card">
            <ContactForm />
          </Spotlight>
        </Reveal>
      </div>
    </Section>
  )
}
