import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Card,
  Title,
  Form,
  Input,
  Select,
  Button,
  Link,
  ErrorMessage,
} from '../components/StyledComponents';

const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    role: 'user' as 'user' | 'admin',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Debug: Log authentication state changes
  React.useEffect(() => {
    console.log('Login: Auth state changed - isAuthenticated:', isAuthenticated, 'user:', user);
    if (isAuthenticated && user) {
      console.log('Login: User is authenticated, navigating to dashboard');
      const redirectPath = user.role === 'admin' ? '/admin' : '/dashboard';
      console.log('Login: Redirecting to:', redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Additional check in case the auth state doesn't update properly
  React.useEffect(() => {
    const checkAuthState = () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');
      
      if (token && userData && !user) {
        console.log('Login: Found auth data in localStorage but context not updated');
        try {
          const parsedUser = JSON.parse(userData);
          const redirectPath = parsedUser.role === 'admin' ? '/admin' : '/dashboard';
          console.log('Login: Force redirecting to:', redirectPath);
          navigate(redirectPath, { replace: true });
        } catch (e) {
          console.error('Login: Error parsing user data:', e);
        }
      }
    };

    // Check immediately and after a short delay
    checkAuthState();
    const timeout = setTimeout(checkAuthState, 1000);
    
    return () => clearTimeout(timeout);
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        console.log('Login: Attempting login...');
        const success = await login(formData.email, formData.password);
        console.log('Login: Login result:', success);
        
        if (success) {
          // Get the updated user from localStorage immediately after successful login
          const userData = localStorage.getItem('user');
          if (userData) {
            try {
              const user = JSON.parse(userData);
              const redirectPath = user.role === 'admin' ? '/admin' : '/dashboard';
              console.log('Login: Immediate redirect to:', redirectPath, 'for user:', user.username);
              navigate(redirectPath, { replace: true });
              return; // Exit early to prevent further execution
            } catch (e) {
              console.error('Login: Error parsing user data for immediate redirect:', e);
            }
          }
        } else {
          setError('Login failed - invalid credentials');
        }
      } else {
        console.log('Login: Attempting registration...');
        const success = await register(
          formData.username,
          formData.email,
          formData.password,
          formData.role
        );
        console.log('Login: Registration result:', success);
        
        if (success) {
          // Get the updated user from localStorage immediately after successful registration
          const userData = localStorage.getItem('user');
          if (userData) {
            try {
              const user = JSON.parse(userData);
              const redirectPath = user.role === 'admin' ? '/admin' : '/dashboard';
              console.log('Login: Immediate redirect after registration to:', redirectPath, 'for user:', user.username);
              navigate(redirectPath, { replace: true });
              return; // Exit early to prevent further execution
            } catch (e) {
              console.error('Login: Error parsing user data for immediate redirect after registration:', e);
            }
          }
        } else {
          setError('Registration failed');
        }
      }
    } catch (error: any) {
      console.error('Login: Error during auth:', error);
      setError(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      email: '',
      password: '',
      username: '',
      role: 'user',
    });
  };

  return (
    <Container>
      <Card>
        <Title>{isLogin ? 'Welcome Back' : 'Create Account'}</Title>
        <Form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <Input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
              <Select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </Select>
            </>
          )}
          <Input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
          <Input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            required
            minLength={6}
          />
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </Button>
        </Form>
        <Link onClick={toggleMode}>
          {isLogin 
            ? "Don't have an account? Sign up" 
            : "Already have an account? Sign in"
          }
        </Link>
        
        {/* Demo accounts info */}
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          background: '#f0f9ff', 
          borderRadius: '8px',
          fontSize: '14px',
          color: '#0369a1'
        }}>
          <strong>Demo Accounts:</strong><br />
          Admin: admin@demo.com / password<br />
          User: user@demo.com / password
        </div>
      </Card>
    </Container>
  );
};

export default Login;
