import type { SectionId } from '../../store'

export interface SectionProps {
  /** Jump to another section (camera flight in 3D, scroll in the 2D view). */
  onNavigate: (id: SectionId) => void
  /** 'panel' = beside the 3D scene (may reference it); 'plain' = the 2D view. */
  variant: 'panel' | 'plain'
}
