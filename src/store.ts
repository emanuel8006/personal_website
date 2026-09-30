import { create } from 'zustand'

/** Every navigable section. Order here is the canonical nav / arrow-key order. */
export const SECTION_IDS = ['about', 'education', 'experience', 'projects', 'skills', 'contact', 'personal'] as const
export type SectionId = (typeof SECTION_IDS)[number]

export type QualityTier = 'high' | 'medium' | 'low'
export type ViewMode = '3d' | '2d'
/** loading: assets downloading · playing: intro camera move · done: interactive */
export type IntroState = 'loading' | 'playing' | 'done'

interface AppState {
  /** Section whose panel is open (null = wide solar-system view). */
  section: SectionId | null
  /** Body currently under the pointer or keyboard focus. */
  hovered: SectionId | null
  intro: IntroState
  quality: QualityTier
  viewMode: ViewMode
  planetXFound: boolean

  openSection: (id: SectionId) => void
  closeSection: () => void
  setHovered: (id: SectionId | null) => void
  setIntro: (state: IntroState) => void
  setQuality: (tier: QualityTier) => void
  setViewMode: (mode: ViewMode) => void
  discoverPlanetX: () => void
}

export const useAppStore = create<AppState>()((set) => ({
  section: null,
  hovered: null,
  intro: 'loading',
  quality: 'high',
  viewMode: '3d',
  // Dev convenience: ?planetx reveals Planet X without hunting for it
  planetXFound: import.meta.env.DEV && new URLSearchParams(location.search).has('planetx'),

  openSection: (id) => set({ section: id }),
  closeSection: () => set({ section: null }),
  setHovered: (id) => set({ hovered: id }),
  setIntro: (intro) => set({ intro }),
  setQuality: (quality) => set({ quality }),
  setViewMode: (viewMode) => set({ viewMode }),
  discoverPlanetX: () => set({ planetXFound: true }),
}))
