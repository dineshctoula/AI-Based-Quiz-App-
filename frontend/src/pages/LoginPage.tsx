import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * LoginPage serves as a unified Authentication page.
 * It toggles between "Login" and "Sign Up" modes, rendering fields conditionally.
 * Includes premium glassmorphic elements, state tracking, and error messaging.
 * 
 * LoginPage ले Login र Sign Up दुबैको काम गर्छ। 'isLogin' state अनुसार form परिवर्तन हुन्छ।
 */
export const LoginPage: React.FC = () => {
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
      // Mock flow for Commit 4 - will be replaced with real AuthContext calls in Commit 5
      // Commit 4 को लागि mock code - Commit 5 मा यसलाई real API call ले replace गरिनेछ
      console.log(isLogin ? 'Signing In...' : 'Registering...', { name, email, password });
      
      // Simulate API request delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Navigate to dashboard on success
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'केही गडबड भयो (Something went wrong)');
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
        {/* login state अनुसार header text change गर्ने */}
        <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        
        <p className="auth-sub">
          {isLogin 
            ? 'Sign in to your account to track your progress' 
            : 'Register now to start generating AI-powered custom quizzes'}
        </p>

        {/* ===== ERROR DISPLAY (त्रुटि सन्देश देखाउने ठाउँ) ===== */}
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
          {/* Sign Up गर्दा मात्र नाम हाल्ने field देखाउने */}
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
          {/* loading हुँदा disable गर्ने */}
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
        {/* Mode switch गर्ने button (Login -> Signup / Signup -> Login) */}
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