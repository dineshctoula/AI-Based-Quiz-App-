import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import './App.css';

const App: React.FC = () => {
  return (
    // Router ले पूरा application लाई navigation सक्षम बनाउँछ
    <Router>

      {/* सम्पूर्ण app को main wrapper */}
      <div className="app-shell">

        {/* ===== NAVBAR (Top Menu) ===== */}
        <header className="navbar">
          <div className="nav-container">

            {/* Logo / Brand (Home page मा लैजान्छ) */}
            <Link to="/" className="nav-brand">
              <span className="brand-accent">Mind</span>Spark
            </Link>
            {/* Navigation menu */}
            <nav className="nav-menu">

              {/* Home page link */}
              <Link to="/" className="nav-link">
                Home
              </Link>

              {/* Dashboard page link */}
              <Link to="/dashboard" className="nav-link">
                Dashboard
              </Link>

              {/* Login page button (Sign In) */}
              <Link to="/login" className="btn btn-secondary btn-nav">
                Sign In
              </Link>

            </nav>
          </div>
        </header>

        {/* ===== MAIN CONTENT AREA ===== */}
        <main className="main-content">

          {/* यहाँ URL अनुसार page change हुन्छ */}

          <Routes>

            {/* Home page (LandingPage) */}
            <Route path="/" element={<LandingPage />} />

            {/* Login page */}
            <Route path="/login" element={<LoginPage />} />

            {/* Dashboard page */}
            <Route path="/dashboard" element={<DashboardPage />} />

          </Routes>
        </main>

        {/* ===== FOOTER (Bottom section) ===== */}
        <footer className="footer">
          <div className="footer-container">

            {/* Dynamic year (auto update हुन्छ) */}
            <p>
              &copy; {new Date().getFullYear()} MindSpark AI.
              All rights reserved.
            </p>

          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
