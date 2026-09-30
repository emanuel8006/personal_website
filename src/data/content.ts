import type { SectionId } from '../store'

/**
 * ALL portfolio copy lives in this file (single source of truth for both the
 * 3D and 2D views). Phase 4 adds the full per-section content below.
 */

export const SITE = {
  name: 'Emanuel Galindo Garcia',
  initials: 'EG',
}

export interface SectionMeta {
  /** Nav / heading label. */
  label: string
  /** The body that represents this section in the 3D scene. */
  body: string
  /** One-line themed teaser shown in the hover tooltip. */
  teaser: string
}

export const SECTIONS: Record<SectionId, SectionMeta> = {
  about: { label: 'About', body: 'The Sun', teaser: 'Where the story starts' },
  education: { label: 'Education', body: 'Earth', teaser: 'Home base, where I learned everything' },
  experience: { label: 'Experience', body: 'Mars', teaser: "Missions I've flown" },
  projects: { label: 'Projects', body: 'Jupiter', teaser: 'The biggest things I have built' },
  skills: { label: 'Skills', body: 'Saturn', teaser: 'Rings of expertise' },
  contact: { label: 'Contact', body: 'Mercury', teaser: 'The fastest way to reach me' },
  personal: { label: 'Off the clock', body: 'Planet X', teaser: 'You found the hidden world' },
}
