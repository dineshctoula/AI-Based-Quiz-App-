import React from 'react';
import { Link } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  return (
    <div className="landing-container">
      <section className="hero">
        <h1 className="hero-title">Supercharge Your Learning with AI Quizzes</h1>
        <p className="hero-subtitle">
          Generate customized multiple-choice tests on any topic instantly using the power of Google Gemini AI.
        </p>
        <div className="hero-actions">
          <Link to="/login" className="btn btn-primary">Get Started</Link>
          <a href="#features" className="btn btn-secondary">Learn More</a>
        </div>
      </section>
      
      <section id="features" className="features-grid">
        <div className="feature-card">
          <h3>Instant AI Generation</h3>
          <p>Type any topic or upload text, choose difficulty, and get a quiz generated instantly.</p>
        </div>
        <div className="feature-card">
          <h3>Detailed Analytics</h3>
          <p>Track your score histories, time averages, and detailed performance insights.</p>
        </div>
        <div className="feature-card">
          <h3>Real-time Multiplayer</h3>
          <p>Create active quiz lobbies, share invite codes, and compete with friends live.</p>
        </div>
      </section>
    </div>
  );
};
