import React, { createContext, useContext, useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

/**
 * Interface representing a player in a multiplayer lobby.
 * 
 * multiplayer lobby मा जोडिएको player को विवरण।
 */
interface Player {
  socketId: string;
  userId: number;
  username: string;
  isHost: boolean;
}

/**
 * Interface representing a chat message inside the lobby.
 * 
 * lobby भित्रको chat message को विवरण।
 */
interface Message {
  sender: string;
  text: string;
  timestamp: string;
}

/**
 * Interface representing details of the multiplayer room.
 * 
 * multiplayer room को सम्पूर्ण विवरण।
 */
interface RoomDetails {
  code: string;
  quizId: number;
  quizTitle: string;
  hostId: number;
  players: Player[];
  messages: Message[];
  battleStarted: boolean;
}

/**
 * Schema defining the properties and methods returned by the useSocket hook.
 * 
 * socket connection र room state व्यवस्थापन गर्ने context schema.
 */
interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  roomCode: string | null;
  roomDetails: RoomDetails | null;
  players: Player[];
  messages: Message[];
  battleStarted: boolean;
  activeQuizId: number | null;
  error: string | null;
  createRoom: (quizId: number) => void;
  joinRoom: (roomCode: string) => void;
  sendMessage: (text: string) => void;
  leaveRoom: () => void;
  startBattle: () => void;
  clearError: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomDetails, setRoomDetails] = useState<RoomDetails | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [battleStarted, setBattleStarted] = useState(false);
  const [activeQuizId, setActiveQuizId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Synchronize socket connection with authentication token lifecycle
  // login token परिवर्तन हुँदा socket connection/disconnection handle गर्ने
  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setIsConnected(false);
      return;
    }

    // Connect to WebSockets Gateway
    const socketUrl = 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      auth: { token },
      query: { token },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to socket gateway | Socket connection सफल भयो');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from socket gateway | Socket connection टुट्यो');
      
      // Clear lobby state on disconnect
      // connection टुट्दा lobby data reset गर्ने
      setRoomCode(null);
      setRoomDetails(null);
      setPlayers([]);
      setMessages([]);
      setBattleStarted(false);
      setActiveQuizId(null);
    });

    // Handle room creation response
    // room successfully create हुँदाको response handle गर्ने
    newSocket.on('room_created', (room: RoomDetails) => {
      setRoomCode(room.code);
      setRoomDetails(room);
      setPlayers(room.players);
      setMessages(room.messages);
      setBattleStarted(false);
      setActiveQuizId(room.quizId);
    });

    // Handle join success response
    // room successfully join हुँदाको response handle गर्ने
    newSocket.on('join_success', (room: RoomDetails) => {
      setRoomCode(room.code);
      setRoomDetails(room);
      setPlayers(room.players);
      setMessages(room.messages);
      setBattleStarted(false);
      setActiveQuizId(room.quizId);
    });

    // Listen to real-time player listing changes
    // players थपघट वा host change हुँदा update गर्ने
    newSocket.on('room_update', (room: RoomDetails) => {
      setRoomDetails(room);
      setPlayers(room.players);
      setMessages(room.messages);
    });

    // Listen to incoming chat messages
    // नयाँ chat messages थप्ने
    newSocket.on('new_message', (msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Listen to start battle broadcast trigger
    // खेल सुरु भएको command सुन्ने
    newSocket.on('battle_started', (data: { quizId: number }) => {
      setBattleStarted(true);
      setActiveQuizId(data.quizId);
    });

    // Listen to error notifications
    // error message handle गर्ने
    newSocket.on('error', (errMsg: string) => {
      setError(errMsg);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  // Request room creation
  const createRoom = (quizId: number) => {
    if (socket && isConnected) {
      socket.emit('create_room', { quizId });
    }
  };

  // Join a room with code
  const joinRoom = (code: string) => {
    if (socket && isConnected) {
      socket.emit('join_room', { roomCode: code });
    }
  };

  // Send text chat message
  const sendMessage = (text: string) => {
    if (socket && isConnected && roomCode) {
      socket.emit('send_message', { roomCode, text });
    }
  };

  // Leave active room and clear state
  const leaveRoom = () => {
    if (socket && isConnected && roomCode) {
      socket.emit('leave_room', { roomCode });
      setRoomCode(null);
      setRoomDetails(null);
      setPlayers([]);
      setMessages([]);
      setBattleStarted(false);
      setActiveQuizId(null);
    }
  };

  // Start battle for room participants (Host only)
  const startBattle = () => {
    if (socket && isConnected && roomCode) {
      socket.emit('start_battle', { roomCode });
    }
  };

  const clearError = () => setError(null);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
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
        clearError,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider | useSocket लाई SocketProvider भित्र मात्र प्रयोग गर्नुपर्छ');
  }
  return context;
};
