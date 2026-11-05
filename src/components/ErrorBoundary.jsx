import { Component } from 'react'

/** Catches render errors so one failing part (e.g. a 3D asset that can't load offline) doesn't blank the whole app. */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error) {
    console.error(error)
  }

  render() {
    if (this.state.error) return this.props.fallback ?? null
    return this.props.children
  }
}
