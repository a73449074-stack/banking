import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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

// Response interceptor to handle token expiration and backend wake-up
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    console.log('API Error:', {
      status: error.response?.status,
      code: error.code,
      message: error.message,
      url: originalRequest?.url,
      retry: originalRequest._retry
    });
    
    // Handle backend sleeping (503/504 errors or connection refused) - but only retry once
    if (
      (error.response?.status === 503 || 
       error.response?.status === 504 || 
       error.code === 'ECONNREFUSED' ||
       error.code === 'ERR_NETWORK' ||
       error.message.includes('Network Error')) && 
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      
      console.log('Backend appears to be sleeping, attempting wake-up...');
      
      // Show user-friendly message about backend waking up
      if (typeof window !== 'undefined') {
        const { default: toast } = await import('react-hot-toast');
        toast.loading('Backend is waking up, please wait...', { 
          id: 'backend-wakeup',
          duration: 10000 
        });
      }
      
      // Wait for backend to wake up and retry ONCE
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      try {
        const retryResponse = await api(originalRequest);
        // Dismiss the loading toast on success
        if (typeof window !== 'undefined') {
          const { default: toast } = await import('react-hot-toast');
          toast.dismiss('backend-wakeup');
          toast.success('Connected to backend!');
        }
        return retryResponse;
      } catch (retryError) {
        // If retry fails, show a more helpful error and DON'T retry again
        console.error('Retry failed:', retryError);
        if (typeof window !== 'undefined') {
          const { default: toast } = await import('react-hot-toast');
          toast.dismiss('backend-wakeup');
          toast.error('Backend is still starting up. Please try again in a minute.', {
            duration: 6000
          });
        }
        return Promise.reject(retryError);
      }
    }
    
    // Handle 401 unauthorized
    if (error.response?.status === 401) {
      console.log('401 Unauthorized - clearing auth data');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
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
    const response = await api.post('/auth/login', data);
    return response.data;
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
