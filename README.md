# AI-Based Quiz Application

A full-stack, AI-powered quiz application built with **React (Vite, TS)** and **NestJS (TS)**. The app enables users to generate customized quizzes on any topic using the Gemini API, play them with an interactive glassmorphic UI, track progress via dashboard statistics, review attempts with an AI Tutor, and battle friends in real-time.

## Project Structure

```text
quiz/
├── backend/            # NestJS Application
├── frontend/           # React (Vite) Application
├── docker-compose.yml  # Development PostgreSQL database
└── README.md           # Workspace Documentation
```

## Prerequisites

- Node.js (v18 or higher)
- Docker & Docker Compose
- Google Gemini API Key

## Getting Started

### 1. Database Setup
Start the local PostgreSQL instance:
```bash
docker compose up -d
```

### 2. Backend Setup
Navigate to the backend, configure variables, and run:
```bash
cd backend
npm install
npm run start:dev
```

### 3. Frontend Setup
Navigate to the frontend and run:
```bash
cd frontend
npm install
npm run dev
```

---

## 15-Day Milestone Tracker

Refer to the developer tracking sheets in the repository workspace log files for daily status, commits, and verification results.

---

## Multiplayer WebSocket Architecture

The real-time multiplayer functionality is designed around **Socket.io** on top of NestJS WebSockets Gateway (`QuizzesBattleGateway`) and React Context State on the frontend (`SocketProvider`).

### 1. Connection & Authentication
- Connections are made to `http://localhost:5000` using the `websocket` transport.
- The connection handshake is authenticated by passing the active JWT token via `auth.token` or `query.token`.
- The gateway verifies the token using `JwtService` and attaches the user profile (`id`, `email`, `name`) to the socket metadata (`client.data.user`). Unauthenticated sockets are automatically disconnected.

### 2. Supported WebSocket Events

| Event | Type | Payload | Description |
|---|---|---|---|
| **`create_room`** | Client $\rightarrow$ Server | `{ quizId: number }` | Creates a new lobby room with a 5-char code. |
| **`room_created`**| Server $\rightarrow$ Client | `Room` | Returns the newly created room details. |
| **`join_room`**   | Client $\rightarrow$ Server | `{ roomCode: string }` | Joins an existing lobby room with the code. |
| **`join_success`**| Server $\rightarrow$ Client | `Room` | Dispatched to the joining player on success. |
| **`room_update`** | Server $\rightarrow$ Client | `Room` | Broadcasted to the room channel when player rosters change. |
| **`send_message`**| Client $\rightarrow$ Server | `{ roomCode: string, text: string }` | Sends a chat message to the room. |
| **`new_message`** | Server $\rightarrow$ Client | `Message` | Broadcasts the sent message to all room players. |
| **`start_battle`**| Client $\rightarrow$ Server | `{ roomCode: string }` | Triggered by host to launch the quiz. |
| **`battle_started`**| Server $\rightarrow$ Client| `{ quizId: number }` | Tells all room players to redirect to `/quiz/:id`. |
| **`leave_room`**  | Client $\rightarrow$ Server | `{ roomCode: string }` | Manually leaves the active lobby. |
| **`error`**       | Server $\rightarrow$ Client | `string` | Emits socket/business validation errors. |

### 3. Room State Lifecycle
- **Lobby State**: Ephemeral, in-memory `Map` inside NestJS Gateway to avoid DB bottlenecks.
- **Host Delegation**: If a host leaves, the gateway automatically promotes the next player in the list to Host and system-messages the channel.
- **Auto Clean Up**: When the last player leaves a lobby, the room object is deleted from memory.
