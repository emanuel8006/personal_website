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
  /** Project to bring into view in the Projects panel (set by clicking its moon). */
  activeProject: string | null
  /** Project whose moon/card is under the pointer or focus (moon glow + tooltip). */
  hoveredProject: string | null
  /** Index of the skill category whose Saturn ring band is highlighted. */
  hoveredSkill: number | null

  openSection: (id: SectionId) => void
  closeSection: () => void
  /** Step to the next/previous available section (arrow keys while a panel is open). */
  stepSection: (dir: 1 | -1) => void
  setHovered: (id: SectionId | null) => void
  setIntro: (state: IntroState) => void
  setQuality: (tier: QualityTier) => void
  setViewMode: (mode: ViewMode) => void
  discoverPlanetX: () => void
  focusProject: (id: string) => void
  setHoveredProject: (id: string | null) => void
  setHoveredSkill: (index: number | null) => void
}

/** Sections currently reachable (Planet X only after discovery), in nav order. */
export function availableSections(planetXFound: boolean): SectionId[] {
  return SECTION_IDS.filter((id) => id !== 'personal' || planetXFound)
}

export const useAppStore = create<AppState>()((set, get) => ({
  section: null,
  hovered: null,
  intro: 'loading',
  quality: 'high',
  viewMode: '3d',
  // Dev convenience: ?planetx reveals Planet X without hunting for it
  planetXFound: import.meta.env.DEV && new URLSearchParams(location.search).has('planetx'),
  activeProject: null,
  hoveredProject: null,
  hoveredSkill: null,

  // Opening/stepping clears hover so a stale tooltip doesn't linger over the new view
  openSection: (id) => set({ section: id, hovered: null, activeProject: null }),
  closeSection: () => set({ section: null, activeProject: null, hoveredSkill: null }),
  stepSection: (dir) => {
    const { section, planetXFound } = get()
    if (!section) return
    const list = availableSections(planetXFound)
    const i = list.indexOf(section)
    set({ section: list[(i + dir + list.length) % list.length], hovered: null, activeProject: null, hoveredSkill: null })
  },
  setHovered: (id) => set({ hovered: id }),
  setIntro: (intro) => set({ intro }),
  setQuality: (quality) => set({ quality }),
  setViewMode: (viewMode) => set({ viewMode }),
  discoverPlanetX: () => set({ planetXFound: true }),
  focusProject: (id) => set({ section: 'projects', activeProject: id, hovered: null, hoveredProject: null }),
  setHoveredProject: (hoveredProject) => set({ hoveredProject }),
  setHoveredSkill: (hoveredSkill) => set({ hoveredSkill }),
}))
