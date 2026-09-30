import { create } from 'zustand'
import { prefersReducedMotion } from './hooks/useReducedMotion'
import { detectCapability, TIER_ORDER, type Capability, type FallbackReason } from './lib/capability'
import { readFlag, readString, writeFlag, writeString } from './lib/storage'

/** Every navigable section. Order here is the canonical nav / arrow-key order. */
export const SECTION_IDS = ['about', 'education', 'experience', 'projects', 'skills', 'contact', 'personal'] as const
export type SectionId = (typeof SECTION_IDS)[number]

export type QualityTier = 'high' | 'medium' | 'low'
export type ViewMode = '3d' | '2d'
/** loading: assets downloading · playing: intro camera move · done: interactive */
export type IntroState = 'loading' | 'playing' | 'done'
/** full: cinematic pull-back from the Sun (first visit per session) · quick: short fade-in */
export type IntroMode = 'full' | 'quick'

const INTRO_SEEN_KEY = 'eg:intro-seen' // sessionStorage
const PLANET_X_KEY = 'eg:planet-x' // localStorage: stays discovered on return visits
const VIEW_KEY = 'eg:view' // localStorage: the visitor's explicit 2D/3D choice
const MOTION_KEY = 'eg:motion-paused' // localStorage: ambient animation paused by the visitor

const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '')
const capability: Capability = detectCapability()

/** ?view=2d / ?view=3d forces a view (and disables the automatic low-FPS fallback). */
const forcedView = ((v) => (v === '2d' || v === '3d' ? v : null))(params.get('view'))

function initialView(): { view: ViewMode; reason?: FallbackReason } {
  if (forcedView) return { view: forcedView, reason: forcedView === '2d' ? 'user' : undefined }
  const saved = readString('local', VIEW_KEY)
  if (saved === '2d') return { view: '2d', reason: 'user' }
  if (saved === '3d' && capability.can3D) return { view: '3d' }
  return { view: capability.view, reason: capability.reason }
}
const startView = initialView()

function initialIntroMode(): IntroMode {
  if (params.has('intro')) return 'full' // ?intro replays the full intro
  if (import.meta.env.DEV && params.has('cam')) return 'quick' // dev screenshots pin their own view
  return readFlag('session', INTRO_SEEN_KEY) || prefersReducedMotion() ? 'quick' : 'full'
}

interface AppState {
  /** Section whose panel is open (null = wide solar-system view). */
  section: SectionId | null
  /** Body currently under the pointer or keyboard focus. */
  hovered: SectionId | null
  intro: IntroState
  introMode: IntroMode
  /** Skip was pressed (before or during the intro). */
  introSkipped: boolean
  /** 0–100, real texture/asset loading progress. */
  loadProgress: number
  quality: QualityTier
  /** Highest tier allowed (from capability detection; lowered for good if FPS keeps flip-flopping). */
  maxQuality: QualityTier
  viewMode: ViewMode
  /** Why the 2D view is showing (auto-detected or the visitor's choice). */
  viewReason: FallbackReason | undefined
  /** 3D is possible on this device (drives whether the 2D view offers "Switch to 3D"). */
  can3D: boolean
  /** Section to scroll to when the 2D view mounts (carried over from the 3D panel). */
  plainTarget: SectionId | null
  planetXFound: boolean
  /** Project to bring into view in the Projects panel (set by clicking its moon). */
  activeProject: string | null
  /** Project whose moon/card is under the pointer or focus (moon glow + tooltip). */
  hoveredProject: string | null
  /** Index of the skill category whose Saturn ring band is highlighted. */
  hoveredSkill: number | null
  /** Social link (by href) whose Mercury satellite is highlighted. */
  hoveredSocial: string | null
  /** The special asteroid (Planet X easter egg) is under the pointer. */
  hoveredAsteroid: boolean
  toast: { id: number; message: string; visible: boolean } | null
  /** Visitor paused ambient motion (orbits, spin, twinkle, drift, meteors). WCAG 2.2.2. */
  motionPaused: boolean

  openSection: (id: SectionId) => void
  closeSection: () => void
  /** Step to the next/previous available section (arrow keys while a panel is open). */
  stepSection: (dir: 1 | -1) => void
  setHovered: (id: SectionId | null) => void
  setLoadProgress: (progress: number) => void
  /** Assets are loaded and shaders compiled: start the intro (or skip straight to done). */
  sceneReady: () => void
  skipIntro: () => void
  finishIntro: () => void
  /** PerformanceMonitor hooks: step the tier down/up; `lockQuality` caps it where it is. */
  degradeQuality: () => void
  improveQuality: () => void
  lockQuality: () => void
  /** Visitor toggled the view (remembered for next time). */
  setViewMode: (mode: ViewMode) => void
  /** Automatic switch to 2D (sustained low FPS, lost WebGL context). ?view=3d disables only the FPS one. */
  fallbackTo2D: (reason: FallbackReason) => void
  clearPlainTarget: () => void
  /** Easter egg found (special asteroid or Konami code): reveal Planet X and fly there. */
  discoverPlanetX: () => void
  focusProject: (id: string) => void
  setHoveredProject: (id: string | null) => void
  setHoveredSkill: (index: number | null) => void
  setHoveredSocial: (href: string | null) => void
  setHoveredAsteroid: (hovered: boolean) => void
  toggleMotion: () => void
  showToast: (message: string) => void
  dismissToast: () => void
}

