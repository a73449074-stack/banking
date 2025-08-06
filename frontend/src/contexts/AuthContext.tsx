import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { User, authAPI } from '../services/api';
import socketService from '../services/socket';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'UPDATE_BALANCE'; payload: number };

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, email: string, password: string, role?: 'user' | 'admin') => Promise<boolean>;
  updateBalance: (balance: number) => void;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: true,
  isAuthenticated: false,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        isAuthenticated: true,
      };
    case 'LOGIN_FAILURE':
      return { ...state, loading: false, isAuthenticated: false };
    case 'LOGOUT':
      return { ...initialState, loading: false };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    case 'UPDATE_BALANCE':
      return {
        ...state,
        user: state.user ? { ...state.user, balance: action.payload } : null,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const setupSocketListeners = useCallback(() => {
    // Listen for transaction updates
    socketService.on('transactionUpdate', (data: any) => {
      if (data.userBalance !== undefined) {
        dispatch({ type: 'UPDATE_BALANCE', payload: data.userBalance });
      }
      
      if (data.action === 'approve') {
        toast.success(`Transaction ${data.action}d! Your balance has been updated.`);
      } else if (data.action === 'decline') {
        toast.error(`Transaction ${data.action}d by admin.`);
      }
    });

    // Listen for account status changes
    socketService.on('accountStatusChange', (data: any) => {
      if (data.isFrozen) {
        toast.error(data.message || 'Your account has been frozen');
      } else {
        toast.success(data.message || 'Your account has been unfrozen');
      }
      
      if (state.user) {
        dispatch({ 
          type: 'UPDATE_USER', 
          payload: { ...state.user, isFrozen: data.isFrozen } 
        });
      }
    });
  }, [dispatch, state.user]);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          const user = JSON.parse(userData);
          dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
          
          // Connect to socket - use _id which is the primary MongoDB identifier
          const userId = user._id || user.id;
          console.log('AuthContext: Connecting socket with userId:', userId, 'role:', user.role);
          socketService.connect(userId, user.role);
          
          // Setup socket listeners for real-time updates
          setupSocketListeners();
          
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          dispatch({ type: 'LOGIN_FAILURE' });
        }
      } else {
        dispatch({ type: 'LOGIN_FAILURE' });
      }
    };

    initializeAuth();
  }, [setupSocketListeners]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const response = await authAPI.login({ email, password });
      
      const { user, token } = response;
      
      // Store in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
      
      // Connect to socket - use _id which is the primary MongoDB identifier
      const userId = user._id || user.id;
      console.log('AuthContext Login: Connecting socket with userId:', userId, 'role:', user.role);
      socketService.connect(userId, user.role);
      setupSocketListeners();
      
      toast.success('Login successful!');
      return true;
    } catch (error: any) {
      dispatch({ type: 'LOGIN_FAILURE' });
      toast.error(error.response?.data?.error || 'Login failed');
      return false;
    }
  };

  const register = async (
    username: string, 
    email: string, 
    password: string, 
    role: 'user' | 'admin' = 'user'
  ): Promise<boolean> => {
    try {
      const response = await authAPI.register({ username, email, password, role });
      
      const { user, token } = response;
      
      // Store in localStorage
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
      
      // Connect to socket - use _id which is the primary MongoDB identifier
      const userId = user._id || user.id;
      console.log('AuthContext Register: Connecting socket with userId:', userId, 'role:', user.role);
      socketService.connect(userId, user.role);
      setupSocketListeners();
      
      toast.success('Registration successful!');
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    socketService.disconnect();
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  const updateBalance = (balance: number) => {
    dispatch({ type: 'UPDATE_BALANCE', payload: balance });
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    register,
    updateBalance,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
