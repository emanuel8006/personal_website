import { useRef } from 'react'
import { CREDITS } from '../data/content'
import { Icon } from './components/icons'

/**
 * "Credits" link + native <dialog> (focus trap, Escape and backdrop come free).
 * Required attribution for the CC BY 4.0 textures lives here.
 */
export default function Credits({ className = '' }: { className?: string }) {
  const dialog = useRef<HTMLDialogElement>(null)

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className={`font-mono text-[11px] tracking-[0.14em] text-slate-400 uppercase underline-offset-4 transition-colors hover:text-white hover:underline focus-visible:ring-2 focus-visible:ring-cyan focus-visible:outline-none ${className}`}
      >
        Credits
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="credits-title"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()} // click on the backdrop
        className="m-auto w-[min(92vw,560px)] rounded-3xl border border-cyan/25 bg-[#070a1c]/95 p-0 text-slate-200 shadow-[0_0_80px_-20px_rgba(94,231,255,0.5)] backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <h2 id="credits-title" className="font-display text-2xl font-semibold text-white">
              Credits
            </h2>
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Close credits"
              className="grid h-9 w-9 place-items-center rounded-full border border-white/12 bg-white/5 text-slate-200 transition hover:border-cyan/50 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan focus-visible:outline-none"
            >
              <Icon name="close" />
            </button>
          </div>
          <ul className="mt-5 space-y-4">
            {CREDITS.map((c) => (
              <li key={c.what}>
                <p className="text-sm font-medium text-white">{c.what}</p>
                <p className="text-sm text-slate-300">
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-cyan focus-visible:outline-none"
                  >
                    {c.who}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                  <span className="text-slate-400"> · {c.license}</span>
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-6 font-mono text-xs text-slate-400">Designed and built by Emanuel Galindo Garcia.</p>
        </div>
      </dialog>
    </>
  )
}
