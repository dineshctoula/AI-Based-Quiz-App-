import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Zap, BarChart3, Users, ArrowRight } from 'lucide-react';

// Landing Page component (क्विज application को गृह पृष्ठ)
export const LandingPage: React.FC = () => {
  return (
    <div className="landing-container animate-fade-in-up">

      {/* Hero section - मुख्य परिचय भाग (मुख्य सन्देश र बटनहरू) */}
      <section className="hero">
        
        {/* Glow badge above header - चम्किलो ब्याज (AI highlights) */}
        <div className="hero-badge animate-fade-in-up delay-1">
          <Sparkles size={14} className="pulse-icon" />
          AI-Powered Knowledge Hub
        </div>

        {/* मुख्य शीर्षक (Main dynamic heading) */}
        <h1 className="hero-title animate-fade-in-up delay-1">
          Supercharge Your Learning with AI Quizzes
        </h1>

        {/* उपशीर्षक / विवरण (Subtitle overview of project) */}
        <p className="hero-subtitle animate-fade-in-up delay-2">
          Generate customized multiple-choice tests on any topic instantly using the power of Google Gemini AI.
        </p>

        {/* Action buttons - सुरु गर्ने बटनहरू (CTA buttons) */}
        <div className="hero-actions animate-fade-in-up delay-3">

          {/* Login पेजमा जान (Navigate to sign in / signup) */}
          <Link to="/login" className="btn btn-primary btn-primary-glow">
            Get Started <ArrowRight size={18} style={{ marginLeft: '8px' }} />
          </Link>

          {/* Features section मा scroll गर्ने लिंक (Scroll to features) */}
          <a href="#features" className="btn btn-secondary">
            Learn More
          </a>

        </div>
      </section>

      {/* Features section - विशेषताहरू देखाउने भाग (Features details section) */}
      <section id="features" className="features-grid animate-fade-in-up delay-4">

        {/* Feature 1: Instant AI generation (तुरुन्तै क्विज बन्ने सुविधा) */}
        <div className="feature-card">
          <div className="feature-icon-wrapper">
            <Zap size={24} />
          </div>
          <h3>Instant AI Generation</h3>
          <p>
            Type any topic or upload text, choose difficulty, and get a quiz generated instantly.
          </p>
        </div>

        {/* Feature 2: Analytics (विस्तृत विश्लेषण) */}
        <div className="feature-card">
          <div className="feature-icon-wrapper">
            <BarChart3 size={24} />
          </div>
          <h3>Detailed Analytics</h3>
          <p>
            Track your score histories, time averages, and detailed performance insights.
          </p>
        </div>

        {/* Feature 3: Realtime Battle (रियल-टाइम प्रतिस्पर्धा) */}
        <div className="feature-card">
          <div className="feature-icon-wrapper">
            <Users size={24} />
          </div>
          <h3>Real-time Multiplayer</h3>
          <p>
            Create active quiz lobbies, share invite codes, and compete with friends live.
          </p>
        </div>

      </section>
    </div>
  );
};