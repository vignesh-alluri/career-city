import { Component, type ReactNode } from 'react'

interface Props { fallback: ReactNode; children: ReactNode }

/** Catches errors thrown while rendering children (e.g. the 3D chunk failing to load) and shows a fallback instead of a blank page. */
export class ErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error: unknown) { console.error('Component failed to render:', error) }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}
