import { Component } from 'react'

// Last-resort fallback so an unexpected render error never leaves a blank page.
export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error, info) {
    console.error('Portfolio render error:', error, info)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="error-screen" role="alert">
        <h1>Something went wrong</h1>
        <p>The page hit an unexpected error. Reloading usually fixes it.</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Reload page
        </button>
      </main>
    )
  }
}
