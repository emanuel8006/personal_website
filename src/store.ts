import { create } from 'zustand'
import { prefersReducedMotion } from './hooks/useReducedMotion'
import { readFlag, writeFlag } from './lib/storage'

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

const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '')

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
  viewMode: ViewMode
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
  toast: { id: number; message: string } | null

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
  setQuality: (tier: QualityTier) => void
  setViewMode: (mode: ViewMode) => void
  /** Easter egg found (special asteroid or Konami code): reveal Planet X and fly there. */
  discoverPlanetX: () => void
  focusProject: (id: string) => void
  setHoveredProject: (id: string | null) => void
  setHoveredSkill: (index: number | null) => void
  setHoveredSocial: (href: string | null) => void
  setHoveredAsteroid: (hovered: boolean) => void
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
    intro: 'loading',
    introMode: initialIntroMode(),
    introSkipped: false,
    loadProgress: 0,
    quality: 'high',
    viewMode: '3d',
    planetXFound: readFlag('local', PLANET_X_KEY) || (import.meta.env.DEV && params.has('planetx')),
    activeProject: null,
    hoveredProject: null,
    hoveredSkill: null,
    hoveredSocial: null,
    hoveredAsteroid: false,
    toast: null,

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

    setQuality: (quality) => set({ quality }),
    setViewMode: (viewMode) => set({ viewMode }),

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
    showToast: (message) => set({ toast: { id: Date.now(), message } }),
    dismissToast: () => set({ toast: null }),
  }
})
