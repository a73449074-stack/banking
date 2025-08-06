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
      console.log('🏦 Reducer: UPDATE_BALANCE action received with payload:', action.payload);
      console.log('🏦 Reducer: Current state.user:', state.user);
      const updatedState = {
        ...state,
        user: state.user ? { ...state.user, balance: action.payload } : null,
      };
      console.log('🏦 Reducer: New state after balance update:', updatedState);
      return updatedState;
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
    // Clean up existing listeners first to prevent duplicates
    socketService.off('transactionUpdate');
    socketService.off('accountStatusChange');
    
    // Listen for transaction updates
    socketService.on('transactionUpdate', (data: any) => {
      console.log('AuthContext: Received transactionUpdate:', data);
      
      if (data.userBalance !== undefined) {
        dispatch({ type: 'UPDATE_BALANCE', payload: data.userBalance });
      }
      
      // Only show toast for approved transactions (decline messages handled in UserDashboard)
      if (data.action === 'approve') {
        toast.success(`Transaction approved! Your balance has been updated.`);
      }
    });

    // Listen for account status changes
    socketService.on('accountStatusChange', (data: any) => {
      console.log('AuthContext: Received accountStatusChange:', data);
      
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
      console.log('AuthContext: Starting initialization...');
      
      try {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('user');

        if (token && userData) {
          try {
            const user = JSON.parse(userData);
            console.log('AuthContext: Found existing auth data, user:', user.username);
            dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
            
            // Connect to socket - use _id which is the primary MongoDB identifier
            const userId = user._id || user.id;
            console.log('AuthContext: Connecting socket with userId:', userId, 'role:', user.role);
            socketService.connect(userId, user.role);
            
            // Setup socket listeners for real-time updates
            setupSocketListeners();
            
          } catch (error) {
            console.error('AuthContext: Failed to parse user data:', error);
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            dispatch({ type: 'LOGIN_FAILURE' });
          }
        } else {
          console.log('AuthContext: No existing auth data found');
          dispatch({ type: 'LOGIN_FAILURE' });
        }
      } catch (error) {
        console.error('AuthContext: Initialization error:', error);
        dispatch({ type: 'LOGIN_FAILURE' });
      }
      
      console.log('AuthContext: Initialization completed');
    };

    // Initialize immediately
    initializeAuth();
  }, [setupSocketListeners]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      dispatch({ type: 'LOGIN_START' });
      console.log('AuthContext: Starting login process...');
      
      const response = await authAPI.login({ email, password });
      console.log('AuthContext: Login API response received:', response);
      
      const { user, token } = response;
      
      // Store in localStorage first
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      console.log('AuthContext: Auth data stored in localStorage');
      
      // Then dispatch to update context state
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
      console.log('AuthContext: Login success dispatched, user:', user.username, 'role:', user.role);
      
      // Connect to socket - use _id which is the primary MongoDB identifier
      const userId = user._id || user.id;
      console.log('AuthContext Login: Connecting socket with userId:', userId, 'role:', user.role);
      socketService.connect(userId, user.role);
      setupSocketListeners();
      
      toast.success(`Welcome back, ${user.username}!`);
      console.log('AuthContext: Login process completed successfully');
      return true;
    } catch (error: any) {
      console.error('AuthContext: Login failed:', error);
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
      console.log('AuthContext: Starting registration process...');
      const response = await authAPI.register({ username, email, password, role });
      console.log('AuthContext: Registration API response received:', response);
      
      const { user, token } = response;
      
      // Store in localStorage first
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      console.log('AuthContext: Registration auth data stored in localStorage');
      
      // Then dispatch to update context state
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
      console.log('AuthContext: Registration success dispatched, user:', user.username, 'role:', user.role);
      
      // Connect to socket - use _id which is the primary MongoDB identifier
      const userId = user._id || user.id;
      console.log('AuthContext Register: Connecting socket with userId:', userId, 'role:', user.role);
      socketService.connect(userId, user.role);
      setupSocketListeners();
      
      toast.success(`Welcome to SecureBank, ${user.username}!`);
      console.log('AuthContext: Registration process completed successfully');
      return true;
    } catch (error: any) {
      console.error('AuthContext: Registration failed:', error);
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
    console.log('🏦 AuthContext: updateBalance called with:', balance);
    console.log('🏦 AuthContext: Current user before update:', state.user);
    dispatch({ type: 'UPDATE_BALANCE', payload: balance });
    console.log('🏦 AuthContext: UPDATE_BALANCE dispatched');
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
