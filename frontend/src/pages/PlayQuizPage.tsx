import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, ArrowLeft, ArrowRight, BrainCircuit, AlertTriangle, HelpCircle, ShieldAlert } from 'lucide-react';

// API base URL matching AuthContext
const API_URL = 'http://localhost:5000/api';

interface Question {
  id: number;
  text: string;
  options: string[];
}

interface Quiz {
  id: number;
  title: string;
  description: string;
  topic: string;
  difficulty: string;
  timeLimit: number;
  questions: Question[];
}

export const PlayQuizPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  // State variables
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ref to hold the submitting state to prevent double submission
  const isSubmittingRef = useRef(false);

  // 1. Fetch quiz questions on mount
  // component load हुँदा quiz र त्यसका questions हरू तान्ने
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`${API_URL}/quizzes/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to load quiz');
        }

        setQuiz(data);
        setTimeLeft(data.timeLimit);
      } catch (err: any) {
        console.error(err);
        setErrorMsg(err.message || 'Error loading quiz | क्विज लोड गर्दा समस्या आयो');
      } finally {
        setLoading(false);
      }
    };

    if (id && token) {
      fetchQuiz();
    }
  }, [id, token]);

  // 2. Countdown Timer Effect
  // समय गणना गर्ने (countdown timer) effect
  useEffect(() => {
    if (loading || !quiz || timeLeft <= 0) {
      if (timeLeft === 0 && quiz && !loading) {
        // Automatically submit when timer runs out
        // समय सकिएपछि आफै submit गर्ने
        handleSubmit();
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, loading, quiz]);

  // Format time (seconds -> MM:SS)
  // सेकेन्डलाई मिनेट र सेकेन्डमा format गर्ने
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 3. Option Selection Handler
  // विकल्प रोज्दा select Answers state update गर्ने
  const handleSelectOption = (option: string) => {
    if (!quiz) return;
    const currentQuestion = quiz.questions[currentIdx];
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: option,
    }));
  };

  // 4. Submit Handler
  // उत्तरहरू backend मा पठाएर grading गराउने function
  const handleSubmit = async () => {
    // Guard against multiple calls
    if (isSubmittingRef.current || !quiz) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      // Map user selections into the format expected by the DTO
      // user ले रोजेका उत्तरहरूलाई DTO format मा मिलाउने
      const answersPayload = quiz.questions.map((q) => ({
        questionId: q.id,
        selectedOption: selectedAnswers[q.id] || '', // Empty if unanswered
      }));

      const response = await fetch(`${API_URL}/quizzes/${quiz.id}/attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ answers: answersPayload }),
      });

      const attemptResult = await response.json();

      if (!response.ok) {
        throw new Error(attemptResult.message || 'Submission failed');
      }

      // Redirect to QuizResultPage and pass attempt details via state
      // Attempt result details सहित result page मा navigate गर्ने
      navigate('/quiz/result', { state: { attempt: attemptResult } });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to submit quiz | क्विज बुझाउन असफल भइयो');
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="wizard-page-container flex-center">
        <div className="loader-spinner-wrapper">
          <div className="glowing-spinner"></div>
          <BrainCircuit className="center-sparkle" size={24} />
        </div>
        <p style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>
          Preparing your quiz challenge... | क्विज लोड हुँदैछ...
        </p>
      </div>
    );
  }

  if (errorMsg && !quiz) {
    return (
      <div className="wizard-page-container">
        <div className="wizard-error-banner" style={{ margin: '40px auto', maxWidth: '600px' }}>
          <AlertTriangle size={24} />
          <span>{errorMsg}</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className="wizard-page-container flex-center">
        <p>No questions found for this quiz. | यस क्विजमा कुनै प्रश्न भेटिएन।</p>
        <button onClick={() => navigate('/dashboard')} className="btn btn-secondary" style={{ marginTop: '20px' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIdx];
  const progressPercent = Math.round(((currentIdx + 1) / quiz.questions.length) * 100);
  const isTimeCritical = timeLeft < 30; // Red flashing timer if less than 30s

  return (
    <div className="wizard-page-container">
      {/* Background glowing rings */}
      <div className="glow-ring glow-ring-left"></div>
      <div className="glow-ring glow-ring-right"></div>

      {/* Quiz Top status bar */}
      <header className="play-quiz-header">
        <div className="quiz-info-meta">
          <span className="quiz-badge difficulty-badge">{quiz.difficulty}</span>
          <span className="quiz-badge topic-badge">{quiz.topic}</span>
        </div>
        
        {/* Timer Badge */}
        <div className={`quiz-timer-badge ${isTimeCritical ? 'timer-critical' : ''}`}>
          <Clock size={18} />
          <span className="timer-digits">{formatTime(timeLeft)}</span>
        </div>
      </header>

      {/* Main question taking layout */}
      <div className="wizard-card-wrapper play-quiz-wrapper">
        {isSubmitting && (
          <div className="wizard-loading-overlay animate-fade-in">
            <div className="loader-spinner-wrapper">
              <div className="glowing-spinner"></div>
              <Clock className="center-sparkle" size={24} />
            </div>
            <h3>Grading Answers</h3>
            <p className="step-message">Submitting responses to AI grading service... | उत्तरहरू जाँचिँदैछ...</p>
          </div>
        )}

        <div className="play-quiz-card">
          {/* Progress bar */}
          <div className="quiz-progress-section">
            <div className="progress-text-row">
              <span>Question <strong>{currentIdx + 1}</strong> of {quiz.questions.length}</span>
              <span>{progressPercent}% Complete</span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>

          {/* Question Text block */}
          <div className="question-text-box">
            <div className="question-badge-circle">
              <HelpCircle size={22} />
            </div>
            <h2 className="question-title">{currentQuestion.text}</h2>
          </div>

          {/* Options Choice list */}
          <div className="quiz-options-list">
            {currentQuestion.options.map((option, oIdx) => {
              const isSelected = selectedAnswers[currentQuestion.id] === option;
              return (
                <button
                  key={oIdx}
                  type="button"
                  onClick={() => handleSelectOption(option)}
                  className={`quiz-option-card ${isSelected ? 'selected' : ''}`}
                >
                  <span className="option-letter">
                    {String.fromCharCode(65 + oIdx)}
                  </span>
                  <span className="option-text">{option}</span>
                </button>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="quiz-navigation-footer">
            <button
              onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="btn btn-secondary btn-nav-quiz"
            >
              <ArrowLeft size={16} style={{ marginRight: '8px' }} /> Previous
            </button>

            {currentIdx < quiz.questions.length - 1 ? (
              <button
                onClick={() => setCurrentIdx((prev) => prev + 1)}
                className="btn btn-primary btn-nav-quiz"
              >
                Next <ArrowRight size={16} style={{ marginLeft: '8px' }} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn btn-primary btn-submit-quiz"
              >
                Submit Quiz <BrainCircuit size={16} style={{ marginLeft: '8px' }} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Warning if exiting */}
      <div className="quit-warning-container">
        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to quit? Progress will be lost. | के तपाईं बाहिरिन चाहनुहुन्छ? हालसम्मको progress हराउनेछ।")) {
              navigate('/dashboard');
            }
          }}
          className="btn-quit"
        >
          <ShieldAlert size={14} style={{ marginRight: '6px' }} /> Quit Quiz
        </button>
      </div>
    </div>
  );
};
