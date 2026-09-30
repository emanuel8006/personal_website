import type { ComponentType } from 'react'
import type { SectionId } from '../../store'
import About from './About'
import Contact from './Contact'
import Education from './Education'
import Experience from './Experience'
import Personal from './Personal'
import Projects from './Projects'
import Skills from './Skills'
import type { SectionProps } from './types'

/** Section bodies, shared by the 3D content panel and the 2D view. */
export const SECTION_COMPONENTS: Record<SectionId, ComponentType<SectionProps>> = {
  about: About,
  education: Education,
  experience: Experience,
  projects: Projects,
  skills: Skills,
  contact: Contact,
  personal: Personal,
}