/** Sections currently reachable (Planet X only after discovery), in nav order. */
export function availableSections(planetXFound: boolean): SectionId[] {
  return SECTION_IDS.filter((id) => id !== 'personal' || planetXFound)
}

export const useAppStore = create<AppState>()((set, get) => {
  const markIntroSeen = () => writeFlag('session', INTRO_SEEN_KEY)

  return {
    section: null,
    hovered: null,
    // The 2D view has no loader/intro
    intro: startView.view === '2d' ? 'done' : 'loading',
    introMode: initialIntroMode(),
    introSkipped: false,
    loadProgress: 0,
    quality: capability.maxTier,
    maxQuality: capability.maxTier,
    viewMode: startView.view,
    viewReason: startView.reason,
    can3D: capability.can3D,
    plainTarget: null,
    planetXFound: readFlag('local', PLANET_X_KEY) || (import.meta.env.DEV && params.has('planetx')),
    activeProject: null,
    hoveredProject: null,
    hoveredSkill: null,
    hoveredSocial: null,
    hoveredAsteroid: false,
    toast: null,
    motionPaused: readFlag('local', MOTION_KEY),

    // Opening/stepping clears hover so a stale tooltip doesn't linger over the new view.
    // Opening a section mid-intro (e.g. a deep link or test) ends the intro.
    openSection: (id) => {
      if (get().intro !== 'done') get().finishIntro()
      set({ section: id, hovered: null, activeProject: null })
    },
    closeSection: () => set({ section: null, activeProject: null, hoveredSkill: null }),
    stepSection: (dir) => {
      const { section, planetXFound } = get()
      if (!section) return
      const list = availableSections(planetXFound)
      const i = list.indexOf(section)
      set({
        section: list[(i + dir + list.length) % list.length],
        hovered: null,
        activeProject: null,
        hoveredSkill: null,
      })
    },
    setHovered: (id) => set({ hovered: id }),
    setLoadProgress: (loadProgress) => set({ loadProgress }),

    sceneReady: () => {
      const { intro, introMode, introSkipped } = get()
      if (intro !== 'loading') return
      if (introMode === 'full' && !introSkipped) set({ intro: 'playing', loadProgress: 100 })
      else {
        set({ intro: 'done', loadProgress: 100 })
        markIntroSeen()
      }
    },
    skipIntro: () => {
      const { intro } = get()
      if (intro === 'loading') set({ introSkipped: true })
      else if (intro === 'playing') get().finishIntro()
    },
    finishIntro: () => {
      set({ intro: 'done', introSkipped: true })
      markIntroSeen()
    },

    degradeQuality: () => {
      const i = TIER_ORDER.indexOf(get().quality)
      if (i > 0) set({ quality: TIER_ORDER[i - 1] })
    },
    improveQuality: () => {
      const { quality, maxQuality } = get()
      const i = TIER_ORDER.indexOf(quality)
      if (i < TIER_ORDER.indexOf(maxQuality)) set({ quality: TIER_ORDER[i + 1] })
    },
    lockQuality: () => set({ maxQuality: get().quality }),

    setViewMode: (mode) => {
      if (mode === get().viewMode) return
      writeString('local', VIEW_KEY, mode)
      if (mode === '2d') {
        set({ viewMode: '2d', viewReason: 'user', plainTarget: get().section, section: null, hovered: null })
      } else {
        // Re-entering 3D: short loader + quick fade (no full intro), starting from the overview
        set({
          viewMode: '3d',
          viewReason: undefined,
          intro: 'loading',
          introMode: 'quick',
          introSkipped: true,
          section: null,
        })
      }
    },
    fallbackTo2D: (reason) => {
      // ?view=3d opts out of the FPS-based fallback, but a lost GPU context always falls back
      if (get().viewMode === '2d' || (forcedView === '3d' && reason === 'low-fps')) return
      set({
        viewMode: '2d',
        viewReason: reason,
        plainTarget: get().section,
        section: null,
        hovered: null,
        intro: 'done',
      })
      get().showToast(
        reason === 'low-fps'
          ? 'Switched to the simple view for smoother performance'
          : 'The 3D view stopped responding, so here is the simple view',
      )
    },
    clearPlainTarget: () => set({ plainTarget: null }),

    discoverPlanetX: () => {
      if (get().planetXFound) {
        get().openSection('personal')
        return
      }
      writeFlag('local', PLANET_X_KEY)
      set({ planetXFound: true, hoveredAsteroid: false })
      get().showToast('You found Planet X')
      // Give Planet X a moment to mount (and register) before the camera flies to it
      window.setTimeout(() => get().openSection('personal'), 120)
    },

    focusProject: (id) => {
      if (get().intro !== 'done') get().finishIntro()
      set({ section: 'projects', activeProject: id, hovered: null, hoveredProject: null })
    },
    setHoveredProject: (hoveredProject) => set({ hoveredProject }),
    setHoveredSkill: (hoveredSkill) => set({ hoveredSkill }),
    setHoveredSocial: (hoveredSocial) => set({ hoveredSocial }),
    setHoveredAsteroid: (hoveredAsteroid) => set({ hoveredAsteroid }),
    toggleMotion: () => {
      const motionPaused = !get().motionPaused
      writeString('local', MOTION_KEY, motionPaused ? '1' : '0')
      set({ motionPaused })
    },
    showToast: (message) => set({ toast: { id: Date.now(), message, visible: true } }),
    // Keep the message while it fades out
    dismissToast: () => {
      const { toast } = get()
      if (toast) set({ toast: { ...toast, visible: false } })
    },
  }
})
