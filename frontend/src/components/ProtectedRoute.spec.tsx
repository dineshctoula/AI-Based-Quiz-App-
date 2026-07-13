import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';

// Mock the AuthContext hook
// AuthContext hook लाई mock गरेको
vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state screen when authentication state is loading', () => {
    // Mock loading state
    // user verify हुँदै गरेको loading state mock गर्ने
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: true,
      token: null,
      isAdmin: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
    });

    render(<ProtectedRoute><div>Private Dashboard</div></ProtectedRoute>);

    // Verify session loading card is displayed
    // verification screen देखियो कि देखिएन भनेर check गर्ने
    expect(screen.getByText('MindSpark AI')).toBeInTheDocument();
    expect(screen.getByText('Verifying session, please wait...')).toBeInTheDocument();
    expect(screen.queryByText('Private Dashboard')).not.toBeInTheDocument();
  });

  it('should redirect unauthenticated users to the login screen', () => {
    // Mock user as null (not logged in)
    // user state null (not logged in) mock गर्ने
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: false,
      token: null,
      isAdmin: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <div>Private Dashboard</div>
              </ProtectedRoute>
            } 
          />
          <Route path="/login" element={<div>Mock Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Verify user is redirected to the login page
    // user लाई /login page मा redirect गरेको verify गर्ने
    expect(screen.getByText('Mock Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Private Dashboard')).not.toBeInTheDocument();
  });

  it('should render the children components when user is authenticated', () => {
    // Mock user is authenticated
    // user authenticated भएको state mock गर्ने
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, name: 'Dinesh', email: 'dinesh@test.com', role: 'USER' },
      loading: false,
      token: 'jwt-token',
      isAdmin: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute>
          <div>Private Dashboard</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    // Verify child components are rendered successfully
    // Child components successfully render भएको check गर्ने
    expect(screen.getByText('Private Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Verifying session, please wait...')).not.toBeInTheDocument();
  });
});
