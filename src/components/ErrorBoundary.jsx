import { Component } from 'react';
import T from '../constants/theme';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleClearAndReset = () => {
    // Only clear potentially corrupted data for the current page
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" style={{
          padding: 32, textAlign: 'center', minHeight: '50vh',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😵</div>
          <h2 style={{ color: T.text, fontSize: 20, marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p style={{ color: T.textMid, fontSize: 14, marginBottom: 24, maxWidth: 300, lineHeight: 1.6 }}>
            An unexpected error occurred. You can try again or reload the page.
          </p>
          {this.state.error && (
            <details style={{ marginBottom: 16, color: T.textDim, fontSize: 12, maxWidth: 300 }}>
              <summary style={{ cursor: 'pointer', marginBottom: 4 }}>Error details</summary>
              <code style={{ wordBreak: 'break-all' }}>{this.state.error.message}</code>
            </details>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '10px 20px', borderRadius: 10,
                background: T.rose, border: 'none',
                color: '#fff', fontSize: 14, cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Try Again
            </button>
            <button
              onClick={this.handleClearAndReset}
              style={{
                padding: '10px 20px', borderRadius: 10,
                background: T.card, border: `1px solid ${T.border}`,
                color: T.textMid, fontSize: 14, cursor: 'pointer',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
