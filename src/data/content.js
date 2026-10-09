import {
  Ambulance,
  BarChart3,
  Binary,
  BookOpen,
  Brain,
  CalendarCheck,
  Cloud,
  Coffee,
  Code2,
  Database,
  FileCode2,
  GitBranch,
  Globe,
  HeartPulse,
  Layers,
  Palette,
  ScanEye,
  ScanSearch,
  Terminal,
  Webhook,
  Wrench,
  Zap,
  Braces,
  Cpu,
  Globe2,
  Workflow,
} from 'lucide-react'
import { GithubIcon } from '../components/Icons.jsx'

// ---------------------------------------------------------------------------
// All portfolio copy lives here, so the components stay presentational.
// ---------------------------------------------------------------------------

export const summary =
  'Artificial Intelligence and Data Science student with experience in developing AI/ML, data-driven, web, and software-based projects. Passionate about problem-solving, hackathons, and building practical technology solutions. Experienced in Python, machine learning, data analysis, databases, APIs, cloud platforms, and modern development tools.'

export const focusAreas = [
  { icon: Brain, title: 'AI / ML', text: 'Machine learning, computer vision and data analysis.' },
  { icon: BarChart3, title: 'Data-driven apps', text: 'Applications that turn data into useful decisions.' },
  { icon: Globe2, title: 'Web & software', text: 'Full-stack products with APIs, databases and cloud services.' },
  { icon: Workflow, title: 'Hackathons', text: 'Building practical solutions to real-world problems.' },
]

export const education = [
  {
    school: 'Rajalakshmi Engineering College, Chennai',
    program: 'B.Tech. Computer Science Engineering',
    period: '2024 – 2028',
    tag: 'Pursuing',
  },
  {
    school: 'Elite School, Chennai',
    program: 'Higher Secondary Education',
    period: '2024',
    tag: 'Completed',
  },
]

export const skillGroups = [
  {
    id: 'programming',
    title: 'Programming',
    icon: Code2,
    skills: [
      { name: 'Python', icon: Terminal },
      { name: 'Java', icon: Coffee },
      { name: 'C/C++', icon: Binary },
    ],
  },
  {
    id: 'web',
    title: 'Web Development',
    icon: Globe,
    skills: [
      { name: 'HTML', icon: FileCode2 },
      { name: 'CSS', icon: Palette },
    ],
  },
  {
    id: 'database',
    title: 'Database',
    icon: Database,
    skills: [
      { name: 'MySQL', icon: Database },
      { name: 'MongoDB', icon: Layers },
    ],
  },
  {
    id: 'ai-ml',
    title: 'AI / ML',
    icon: Brain,
    skills: [
      { name: 'Machine Learning', icon: Brain },
      { name: 'Data Analysis', icon: BarChart3 },
      { name: 'Computer Vision', icon: ScanEye },
    ],
  },
  {
    id: 'tools',
    title: 'Tools',
    icon: Wrench,
    skills: [
      { name: 'Git', icon: GitBranch },
      { name: 'GitHub', icon: GithubIcon },
      { name: 'VS Code', icon: Braces },
    ],
  },
  {
    id: 'cloud',
    title: 'Cloud / Backend',
    icon: Cloud,
    skills: [
      { name: 'Supabase', icon: Zap },
      { name: 'Cloudflare Workers', icon: Cloud },
      { name: 'REST APIs', icon: Webhook },
    ],
  },
]

export const projectFilters = ['All', 'AI / ML', 'Full-Stack', 'Real-time', 'Web']

// Screenshots live in /public/projects/. A missing file just shows a labelled placeholder.
// Set `links.repo` / `links.live` to a real URL to enable those buttons.
const shot = (file, caption) => ({ src: `/projects/${file}`, caption })

