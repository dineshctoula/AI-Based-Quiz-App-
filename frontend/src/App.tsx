import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import './App.css';

// Lazy load route pages for performance optimization
// performance optimization को लागि route pages लाई lazy load गरेको
const LandingPage = lazy(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(module => ({ default: module.DashboardPage })));
const GenerateQuizPage = lazy(() => import('./pages/GenerateQuizPage').then(module => ({ default: module.GenerateQuizPage })));
const PlayQuizPage = lazy(() => import('./pages/PlayQuizPage').then(module => ({ default: module.PlayQuizPage })));
const QuizResultPage = lazy(() => import('./pages/QuizResultPage').then(module => ({ default: module.QuizResultPage })));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage').then(module => ({ default: module.LeaderboardPage })));
const MultiplayerPage = lazy(() => import('./pages/MultiplayerPage').then(module => ({ default: module.MultiplayerPage })));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage').then(module => ({ default: module.AdminDashboardPage })));

/**
 * PageLoader displays a premium glassmorphic loading spinner while lazy components load.
 * Lazy components load हुँदा PageLoader ले premium loading indicator देखाउँछ।
 */
const PageLoader: React.FC = () => (
  <div className="flex-center" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
    <div className="spinner" style={{
      width: '48px',
      height: '48px',
      border: '4px solid rgba(255, 255, 255, 0.1)',
      borderTop: '4px solid var(--primary)',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', letterSpacing: '0.5px' }}>Loading mind sparks...</p>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

 
 /**
  * AppContent contains the application layout, navbar, routes, and consumes AuthContext.
  */
 const AppContent: React.FC = () => {
   const { user, logout, isAdmin } = useAuth();
 
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
 
               {/* Show Dashboard, Leaderboard, and Multiplayer links only if user is logged in */}
               {/* user logged in छ भने मात्र Dashboard, Leaderboard र Multiplayer links देखाउने */}
               {user && (
                 <>
                   <Link to="/dashboard" className="nav-link">
                     Dashboard
                   </Link>
                   <Link to="/leaderboard" className="nav-link">
                     Leaderboard
                   </Link>
                   <Link to="/multiplayer" className="nav-link">
                     Multiplayer
                   </Link>
                   {isAdmin && (
                     <Link to="/admin" className="nav-link" style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>
                       Admin
                     </Link>
                   )}
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
           <Suspense fallback={<PageLoader />}>
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

               {/* Protected: Multiplayer Lobby page wrapped in ProtectedRoute */}
               <Route 
                 path="/multiplayer" 
                 element={
                   <ProtectedRoute>
                     <MultiplayerPage />
                   </ProtectedRoute>
                 } 
               />

               {/* Protected: Admin Dashboard page wrapped in ProtectedRoute */}
               <Route 
                 path="/admin" 
                 element={
                   <ProtectedRoute>
                     <AdminDashboardPage />
                   </ProtectedRoute>
                 } 
               />
             </Routes>
           </Suspense>
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
    <ErrorBoundary>
      <AuthProvider>
        <SocketProvider>
          <AppContent />
        </SocketProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
