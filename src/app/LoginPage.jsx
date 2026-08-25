import { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Alert,
} from '@mui/material';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { SimpleLoadingScreen } from '../components/screens/SimpleLoadingScreen';

export function LoginPage() {
  const { login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    setError(null);
    try {
      const result = await login(username, password);
      if (!result) throw new Error('Invalid credentials');
    } catch (err) {
      if (import.meta.env.DEV) console.error('[login]', err);
      setError('Login failed. Please check your username and password.');
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLoginDev = async (u, p) => {
    setUsername(u);
    setPassword(p);
    setLoading(true);
    try {
      const result = await login(u, p);
      if (!result) throw new Error('Invalid credentials');
    } catch (err) {
      if (import.meta.env.DEV) console.error('[quickLogin]', err);
      toast.error('Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <SimpleLoadingScreen message="Signing in..." />;
  }

  return (
    <Container maxWidth="sm" sx={styles.container}>
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <Typography variant="h4" sx={styles.title}>
          Merits and Demerits
        </Typography>
        <Typography variant="h5" sx={styles.subtitle}>
          mini app
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Username"
              variant="outlined"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={textFieldStyles}
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={textFieldStyles}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={!username || !password || loading}
              sx={buttonStyles}
            >
              Login
            </Button>
          </Box>
        </form>

        {import.meta.env.DEV && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="caption" sx={styles.developmentMode}>
              Development Mode
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              <Button
                size="small"
                variant="text"
                sx={{ color: '#5A5984' }}
                onClick={() => quickLoginDev(
                  import.meta.env.VITE_DEV_ADMIN_USER || 'testAdmin',
                  import.meta.env.VITE_DEV_ADMIN_PASS || ''
                )}
              >
                Admin
              </Button>
              <Button
                size="small"
                variant="text"
                sx={{ color: '#5A5984' }}
                onClick={() => quickLoginDev(
                  import.meta.env.VITE_DEV_TEACHER_USER || 'testTeacher',
                  import.meta.env.VITE_DEV_TEACHER_PASS || ''
                )}
              >
                Teacher
              </Button>
              <Button
                size="small"
                variant="text"
                sx={{ color: '#5A5984' }}
                onClick={() => quickLoginDev(
                  import.meta.env.VITE_DEV_STUDENT_USER || 'testStudent',
                  import.meta.env.VITE_DEV_STUDENT_PASS || ''
                )}
              >
                Student
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Container>
  );
}

const textFieldStyles = {
  '& .MuiOutlinedInput-root': {
    color: '#ffffff',
    '& fieldset': { borderColor: '#373758' },
    '&:hover fieldset': { borderColor: '#8483AE' },
    '&.Mui-focused fieldset': { borderColor: '#9266FF' },
  },
  '& .MuiInputLabel-root': {
    color: '#5A5984',
    '&.Mui-focused': { color: '#9266FF' },
  },
};

const buttonStyles = {
  background: 'linear-gradient(135deg, #9266FF 0%, #6932EB 100%)',
  color: '#F4F4FF',
  py: 1.5,
  '&:hover': {
    background: 'linear-gradient(135deg, #6932EB 0%, #5A2980 100%)',
  },
  '&:disabled': {
    background: 'linear-gradient(135deg, #626290 0%, #373758 100%)',
    color: '#5A5984',
  },
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    py: 4,
  },
  title: {
    color: '#ffffff',
    fontWeight: 400,
    textAlign: 'center',
    background: 'linear-gradient(135deg, #F4F4FF 0%, #9266FF 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: '#5A5984',
    textAlign: 'center',
    mb: 4,
  },
  developmentMode: {
    display: 'block',
    textAlign: 'center',
    color: '#5A5984',
    fontSize: '0.75rem',
    mb: 1,
  },
};
