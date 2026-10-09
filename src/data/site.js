import { GithubIcon, LinkedinIcon } from '../components/Icons.jsx'

// ---------------------------------------------------------------------------
// Edit this file to change identity details, social links and nav items.
// ---------------------------------------------------------------------------

export const site = {
  name: 'Dinesh G',
  roleParts: ['Artificial Intelligence & Data Science Student', 'AI/ML', 'Software Development'],
  intro:
    'I am an Artificial Intelligence and Data Science student passionate about AI/ML, data-driven applications, web development, and software engineering. I enjoy solving real-world problems, building practical technology solutions, and participating in hackathons and innovative projects.',
  email: 'dineshsekar6618@gmail.com',
  phone: '9597026618',
  phoneHref: '+919597026618', // assumes an Indian (+91) number
  location: 'Chennai, India',
  coords: '13.08°N 80.27°E', // Chennai, shown as a small technical detail in the hero
  timeZone: 'Asia/Kolkata',
  resume: { href: '/resume.pdf', filename: 'Dinesh_G_Resume.pdf' },
  // Front-page photo. Replace public/profile.webp (keep width/height in sync with the new file).
  heroImage: { src: '/profile.webp', alt: 'Portrait of Dinesh G', width: 502, height: 567 },
  // Optional form endpoint (set VITE_CONTACT_ENDPOINT in .env.local / Vercel).
  // Empty -> the contact form falls back to opening the visitor's email app.
  contactEndpoint: import.meta.env.VITE_CONTACT_ENDPOINT || '',
}

// Leave a URL empty ('') and that link is simply not shown anywhere on the site.
export const socials = [
  { id: 'github', label: 'GitHub', href: 'https://github.com/Dinesh6618/', icon: GithubIcon },
  { id: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/dinesh6618/', icon: LinkedinIcon },
]

export const activeSocials = socials.filter((s) => s.href)

export const navLinks = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'achievements', label: 'Achievements' },
  { id: 'contact', label: 'Contact' },
]

export const sectionIds = navLinks.map((l) => l.id)
