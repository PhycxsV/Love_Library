import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Avatar,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  AppBar,
  Toolbar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
    }
  }, [user]);

  const handleSave = async () => {
    if (!username.trim()) {
      setSnackbar({ open: true, message: 'Username is required', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await api.put('/auth/profile', { username, email });
      updateUser(response.data.user);
      setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Failed to update profile',
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setSnackbar({ open: true, message: 'File size must be less than 5MB', severity: 'error' });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await api.post('/profile/photo', formData);

      updateUser(response.data.user);
      setSnackbar({ open: true, message: 'Profile photo updated successfully!', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Failed to upload photo',
        severity: 'error' 
      });
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky" elevation={0} sx={{ background: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/libraries')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600, color: 'white' }}>
            Edit Profile
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ flex: 1, py: 4, px: { xs: 2, sm: 3 } }}>
        <Paper
          elevation={0}
          sx={{
            backgroundColor: '#FFFBFD',
            borderRadius: 3,
            p: { xs: 3, sm: 4 },
            border: '1px solid rgba(233, 30, 99, 0.1)',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Box sx={{ position: 'relative', mb: 2 }}>
              <Avatar
                src={user?.profilePhoto ?? undefined}
                sx={{
                  width: { xs: 100, sm: 120 },
                  height: { xs: 100, sm: 120 },
                  bgcolor: '#E91E63',
                  fontSize: { xs: 40, sm: 48 },
                  fontWeight: 600,
                  boxShadow: '0px 8px 24px rgba(233, 30, 99, 0.3)',
                }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
              <IconButton
                component="label"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: '#E91E63',
                  color: 'white',
                  '&:hover': { bgcolor: '#C2185B' },
                  border: '3px solid white',
                }}
                disabled={uploading}
              >
                {uploading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <PhotoCameraIcon />
                )}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
              </IconButton>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              Click camera icon to upload profile photo
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Username"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              variant="outlined"
            />
            <TextField
              label="Email"
              fullWidth
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              variant="outlined"
            />
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleSave}
              disabled={loading || !username.trim()}
              sx={{
                py: 1.5,
                mt: 2,
                fontSize: '1rem',
                fontWeight: 600,
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
            </Button>
          </Box>
        </Paper>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}


