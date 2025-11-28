import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register, logout } = useAuth();
  const navigate = useNavigate();

  const clearForm = (clearSuccess = true) => {
    setEmail('');
    setUsername('');
    setPassword('');
    setError('');
    if (clearSuccess) {
      setSuccess('');
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setIsLogin(newValue === 0);
    clearForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        // Navigate to dashboard after successful login
        navigate('/libraries');
      } else {
        if (!username.trim()) {
          setError('Username is required');
          setLoading(false);
          return;
        }
        // Register the user (this will log them in temporarily)
        await register(email, username, password);
        // Log them out so they must sign in manually
        await logout();
        // Clear form but keep success message
        setEmail('');
        setUsername('');
        setPassword('');
        setError('');
        // Show success message - stay on sign up tab, user can manually switch to sign in
        setSuccess('Account created successfully! Please switch to Sign In to continue.');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      // Provide more specific error messages
      if (isLogin) {
        // For login errors, provide helpful guidance
        if (errorMessage.includes('Invalid credentials') || errorMessage.includes('User not found')) {
          setError('Invalid email or password. If you don\'t have an account, please sign up first.');
        } else {
          setError(errorMessage);
        }
      } else {
        // For registration errors
        if (errorMessage.includes('User already exists')) {
          setError('An account with this email or username already exists. Please sign in instead.');
        } else {
          setError(errorMessage);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="sm" sx={{ px: { xs: 2, sm: 3 } }}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 3, sm: 4, md: 5 }, 
            backgroundColor: '#FFFBFD',
            borderRadius: 3,
            border: '1px solid rgba(233, 30, 99, 0.1)',
          }}
        >
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          align="center" 
          sx={{ 
            mb: 1,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Love Library
        </Typography>
        <Typography 
          variant="body1" 
          align="center" 
          sx={{ 
            mb: 4,
            color: '#6B6B6B',
            fontSize: { xs: '0.875rem', sm: '1rem' },
          }}
        >
          {isLogin ? 'Sign in to your account' : 'Create a new account'}
        </Typography>

        <Tabs 
          value={isLogin ? 0 : 1} 
          onChange={handleTabChange} 
          sx={{ 
            mb: 3,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
            },
            '& .Mui-selected': {
              color: '#E91E63',
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#E91E63',
            },
          }}
        >
          <Tab label="Sign In" />
          <Tab label="Sign Up" />
        </Tabs>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          {!isLogin && (
            <TextField
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
            />
          )}
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ 
              mt: 3, 
              mb: 2,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 600,
            }}
            disabled={loading}
          >
            {isLogin ? 'Sign In' : 'Sign Up'}
          </Button>
        </Box>
      </Paper>
    </Container>
    </Box>
  );
}

