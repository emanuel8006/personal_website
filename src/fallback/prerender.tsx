import { renderToString } from 'react-dom/server'
import { CONTACT, EDUCATION, SITE } from '../data/content'
import PlainView from './PlainView'

/**
 * Build-time entry (scripts/prerender.mjs): the 2D view as static HTML, so
 * crawlers and no-JS visitors get the full content. In the browser React
 * replaces it with the live app.
 */
export function render() {
  return renderToString(<PlainView />)
}

/** schema.org Person, generated from the same content file. */
export function structuredData(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: SITE.name,
    url: `${siteUrl}/`,
    image: `${siteUrl}/images/portrait-480.webp`,
    alumniOf: EDUCATION.map((e) => ({ '@type': 'CollegeOrUniversity', name: e.school })).slice(0, 1),
    sameAs: CONTACT.socials.filter((s) => s.href.startsWith('http')).map((s) => s.href),
  }
}
