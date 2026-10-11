import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import About from './components/About.jsx'
import Skills from './components/Skills.jsx'
import Projects from './components/Projects.jsx'
import Research from './components/Research.jsx'
import Experience from './components/Experience.jsx'
import Achievements from './components/Achievements.jsx'
import Contact from './components/Contact.jsx'
import Footer from './components/Footer.jsx'
import BackToTop from './components/BackToTop.jsx'
import Marquee from './components/Marquee.jsx'
import CommandPalette from './components/CommandPalette.jsx'
import CursorRing from './components/CursorRing.jsx'
import CursorFx from './components/CursorFx.jsx'
import PageTransitions from './components/PageTransitions.jsx'
import PageNetwork from './components/PageNetwork.jsx'
import IntroLoader from './components/IntroLoader.jsx'

export default function App() {
  return (
    <>
      <IntroLoader />
      <PageNetwork />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Navbar />
      <main id="main">
        <Hero />
        <Marquee />
        <About />
        <Skills />
        <Projects />
        <Research />
        <Experience />
        <Achievements />
        <Contact />
      </main>
      <Footer />
      <BackToTop />
      <CommandPalette />
      <PageTransitions />
      <CursorFx />
      <CursorRing />
    </>
  )
}
