import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { GenerateQuizPage } from './pages/GenerateQuizPage';
import { PlayQuizPage } from './pages/PlayQuizPage';
import { QuizResultPage } from './pages/QuizResultPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import './App.css';
 
 /**
  * AppContent contains the application layout, navbar, routes, and consumes AuthContext.
  */
 const AppContent: React.FC = () => {
   const { user, logout } = useAuth();
 
   return (
     // Router keeps track of navigation history
     <Router>
       <div className="app-shell">
         
         {/* ===== NAVBAR (Top Menu) ===== */}
         <header className="navbar">
           <div className="nav-container">
             
             {/* Logo / Brand */}
             <Link to="/" className="nav-brand">
               <span className="brand-accent">Mind</span>Spark
             </Link>
 
             {/* Navigation menu */}
             <nav className="nav-menu">
               <Link to="/" className="nav-link">
                 Home
               </Link>
 
               {/* Show Dashboard and Leaderboard links only if user is logged in */}
               {/* user logged in छ भने मात्र Dashboard र Leaderboard links देखाउने */}
               {user && (
                 <>
                   <Link to="/dashboard" className="nav-link">
                     Dashboard
                   </Link>
                   <Link to="/leaderboard" className="nav-link">
                     Leaderboard
                   </Link>
                 </>
               )}
 
               {/* Conditional Authentication Action buttons */}
               {/* login छ भने Logout button र user को नाम, छैन भने Sign In button */}
               {user ? (
                 <div className="nav-auth-group" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                   <span className="nav-user-name" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                     नमस्ते, {user.name}
                   </span>
                   <button 
                     onClick={logout} 
                     className="btn btn-secondary btn-nav"
                     style={{ padding: '8px 16px', fontSize: '0.9rem' }}
                   >
                     Logout
                   </button>
                 </div>
               ) : (
                 <Link to="/login" className="btn btn-secondary btn-nav">
                   Sign In
                 </Link>
               )}
             </nav>
           </div>
         </header>
 
         {/* ===== MAIN CONTENT AREA ===== */}
         <main className="main-content">
           <Routes>
             {/* Public: Landing page */}
             <Route path="/" element={<LandingPage />} />
 
             {/* Public: Login page */}
             <Route path="/login" element={<LoginPage />} />
 
             {/* Protected: Dashboard page wrapped in ProtectedRoute */}
             {/* यो route मा जान login हुन अनिवार्य छ */}
             <Route 
               path="/dashboard" 
               element={
                 <ProtectedRoute>
                   <DashboardPage />
                 </ProtectedRoute>
               } 
             />
 
             {/* Protected: Quiz Generator page wrapped in ProtectedRoute */}
             <Route 
               path="/generate" 
               element={
                 <ProtectedRoute>
                   <GenerateQuizPage />
                 </ProtectedRoute>
               } 
             />

             {/* Protected: Quiz Taking page wrapped in ProtectedRoute */}
             <Route 
               path="/quiz/:id" 
               element={
                 <ProtectedRoute>
                   <PlayQuizPage />
                 </ProtectedRoute>
               } 
             />

             {/* Protected: Quiz Results page wrapped in ProtectedRoute */}
             <Route 
               path="/quiz/result" 
               element={
                 <ProtectedRoute>
                   <QuizResultPage />
                 </ProtectedRoute>
               } 
             />

             {/* Protected: Leaderboard page wrapped in ProtectedRoute */}
             <Route 
               path="/leaderboard" 
               element={
                 <ProtectedRoute>
                   <LeaderboardPage />
                 </ProtectedRoute>
               } 
             />
           </Routes>
         </main>

        {/* ===== FOOTER ===== */}
        <footer className="footer">
          <div className="footer-container">
            <p>
              &copy; {new Date().getFullYear()} MindSpark AI. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

/**
 * App is the root React component.
 * It wraps the entire app in AuthProvider to make auth context globally accessible.
 */
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
