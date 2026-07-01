import React, { createContext, useContext, useState, useEffect } from 'react';

// API base URL configuration
// backend चलिरहेको port 5000 को URL
const API_URL = 'http://localhost:5000/api';

// Interface for User data model
interface User {
  id: number;
  name: string;
  email: string;
}

// Context state contract/schema
interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

// Create the context with undefined default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // initially true while checking token

  // 1. Run profile check on mount if token is stored in localStorage
  // app start हुँदा localstorage मा token छ कि छैन र त्यो valid छ कि छैन चेक गर्ने
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          // Fetch current user details using the saved token
          // saved token पठाएर user profile (/auth/me) fetch गर्ने
          const res = await fetch(`${API_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${savedToken}`,
            },
          });

          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            setToken(savedToken);
          } else {
            // If token is invalid or expired, clear it
            // token invalid वा expired भएमा storage clear गर्ने
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Failed to restore auth session:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // 2. Login handler
  // user login गराउने function
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Save token in localStorage and update state
      // login successful भएमा storage र state मा token/user save गर्ने
      localStorage.setItem('token', data.accessToken);
      setToken(data.accessToken);
      setUser(data.user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 3. Signup handler
  // user register गराउने function
  const signup = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      // Step A: Register the user
      // पहिला register API कल गर्ने
      const signupRes = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const signupData = await signupRes.json();

      if (!signupRes.ok) {
        throw new Error(signupData.message || 'Registration failed');
      }

      // Step B: Auto login the user after successful registration
      // register सफल भएपछि सिधै login गराउने
      await login(email, password);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 4. Logout handler
  // user logout गराउने function
  const logout = () => {
    // Clear storage and state properties
    // storage र state बाट token र user details हटाउने
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access AuthContext easily in components
// context consume गर्न सजिलो custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
