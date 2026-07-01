import React from 'react';
import { Link } from 'react-router-dom';

// Landing Page component
export const LandingPage: React.FC = () => {
  return (
    <div className="landing-container">

      {/* Hero section - मुख्य परिचय भाग */}
      <section className="hero">

        {/* मुख्य शीर्षक */}
        <h1 className="hero-title">
          Supercharge Your Learning with AI Quizzes
        </h1>

        {/* उपशीर्षक / विवरण */}
        <p className="hero-subtitle">
          Generate customized multiple-choice tests on any topic instantly using the power of Google Gemini AI.
        </p>

        {/* Action buttons - सुरु गर्ने बटनहरू */}
        <div className="hero-actions">

          {/* Login पेजमा जान */}
          <Link to="/login" className="btn btn-primary">
            Get Started
          </Link>

          {/* Features section मा scroll गर्ने लिंक */}
          <a href="#features" className="btn btn-secondary">
            Learn More
          </a>

        </div>
      </section>

      {/* Features section - विशेषताहरू देखाउने भाग */}
      <section id="features" className="features-grid">

        {/* Feature 1 */}
        <div className="feature-card">
          <h3>Instant AI Generation</h3>
          <p>
            Type any topic or upload text, choose difficulty, and get a quiz generated instantly.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="feature-card">
          <h3>Detailed Analytics</h3>
          <p>
            Track your score histories, time averages, and detailed performance insights.
          </p>
        </div>

        {/* Feature 3 */}
        <div className="feature-card">
          <h3>Real-time Multiplayer</h3>
          <p>
            Create active quiz lobbies, share invite codes, and compete with friends live.
          </p>
        </div>

      </section>
    </div>
  );
};