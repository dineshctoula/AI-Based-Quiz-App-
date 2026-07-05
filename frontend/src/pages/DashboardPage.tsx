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

  interface PerformanceStats {
    strengths: Array<{ topic: string; averageScore: number; attemptsCount: number }>;
    history: Array<{ id: number; score: number; completedAt: string; quizTitle?: string }>;
  }
  const [perfStats, setPerfStats] = useState<PerformanceStats | null>(null);

  // Fetch quizzes, attempts, and performance stats in parallel
  // quizzes, attempts र user performance stats parallel रूपमा fetch गर्ने
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const headers = {
          'Authorization': `Bearer ${token}`,
        };

        const [quizzesRes, attemptsRes, perfRes] = await Promise.all([
          fetch(`${API_URL}/quizzes`, { headers }),
          fetch(`${API_URL}/quizzes/attempts/my`, { headers }),
          fetch(`${API_URL}/quizzes/stats/performance`, { headers }),
        ]);

        if (!quizzesRes.ok || !attemptsRes.ok || !perfRes.ok) {
          throw new Error('Failed to load dashboard data');
        }

        const quizzesData = await quizzesRes.json();
        const attemptsData = await attemptsRes.json();
        const perfData = await perfRes.json();

        setQuizzes(quizzesData);
        setAttempts(attemptsData);
        setPerfStats(perfData);
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

  // Helper to render the custom SVG performance trend chart
  // User को score trend देखाउन custom SVG Chart render गर्ने function
  const renderTrendChart = () => {
    if (!perfStats || !perfStats.history || perfStats.history.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          No quiz history available to map trend | ट्रेन्ड देखाउन पर्याप्त डेटा उपलब्ध छैन।
        </div>
      );
    }

    const history = perfStats.history;
    const width = 500;
    const height = 200;
    const paddingLeft = 40;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 35;
    
    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Generate coordinate points for each history item
    // coordinate points गणना गर्ने
    const points = history.map((item, index) => {
      const x = paddingLeft + (history.length > 1 ? (index / (history.length - 1)) * chartWidth : chartWidth / 2);
      const y = paddingTop + chartHeight - (item.score / 100) * chartHeight;
      return { x, y, score: item.score, date: new Date(item.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), topic: item.quizTitle || 'Quiz' };
    });

    // Create line path string
    // SVG line path string बनाउने
    const pathD = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    // Create gradient area closed path
    // gradient area fill गर्न closed path बनाउने
    const areaD = points.length > 0 
      ? `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
      : '';

    // Horizontal grid line values
    const gridLines = [0, 25, 50, 75, 100];

    return (
      <div className="svg-chart-container" style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
          <defs>
            <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="line-stroke-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--secondary)" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines and Y-axis labels */}
          {gridLines.map((val) => {
            const y = paddingTop + chartHeight - (val / 100) * chartHeight;
            return (
              <g key={val}>
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={width - paddingRight} 
                  y2={y} 
                  stroke="rgba(255, 255, 255, 0.05)" 
                  strokeDasharray="4 4" 
                />
                <text 
                  x={paddingLeft - 10} 
                  y={y + 4} 
                  fill="var(--text-muted)" 
                  fontSize="10" 
                  textAnchor="end"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Filled Area Gradient */}
          {areaD && <path d={areaD} fill="url(#chart-area-grad)" />}

          {/* Stroke Path Line */}
          {pathD && (
            <path 
              d={pathD} 
              fill="none" 
              stroke="url(#line-stroke-grad)" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          )}

          {/* Interactive dots and values */}
          {points.map((p, idx) => (
            <g key={idx} className="chart-dot-group">
              {/* Highlight line on hover */}
              <line
                x1={p.x}
                y1={paddingTop}
                x2={p.x}
                y2={paddingTop + chartHeight}
                stroke="rgba(6, 182, 212, 0.15)"
                strokeWidth="1.5"
                className="hover-guide-line"
              />
              {/* Background glowing pulse dot */}
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="6" 
                fill="var(--secondary)" 
                opacity="0.3"
                className="dot-glow"
              />
              {/* Foreground point dot */}
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="4" 
                fill="var(--secondary)" 
                stroke="#fff" 
                strokeWidth="1.5" 
                style={{ cursor: 'pointer' }}
              />
              {/* Score label above dot */}
              <text
                x={p.x}
                y={p.y - 8}
                fill="var(--text-primary)"
                fontSize="9"
                fontWeight="700"
                textAnchor="middle"
                className="dot-val-label"
              >
                {p.score}%
              </text>
              {/* Date label at X-axis */}
              <text 
                x={p.x} 
                y={height - 12} 
                fill="var(--text-muted)" 
                fontSize="9" 
                textAnchor="middle"
              >
                {p.date}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  // Helper to render the topic strengths progress bar list
  // User को subject category अनुसारको average score progress display गर्ने
  const renderStrengths = () => {
    if (!perfStats || !perfStats.strengths || perfStats.strengths.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          No stats available to determine strengths | कुनै विश्लेषण विवरण उपलब्ध छैन।
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {perfStats.strengths.map((item, idx) => (
          <div key={idx} className="strength-item-row">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{item.topic}</span>
              <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>{item.averageScore}% avg</span>
            </div>
            <div className="progress-bar-container" style={{ height: '8px' }}>
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${item.averageScore}%`, 
                  background: item.averageScore >= 80 ? 'linear-gradient(90deg, var(--success), #34d399)' : item.averageScore >= 50 ? 'linear-gradient(90deg, var(--secondary), var(--primary))' : 'linear-gradient(90deg, var(--error), #f87171)'
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

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
        <div className="stat-card" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => navigate('/leaderboard')}>
          <span className="stat-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            Global Rank <span style={{ fontSize: '0.7rem', color: 'var(--secondary)', textTransform: 'none', border: '1px solid var(--secondary)', padding: '1px 6px', borderRadius: '4px' }}>View Leaderboard →</span>
          </span>
          <span className="stat-val">{rank}</span>
        </div>
      </div>

      {/* 2. Performance Analytics Panels */}
      {/* User Performance र analytics panels */}
      {attempts.length > 0 && (
        <div className="dashboard-split-layout" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px', marginTop: '16px' }}>
          <section className="dashboard-section">
            <h2>Score Progression Trend</h2>
            <div className="wizard-card-wrapper" style={{ padding: '24px 30px' }}>
              {renderTrendChart()}
            </div>
          </section>
          <section className="dashboard-section">
            <h2>Strengths by Topic</h2>
            <div className="wizard-card-wrapper" style={{ padding: '24px 30px' }}>
              {renderStrengths()}
            </div>
          </section>
        </div>
      )}

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
