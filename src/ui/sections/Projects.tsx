import { useEffect } from 'react'
import { PROJECTS, type Project } from '../../data/content'
import { prefersReducedMotion } from '../../hooks/useReducedMotion'
import { useAppStore } from '../../store'
import { Icon } from '../components/icons'
import { ExternalLink, TechTags } from '../components/primitives'
import type { SectionProps } from './types'

function Media({ project }: { project: Project }) {
  const { media, accent, title } = project
  const frame = 'aspect-video w-full overflow-hidden rounded-xl border border-white/10'

  if (!media) {
    // Placeholder frame tinted with the project's accent until a screenshot exists
    return (
      <div
        className={`${frame} relative grid place-items-center`}
        style={{ background: `radial-gradient(120% 90% at 20% 10%, ${accent}33, transparent 60%), #0b0e22` }}
        role="img"
        aria-label={`${title}: screenshot coming soon`}
      >
        <span className="font-mono text-[11px] tracking-[0.2em] text-slate-400 uppercase">
          [Screenshot placeholder]
        </span>
      </div>
    )
  }

  if (media.kind === 'video') {
    return (
      <video
        className={`${frame} object-cover`}
        src={media.src}
        autoPlay
        muted
        loop
        playsInline
        aria-label={media.alt}
      />
    )
  }

  return (
    <img
      className={`${frame} object-cover`}
      src={media.src}
      srcSet={media.srcSet}
      sizes="(min-width: 768px) 40vw, 100vw"
      alt={media.alt}
      loading="lazy"
      decoding="async"
    />
  )
}

function ProjectCard({ project, active }: { project: Project; active: boolean }) {
  const setHoveredProject = useAppStore((s) => s.setHoveredProject)
  const titleId = `project-title-${project.id}`

  return (
    <article
      id={`project-${project.id}`}
      tabIndex={-1}
      aria-labelledby={titleId}
      onMouseEnter={() => setHoveredProject(project.id)}
      onMouseLeave={() => setHoveredProject(null)}
      className={`scroll-mt-4 rounded-2xl border bg-white/[0.03] p-4 transition-colors duration-300 focus:outline-none ${
        active ? 'border-cyan/60 shadow-[0_0_32px_-10px_rgba(94,231,255,0.6)]' : 'border-white/10 hover:border-white/20'
      }`}
    >
      <Media project={project} />

      <div className="mt-4 flex items-start gap-3">
        {/* The matching Jupiter moon's color */}
        <span
          aria-hidden="true"
          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: project.accent, boxShadow: `0 0 10px ${project.accent}` }}
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <h3 id={titleId} className="font-display text-lg leading-snug font-semibold text-white">
              {project.title}
            </h3>
            {project.date && (
              <p className="font-mono text-[11px] tracking-[0.16em] text-slate-400 uppercase">{project.date}</p>
            )}
          </div>
          <p className="mt-0.5 text-sm text-slate-300">{project.pitch}</p>
        </div>
      </div>

      {project.highlights.length > 0 && (
        <dl className="mt-4 grid gap-2 sm:grid-cols-2">
          {project.highlights.map((h) => (
            <div key={h.label} className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2">
              <dt className="font-mono text-[10px] tracking-[0.2em] text-cyan uppercase">{h.label}</dt>
              <dd className="mt-0.5 text-sm text-slate-200">{h.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-4 space-y-2 text-[15px] leading-relaxed text-slate-300">
        {project.description.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>

      {project.tech.length > 0 && (
        <div className="mt-4">
          <TechTags items={project.tech} />
        </div>
      )}

      {(project.links.github || project.links.demo) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {project.links.github && (
            <ExternalLink
              href={project.links.github}
              label={`${project.title} source code on GitHub`}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-100 transition hover:border-cyan/50 focus-visible:ring-2 focus-visible:ring-cyan focus-visible:outline-none"
            >
              <Icon name="github" className="h-3.5 w-3.5" /> Code
            </ExternalLink>
          )}
          {project.links.demo && (
            <ExternalLink
              href={project.links.demo}
              label={`${project.title} live demo`}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs text-slate-100 transition hover:border-cyan/50 focus-visible:ring-2 focus-visible:ring-cyan focus-visible:outline-none"
            >
              <Icon name="external" className="h-3.5 w-3.5" /> Live demo
            </ExternalLink>
          )}
        </div>
      )}
    </article>
  )
}

export default function Projects({ variant }: SectionProps) {
  const activeProject = useAppStore((s) => s.activeProject)

  // A moon was clicked: bring its card into view and move focus to it
  useEffect(() => {
    if (!activeProject) return
    const timer = window.setTimeout(() => {
      const el = document.getElementById(`project-${activeProject}`)
      el?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
      el?.focus({ preventScroll: true })
    }, 80)
    return () => window.clearTimeout(timer)
  }, [activeProject])

  return (
    <div className="space-y-5">
      {variant === 'panel' && (
        <p className="font-mono text-xs text-slate-400">
          Each project is a moon of Jupiter. Click one in the scene to jump to it here.
        </p>
      )}
      {PROJECTS.map((p) => (
        <ProjectCard key={p.id} project={p} active={p.id === activeProject} />
      ))}
    </div>
  )
}
