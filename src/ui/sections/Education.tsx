import { EDUCATION } from '../../data/content'
import { ChipList, SubHeading } from '../components/primitives'

export default function Education() {
  return (
    <div className="space-y-8">
      {EDUCATION.map((e) => (
        <article key={e.school} className="space-y-5">
          <header>
            <h3 className="font-display text-xl font-semibold text-white">{e.school}</h3>
            {e.degrees.map((d) => (
              <p key={d} className="mt-1 text-slate-200">
                {d}
              </p>
            ))}
            <p className="mt-1 font-mono text-xs tracking-wide text-slate-400">
              {e.location} · {e.graduation}
              {e.gpa?.show && <> · GPA {e.gpa.value}</>}
            </p>
          </header>

          {e.coursework.length > 0 && (
            <section className="space-y-2">
              <SubHeading>Relevant coursework</SubHeading>
              <ChipList items={e.coursework} label="Relevant coursework" />
            </section>
          )}

          {e.honors.length > 0 && (
            <section className="space-y-2">
              <SubHeading>Honors</SubHeading>
              <ul className="list-disc space-y-1 pl-5 text-slate-300 marker:text-sun/70">
                {e.honors.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </section>
          )}

          {e.clubs.length > 0 && (
            <section className="space-y-2">
              <SubHeading>Clubs & activities</SubHeading>
              <ChipList items={e.clubs} label="Clubs and activities" tone="accent" />
            </section>
          )}
        </article>
      ))}
    </div>
  )
}
