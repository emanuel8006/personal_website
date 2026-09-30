import type { ReactNode } from 'react'

/** Small uppercase HUD label (JetBrains Mono). */
export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`font-mono text-[11px] tracking-[0.2em] text-cyan uppercase ${className}`}>{children}</p>
}

/** Sub-heading inside a section (the section title itself is the panel's h2). */
export function SubHeading({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h3 className={`font-mono text-xs tracking-[0.18em] text-slate-400 uppercase ${className}`}>{children}</h3>
}

export function Chip({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'accent' }) {
  return (
    <li
      className={`rounded-full border px-2.5 py-1 text-xs leading-none ${
        tone === 'accent' ? 'border-cyan/35 bg-cyan/10 text-cyan' : 'border-white/12 bg-white/[0.04] text-slate-200'
      }`}
    >
      {children}
    </li>
  )
}

export function ChipList({ items, label, tone }: { items: string[]; label: string; tone?: 'default' | 'accent' }) {
  return (
    <ul aria-label={label} className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <Chip key={item} tone={tone}>
          {item}
        </Chip>
      ))}
    </ul>
  )
}

/** Tech stack tags: mono, compact. */
export function TechTags({ items }: { items: string[] }) {
  return (
    <ul aria-label="Tech stack" className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <li
          key={t}
          className="rounded border border-violet/25 bg-violet/10 px-1.5 py-0.5 font-mono text-[11px] text-violet-200"
        >
          {t}
        </li>
      ))}
    </ul>
  )
}

/** Opens in a new tab; says so to screen readers. */
export function ExternalLink({
  href,
  children,
  className = '',
  label,
}: {
  href: string
  children: ReactNode
  className?: string
  label?: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label ? `${label} (opens in a new tab)` : undefined}
      className={className}
    >
      {children}
      {!label && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  )
}
