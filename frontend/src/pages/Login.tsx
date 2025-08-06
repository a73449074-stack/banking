import React, { useState } from 'react';
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

  // Simple useEffect - only handle already authenticated users
  React.useEffect(() => {
    console.log('Login: Auth state - isAuthenticated:', isAuthenticated, 'user:', user?.username);
    
    // If user is already authenticated, redirect immediately
    if (isAuthenticated && user) {
      const redirectPath = user.role === 'admin' ? '/admin' : '/dashboard';
      console.log('Login: User already authenticated, redirecting to:', redirectPath);
      window.location.href = redirectPath;
    }
  }, [isAuthenticated, user]);

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
          console.log('Login: Login successful, preparing to navigate...');
          
          // Simple, reliable navigation that works everywhere
          setTimeout(() => {
            const userData = localStorage.getItem('user');
            if (userData) {
              try {
                const user = JSON.parse(userData);
                const redirectPath = user.role === 'admin' ? '/admin' : '/dashboard';
                console.log('Login: Navigating to:', redirectPath, 'for user:', user.username);
                
                // Use window.location.href for most reliable navigation
                window.location.href = redirectPath;
              } catch (e) {
                console.error('Login: Error parsing user data:', e);
                window.location.href = '/dashboard';
              }
            } else {
              console.log('Login: No user data found, using fallback navigation');
              window.location.href = '/dashboard';
            }
          }, 100); // Faster navigation - just enough for auth state to update
          
          return; // Exit early to prevent setting loading to false
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
          console.log('Login: Registration successful, preparing to navigate...');
          
          // Simple, reliable navigation that works everywhere
          setTimeout(() => {
            const userData = localStorage.getItem('user');
            if (userData) {
              try {
                const user = JSON.parse(userData);
                const redirectPath = user.role === 'admin' ? '/admin' : '/dashboard';
                console.log('Login: Navigating after registration to:', redirectPath, 'for user:', user.username);
                
                // Use window.location.href for most reliable navigation
                window.location.href = redirectPath;
              } catch (e) {
                console.error('Login: Error parsing user data after registration:', e);
                window.location.href = '/dashboard';
              }
            } else {
              console.log('Login: No user data found after registration, using fallback navigation');
              window.location.href = '/dashboard';
            }
          }, 100); // Faster navigation - just enough for auth state to update
          
          return; // Exit early to prevent setting loading to false
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
