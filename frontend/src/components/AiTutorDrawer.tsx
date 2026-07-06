import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare, Loader2, AlertCircle, Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MarkdownRenderer } from '../utils/markdown';

// API base URL matching AuthContext and other pages
// AuthContext र अन्य pages सँग मिल्ने API base URL
const API_URL = 'http://localhost:5000/api';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface AiTutorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  quizId: number;
  questionId: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
  selectedOption: string;
  originalExplanation: string;
}

export const AiTutorDrawer: React.FC<AiTutorDrawerProps> = ({
  isOpen,
  onClose,
  quizId,
  questionId,
  questionText,
  options,
  correctAnswer,
  selectedOption,
  originalExplanation,
}) => {
  const { token } = useAuth();
  
  // States for chat session
  // च्याट र मेसेज सम्बन्धी states हरू
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // States and Refs for Speech Capabilities (TTS / STT)
  // आवाज सेवा (TTS / STT) का लागि states र refs
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize SpeechRecognition on mount
  // component load हुँदा SpeechRecognition initialize गर्ने
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Text-to-Speech handler
  // मेसेज ठूलो स्वरमा वाचन गर्ने (TTS) handler
  const handleSpeak = (text: string, index: number) => {
    if ('speechSynthesis' in window) {
      if (speakingMessageIndex === index) {
        window.speechSynthesis.cancel();
        setSpeakingMessageIndex(null);
      } else {
        window.speechSynthesis.cancel();
        
        const cleanText = text
          .replace(/\*\*|`|_|#/g, '')
          .replace(/\[Mock AI Tutor\]/i, 'Mock AI Tutor');

        const utterance = new SpeechSynthesisUtterance(cleanText);
        const hasNepali = /[\u0900-\u097F]/.test(cleanText);
        if (hasNepali) {
          utterance.lang = 'ne-NP';
        } else {
          utterance.lang = 'en-US';
        }

        utterance.onend = () => {
          setSpeakingMessageIndex(null);
        };
        utterance.onerror = () => {
          setSpeakingMessageIndex(null);
        };

        setSpeakingMessageIndex(index);
        window.speechSynthesis.speak(utterance);
      }
    } else {
      alert('Text-to-speech is not supported in this browser | यो ब्राउजरमा वाचन सेवा उपलब्ध छैन।');
    }
  };

  // Toggle listening state for voice typing
  // आवाज टाइप सेवा (STT) सुरु वा बन्द गर्ने
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge | तपाईंको ब्राउजरमा आवाज पहिचान सेवा छैन।');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setErrorMsg(null);
      recognitionRef.current.start();
    }
  };

  // Stop speaking and listening when component unmounts or drawer closes
  // Drawer बन्द हुँदा वा component हट्दा आवाज बन्द गर्ने
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  // Reset chat and load initial greeting when drawer opens or question changes
  // Drawer खुल्दा वा नयाँ प्रश्न छान्दा च्याट रिसेट र स्वागत मेसेज लोड गर्ने
  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          role: 'model',
          text: `Hello! I am your AI Tutor. ✨ I see you answered this question:
          
**"${questionText}"**

You chose: **"${selectedOption}"** (Correct Answer: **"${correctAnswer}"**).

How can I help you understand this topic better? Ask me anything about it!`,
        },
      ]);
      setErrorMsg(null);
      setInputValue('');
    }
  }, [isOpen, questionId, questionText, selectedOption, correctAnswer]);

  // Auto scroll to bottom when new messages arrive
  // नयाँ मेसेज थपिदा आफैं तल स्क्रोल गर्ने
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Send question message to backend AI Tutor endpoint
  // AI Tutor लाई जिज्ञासा पठाउने handler function
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setErrorMsg(null);

    // 1. Add user message to log
    // प्रयोगकर्ताको मेसेज थप्ने
    const updatedMessages = [...messages, { role: 'user' as const, text: userMessage }];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // 2. Format history for API request (excluding the initial greeting)
      // पहिलो स्वागत मेसेज बाहेकको इतिहास तयार पार्ने
      const chatHistory = updatedMessages
        .slice(1, -1) // Exclude initial greeting and current message
        .map((msg) => ({
          role: msg.role,
          text: msg.text,
        }));

      // 3. Make POST request to backend
      // Backend मा POST request पठाउने
      const response = await fetch(`${API_URL}/quizzes/${quizId}/tutor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          questionId,
          message: userMessage,
          history: chatHistory,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get tutor explanation | Tutor बाट प्रतिक्रिया पाउन सकिएन');
      }

      // 4. Add AI response to log
      // AI को प्रतिक्रिया च्याटमा थप्ने
      setMessages((prev) => [...prev, { role: 'model', text: data.response }]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Network error occurred | नेटवर्कमा समस्या देखियो');
      // Remove last user message from log on failure so they can try again
      setMessages((prev) => prev.slice(0, -1));
      setInputValue(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ai-drawer-overlay" onClick={onClose}>
      <div className="ai-drawer-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Drawer Header */}
        {/* Drawer को Header र बन्द गर्ने Button */}
        <div className="ai-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={20} className="glow-icon" style={{ color: 'var(--secondary)' }} />
            <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>AI Study Tutor</h2>
          </div>
          <button className="close-drawer-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Question context preview inside drawer */}
        {/* प्रश्नको संक्षिप्त जानकारी दिने सानो card */}
        <div className="ai-drawer-context-card">
          <div className="context-card-badge">Question Context</div>
          <p className="context-question-text" style={{ fontWeight: 600, marginBottom: '8px' }}>{questionText}</p>
          
          {/* Render options list inside context preview */}
          {/* विकल्पहरूको सूची देखाउने */}
          <ul style={{ margin: '0 0 12px 0', paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)', listStyleType: 'decimal' }}>
            {options.map((opt, idx) => (
              <li key={idx} style={{ 
                fontWeight: opt === correctAnswer ? 700 : opt === selectedOption ? 600 : 'normal',
                color: opt === correctAnswer ? 'var(--success)' : opt === selectedOption ? 'var(--error)' : 'inherit',
                marginBottom: '4px'
              }}>
                {opt}
                {opt === correctAnswer && <span style={{ fontSize: '0.75rem', marginLeft: '6px', color: 'var(--success)' }}>(Correct)</span>}
                {opt === selectedOption && opt !== correctAnswer && <span style={{ fontSize: '0.75rem', marginLeft: '6px', color: 'var(--error)' }}>(Your Choice)</span>}
              </li>
            ))}
          </ul>

          <div className="context-answer-row">
            <span className="context-status-pill correct">Correct: {correctAnswer}</span>
            {selectedOption !== correctAnswer && (
              <span className="context-status-pill incorrect">Selected: {selectedOption}</span>
            )}
          </div>

          {originalExplanation && (
            <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)', borderTop: '1px solid var(--glass-border)', paddingTop: '8px', lineHeight: 1.4 }}>
              <strong>Original Explanation:</strong> {originalExplanation}
            </div>
          )}
        </div>

        {/* Chat message history list */}
        {/* संवाद विवरण (Log) */}
        <div className="ai-drawer-chat-log">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`chat-bubble-wrapper ${msg.role === 'user' ? 'user-bubble' : 'tutor-bubble'}`}
            >
              <div className="chat-bubble-avatar">
                {msg.role === 'user' ? 'ME' : 'AI'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '85%' }}>
                <div className="chat-bubble">
                  <MarkdownRenderer text={msg.text} />
                </div>
                {/* TTS Reader button */}
                <button
                  type="button"
                  onClick={() => handleSpeak(msg.text, index)}
                  className="chat-tts-btn"
                  style={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    background: 'transparent',
                    border: 'none',
                    color: speakingMessageIndex === index ? 'var(--secondary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    transition: 'all 0.2s ease',
                  }}
                  title={speakingMessageIndex === index ? 'Stop speaking' : 'Read message aloud'}
                >
                  {speakingMessageIndex === index ? <VolumeX size={12} /> : <Volume2 size={12} />}
                  <span>{speakingMessageIndex === index ? 'Stop | रोक्नुहोस्' : 'Listen | सुन्नुहोस्'}</span>
                </button>
              </div>
            </div>
          ))}

          {/* Typing loader spinner */}
          {/* AI ले सोच्दै गर्दाको loading indicator */}
          {isLoading && (
            <div className="chat-bubble-wrapper tutor-bubble">
              <div className="chat-bubble-avatar">AI</div>
              <div className="chat-bubble typing-indicator-bubble">
                <Loader2 size={16} className="spin-icon" style={{ marginRight: '8px' }} />
                <span>AI Tutor is thinking... | शिक्षकले विश्लेषण गर्दै हुनुहुन्छ...</span>
              </div>
            </div>
          )}

          {/* Error message card */}
          {errorMsg && (
            <div className="chat-error-card">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Footer input form */}
        {/* प्रश्न सोध्ने input panel */}
        <form onSubmit={handleSendMessage} className="ai-drawer-footer">
          {/* STT Microphone button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`ai-drawer-mic-btn ${isListening ? 'listening' : ''}`}
            disabled={isLoading}
            style={{
              background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              border: isListening ? '1px solid var(--error)' : '1px solid var(--glass-border)',
              color: isListening ? 'var(--error)' : 'var(--text-secondary)',
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0,
            }}
            title={isListening ? 'Listening... click to stop' : 'Use voice input (STT)'}
          >
            {isListening ? <MicOff size={16} className="pulse-icon" /> : <Mic size={16} />}
          </button>

          <input
            type="text"
            placeholder={isListening ? "Listening... | सुन्दैछु..." : "Ask AI Tutor... | जिज्ञासा सोध्नुहोस्..."}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="ai-drawer-input"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="ai-drawer-send-btn"
          >
            <Send size={16} />
          </button>
        </form>

      </div>
    </div>
  );
};
