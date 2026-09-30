import { EXPERIENCE } from '../../data/content'
import { TechTags } from '../components/primitives'

/** Vertical timeline styled as mission logs, most recent first. */
export default function Experience() {
  const total = EXPERIENCE.length
  return (
    <ol className="relative ml-1.5 space-y-9 border-l border-cyan/20 pl-6">
      {EXPERIENCE.map((e, i) => (
        <li key={`${e.company}-${e.start}`} className="relative">
          <span
            aria-hidden="true"
            className="absolute top-1 -left-[31px] h-3 w-3 rounded-full bg-sun-deep shadow-[0_0_12px_2px_rgba(255,122,24,0.6)] ring-4 ring-sun-deep/15"
          />
          <p className="font-mono text-[11px] tracking-[0.2em] text-amber-300 uppercase">
            Mission log {String(total - i).padStart(2, '0')} · {e.start} – {e.end}
          </p>
          <h3 className="mt-1 font-display text-lg font-semibold text-white">{e.role}</h3>
          <p className="text-slate-300">
            {e.company} <span className="text-slate-500">·</span> {e.location}
          </p>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-slate-300 marker:text-cyan/70">
            {e.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          {e.tech.length > 0 && (
            <div className="mt-3">
              <TechTags items={e.tech} />
            </div>
          )}
        </li>
      ))}
    </ol>
  )
}
