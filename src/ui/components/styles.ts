/** Shared button look: primary = warm Sun gradient, ghost = glass outline. */
export const buttonClass = {
  primary:
    'inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sun to-sun-deep px-4 py-2 text-sm font-semibold text-space shadow-[0_0_24px_-6px_rgba(255,179,71,0.7)] transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-space focus-visible:outline-none',
  ghost:
    'inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-cyan/50 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan focus-visible:outline-none',
}
