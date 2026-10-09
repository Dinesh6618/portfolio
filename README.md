# Dinesh G — Portfolio

Personal portfolio built with **React + Vite** (plain JavaScript and CSS, Lucide icons). A single-page site with Home, About, Skills, Projects, Experience, Achievements and Contact sections.

## Design

- **Black and gold** technical look. The palette lives in the `:root` tokens at the top of `src/index.css` (`--gold`, `--gold-bright`, `--bg`, ...), so a re-colour is a few lines.
- **3D:** a rotating neural globe (hand-written canvas renderer, no extra library) that spins with scroll and leans toward the pointer, a portrait with pointer-driven 3D tilt and parallax layers, 3D hover tilt on project cards, and a 3D flip-in on scroll.
- **Command palette:** press **Ctrl + K** (**⌘ K** on Mac) or use the search button in the navbar to jump to sections, open a project, download the resume, copy the email or open GitHub / LinkedIn.
- Reduced motion is respected everywhere: with the OS setting on, the globe is a still frame and the tilt, parallax, ticker and decode effects are off.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

## Where things live

| What | Where |
| --- | --- |
| Name, email, phone, social links, nav | `src/data/site.js` |
| About, skills, projects, achievements, experience | `src/data/content.js` |
| Section components | `src/components/` |
| All styling | `src/index.css` |

## Files you add yourself (in `public/`)

| File | Notes |
| --- | --- |
| `profile.webp` | Front-page photo (502×567). To change it, replace the file and update `heroImage` (`width` / `height` / `alt`) in `src/data/site.js`. |
| `resume.pdf` | Your resume. The Download Resume buttons point to it. A stand-in generated from the portfolio content ships with the project; overwrite it with your own. |
| `og-image.png` | 1200×630 social-share preview. Replace if you want a different card. |
| `projects/*.webp` | Project screenshots (see below). |

### Project screenshots

Screenshots for CLICK, SEVPS and EventFlow are already in `public/projects/` (compressed WebP, with the slideshow caption bar trimmed from the CLICK shots). To replace or add one, drop a file with the same name there. Any file that is missing is skipped, and a project with no screenshots (GramSentinel, RoadMind AI) shows a "Screenshots coming soon" placeholder.

| Project | Files |
| --- | --- |
| CLICK | `click-home.webp`, `click-lesson.webp`, `click-fill-code.webp`, `click-test-complete.webp`, `click-practice.webp` |
| SEVPS | `sevps-operations-map.webp`, `sevps-analytics.webp`, `sevps-hospital.webp`, `sevps-paramedic.webp`, `sevps-driver.webp` |
| EventFlow | `eventflow-landing.webp`, `eventflow-explore.webp`, `eventflow-student-home.webp`, `eventflow-event-details.webp`, `eventflow-organizer-dashboard.webp` |

The first image of each project is its card cover. To use a different filename or format, edit the `shot(...)` lines in `src/data/content.js`.

### Links

- **LinkedIn and GitHub:** set in `src/data/site.js` (`socials`). Clear a URL to hide that link everywhere.
- **Project GitHub / live-demo buttons:** set `links.repo` / `links.live` for a project in `src/data/content.js`. Until then the buttons show as "coming soon".

## Contact form

With no backend configured, the form validates the input and then opens the visitor's email app with the message pre-filled. It never claims a message was sent.

To send real messages, create a form endpoint (for example a free [Formspree](https://formspree.io) form) and set `VITE_CONTACT_ENDPOINT` to its URL. The form then POSTs JSON and only shows "sent" when the endpoint returns success.

## Environment variables (all optional)

See `.env.example`. For local use copy it to `.env.local`; on Vercel add them under Project Settings → Environment Variables.

| Variable | Purpose |
| --- | --- |
| `VITE_CONTACT_ENDPOINT` | Form endpoint URL (see above). |
| `VITE_SITE_URL` | Public site URL for canonical and social-share tags. Vercel's production URL is detected automatically, so set this only when you add a custom domain. |

## Deploy to Vercel

1. Push this repo to GitHub (`main` branch).
2. In Vercel: **Add New → Project → Import** the `portfolio` repository.
3. Settings (Vercel detects these from `vercel.json`):
   - Framework Preset: **Vite**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
   - Node.js Version: 22.x or newer
4. Add the optional environment variables above, then click **Deploy**.

Every push to `main` redeploys automatically; other branches get preview URLs.
