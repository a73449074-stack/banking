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

  // Single useEffect to handle navigation when user is already authenticated
  React.useEffect(() => {
    console.log('Login: Checking if user is already authenticated - isAuthenticated:', isAuthenticated, 'user:', user);
    
    // Only navigate if user is already authenticated when component mounts
    // This handles the case where user refreshes on login page while already logged in
    if (isAuthenticated && user && !loading) {
      console.log('Login: User already authenticated, redirecting...');
      const redirectPath = user.role === 'admin' ? '/admin' : '/dashboard';
      console.log('Login: Redirecting to:', redirectPath);
      
      // Mobile-optimized navigation for already authenticated users
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      try {
        if (isMobile) {
          console.log('Login: Mobile device detected (already auth), using location.replace');
          window.location.replace(redirectPath);
        } else {
          console.log('Login: Desktop device (already auth), trying React Router first');
          navigate(redirectPath, { replace: true });
          
          // Fallback for desktop
          setTimeout(() => {
            if (window.location.pathname === '/login') {
              console.log('Login: Desktop fallback for already authenticated user');
              window.location.replace(redirectPath);
            }
          }, 100);
        }
      } catch (error) {
        console.error('Navigation error for already authenticated user:', error);
        window.location.replace(redirectPath);
      }
    }
  }, [isAuthenticated, user, loading, navigate]);

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
          
          // More reliable navigation for mobile devices
          setTimeout(() => {
            const userData = localStorage.getItem('user');
            if (userData) {
              try {
                const user = JSON.parse(userData);
                const redirectPath = user.role === 'admin' ? '/admin' : '/dashboard';
                console.log('Login: Navigating to:', redirectPath, 'for user:', user.username);
                
                // Mobile-optimized navigation - more aggressive approach for Android
                try {
                  console.log('Login: Attempting mobile-optimized navigation');
                  
                  // For Android and mobile browsers, use location.replace immediately
                  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                  
                  if (isMobile) {
                    console.log('Login: Mobile device detected, using location.replace');
                    window.location.replace(redirectPath);
                  } else {
                    console.log('Login: Desktop device, trying React Router first');
                    navigate(redirectPath, { replace: true });
                    
                    // Fallback check for desktop
                    setTimeout(() => {
                      if (window.location.pathname === '/login') {
                        console.log('Login: Desktop React Router failed, using location.replace');
                        window.location.replace(redirectPath);
                      }
                    }, 200);
                  }
                } catch (navError) {
                  console.error('Login: All navigation methods failed:', navError);
                  window.location.replace(redirectPath);
                }
              } catch (e) {
                console.error('Login: Error parsing user data:', e);
                // Fallback navigation
                window.location.replace('/dashboard');
              }
            } else {
              console.log('Login: No user data found, using fallback navigation');
              window.location.replace('/dashboard');
            }
          }, 200); // Slightly longer delay for mobile
          
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
          
          // More reliable navigation for mobile devices
          setTimeout(() => {
            const userData = localStorage.getItem('user');
            if (userData) {
              try {
                const user = JSON.parse(userData);
                const redirectPath = user.role === 'admin' ? '/admin' : '/dashboard';
                console.log('Login: Navigating after registration to:', redirectPath, 'for user:', user.username);
                
                // Mobile-optimized navigation - more aggressive approach for Android
                try {
                  console.log('Login: Attempting mobile-optimized navigation after registration');
                  
                  // For Android and mobile browsers, use location.replace immediately
                  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                  
                  if (isMobile) {
                    console.log('Login: Mobile device detected after registration, using location.replace');
                    window.location.replace(redirectPath);
                  } else {
                    console.log('Login: Desktop device after registration, trying React Router first');
                    navigate(redirectPath, { replace: true });
                    
                    // Fallback check for desktop
                    setTimeout(() => {
                      if (window.location.pathname === '/login') {
                        console.log('Login: Desktop React Router failed after registration, using location.replace');
                        window.location.replace(redirectPath);
                      }
                    }, 200);
                  }
                } catch (navError) {
                  console.error('Login: All navigation methods failed after registration:', navError);
                  window.location.replace(redirectPath);
                }
              } catch (e) {
                console.error('Login: Error parsing user data after registration:', e);
                // Fallback navigation
                window.location.replace('/dashboard');
              }
            } else {
              console.log('Login: No user data found after registration, using fallback navigation');
              window.location.replace('/dashboard');
            }
          }, 200); // Slightly longer delay for mobile
          
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
