import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrainCircuit, Award, Clock, Play, AlertTriangle, HelpCircle, User } from 'lucide-react';

// API base URL matching AuthContext
const API_URL = 'http://localhost:5000/api';

interface Creator {
  id: number;
  name: string;
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  topic: string;
  difficulty: string;
  timeLimit: number;
  creator: Creator;
  _count: {
    questions: number;
  };
}

interface Attempt {
  id: number;
  score: number;
  completedAt: string;
  answers: any[];
  quiz: {
    id: number;
    title: string;
    topic: string;
    difficulty: string;
    _count: {
      questions: number;
    };
  };
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  // Component state
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch quizzes and attempts data in parallel
  // quizzes र user का attempts details parallel रूपमा fetch गर्ने
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const headers = {
          'Authorization': `Bearer ${token}`,
        };

        const [quizzesRes, attemptsRes] = await Promise.all([
          fetch(`${API_URL}/quizzes`, { headers }),
          fetch(`${API_URL}/quizzes/attempts/my`, { headers }),
        ]);

        if (!quizzesRes.ok || !attemptsRes.ok) {
          throw new Error('Failed to load dashboard data');
        }

        const quizzesData = await quizzesRes.json();
        const attemptsData = await attemptsRes.json();

        setQuizzes(quizzesData);
        setAttempts(attemptsData);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Error loading dashboard | Dashboard लोड गर्दा समस्या आयो');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  // Compute stats from attempt history
  // attempts history बाट user stats calculate गर्ने
  const totalCompleted = attempts.length;
  const averageScore =
    totalCompleted > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / totalCompleted)
      : 0;
  
  // Calculate dynamic rank
  const getRank = (score: number, completed: number) => {
    if (completed === 0) return 'Unranked';
    const rankNum = Math.max(1, 500 - completed * 20 - Math.round(score * 1.5));
    return `#${rankNum}`;
  };

  const rank = getRank(averageScore, totalCompleted);

  if (loading) {
    return (
      <div className="wizard-page-container flex-center" style={{ minHeight: '50vh' }}>
        <div className="loader-spinner-wrapper">
          <div className="glowing-spinner"></div>
          <BrainCircuit className="center-sparkle" size={24} />
        </div>
        <p style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>
          Loading dashboard insights... | Dashboard लोड हुँदैछ...
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* ambient design background */}
      <div className="glow-ring glow-ring-left" style={{ opacity: 0.05 }}></div>

      {/* Header section */}
      <header className="dashboard-header">
        <div>
          <h1>Welcome back, {user?.name || 'Quizzer'}!</h1>
          <p className="subtitle">Ready to test your knowledge or generate a new AI challenge?</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/generate')}>
          + Generate AI Quiz
        </button>
      </header>

      {/* Error message banner */}
      {errorMsg && (
        <div className="wizard-error-banner">
          <AlertTriangle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Statistics Cards Grid */}
      {/* User को real-time statistics cards */}
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-label">Quizzes Completed</span>
          <span className="stat-val">{totalCompleted}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Average Score</span>
          <span className="stat-val">{averageScore}%</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Global Rank</span>
          <span className="stat-val">{rank}</span>
        </div>
      </div>

      <div className="dashboard-split-layout" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px', marginTop: '16px' }}>
        
        {/* Left Column: Available Quizzes list */}
        {/* Play गर्न मिल्ने उपलब्ध quiz हरूको सूची */}
        <section className="dashboard-section">
          <h2>Available AI Quizzes</h2>
          {quizzes.length === 0 ? (
            <div className="quiz-card-placeholder" style={{ textAlign: 'center', padding: '40px' }}>
              <HelpCircle size={32} style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }} />
              <h3>No quizzes available</h3>
              <p>Be the first to generate a quiz using AI!</p>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => navigate('/generate')}
                style={{ marginTop: '12px' }}
              >
                Create Now
              </button>
            </div>
          ) : (
            <div className="recent-grid" style={{ gridTemplateColumns: '1fr' }}>
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="quiz-card-placeholder">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="difficulty-badge" style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', marginRight: '8px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                        {quiz.difficulty}
                      </span>
                      <span className="topic-badge" style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(217, 70, 239, 0.2)' }}>
                        {quiz.topic}
                      </span>
                      <h3 style={{ marginTop: '12px', fontSize: '1.2rem' }}>{quiz.title}</h3>
                      <p style={{ marginTop: '6px', fontSize: '0.85rem' }}>{quiz.description}</p>
                    </div>
                  </div>

                  <div className="card-footer" style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {(quiz.timeLimit / 60).toFixed(0)} min
                      </span>
                      <span>•</span>
                      <span>{quiz._count.questions} MCQs</span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={12} /> {quiz.creator?.name || 'AI'}
                      </span>
                    </div>

                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => navigate(`/quiz/${quiz.id}`)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', border: '1px solid var(--secondary)' }}
                    >
                      <Play size={12} fill="currentColor" /> Play Quiz
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right Column: User Attempt History */}
        {/* User ले पहिले खेलेका attempts र तिनीहरूका score/review */}
        <section className="dashboard-section">
          <h2>Your Attempt History</h2>
          {attempts.length === 0 ? (
            <div className="quiz-card-placeholder" style={{ textAlign: 'center', padding: '40px' }}>
              <Award size={32} style={{ margin: '0 auto 12px', color: 'var(--text-muted)' }} />
              <h3>No attempts yet</h3>
              <p>Play a quiz to record your first score!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {attempts.map((attempt) => (
                <div 
                  key={attempt.id} 
                  className="quiz-card-placeholder" 
                  style={{ padding: '16px 20px', gap: '8px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '70%' }}>
                      {attempt.quiz?.title || 'Deleted Quiz'}
                    </h4>
                    <span 
                      style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 700, 
                        color: attempt.score >= 70 ? 'var(--success)' : attempt.score >= 40 ? 'var(--warning)' : 'var(--error)',
                        background: attempt.score >= 70 ? 'rgba(16, 185, 129, 0.1)' : attempt.score >= 40 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        padding: '4px 10px',
                        borderRadius: '6px',
                      }}
                    >
                      {attempt.score}%
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--glass-border)', paddingTop: '10px', marginTop: '4px' }}>
                    <span>
                      {new Date(attempt.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                    <button 
                      onClick={() => navigate('/quiz/result', { state: { attempt } })}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
