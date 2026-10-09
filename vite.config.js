import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Resolves the public site URL used for canonical / social-share tags in index.html.
// Priority: VITE_SITE_URL (set it once you attach a custom domain) -> the Vercel
// production URL that Vercel exposes at build time -> empty (relative URLs).
function siteUrlPlugin(siteUrl) {
  return {
    name: 'inject-site-url',
    transformIndexHtml(html) {
      const withUrl = html.replaceAll('__SITE_URL__', siteUrl)
      // Without an absolute URL a canonical tag would be wrong, so drop it.
      return siteUrl ? withUrl : withUrl.replace(/^.*data-needs-site-url.*\r?\n/gm, '')
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL
  const siteUrl = (env.VITE_SITE_URL || (vercelHost ? `https://${vercelHost}` : '')).replace(/\/+$/, '')

  return {
    plugins: [react(), siteUrlPlugin(siteUrl)],
  }
})
