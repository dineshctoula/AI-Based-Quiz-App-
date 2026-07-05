import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Trophy, Award, Crown, ArrowLeft, AlertTriangle } from 'lucide-react';

// API base URL matching AuthContext
const API_URL = 'http://localhost:5000/api';

interface LeaderboardEntry {
  userId: number;
  name: string;
  totalCompleted: number;
  averageScore: number;
}

export const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();

  // Component states
  // र्‍याङ्किङ र loading सम्बन्धी states
  const [rankings, setRankings] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch leaderboard statistics from API
  // API बाट leaderboard सम्बन्धी विवरणहरू तान्ने
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(`${API_URL}/quizzes/leaderboard`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch leaderboard stats');
        }

        setRankings(data);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Error loading leaderboard | Leaderboard लोड गर्दा समस्या आयो');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchLeaderboard();
    }
  }, [token]);

  // UI for loading state
  // Loading हुँदाको UI representation
  if (loading) {
    return (
      <div className="wizard-page-container flex-center" style={{ minHeight: '50vh' }}>
        <div className="loader-spinner-wrapper">
          <div className="glowing-spinner"></div>
          <Trophy className="center-sparkle" size={24} />
        </div>
        <p style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>
          Compiling player rankings... | खेलाडीको र्‍याङ्किङ तयार हुँदैछ...
        </p>
      </div>
    );
  }

  return (
    <div className="wizard-page-container leaderboard-page-container" style={{ maxWidth: '700px' }}>
      {/* Background design glow rings */}
      <div className="glow-ring glow-ring-left" style={{ opacity: 0.08 }}></div>
      <div className="glow-ring glow-ring-right" style={{ opacity: 0.08 }}></div>

      {/* Header section with back navigation */}
      {/* Header र Back button */}
      <div className="wizard-header">
        <div className="wizard-icon-badge" style={{ color: 'var(--secondary)', borderColor: 'rgba(6, 182, 212, 0.4)' }}>
          <Trophy className="pulse-icon" size={28} />
        </div>
        <h1>Global Leaderboard</h1>
        <p className="wizard-subtitle">
          See where you stand among top mindsparkers globally! | विश्वभरका उत्कृष्ट खेलाडीहरूमाझ आफ्नो स्थान हेर्नुहोस्!
        </p>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="wizard-error-banner">
          <AlertTriangle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Leaderboard Card Container */}
      {/* मुख्य Rankings सूची Card */}
      <div className="wizard-card-wrapper" style={{ padding: '30px 24px' }}>
        {rankings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Award size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <h3>No rankings available yet</h3>
            <p style={{ color: 'var(--text-secondary)' }}>Be the first to score on a quiz and claim rank #1!</p>
          </div>
        ) : (
          <div className="leaderboard-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Table Header Row */}
            <div className="leaderboard-header-row" style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px 100px', padding: '12px 16px', borderBottom: '1px solid var(--glass-border)', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <span>Rank</span>
              <span>Name</span>
              <span style={{ textAlign: 'center' }}>Completed</span>
              <span style={{ textAlign: 'right' }}>Avg Score</span>
            </div>

            {/* Render ranking list items */}
            {rankings.map((entry, index) => {
              const isCurrentUser = entry.userId === user?.id;
              const rank = index + 1;
              
              // Top 3 distinct row styles
              const rowStyle: React.CSSProperties = {
                display: 'grid',
                gridTemplateColumns: '80px 1fr 120px 100px',
                alignItems: 'center',
                padding: '16px',
                borderRadius: 'var(--radius-sm)',
                background: isCurrentUser ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                border: isCurrentUser ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                transition: 'all 0.2s ease',
              };

              return (
                <div 
                  key={entry.userId} 
                  className={`leaderboard-item-row ${isCurrentUser ? 'current-user-row' : ''}`}
                  style={rowStyle}
                >
                  {/* Rank Display (Trophy Icons for Top 3) */}
                  {/* पहिलो, दोस्रो र तेस्रो स्थानका लागि विशेष Trophy/Medal icons */}
                  <span style={{ display: 'flex', alignItems: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
                    {rank === 1 ? (
                      <Crown size={22} style={{ color: '#ffd700', filter: 'drop-shadow(0 0 4px rgba(255, 215, 0, 0.5))' }} />
                    ) : rank === 2 ? (
                      <Trophy size={18} style={{ color: '#c0c0c0' }} />
                    ) : rank === 3 ? (
                      <Trophy size={18} style={{ color: '#cd7f32' }} />
                    ) : (
                      <span style={{ paddingLeft: '4px', color: 'var(--text-muted)', fontSize: '0.95rem' }}>#{rank}</span>
                    )}
                  </span>

                  {/* Player Name details */}
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.name}
                    {isCurrentUser && (
                      <span className="review-tag correct-tag" style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px' }}>
                        You
                      </span>
                    )}
                  </span>

                  {/* Quizzes Completed Counter */}
                  <span style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {entry.totalCompleted}
                  </span>

                  {/* Average Score Badge */}
                  <span 
                    style={{ 
                      textAlign: 'right', 
                      fontWeight: 700, 
                      fontSize: '0.95rem',
                      color: entry.averageScore >= 80 ? 'var(--success)' : entry.averageScore >= 50 ? 'var(--secondary)' : 'var(--text-primary)'
                    }}
                  >
                    {entry.averageScore}%
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Back control */}
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
