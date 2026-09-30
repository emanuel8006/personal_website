import type { SectionId } from '../store'

/**
 * ALL portfolio copy lives in this file: the single source of truth for both
 * the 3D panel and the 2D view. Edit freely; the UI adapts to list lengths.
 *
 * Anything marked [PLACEHOLDER] / TODO still needs real content.
 */

/* ────────────────────────────────────────────────────────────────────────── */
/* Types                                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

export interface SectionMeta {
  /** Nav / heading label. */
  label: string
  /** The body that represents this section in the 3D scene. */
  body: string
  /** One-line themed teaser shown in the hover tooltip. */
  teaser: string
}

export interface ImageAsset {
  /** Default src (also the fallback when srcSet isn't supported). */
  src: string
  /** Optional responsive sources, e.g. "/images/x-480.webp 480w, /images/x-960.webp 960w". */
  srcSet?: string
  alt: string
}

export interface About {
  name: string
  tagline: string
  /** One string per paragraph. */
  bio: string[]
  photo?: ImageAsset
  resume: { href: string; downloadName: string }
}

export interface EducationEntry {
  school: string
  location: string
  degrees: string[]
  /** e.g. "Expected May 2028" */
  graduation: string
  gpa?: { value: string; show: boolean }
  coursework: string[]
  honors: string[]
  clubs: string[]
}

export interface ExperienceEntry {
  company: string
  role: string
  /** e.g. "Jun 2025" */
  start: string
  /** e.g. "Present" */
  end: string
  location: string
  /** 3–4 impact-focused bullets. */
  bullets: string[]
  tech: string[]
  url?: string
}

export interface ProjectHighlight {
  /** Short label: Architecture, Data, Scale, Results… */
  label: string
  value: string
}

export interface Project {
  /** Stable id (used for the matching Jupiter moon and deep links). */
  id: string
  title: string
  /** One-line pitch. */
  pitch: string
  /** e.g. "April 2026" */
  date?: string
  /** Longer description; one string per paragraph. */
  description: string[]
  /** Technical depth at a glance: architecture, data, scale, results. */
  highlights: ProjectHighlight[]
  tech: string[]
  links: { github?: string; demo?: string }
  /** Screenshot, GIF, or short looping video (.mp4/.webm). */
  media?: ImageAsset & { kind?: 'image' | 'video' }
  /** Accent color for the card and the project's moon. */
  accent: string
}

export type SkillLevel = 'Expert' | 'Proficient' | 'Familiar'

export interface SkillCategory {
  /** Shown as one band of Saturn's rings (inner → outer, in this order). */
  name: string
  /** `level` is optional: leave it out to show a plain chip. */
  skills: { name: string; level?: SkillLevel }[]
}

export type SocialKind = 'linkedin' | 'github' | 'email' | 'x' | 'devpost' | 'website' | 'other'

export interface SocialLink {
  kind: SocialKind
  label: string
  href: string
}

export interface Contact {
  intro: string
  /** Optional public email shown as a mailto link (the form works without it). */
  publicEmail?: string
  socials: SocialLink[]
}

