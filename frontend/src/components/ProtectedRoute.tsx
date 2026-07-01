import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute blocks access to specific pages (like Dashboard)
 * if the user is not authenticated. It redirects them to the login screen.
 * 
 * ProtectedRoute ले login नभएका user लाई /login page मा redirect गराउँछ।
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // Show a glassmorphic loading shell while restoring session
  // user authorization status verify हुँदै गर्दा loading screen देखाउने
  if (loading) {
    return (
      <div className="loading-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        color: 'var(--text-primary)'
      }}>
        <div style={{
          padding: '40px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ marginBottom: '10px' }}>MindSpark AI</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Verifying session, please wait...</p>
        </div>
      </div>
    );
  }

  // If not logged in, redirect to login page
  // user object null छ भने login page मा redirect गर्ने
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Render child components if authenticated
  // logged in छ भने Dashboard वा requested component render गर्ने
  return <>{children}</>;
};
