import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../config/api';
import toast from 'react-hot-toast';

interface User {
  _id?: string;
  id?: string;
  name?: string;
  email: string;
  role: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  register: (userData: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: User | null) => void;
  hasRole: (roles: string | string[]) => boolean;
  isAdmin: () => boolean;
  canManage: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    // During hot reload, context might be temporarily unavailable
    // Return a safe default instead of throwing
    if (import.meta.env.DEV) {
      console.warn('useAuth called outside AuthProvider - this may happen during hot reload');
    }
    return {
      user: null,
      loading: true,
      login: async () => ({ success: false, error: 'Not authenticated' }),
      register: async () => ({ success: false, error: 'Not authenticated' }),
      logout: async () => {},
      updateUser: () => {},
      hasRole: () => false,
      isAdmin: () => false,
      canManage: () => false,
    };
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      // Check for stored user first (for mock login) - do this synchronously
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser) as User;
          setUser(user);
          setLoading(false);
          return;
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('Failed to parse stored user:', error);
          }
          localStorage.removeItem('user');
        }
      }
      
      // Try API authentication
      if (token && !storedUser) {
        try {
          const response = await authAPI.getMe();
          setUser(response.data.data);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('Auth check failed:', error);
          }
          // If API fails, clear tokens
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
        }
      }
      
      // If no token and no stored user, set loading to false immediately
      if (!token && !storedUser) {
        setLoading(false);
      } else if (token && !storedUser) {
        // If we have a token but no stored user, wait for API call
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authAPI.login(credentials);
      
      // Handle both response formats: direct or nested in data
      let token: string, refreshToken: string | undefined, user: User;
      
      if (response.data.data) {
        // Nested format: { data: { token, refreshToken, user } }
        ({ token, refreshToken, user } = response.data.data);
      } else {
        // Direct format: { token, refreshToken, user }
        ({ token, refreshToken, user } = response.data);
      }

      if (!token || !user) {
        throw new Error('Invalid response from server');
      }

      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      // Also store user in localStorage for mock login fallback
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      toast.success(`Welcome back, ${user.name || user.email || 'User'}!`);
      navigate('/');
      return { success: true };
    } catch (error: any) {
      let message = 'Login failed';
      
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        message = 'Cannot connect to server. Please ensure the backend is running on port 5000.';
      } else if (error.response?.status === 401) {
        message = error.response?.data?.message || 'Invalid email or password';
      } else if (error.response?.status === 404) {
        message = 'Login endpoint not found. Please check your API configuration.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      
      if (import.meta.env.DEV) {
        console.error('Login error:', error);
      }
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const register = async (userData: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await authAPI.register(userData);
      
      // Handle both response formats: direct or nested in data
      let token: string, refreshToken: string | undefined, user: User;
      
      if (response.data.data) {
        // Nested format: { data: { token, refreshToken, user } }
        ({ token, refreshToken, user } = response.data.data);
      } else {
        // Direct format: { token, refreshToken, user }
        ({ token, refreshToken, user } = response.data);
      }

      if (!token || !user) {
        throw new Error('Invalid response from server');
      }

      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      // Also store user in localStorage for mock login fallback
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      toast.success('Account created successfully!');
      navigate('/');
      return { success: true };
    } catch (error: any) {
      let message = 'Registration failed';
      
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        message = 'Cannot connect to server. Please ensure the backend is running on port 5000.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }
      
      if (import.meta.env.DEV) {
        console.error('Registration error:', error);
      }
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authAPI.logout();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Logout error:', error);
      }
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      toast.success('Logged out successfully');
      navigate('/login');
    }
  };

  const updateUser = (updatedUser: User | null): void => {
    setUser(updatedUser);
    // Also update localStorage
    if (updatedUser) {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } else {
      localStorage.removeItem('user');
    }
  };

  // Check if user has specific role
  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  // Check if user is admin
  const isAdmin = (): boolean => hasRole('admin');

  // Check if user is admin or manager
  const canManage = (): boolean => hasRole(['admin', 'manager']);

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    hasRole,
    isAdmin,
    canManage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

