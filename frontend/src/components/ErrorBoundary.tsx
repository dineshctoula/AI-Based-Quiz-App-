import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary catches JavaScript errors anywhere in its child component tree,
 * logs those errors, and displays a premium glassmorphic fallback UI.
 * 
 * ErrorBoundary ले child components मा आउने जुनसुकै JavaScript error लाई catch गर्छ,
 * log गर्छ, र एउटा प्रिमियम fallback UI देखाउँछ।
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  /**
   * Update state so the next render will show the fallback UI.
   * Fallback UI देखाउनका लागि state update गरेको।
   */
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   * Catch errors in children and log them.
   * Children मा आउने error हरू catch गरेर log गर्ने।
   */
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    // Reload the current page to restore state
    // state restore गर्न page reload गर्ने
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
          color: '#ffffff',
          fontFamily: 'Inter, system-ui, sans-serif',
          padding: '20px'
        }}>
          {/* Glassmorphic Error Container */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            padding: '40px',
            maxWidth: '500px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            {/* Warning Icon */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '2px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '0 auto 24px',
              color: '#ef4444',
              fontSize: '32px',
              fontWeight: 'bold'
            }}>
              !
            </div>

            <h1 style={{
              fontSize: '1.8rem',
              fontWeight: 700,
              marginBottom: '12px',
              background: 'linear-gradient(to right, #ffffff, #cbd5e1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Something went wrong
            </h1>
            <h2 style={{
              fontSize: '1.1rem',
              fontWeight: 500,
              color: 'var(--secondary, #38bdf8)',
              marginBottom: '20px'
            }}>
              केही गडबड भयो!
            </h2>

            <p style={{
              color: '#94a3b8',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              marginBottom: '32px'
            }}>
              An unexpected client-side error occurred. Don't worry, your progress is safe. Press the button below to return to safety.
            </p>

            {/* Error Detail accordion */}
            {this.state.error && (
              <details style={{
                textAlign: 'left',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '32px',
                fontSize: '0.85rem',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <summary style={{ cursor: 'pointer', color: '#64748b', userSelect: 'none' }}>
                  Technical details | प्राविधिक विवरणहरू
                </summary>
                <div style={{
                  marginTop: '8px',
                  color: '#ef4444',
                  whiteSpace: 'pre-wrap',
                  maxHeight: '150px',
                  overflowY: 'auto',
                  fontFamily: 'monospace'
                }}>
                  {this.state.error.message}
                </div>
              </details>
            )}

            <button
              onClick={this.handleReload}
              style={{
                width: '100%',
                padding: '14px 28px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.3)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Go to Home Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
