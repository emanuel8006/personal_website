import type { SectionId } from '../store'
import type { TextureKey } from './textures'

/**
 * Artistic (not realistic) layout of the system. Units are arbitrary scene
 * units; the Sun sits at the origin. Speeds are radians per second.
 */

export const SUN_RADIUS = 9
/** World radius the camera frames when the Sun (About) is focused, corona included. */
export const SUN_FRAME_RADIUS = 13

export interface AtmosphereConfig {
  color: string
  /** Rim brightness on the disk. */
  rim: number
  /** Soft halo just outside the silhouette (0 disables it). */
  halo: number
}

export interface MoonConfig {
  radius: number
  distance: number
  speed: number
  /** Starting angle (radians) around the parent. */
  phase: number
  /** Tilt of the moon's orbit plane (radians). */
  inclination?: number
  /** Multiplied with the moon texture, or used as the procedural base color. */
  tint?: string
}

export interface PlanetConfig {
  id: SectionId
  name: string
  radius: number
  orbitRadius: number
  orbitSpeed: number
  /** Starting angle (radians), chosen so the opening shot reads clearly. */
  phase: number
  /** Axial tilt (radians). */
  tilt: number
  /** Direction the axis leans, around the vertical (radians). π/2 leans it toward the opening camera. */
  tiltAzimuth?: number
  spinSpeed: number
  texture: TextureKey
  /** Used when the texture is missing: procedural surface style + palette. */
  fallback: { style: 'rocky' | 'banded'; colors: string[] }
  atmosphere?: AtmosphereConfig
  /** World radius the camera frames when focused (includes rings, close moons). */
  frameRadius: number
  /** Invisible click/hover sphere radius; generous so small planets are easy to hit. */
  hitRadius: number
}

const deg = (d: number) => (d * Math.PI) / 180

export const PLANETS: Record<Exclude<SectionId, 'about'>, PlanetConfig> = {
  contact: {
    id: 'contact',
    name: 'Mercury',
    radius: 2.0,
    orbitRadius: 22,
    orbitSpeed: 0.08,
    phase: deg(15),
    tilt: deg(2),
    spinSpeed: 0.05,
    texture: 'mercury',
    fallback: { style: 'rocky', colors: ['#5f5a55', '#8c857c', '#3d3a37'] },
    frameRadius: 3.6,
    hitRadius: 3.6,
  },
  education: {
    id: 'education',
    name: 'Earth',
    radius: 3.3,
    orbitRadius: 35,
    orbitSpeed: 0.05,
    phase: deg(140),
    tilt: deg(23.4),
    spinSpeed: 0.12,
    texture: 'earthDay',
    fallback: { style: 'rocky', colors: ['#1d4e89', '#2f7d4a', '#c2b280'] },
    atmosphere: { color: '#5aa9ff', rim: 1.6, halo: 1.1 },
    frameRadius: 4.8,
    hitRadius: 5,
  },
  experience: {
    id: 'experience',
    name: 'Mars',
    radius: 2.6,
    orbitRadius: 48,
    orbitSpeed: 0.038,
    phase: deg(35),
    tilt: deg(25),
    spinSpeed: 0.11,
    texture: 'mars',
    fallback: { style: 'rocky', colors: ['#a0442a', '#c96b3c', '#6e2c1b'] },
    atmosphere: { color: '#ff9a6b', rim: 0.7, halo: 0.45 },
    frameRadius: 3.3,
    hitRadius: 4,
  },
  projects: {
    id: 'projects',
    name: 'Jupiter',
    radius: 7,
    orbitRadius: 80,
    orbitSpeed: 0.02,
    phase: deg(160),
    tilt: deg(3),
    spinSpeed: 0.2,
    texture: 'jupiter',
    fallback: { style: 'banded', colors: ['#d8c3a5', '#a9825c', '#e9dcc7', '#8c6a4f'] },
    atmosphere: { color: '#f0d9b5', rim: 0.55, halo: 0.2 },
    frameRadius: 10.5,
    hitRadius: 9,
  },
  skills: {
    id: 'skills',
    name: 'Saturn',
    radius: 5.8,
    orbitRadius: 106,
    orbitSpeed: 0.014,
    phase: deg(25),
    tilt: deg(26.7),
    tiltAzimuth: deg(90),
    spinSpeed: 0.18,
    texture: 'saturn',
    fallback: { style: 'banded', colors: ['#e3d3a8', '#c8b07a', '#f0e4c4', '#b09a6a'] },
    atmosphere: { color: '#f5e2b0', rim: 0.5, halo: 0.18 },
    frameRadius: 14,
    hitRadius: 13.6,
  },
  personal: {
    id: 'personal',
    name: 'Planet X',
    radius: 3,
    orbitRadius: 160,
    orbitSpeed: 0.006,
    phase: deg(110),
    tilt: deg(28),
    spinSpeed: 0.09,
    texture: 'planetX',
    fallback: { style: 'banded', colors: ['#2b4fb8', '#3f6fe0', '#1c3480'] },
    atmosphere: { color: '#6f9dff', rim: 1.1, halo: 0.7 },
    frameRadius: 4,
    hitRadius: 4.5,
  },
}

/** Draw / orbit order outward from the Sun. Planet X is hidden until discovered. */
export const PLANET_ORDER = ['contact', 'education', 'experience', 'projects', 'skills', 'personal'] as const

export const EARTH_MOON: MoonConfig = { radius: 0.85, distance: 6, speed: 0.35, phase: 0, inclination: deg(5) }

/** Saturn ring extents as multiples of Saturn's radius. */
export const SATURN_RING = { inner: 1.25, outer: 2.35 }

/**
 * Placeholder Jupiter moons. Phase 4 derives these from the projects in
 * src/data/content.ts (one moon per project).
 */
export const JUPITER_MOONS_PLACEHOLDER: MoonConfig[] = [
  { radius: 0.7, distance: 10.5, speed: 0.42, phase: deg(20), inclination: deg(4), tint: '#e8d6a0' },
  { radius: 0.62, distance: 12.5, speed: 0.33, phase: deg(140), inclination: deg(-3), tint: '#d9d2c5' },
  { radius: 0.85, distance: 14.6, speed: 0.26, phase: deg(250), inclination: deg(2), tint: '#b7a58c' },
  { radius: 0.75, distance: 16.8, speed: 0.2, phase: deg(320), inclination: deg(-5), tint: '#8f8577' },
]

export function frameRadius(id: SectionId) {
  return id === 'about' ? SUN_FRAME_RADIUS : PLANETS[id].frameRadius
}
