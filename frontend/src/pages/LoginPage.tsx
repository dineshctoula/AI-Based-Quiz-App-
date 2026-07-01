import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * LoginPage serves as a unified Authentication page.
 * It toggles between "Login" and "Sign Up" modes, rendering fields conditionally.
 * Includes premium glassmorphic elements, state tracking, and error messaging.
 * Consumes AuthContext to trigger real login/register network operations.
 * 
 * LoginPage ले Login र Sign Up दुबैको काम गर्छ। 'isLogin' state अनुसार form परिवर्तन हुन्छ।
 * यसले context (useAuth) प्रयोग गरेर real API operations चलाउँछ।
 */
export const LoginPage: React.FC = () => {
  const { login, signup } = useAuth();

  // ===== STATE CONFIGURATION =====
  const [isLogin, setIsLogin] = useState<boolean>(true); // Mode toggle: true = Login, false = Sign Up
  const [name, setName] = useState<string>('');           // Name (only for Sign Up)
  const [email, setEmail] = useState<string>('');         // Email input
  const [password, setPassword] = useState<string>('');   // Password input
  const [error, setError] = useState<string>('');         // Error alert message
  const [loading, setLoading] = useState<boolean>(false); // Button spinner / loading state

  const navigate = useNavigate();

  // ===== FORM SUBMISSION HANDLER =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic Validations
    if (!email || !password) {
      setError('कृपया सबै आवश्यक क्षेत्रहरू भर्नुहोस् (Please fill in all required fields)');
      setLoading(false);
      return;
    }

    if (!isLogin && !name) {
      setError('कृपया आफ्नो नाम हाल्नुहोस् (Please enter your name)');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('पासवर्ड कम्तिमा ६ अक्षरको हुनुपर्छ (Password must be at least 6 characters)');
      setLoading(false);
      return;
    }

    try {
      // Connect to AuthContext functions based on current form mode
      // login वा signup API call गराउने
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(name, email, password);
      }
      
      // Navigate to dashboard on success
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'अवैध विवरणहरू वा सर्भर त्रुटि (Invalid credentials or server error)');
    } finally {
      setLoading(false);
    }
  };

  // Toggle between Login and Sign Up views
  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Title based on isLogin state */}
        <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        
        <p className="auth-sub">
          {isLogin 
            ? 'Sign in to your account to track your progress' 
            : 'Register now to start generating AI-powered custom quizzes'}
        </p>

        {/* ===== ERROR DISPLAY ===== */}
        {error && (
          <div className="auth-error-alert" style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '0.9rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* ===== AUTH FORM ===== */}
        <form onSubmit={handleSubmit} className="auth-form">
          
          {/* ===== NAME FIELD (Only shown in Sign Up mode) ===== */}
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          {/* ===== EMAIL FIELD ===== */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* ===== PASSWORD FIELD ===== */}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* ===== SUBMIT BUTTON ===== */}
          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading 
              ? 'Processing...' 
              : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        {/* ===== MODE TOGGLE LINK ===== */}
        <div className="auth-toggle" style={{ marginTop: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              onClick={handleToggleMode}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-color)',
                cursor: 'pointer',
                fontWeight: '600',
                padding: '0 4px',
                textDecoration: 'underline'
              }}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};