export interface Personal {
  blurb: string[]
  hobbies: string[]
  funFacts: string[]
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Site & section metadata                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

export const SITE = {
  name: 'Emanuel Galindo Garcia',
  initials: 'EGG',
}

export const SECTIONS: Record<SectionId, SectionMeta> = {
  about: { label: 'About', body: 'The Sun', teaser: 'Who I am' },
  education: { label: 'Education', body: 'Earth', teaser: 'Where I learned everything' },
  experience: { label: 'Experience', body: 'Mars', teaser: "Missions I've flown" },
  projects: { label: 'Projects', body: 'Jupiter', teaser: 'The biggest things I have built' },
  skills: { label: 'Skills', body: 'Saturn', teaser: 'Rings of expertise' },
  contact: { label: 'Contact', body: 'Mercury', teaser: 'The fastest way to reach me' },
  personal: { label: 'Off the clock', body: 'Planet X', teaser: 'You found the hidden world' },
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Content                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

export const ABOUT: About = {
  name: SITE.name,
  tagline: 'Aspiring Software engineer building data-heavy systems that feel effortless.',
  bio: [
    'Hello! I am a second-year student in the John Martinson Honors Program at Northeastern University, studying Computer Science and Mathematics.',
    'I like building full-stack, data-driven apps: SwipeWise, a dining app that helps Northeastern students spend meal swipes wisely; Project Prometheus, a stock-simulation game that won Best Beginner at HackBeanpot 2026; and Sprouted, a role-based platform for managing community gardens.',
    'I am currently looking for a Spring 2027 (January to June) co-op or internship in Software Engineering or Data Analytics.',
  ],
  photo: {
    src: '/images/portrait-480.webp',
    srcSet: '/images/portrait-480.webp 480w, /images/portrait-960.webp 960w',
    alt: `Portrait of ${SITE.name}`,
  },
  resume: {
    href: '/documents/eg_pw_resume.pdf',
    downloadName: 'Emanuel-Galindo-Garcia-Resume.pdf',
  },
}

export const EDUCATION: EducationEntry[] = [
  {
    school: 'Northeastern University',
    location: 'Boston, MA',
    degrees: ['B.S. in Computer Science and Mathematics'],
    graduation: 'Expected May 2029',
    gpa: { value: '3.72 / 4.0', show: true },
    coursework: [
      'Algorithms',
      'Object-Oriented Design',
      'Intro to Databases',
      'Computer Systems',
      'Linear Algebra',
      'Matrix Methods for Data Analysis and Machine Learning',
      'Projects in Cloud Computing (AWS)',
    ],
    honors: ['John Martinson Honors Program', "Dean's List"],
    clubs: [
      'Association of Latino Professionals for America (ALPFA)',
      'ColorStack',
      'Oasis',
      'Northeastern Electric Racing: Software',
    ],
  },
  {
    school: 'Brewster High School',
    location: 'Brewster, NY',
    degrees: [],
    graduation: 'June 2025',
    coursework: [],
    honors: ['Ranked 5th out of 277 in the 2025 graduating class', 'College Board National Hispanic Recognition'],
    clubs: ['FIRST Robotics: Software Co-Lead', 'Math Honor Society: Secretary'],
  },
]

export const EXPERIENCE: ExperienceEntry[] = [
  {
    company: 'VistaLab Technologies',
    role: 'Engineer Intern',
    start: 'June 2025',
    end: 'August 2025',
    location: 'Patterson, NY',
    bullets: [
      'Verified zero air-tank leaks across over 25 units through systematic pressure testing per QC protocol.',
      'Diagnosed 4 defective PCB boards via Realterm serial capture, catching display faults before assembly.',
      'Authored 3 formal technical test reports on benchmarking device performance and reliability for lab instrumentation, following professional engineering documentation standards.',
    ],
    tech: ['N/A'],
  },
]

export const PROJECTS: Project[] = [
  {
    id: 'sprouted',
    title: 'Sprouted',
    date: 'April 2026',
    pitch: 'A community garden management platform with dashboards for five different kinds of users.',
    description: [
      'Built a 5-module Streamlit dashboard supporting 5 distinct user roles, integrated with a Flask REST API through role-based navigation so every persona gets permission-aware access.',
      "Designed the schema and relations for the garden admin role within the platform's 5-role MySQL database.",
    ],
    highlights: [
      { label: 'Architecture', value: 'Streamlit frontend → Flask REST API → MySQL, containerized with Docker' },
      { label: 'Data', value: '5-role relational schema; designed the garden admin tables and relations' },
      { label: 'Access control', value: 'Role-based navigation, permission-aware across all 5 personas' },
    ],
    tech: ['Python', 'MySQL', 'Streamlit', 'Flask', 'Docker'],
    links: {}, // TODO: add github / demo URLs if public
    accent: '#9fe0a0',
  },
  {
    id: 'swipewise',
    title: 'SwipeWise',
    date: 'March 2026',
    pitch: 'A swipe-spending tracker and dining app that recommends cost-saving meal plans for Northeastern students.',
    description: [
      "A full-stack app that tracks meal-swipe spending and recommends cost-saving meal plans based on each student's usage. A Python pipeline fetches and parses DineOnCampus API data to power real-time dining hall menus.",
      'To keep it fast and reliable, I engineered a two-layer TTL cache over the DineOnCampus API to cut redundant external calls, resolved cross-device 403 errors with curl_cffi browser impersonation, and organized the FastAPI backend into services, routers, and models layers with CORS middleware.',
    ],
    highlights: [
      { label: 'Architecture', value: 'FastAPI (services / routers / models) + React and Vite frontend' },
      { label: 'Data', value: 'Python pipeline over the DineOnCampus API, Supabase PostgreSQL' },
      { label: 'Performance', value: 'Two-layer TTL cache cuts redundant external API calls' },
      { label: 'Reliability', value: 'curl_cffi browser impersonation fixed cross-device 403 errors' },
    ],
    tech: ['Python', 'FastAPI', 'React', 'Vite', 'Supabase', 'PostgreSQL'],
    links: {}, // TODO: add github / demo URLs if public
    accent: '#f6c177',
  },
  {
    id: 'project-prometheus',
    title: 'Project Prometheus',
    date: 'February 2026',
    pitch:
      'A stock-market simulation game: track a virtual portfolio against real market data and climb the leaderboard.',
    description: [
      'A full-stack stock simulation platform where users compete on leaderboards by tracking virtual portfolios against real market data. Built at HackBeanpot 2026.',
      'I designed the PostgreSQL relational database for users, portfolios, and leaderboards (persistent multi-user state) and developed secure authentication with Supabase Auth, custom React modals, and protected frontend routing.',
    ],
    highlights: [
      { label: 'Award', value: '"Best Beginner" at HackBeanpot 2026, among 20+ teams' },
      { label: 'Data', value: 'PostgreSQL schema for users, portfolios, and leaderboards' },
      { label: 'Auth', value: 'Supabase Auth with custom React modals and protected routes' },
    ],
    tech: ['React', 'JavaScript', 'Supabase', 'PostgreSQL', 'AWS Lambda'],
    links: {}, // TODO: add github / demo (e.g. Devpost) URLs if public
    accent: '#ff9b7a',
  },
  {
    id: 'this-site',
    title: 'This portfolio',
    date: '2026',
    pitch: 'A cinematic, explorable solar system that still reads like a resume.',
    description: [
      'React Three Fiber scene with custom GLSL (sun surface, fresnel atmospheres, Saturn ring shadows computed analytically in both directions), HDR bloom, and an interruptible camera director. Every word of content is real DOM from one typed data file, shared with a fast 2D fallback.',
    ],
    highlights: [
      { label: 'Architecture', value: 'Vite + React + R3F, zustand, Vercel serverless contact API' },
      { label: 'Performance', value: '3D code split from the 2D view, quality tiers, instanced meshes' },
    ],
    tech: ['TypeScript', 'three.js', 'GLSL', 'React', 'Tailwind'],
    links: { github: 'https://github.com/emanuel8006/personal_website' },
    accent: '#7fe3ff',
  },
]

const plain = (...names: string[]) => names.map((name) => ({ name }))

export const SKILLS: SkillCategory[] = [
  { name: 'Languages', skills: plain('Python', 'Java', 'JavaScript', 'C', 'Lean') },
  { name: 'Backend & Web', skills: plain('FastAPI', 'Flask', 'React', 'Vite', 'Streamlit', 'REST APIs', 'curl_cffi') },
  {
    name: 'Data',
    skills: plain('Pandas', 'NumPy', 'Matplotlib', 'ETL pipelines', 'PostgreSQL', 'MySQL', 'Supabase'),
  },
  { name: 'Cloud & DevOps', skills: plain('AWS', 'AWS Lambda', 'Docker') },
  { name: 'Developer Tools', skills: plain('Git', 'GitHub', 'Visual Studio Code', 'IntelliJ IDEA', 'DataGrip') },
]

export const CONTACT: Contact = {
  intro:
    "I'm looking for a Spring 2027 (January to June) co-op or summer internship in software engineering or data analytics. The fastest way to reach me is the form below.",
  publicEmail: undefined, // TODO: optional, e.g. 'you@northeastern.edu'
  socials: [
    { kind: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/emanuel-galindo-garcia' },
    { kind: 'github', label: 'GitHub', href: 'https://github.com/emanuel8006' },
    // Add more: { kind: 'devpost' | 'x' | 'website' | 'other', label, href }
  ],
}

export const PERSONAL: Personal = {
  blurb: [
    "Off the clock you'll find me hiking, watching sci-fi shows, or reading about space exploration (which probably explains this website). I'm also interested in artificial intelligence and in digital inclusion: making technology work for everyone.",
  ],
  hobbies: ['Hiking', 'Sci-fi shows', 'Space exploration', 'Artificial intelligence', 'Digital inclusion'],
  funFacts: [
    'Before Northeastern, I co-led software for my high school FIRST Robotics team.',
    'One of the languages I know is Lean, which doubles as a theorem prover for math proofs.',
    '[PLACEHOLDER] Something surprising about you that is not on your resume',
  ],
}
