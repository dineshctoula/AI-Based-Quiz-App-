import React from 'react';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Welcome back, Quizzer!</h1>
          <p className="subtitle">Ready to test your knowledge or generate a new challenge?</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/generate')}>
          + Generate AI Quiz
        </button>
      </header>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Quizzes Completed</span>
          <span className="stat-val">12</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Average Score</span>
          <span className="stat-val">84%</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Global Rank</span>
          <span className="stat-val">#422</span>
        </div>
      </div>

      <section className="dashboard-section">
        <h2>Your Recent Quizzes</h2>
        <div className="recent-grid">
          <div className="quiz-card-placeholder">
            <h3>React Design Patterns</h3>
            <p>Difficulty: Intermediate • 10 Questions</p>
            <div className="card-footer">
              <span>Score: 90%</span>
              <button className="btn btn-secondary btn-sm">Retake</button>
            </div>
          </div>
          <div className="quiz-card-placeholder">
            <h3>NestJS Dependency Injection</h3>
            <p>Difficulty: Advanced • 8 Questions</p>
            <div className="card-footer">
              <span>Score: 75%</span>
              <button className="btn btn-secondary btn-sm">Retake</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
