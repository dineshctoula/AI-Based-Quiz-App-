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
