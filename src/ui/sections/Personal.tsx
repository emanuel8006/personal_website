import { PERSONAL } from '../../data/content'
import { ChipList, SubHeading } from '../components/primitives'

export default function Personal() {
  return (
    <div className="space-y-6">
      <div className="space-y-3 text-[15px] leading-relaxed text-slate-300">
        {PERSONAL.blurb.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <section className="space-y-2">
        <SubHeading>Hobbies</SubHeading>
        <ChipList items={PERSONAL.hobbies} label="Hobbies" tone="accent" />
      </section>
      <section className="space-y-2">
        <SubHeading>Fun facts</SubHeading>
        <ul className="list-disc space-y-1.5 pl-5 text-slate-300 marker:text-violet">
          {PERSONAL.funFacts.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
