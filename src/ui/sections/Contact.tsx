import { CONTACT } from '../../data/content'
import { Icon } from '../components/icons'
import { ExternalLink, SubHeading } from '../components/primitives'

/** Contact details and social links. The form itself is added in phase 5. */
export default function Contact() {
  return (
    <div className="space-y-6">
      <p className="text-[15px] leading-relaxed text-slate-300">{CONTACT.intro}</p>

      {CONTACT.publicEmail && (
        <a
          href={`mailto:${CONTACT.publicEmail}`}
          className="inline-flex items-center gap-2 text-cyan underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-cyan focus-visible:outline-none"
        >
          <Icon name="email" /> {CONTACT.publicEmail}
        </a>
      )}

      <section className="space-y-3">
        <SubHeading>Find me elsewhere</SubHeading>
        <ul className="flex flex-wrap gap-2">
          {CONTACT.socials.map((s) => (
            <li key={s.href}>
              <ExternalLink
                href={s.href}
                label={s.label}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:border-cyan/50 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan focus-visible:outline-none"
              >
                <Icon name={s.kind} /> {s.label}
              </ExternalLink>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