export const projects = [
  {
    id: 'click',
    name: 'CLICK',
    tagline: 'Programming Using C Learning Platform',
    icon: BookOpen,
    accent: '#f2cf5b',
    categories: ['Full-Stack', 'Web'],
    tech: ['JavaScript', 'Supabase', 'Cloudflare Workers', 'VS Code Extension API'],
    description:
      'Built a C-learning platform for college students with microlearning, tests, and progress tracking. Shipped as a PWA, Windows executable, Android APK, and TypeScript VS Code extension for in-editor practice, backed by Supabase PostgreSQL and session authentication on Cloudflare Workers.',
    features: [
      'Interactive C programming learning.',
      'Tests and student progress tracking.',
      'Progressive Web App.',
      'Windows and Android support.',
      'VS Code extension integration.',
      'Supabase-backed storage and authentication.',
    ],
    links: { repo: '', live: '' },
    screenshots: [
      shot('click-home.webp', 'Home: welcome hero and the learning path'),
      shot('click-lesson.webp', 'Microlearning lesson: the three parts of a for loop'),
      shot('click-fill-code.webp', 'Chapter test: fill in the missing parts of a C program'),
      shot('click-test-complete.webp', 'Chapter test complete with XP awarded'),
      shot('click-practice.webp', 'Practice problem with sample input/output, opened in VS Code'),
    ],
  },
  {
    id: 'sevps',
    name: 'SEVPS',
    tagline: 'Smart Emergency Vehicle Priority System',
    icon: Ambulance,
    accent: '#d4af37',
    categories: ['Full-Stack', 'Real-time', 'AI / ML'],
    tech: ['Django', 'DRF', 'Django Channels', 'PostgreSQL/PostGIS', 'React', 'Docker'],
    description:
      'Developed a real-time emergency vehicle platform providing ambulance traffic-signal priority, fastest routing over PostGIS spatial data, and live hospital readiness tracking. Included admin, driver, paramedic, and hospital dashboards with WebSocket updates, push notifications, and explainable ML estimators.',
    features: [
      'Real-time ambulance tracking.',
      'Emergency route optimization.',
      'Traffic signal priority.',
      'Hospital readiness monitoring.',
      'Live dashboard updates.',
      'Explainable ML estimators.',
    ],
    links: { repo: '', live: '' },
    screenshots: [
      shot('sevps-operations-map.webp', 'Operations map: live ambulances, signals and traffic flow'),
      shot('sevps-analytics.webp', 'Admin analytics: response-time and demand charts'),
      shot('sevps-hospital.webp', 'Hospital dashboard: readiness, resources and inbound ambulance alerts'),
      shot('sevps-paramedic.webp', 'Paramedic app: recommended hospital selection'),
      shot('sevps-driver.webp', 'Driver app: navigation with green-corridor signals ahead'),
    ],
  },
  {
    id: 'gramsentinel',
    name: 'GramSentinel',
    tagline: 'Multi-Agent Rural Health Warning System',
    icon: HeartPulse,
    accent: '#e8c14f',
    categories: ['Full-Stack', 'Real-time', 'AI / ML'],
    tech: ['React', 'TypeScript', 'Django REST', 'PostgreSQL', 'Django Channels', 'WebSockets'],
    description:
      'Developed a multi-agent rural healthcare platform connecting ASHA/health-worker observations with community-level early-warning intelligence. Combined individual RuralCare decision support, multi-source signal correlation, deterministic safety verification, real-time dashboards, and human-led investigation.',
    features: [
      'Rural healthcare monitoring.',
      'Early-warning intelligence.',
      'Multi-source signal correlation.',
      'Real-time dashboards.',
      'Human-led investigation workflow.',
    ],
    links: { repo: '', live: '' },
    screenshots: [],
  },
  {
    id: 'eventflow',
    name: 'EventFlow',
    tagline: 'Intelligent College Event Management Platform',
    icon: CalendarCheck,
    accent: '#c9a227',
    categories: ['Web', 'AI / ML'],
    tech: ['JavaScript', 'SQL', 'CSS', 'HTML', 'Markdown', 'JSON'],
    description:
      'Built a centralized platform for college events, registrations, and participants with QR-based attendance, scheduling, team management, certificates, and feedback. Integrated AI-powered event planning, recommendations, analytics, and responsive role-based access for students, organizers, and administrators.',
    features: [
      'Event creation and registration.',
      'QR-code attendance.',
      'Team and schedule management.',
      'Certificate management.',
      'AI-powered recommendations.',
      'Separate student, organizer, and administrator interfaces.',
    ],
    links: { repo: '', live: '' },
    screenshots: [
      shot('eventflow-landing.webp', 'Landing page for the AI-powered college event platform'),
      shot('eventflow-explore.webp', 'Student view: explore events with search and category filters'),
      shot('eventflow-student-home.webp', 'Student home: registrations, upcoming events and quick access to help'),
      shot('eventflow-event-details.webp', 'Event details: schedule, prizes, rules, FAQs and registration'),
      shot('eventflow-organizer-dashboard.webp', 'Organizer dashboard: events, participants, attendance and registration trend'),
    ],
  },
  {
    id: 'roadmind',
    name: 'RoadMind AI',
    tagline: 'AI-Powered Road Damage Detection & Safer Route Recommendation',
    icon: ScanSearch,
    accent: '#f7dc7a',
    categories: ['AI / ML'],
    tech: ['Python', 'Computer Vision', 'Machine Learning', 'GIS'],
    description:
      'Built an AI-powered road intelligence platform that detects and classifies road damage from images, predicts future deterioration, assesses severity, prioritizes maintenance, and visualizes road conditions on an interactive map. Recommends safer alternative routes using road-risk data.',
    features: [
      'Road damage detection.',
      'Image classification.',
      'Road deterioration prediction.',
      'Road severity analysis.',
      'Interactive GIS map.',
      'Safer route recommendations.',
    ],
    links: { repo: '', live: '' },
    screenshots: [],
  },
]

export const achievements = [
  {
    event: 'VMEDITTHON V3.0',
    badge: 'Finalist',
    text: 'Selected as a finalist at VMEDITTHON V3.0.',
  },
  {
    event: "CIH'26",
    badge: 'Finalist',
    text: "Selected as a finalist at CIH'26.",
  },
]

export const experience = [
  {
    role: 'IoT Intern',
    company: 'Triz Technologies Pvt. Ltd.',
    icon: Cpu,
    start: { iso: '2025-12-17', label: '17 December 2025' },
    end: { iso: '2026-01-03', label: '3 January 2026' },
    points: [
      'Worked on IoT-based projects involving connected devices, sensors, and data-driven solutions.',
      'Gained hands-on experience in IoT technologies, device integration, and real-time data handling.',
      'Collaborated with the technical team to understand, develop, test, and troubleshoot IoT applications.',
    ],
  },
]
