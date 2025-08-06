import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Debug logging for API URL
console.log('🔧 API Configuration:', {
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  API_BASE_URL: API_BASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  ALL_ENV_VARS: Object.keys(process.env).filter(key => key.startsWith('REACT_APP_'))
});

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    console.log('API Error Details:', {
      status: error.response?.status,
      code: error.code,
      message: error.message,
      url: originalRequest?.url,
      hasResponse: !!error.response,
      responseData: error.response?.data
    });
    
    // Handle 401 unauthorized - redirect to login
    if (error.response?.status === 401) {
      console.log('401 Unauthorized - clearing auth data');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Handle other errors without retry to prevent infinite loops
    return Promise.reject(error);
  }
);

export interface User {
  _id: string;
  id?: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  accountNumber: string;
  balance: number;
  isFrozen?: boolean;
  isActive?: boolean;
}

export interface Transaction {
  _id: string;
  transactionId: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  description?: string;
  recipient?: {
    accountNumber: string;
    name: string;
  };
  status: 'pending' | 'approved' | 'declined';
  adminAction?: {
    adminId: string;
    actionDate: string;
    comment: string;
  };
  balanceAfter?: number;
  createdAt: string;
  updatedAt: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
}

export interface TransactionData {
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  description?: string;
  recipient?: {
    accountNumber: string;
    name: string;
  };
}

// Auth API
export const authAPI = {
  login: async (data: LoginData) => {
    console.log('🔐 AuthAPI: Attempting login to:', API_BASE_URL + '/auth/login');
    console.log('🔐 AuthAPI: Login data:', { email: data.email });
    
    try {
      const response = await api.post('/auth/login', data);
      console.log('🔐 AuthAPI: Login response received:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('🔐 AuthAPI: Login error:', error);
      console.error('🔐 AuthAPI: Error details:', error.response?.data);
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  refreshToken: async () => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },
};

// Transaction API
export const transactionAPI = {
  getTransactions: async (params?: { page?: number; limit?: number; status?: string }) => {
    console.log('🚀 API: Making getTransactions request with params:', params);
    console.log('🚀 API: Token in localStorage:', localStorage.getItem('authToken') ? 'Present' : 'Missing');
    try {
      const response = await api.get('/transactions', { params });
      console.log('🚀 API: getTransactions response:', response.data);
      return response.data;
    } catch (error) {
      console.error('🚀 API: getTransactions error:', error);
      throw error;
    }
  },

  createTransaction: async (data: TransactionData) => {
    const response = await api.post('/transactions', data);
    return response.data;
  },

  getTransaction: async (id: string) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  cancelTransaction: async (id: string) => {
    const response = await api.delete(`/transactions/${id}`);
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  getPendingTransactions: async (params?: { page?: number; limit?: number }) => {
    const response = await api.get('/admin/transactions/pending', { params });
    return response.data;
  },

  getAllTransactions: async (params?: { 
    page?: number; 
    limit?: number; 
    status?: string; 
    userId?: string 
  }) => {
    const response = await api.get('/admin/transactions', { params });
    return response.data;
  },

  processTransaction: async (id: string, data: { action: 'approve' | 'decline'; comment?: string }) => {
    const response = await api.patch(`/admin/transactions/${id}`, data);
    return response.data;
  },

  getUsers: async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  freezeUser: async (id: string, freeze: boolean) => {
    const response = await api.patch(`/admin/users/${id}/freeze`, { freeze });
    return response.data;
  },

  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },
};

export default api;
