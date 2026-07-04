import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, BrainCircuit, AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, Clock, Award, HelpCircle } from 'lucide-react';

// API URL matching our AuthContext setup
const API_URL = 'http://localhost:5000/api';

/**
 * Suggestions for topics that are popular and ready to generate.
 * 
 * प्रयोगकर्ताले सजिलै छान्ने लोकप्रिय topic हरू।
 */
const POPULAR_TOPICS = [
  'React Hooks',
  'Node.js REST APIs',
  'World Geography',
  'Space Exploration',
  'Artificial Intelligence',
];

// Sequential loading messages to make AI generation process feel premium
const LOADING_STEPS = [
  'Connecting to Spark AI Engine | Spark AI Engine सँग connect हुँदैछ...',
  'Generating multiple-choice questions | बहूबैकल्पिक प्रश्नहरू तयार पारिँदैछ...',
  'Analyzing options and correct responses | विकल्पहरू र सही उत्तरहरू जाँच्दैछ...',
  'Saving generated quiz into local database | क्विज डाटाबेसमा सुरक्षित गरिँदैछ...',
  'Finalizing quiz details, preparing dashboard | विवरणहरू पूरा गरेर dashboard तयार पार्दैछ...',
];

export const GenerateQuizPage: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [count, setCount] = useState(5);

  // Loading states
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success states
  const [generatedQuiz, setGeneratedQuiz] = useState<any | null>(null);

  // Rotate loading step messages sequentially
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingStepIndex((prev) => {
          if (prev < LOADING_STEPS.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 3500);
    } else {
      setLoadingStepIndex(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Handler to submit request to backend
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setErrorMsg('Please specify a topic | कृपया एउटा topic लेख्नुहोस्');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setGeneratedQuiz(null);

    try {
      const response = await fetch(`${API_URL}/quizzes/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic: topic.trim(),
          difficulty,
          count: Number(count),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Generation failed');
      }

      setGeneratedQuiz(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to generate quiz | क्विज बनाउन असमर्थ भइयो');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="wizard-page-container">
      {/* Glow ambient background rings */}
      <div className="glow-ring glow-ring-left"></div>
      <div className="glow-ring glow-ring-right"></div>

      {/* Title block */}
      <div className="wizard-header">
        <div className="wizard-icon-badge">
          <BrainCircuit className="pulse-icon" size={28} />
        </div>
        <h1>Create an AI Quiz</h1>
        <p className="wizard-subtitle">
          Enter any topic, select difficulty, and let Gemini craft a custom interactive quiz challenge for you.
        </p>
      </div>

      {/* Error state display */}
      {errorMsg && (
        <div className="wizard-error-banner animate-fade-in">
          <AlertTriangle size={20} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main wizard cards */}
      <div className="wizard-card-wrapper">
        {/* Loading State Overlay */}
        {isGenerating && (
          <div className="wizard-loading-overlay animate-fade-in">
            <div className="loader-spinner-wrapper">
              <div className="glowing-spinner"></div>
              <Sparkles className="center-sparkle" size={24} />
            </div>
            <h3>Generating Quiz</h3>
            <p className="step-message">{LOADING_STEPS[loadingStepIndex]}</p>
            <span className="info-subtext">This takes around 10-15 seconds depending on connection speed.</span>
          </div>
        )}

        {/* Success State Screen */}
        {generatedQuiz ? (
          <div className="wizard-success-screen animate-scale-up">
            <div className="success-icon-badge">
              <CheckCircle2 size={48} />
            </div>
            <h2>Quiz Ready!</h2>
            <p className="success-subtitle">
              Your customized quiz has been generated successfully and saved.
            </p>

            <div className="quiz-summary-panel">
              <h3 className="quiz-summary-title">{generatedQuiz.title}</h3>
              <div className="quiz-specs-grid">
                <div className="spec-item">
                  <Award size={18} />
                  <div>
                    <span className="spec-label">Difficulty</span>
                    <span className="spec-value">{generatedQuiz.difficulty}</span>
                  </div>
                </div>
                <div className="spec-item">
                  <HelpCircle size={18} />
                  <div>
                    <span className="spec-label">Questions</span>
                    <span className="spec-value">{generatedQuiz.questions?.length || count} MCQs</span>
                  </div>
                </div>
                <div className="spec-item">
                  <Clock size={18} />
                  <div>
                    <span className="spec-label">Time Limit</span>
                    <span className="spec-value">{(generatedQuiz.timeLimit / 60).toFixed(0)} Minutes</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="success-actions-row">
              <button 
                onClick={() => navigate('/dashboard')} 
                className="btn btn-secondary"
              >
                Go to Dashboard
              </button>
              <button 
                onClick={() => {
                  navigate(`/quiz/${generatedQuiz.id}`);
                }} 
                className="btn btn-primary"
              >
                Start Quiz <ArrowRight size={16} style={{ marginLeft: '8px' }} />
              </button>
            </div>
          </div>
        ) : (
          /* Input preferences form configuration */
          <form onSubmit={handleGenerate} className="wizard-form">
            <div className="form-group">
              <label>Topic / Concept to test</label>
              <input
                type="text"
                placeholder="e.g., React Hooks, Quantum Physics, French Cuisine..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                maxLength={80}
                required
              />
            </div>

            {/* Popular Topics quick links */}
            <div className="topic-suggestions-row">
              <span className="suggestions-label">Try:</span>
              <div className="suggestions-list">
                {POPULAR_TOPICS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTopic(t)}
                    className={`suggestion-tag ${topic === t ? 'active' : ''}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-row-cols">
              <div className="form-group flex-1">
                <label>Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="wizard-select"
                >
                  <option value="Easy">Easy | सजिलो</option>
                  <option value="Medium">Medium | मध्यम</option>
                  <option value="Hard">Hard | गाह्रो</option>
                </select>
              </div>

              <div className="form-group flex-1">
                <label>Number of Questions</label>
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="wizard-select"
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                  <option value={20}>20 Questions</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block wizard-submit-btn">
              Generate AI Quiz <ChevronRight size={18} style={{ marginLeft: '6px' }} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
