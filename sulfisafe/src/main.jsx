import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(err, info) {
    console.error('App crashed:', err, info);
  }
  handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.href = '/';
  };
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0b0f19',
          color: '#f8fafc',
          fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '440px',
            width: '100%',
            background: '#131d2e',
            border: '1px solid #1e293b',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛡️</div>
            <h2 style={{ color: '#38bdf8', margin: '0 0 8px', fontSize: '22px' }}>SulfiSafe Portal</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5', margin: '0 0 24px' }}>
              The application encountered a transient state issue. Click below to refresh your session.
            </p>
            <button
              onClick={this.handleReset}
              style={{
                width: '100%',
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Reset Session & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
