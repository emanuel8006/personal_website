import { SKILLS, type SkillLevel } from '../../data/content'
import { useAppStore } from '../../store'
import type { SectionProps } from './types'

const LEVEL_DOTS: Record<SkillLevel, number> = { Expert: 3, Proficient: 2, Familiar: 1 }

function LevelDots({ level }: { level: SkillLevel }) {
  const n = LEVEL_DOTS[level]
  return (
    <span aria-hidden="true" className="ml-1.5 inline-flex gap-0.5 align-middle">
      {[0, 1, 2].map((i) => (
        <span key={i} className={`h-1 w-1 rounded-full ${i < n ? 'bg-cyan' : 'bg-white/20'}`} />
      ))}
    </span>
  )
}

/** Skill categories; each maps to one band of Saturn's rings (inner → outer). */
/** Only show the level legend if any skill actually has a level. */
const HAS_LEVELS = SKILLS.some((c) => c.skills.some((s) => s.level))

export default function Skills({ variant }: SectionProps) {
  const setHoveredSkill = useAppStore((s) => s.setHoveredSkill)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-slate-400">
        {HAS_LEVELS &&
          (Object.keys(LEVEL_DOTS) as SkillLevel[]).map((level) => (
            <span key={level} className="inline-flex items-center">
              {level}
              <LevelDots level={level} />
            </span>
          ))}
        {variant === 'panel' && (
          <span className="text-slate-500">{HAS_LEVELS && '· '}Hover a category to light up its ring on Saturn</span>
        )}
      </div>

      <ul className="space-y-3">
        {SKILLS.map((category, i) => (
          <li
            key={category.name}
            onMouseEnter={() => setHoveredSkill(i)}
            onMouseLeave={() => setHoveredSkill(null)}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:border-cyan/40"
          >
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h3 className="font-display text-base font-semibold text-white">{category.name}</h3>
              <span className="font-mono text-[10px] tracking-[0.2em] text-slate-500 uppercase">Ring {i + 1}</span>
            </div>
            <ul aria-label={`${category.name} skills`} className="flex flex-wrap gap-1.5">
              {category.skills.map((skill) => (
                <li
                  key={skill.name}
                  className="rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1 text-xs leading-none text-slate-200"
                >
                  {skill.name}
                  {skill.level && (
                    <>
                      <LevelDots level={skill.level} />
                      <span className="sr-only">, {skill.level}</span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}
