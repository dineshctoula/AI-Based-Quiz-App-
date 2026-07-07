import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  Users, 
  Send, 
  Copy, 
  LogOut, 
  Play, 
  Gamepad2, 
  Sparkles, 
  KeyRound, 
  Volume2, 
  Check, 
  AlertTriangle 
} from 'lucide-react';

// Backend API URL configuration
const API_URL = 'http://localhost:5000/api';

interface Quiz {
  id: number;
  title: string;
  topic: string;
  difficulty: string;
  questionsCount?: number;
}

export const MultiplayerPage: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const {
    roomCode,
    roomDetails,
    players,
    messages,
    battleStarted,
    activeQuizId,
    error,
    createRoom,
    joinRoom,
    sendMessage,
    leaveRoom,
    startBattle,
    clearError
  } = useSocket();

  // Component local states
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch all generated quizzes for hosting
  // host गर्न मिल्ने quiz हरूको सूची database बाट तान्ने
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await fetch(`${API_URL}/quizzes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setQuizzes(data);
        }
      } catch (err) {
        console.error('Failed to load quizzes:', err);
      } finally {
        setLoadingQuizzes(false);
      }
    };

    if (token && !roomCode) {
      fetchQuizzes();
    }
  }, [token, roomCode]);

  // Scroll to bottom of chat list whenever a new message arrives
  // नयाँ message आउँदा chat box scroll bottom गराउने
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Navigate players automatically when game starts
  // host ले game start गर्दा सबै player लाई quiz page मा लैजाने
  useEffect(() => {
    if (battleStarted && activeQuizId) {
      navigate(`/quiz/${activeQuizId}?mode=multiplayer&room=${roomCode}`);
    }
  }, [battleStarted, activeQuizId, roomCode, navigate]);

  // Clear socket error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Handle Join Submit
  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCodeInput.trim()) return;
    joinRoom(roomCodeInput.trim().toUpperCase());
  };

  // Handle Send Chat message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput.trim());
    setChatInput('');
  };

  // Copy Room Code to clipboard
  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Check if current user is the host
  const isHost = roomDetails?.hostId === user?.id;

  // View: Waiting/Active Room Lobby
  // room भित्र हुँदाको UI
  if (roomCode && roomDetails) {
    return (
      <div className="wizard-page-container multiplayer-lobby-container" style={{ maxWidth: '1000px' }}>
        <div className="glow-ring glow-ring-left" style={{ opacity: 0.08 }}></div>
        <div className="glow-ring glow-ring-right" style={{ opacity: 0.08 }}></div>

        {/* Room Header Info */}
        <div className="wizard-header lobby-header">
          <div className="wizard-icon-badge lobby-badge">
            <Gamepad2 className="pulse-icon" size={28} />
          </div>
          <h1>Multiplayer Battle Lobby</h1>
          <p className="wizard-subtitle">
            Quiz: <strong>{roomDetails.quizTitle}</strong>
          </p>

          {/* Room Code Display card */}
          <div className="lobby-code-card">
            <span className="code-label">ROOM CODE:</span>
            <span className="code-value">{roomCode}</span>
            <button onClick={handleCopyCode} className="btn-copy-code" title="Copy Code">
              {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="wizard-error-banner" style={{ marginBottom: '20px' }}>
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Grid panel: Players list on left, Chat on right */}
        <div className="lobby-grid">
          
          {/* Left panel: Active Players roster */}
          <div className="wizard-card-wrapper player-list-card">
            <div className="card-header-label">
              <Users size={18} />
              <h3>Players Joined ({players.length})</h3>
            </div>
            
            <div className="players-roster">
              {players.map((player) => (
                <div 
                  key={player.socketId} 
                  className={`player-item ${player.userId === user?.id ? 'player-self' : ''}`}
                >
                  <div className="player-avatar">
                    {player.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="player-name">
                    {player.username} 
                    {player.userId === user?.id && <span className="tag-self"> (You)</span>}
                  </span>
                  {player.isHost && (
                    <span className="tag-host" title="Host">
                      👑 Host
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right panel: Chat messages */}
          <div className="wizard-card-wrapper chat-card">
            <div className="card-header-label">
              <Volume2 size={18} />
              <h3>Lobby Chat</h3>
            </div>

            {/* Chat message listing area */}
            <div className="chat-messages-container">
              {messages.length === 0 ? (
                <div className="chat-empty-state">
                  <p>Send a message to greet other players! | कुराकानी सुरु गर्न सन्देश पठाउनुहोस्!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isSystem = msg.sender === 'SYSTEM';
                  const isSelf = msg.sender === user?.name;

                  return (
                    <div 
                      key={i} 
                      className={`chat-bubble-row ${isSystem ? 'system-row' : isSelf ? 'self-row' : 'other-row'}`}
                    >
                      {!isSystem && <span className="chat-sender">{msg.sender}</span>}
                      <div className="chat-bubble">
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Message input controls */}
            <form onSubmit={handleSendMessage} className="chat-input-form">
              <input
                type="text"
                placeholder="Type your message... | सन्देश लेख्नुहोस्..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                maxLength={100}
              />
              <button type="submit" className="btn-chat-send" disabled={!chatInput.trim()}>
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* Action button controls: Host start vs Player waiting */}
        <div className="lobby-actions-footer">
          <button onClick={leaveRoom} className="btn btn-secondary btn-leave-lobby">
            <LogOut size={16} /> Leave Lobby
          </button>

          {isHost ? (
            <button onClick={startBattle} className="btn btn-primary btn-start-battle" disabled={players.length < 1}>
              <Play size={16} /> Start Quiz Battle
            </button>
          ) : (
            <div className="player-waiting-indicator">
              <div className="mini-glowing-spinner"></div>
              <span>Waiting for host to start the quiz... | Host ले खेल सुरु गर्ने पर्खाइमा...</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // View: Lobby Landing (Select quiz to Host or Enter code to Join)
  // room भन्दा बाहिर हुँदाको main control screen
  return (
    <div className="wizard-page-container multiplayer-landing-container" style={{ maxWidth: '900px' }}>
      <div className="glow-ring glow-ring-left" style={{ opacity: 0.08 }}></div>
      <div className="glow-ring glow-ring-right" style={{ opacity: 0.08 }}></div>

      <div className="wizard-header">
        <div className="wizard-icon-badge">
          <Gamepad2 className="pulse-icon" size={28} />
        </div>
        <h1>Multiplayer Quiz Battle</h1>
        <p className="wizard-subtitle">
          Host a quiz and challenge friends in real-time or join an active room! | साथीहरूसँग real-time मा खेल्नुहोस्!
        </p>
      </div>

      {error && (
        <div className="wizard-error-banner" style={{ marginBottom: '20px' }}>
          <AlertTriangle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="lobby-landing-grid">
        
        {/* Left Side: Host a Battle section */}
        <div className="wizard-card-wrapper host-section-card">
          <div className="card-header-label">
            <Sparkles size={18} style={{ color: 'var(--secondary)' }} />
            <h3>Host a New Battle</h3>
          </div>
          <p className="section-desc">Select one of your generated quizzes to create a lobby:</p>

          <div className="quiz-host-list">
            {loadingQuizzes ? (
              <div className="quiz-list-loader">
                <div className="mini-glowing-spinner"></div>
                <p>Loading quizzes...</p>
              </div>
            ) : quizzes.length === 0 ? (
              <div className="no-quizzes-state">
                <p>No quizzes available yet. Create one first! | कुनै quiz भेटिएन। पहिले quiz generate गर्नुहोस्।</p>
                <button onClick={() => navigate('/generate')} className="btn btn-secondary btn-sm" style={{ marginTop: '10px' }}>
                  Generate Quiz
                </button>
              </div>
            ) : (
              quizzes.map((quiz) => (
                <div key={quiz.id} className="quiz-host-item">
                  <div className="quiz-item-meta">
                    <span className="quiz-item-title">{quiz.title}</span>
                    <span className="quiz-item-topic">Topic: {quiz.topic}</span>
                  </div>
                  <button onClick={() => createRoom(quiz.id)} className="btn btn-primary btn-sm btn-host-now">
                    Host
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Join a Battle section */}
        <div className="wizard-card-wrapper join-section-card">
          <div className="card-header-label">
            <KeyRound size={18} style={{ color: 'var(--primary)' }} />
            <h3>Join an Existing Battle</h3>
          </div>
          <p className="section-desc">Enter the 5-character code shared by your friend:</p>

          <form onSubmit={handleJoinSubmit} className="join-room-form">
            <input
              type="text"
              placeholder="ENTER ROOM CODE (e.g. A9B8C)"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              maxLength={5}
            />
            <button type="submit" className="btn btn-primary btn-join-submit" disabled={roomCodeInput.length !== 5}>
              Join Room
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
