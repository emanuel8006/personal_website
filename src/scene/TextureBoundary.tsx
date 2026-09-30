import { Component, type ReactNode } from 'react'

/**
 * If a texture fails to load at runtime (network error, bad file), render
 * the procedural fallback instead of taking down the whole scene.
 */
export default class TextureBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('[scene] texture failed to load, using procedural fallback:', error)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
