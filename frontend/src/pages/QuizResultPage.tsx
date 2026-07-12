import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Award, BookOpen, CheckCircle2, XCircle, ArrowLeft, RefreshCw, MessageSquare, AlertTriangle } from 'lucide-react';
import { AiTutorDrawer } from '../components/AiTutorDrawer';

const API_URL = 'http://localhost:5000/api';

interface GradedAnswer {
  questionId: number;
  text: string;
  options: string[];
  selectedOption: string;
  correctAnswer: string;
  explanation: string;
  isCorrect: boolean;
}

interface Attempt {
  id: number;
  quizId: number;
  score: number;
  completedAt: string;
  answers: GradedAnswer[];
  quiz: {
    title: string;
    topic: string;
  };
}

export const QuizResultPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve attempt details passed via navigation state
  // navigation state बाट quiz attempt को details तान्ने
  const attempt = location.state?.attempt as Attempt | undefined;

  // States for controlling the AI Tutor chat drawer
  // AI Tutor च्याट panel नियन्त्रण गर्ने states हरू
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<GradedAnswer | null>(null);

  // States for controlling Flag/Report Modal
  // रिपोर्ट/फ्ल्याग मोडेल नियन्त्रण गर्ने states हरू
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [flaggingQuestionId, setFlaggingQuestionId] = useState<number | null>(null);
  const [flagReason, setFlagReason] = useState('incorrect_answer');
  const [flagComment, setFlagComment] = useState('');
  const [flagSuccess, setFlagSuccess] = useState(false);
  const [flagLoading, setFlagLoading] = useState(false);

  const handleAskTutor = (answer: GradedAnswer) => {
    setActiveQuestion(answer);
    setDrawerOpen(true);
  };

  const handleOpenFlagModal = (questionId: number) => {
    setFlaggingQuestionId(questionId);
    setFlagReason('incorrect_answer');
    setFlagComment('');
    setFlagSuccess(false);
    setFlagModalOpen(true);
  };

  const handleSubmitFlag = async () => {
    if (!flaggingQuestionId || !attempt) return;
    const token = localStorage.getItem('token');
    if (!token) return;

    setFlagLoading(true);
    try {
      // Find the targeted question details
      const q = attempt.answers.find(ans => ans.questionId === flaggingQuestionId);
      const questionSnippet = q ? `[Question: "${q.text}"]` : '';
      
      const res = await fetch(`${API_URL}/quizzes/${attempt.quizId}/flag`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: flagReason,
          comment: `Question ID: ${flaggingQuestionId} ${questionSnippet} - User Comment: ${flagComment}`,
        }),
      });

      if (res.ok) {
        setFlagSuccess(true);
        setTimeout(() => {
          setFlagModalOpen(false);
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to submit flag:', err);
    } finally {
      setFlagLoading(false);
    }
  };

  // If no attempt data is present in route state, redirect to dashboard
  // state मा attempt details छैन भने direct dashboard मा पठाइदिने
  if (!attempt) {
    return (
      <div className="wizard-page-container">
        <div className="wizard-error-banner" style={{ margin: '40px auto', maxWidth: '600px' }}>
          <XCircle size={24} />
          <span>No attempt data found. Please take a quiz first. | कुनै नतिजा भेटिएन। कृपया पहिले क्विज पूरा गर्नुहोस्।</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Calculate stats
  const totalQuestions = attempt.answers.length;
  const correctCount = attempt.answers.filter((a) => a.isCorrect).length;

  // Custom feedback messages based on score
  // score को आधारमा फरक-फरक बधाई वा हौसला सन्देश
  const getFeedbackMessage = (score: number) => {
    if (score >= 90) return { title: 'Mastery Level! | उत्कृष्ट नतिजा!', desc: 'You have outstanding knowledge on this topic. | तपाईंको यस विषयमा उत्कृष्ट ज्ञान रहेको छ।' };
    if (score >= 70) return { title: 'Great Job! | राम्रो नतिजा!', desc: 'You have a solid understanding. Keep it up! | तपाईंको समझ राम्रो छ। यसलाई निरन्तरता दिनुहोस्!' };
    if (score >= 40) return { title: 'Passed! | उत्तीर्ण हुनुभयो!', desc: 'Good attempt, but there is room for improvement. | राम्रो प्रयास, तर अझै सुधार गर्ने ठाउँ छ।' };
    return { title: 'Keep Practicing | निरन्तर अभ्यास गर्नुहोस्', desc: 'Review the explanations below and try again! | तलका विश्लेषणहरू पढेर फेरि प्रयास गर्नुहोस्!' };
  };

  const feedback = getFeedbackMessage(attempt.score);

  return (
    <div className="wizard-page-container result-page-container" style={{ maxWidth: '750px' }}>
      {/* Glow rings */}
      <div className="glow-ring glow-ring-left"></div>
      <div className="glow-ring glow-ring-right"></div>

      {/* Header title */}
      <div className="wizard-header">
        <div className="wizard-icon-badge" style={{ color: 'var(--accent)', borderColor: 'rgba(217, 70, 239, 0.4)' }}>
          <Award className="pulse-icon" size={28} />
        </div>
        <h1>Quiz Results</h1>
        <p className="wizard-subtitle">{attempt.quiz.title}</p>
      </div>

      {/* 1. Score Gauge Card */}
      {/* score display र feedback card */}
      <div className="wizard-card-wrapper score-summary-wrapper" style={{ marginBottom: '32px' }}>
        <div className="score-summary-content">
          <div className="circular-score-gauge">
            <span className="gauge-number">{attempt.score}%</span>
            <span className="gauge-label">Score</span>
          </div>
          
          <div className="score-feedback-text">
            <h2>{feedback.title}</h2>
            <p>{feedback.desc}</p>
            <div className="score-meta-pills">
              <span className="stat-pill">Correct: {correctCount}/{totalQuestions}</span>
              <span className="stat-pill">Topic: {attempt.quiz.topic}</span>
            </div>
          </div>
        </div>

        <div className="result-actions-row" style={{ display: 'flex', gap: '16px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--glass-border)' }}>
          <button 
            onClick={() => navigate('/dashboard')} 
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Dashboard
          </button>
          <button 
            onClick={() => navigate('/generate')} 
            className="btn btn-primary"
            style={{ flex: 1 }}
          >
            <RefreshCw size={16} style={{ marginRight: '8px' }} /> Try Another
          </button>
        </div>
      </div>

      {/* 2. Detailed Questions Review */}
      {/* प्रश्न र उत्तरहरूको विस्तृत विवरण */}
      <section className="detailed-review-section" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', fontFamily: 'var(--font-heading)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BookOpen size={20} style={{ color: 'var(--secondary)' }} />
          Question Review & Explanations
        </h2>

        {attempt.answers.map((answer, index) => (
          <div 
            key={answer.questionId} 
            className={`review-card wizard-card-wrapper ${answer.isCorrect ? 'review-correct' : 'review-incorrect'}`}
            style={{ padding: '24px', background: 'var(--glass-bg)' }}
          >
            {/* Question status label */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                QUESTION {index + 1}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: 600, color: answer.isCorrect ? 'var(--success)' : 'var(--error)' }}>
                {answer.isCorrect ? (
                  <>
                    <CheckCircle2 size={16} /> Correct | सही
                  </>
                ) : (
                  <>
                    <XCircle size={16} /> Incorrect | गलत
                  </>
                )}
              </span>
            </div>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '20px', lineHeight: 1.5 }}>
              {answer.text}
            </h3>

            {/* Options list showing user's selection vs correct answer */}
            <div className="review-options-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {answer.options.map((option, oIdx) => {
                const isSelected = answer.selectedOption === option;
                const isCorrectOption = answer.correctAnswer === option;
                
                let optionClass = 'review-option-card-static';
                if (isCorrectOption) {
                  optionClass += ' correct-option';
                } else if (isSelected && !answer.isCorrect) {
                  optionClass += ' incorrect-option';
                }

                return (
                  <div key={oIdx} className={optionClass}>
                    <span className="option-letter-static">
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span className="option-text-static" style={{ flex: 1 }}>{option}</span>
                    
                    {/* Visual labels: Selected / Correct */}
                    {isSelected && (
                      <span className="review-tag user-select-tag" style={{ marginLeft: '8px' }}>
                        Your Answer
                      </span>
                    )}
                    {isCorrectOption && (
                      <span className="review-tag correct-tag" style={{ marginLeft: '8px' }}>
                        Correct Answer
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* AI Tutor Explanation box */}
            {/* AI Tutor विश्लेषण panel */}
            <div className="ai-explanation-box">
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                <span className="mini-ai-sparkle">✨</span> AI Tutor Explanation
              </h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                {answer.explanation || 'No explanation provided. | विश्लेषण उपलब्ध छैन।'}
              </p>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleAskTutor(answer)}
                  className="btn btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    padding: '6px 12px',
                    marginTop: '12px',
                    border: '1px solid rgba(6, 182, 212, 0.4)',
                    color: 'var(--secondary)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: 'rgba(6, 182, 212, 0.05)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <MessageSquare size={14} /> Ask AI Tutor | थप स्पष्टीकरण सोध्नुहोस्
                </button>

                <button
                  onClick={() => handleOpenFlagModal(answer.questionId)}
                  className="btn btn-secondary animate-pulse"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    padding: '6px 12px',
                    marginTop: '12px',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#ef4444',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    background: 'rgba(239, 68, 68, 0.05)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <AlertTriangle size={14} /> Report Content | त्रुटि सच्याउन रिपोर्ट गर्नुहोस्
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Bottom dashboard back link */}
      <div style={{ textAlign: 'center', marginTop: '32px' }}>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
          Back to Dashboard
        </button>
      </div>

      {/* AI Tutor chat sidebar drawer */}
      {/* AI Tutor च्याट sidebar drawer */}
      {activeQuestion && (
        <AiTutorDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          quizId={attempt.quizId}
          questionId={activeQuestion.questionId}
          questionText={activeQuestion.text}
          options={activeQuestion.options}
          correctAnswer={activeQuestion.correctAnswer}
          selectedOption={activeQuestion.selectedOption}
          originalExplanation={activeQuestion.explanation}
        />
      )}

      {/* Flag Report Modal */}
      {/* रिपोर्ट दर्ता गर्ने मोडेल */}
      {flagModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(7, 9, 19, 0.85)', zIndex: 1100, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '20px',
          backdropFilter: 'blur(8px)'
        }}>
          <div className="glass-card p-4 animate-scale-up" style={{ maxWidth: '450px', width: '100%', position: 'relative' }}>
            <button 
              onClick={() => setFlagModalOpen(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <XCircle size={20} />
            </button>

            {flagSuccess ? (
              <div className="text-center py-4">
                <CheckCircle2 className="text-success mb-3" size={56} style={{ margin: '0 auto' }} />
                <h4 className="gradient-text">Report Submitted!</h4>
                <p className="text-secondary small mb-0">
                  Thank you! The AI system and admins have been notified to moderate this question.
                </p>
              </div>
            ) : (
              <div>
                <h3 className="mb-2 d-flex align-items-center gap-2">
                  <AlertTriangle className="text-warning animate-pulse" size={24} />
                  Report Question | प्रश्न रिपोर्ट
                </h3>
                <p className="text-secondary small mb-4">
                  Identify the issue with this question to trigger admin review and auto-correction.
                </p>

                <div className="form-group mb-3">
                  <label className="small font-bold text-muted">Reason | कारण</label>
                  <select 
                    value={flagReason} 
                    onChange={(e) => setFlagReason(e.target.value)}
                    className="wizard-select mt-1"
                  >
                    <option value="incorrect_answer">Incorrect Answer (गलत उत्तर)</option>
                    <option value="vague_question">Vague Question (अस्पष्ट प्रश्न)</option>
                    <option value="grammar_typo">Grammar / Typo (व्याकरण वा टाइपो)</option>
                    <option value="out_of_topic">Out of Topic (अप्रासंगिक विषय)</option>
                  </select>
                </div>

                <div className="form-group mb-4">
                  <label className="small font-bold text-muted">Comment | विवरण</label>
                  <textarea
                    value={flagComment}
                    onChange={(e) => setFlagComment(e.target.value)}
                    placeholder="Briefly describe what makes this incorrect..."
                    rows={3}
                    style={{
                      width: '100%',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 16px',
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem',
                      outline: 'none',
                      resize: 'none',
                      marginTop: '4px'
                    }}
                  />
                </div>

                <div className="d-flex gap-3">
                  <button 
                    onClick={() => setFlagModalOpen(false)}
                    className="btn btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSubmitFlag}
                    className="btn btn-primary flex-1"
                    disabled={flagLoading}
                  >
                    {flagLoading ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
