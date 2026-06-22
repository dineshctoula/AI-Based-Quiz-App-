import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app-shell">
        <header className="navbar">
          <div className="nav-container">
            <Link to="/" className="nav-brand">
              <span className="brand-accent">Mind</span>Spark
            </Link>
            <nav className="nav-menu">
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/login" className="btn btn-secondary btn-nav">Sign In</Link>
            </nav>
          </div>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </main>

        <footer className="footer">
          <div className="footer-container">
            <p>&copy; {new Date().getFullYear()} MindSpark AI. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
