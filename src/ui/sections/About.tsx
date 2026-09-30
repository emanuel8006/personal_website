import { ABOUT } from '../../data/content'
import { Icon } from '../components/icons'
import { buttonClass } from '../components/styles'
import type { SectionProps } from './types'

export default function About({ onNavigate }: SectionProps) {
  const { name, tagline, bio, photo, resume } = ABOUT
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-5">
        {photo && (
          <img
            src={photo.src}
            srcSet={photo.srcSet}
            sizes="112px"
            alt={photo.alt}
            width={112}
            height={112}
            decoding="async"
            className="h-28 w-28 shrink-0 rounded-full object-cover object-[50%_28%] shadow-[0_0_40px_-6px_rgba(255,179,71,0.55)] ring-2 ring-sun/50"
          />
        )}
        <div className="min-w-0">
          <p className="font-display text-3xl leading-tight font-semibold text-white">{name}</p>
          <p className="mt-1.5 text-base text-amber-200">{tagline}</p>
        </div>
      </div>

      <div className="space-y-3 text-[15px] leading-relaxed text-slate-300">
        {bio.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <a href={resume.href} download={resume.downloadName} className={buttonClass.primary}>
          <Icon name="download" /> Download Resume
        </a>
        <button type="button" onClick={() => onNavigate('projects')} className={buttonClass.ghost}>
          View Projects <Icon name="arrow" />
        </button>
      </div>
    </div>
  )
}
