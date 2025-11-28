import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  AppBar,
  Toolbar,
  Box,
  CircularProgress,
  Avatar,
  Chip,
  IconButton,
  CardActionArea,
  Divider,
  Paper,
  Snackbar,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LogoutIcon from '@mui/icons-material/Logout';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import PeopleIcon from '@mui/icons-material/People';
import CodeIcon from '@mui/icons-material/Code';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';

interface Library {
  id: string;
  name: string;
  code: string;
  description?: string;
  members: any[];
}

export default function LibraryListPage() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [libraryName, setLibraryName] = useState('');
  const [libraryDescription, setLibraryDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' as 'success' | 'error' });
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Clear libraries when user changes to prevent showing wrong user's libraries
      setLibraries([]);
      setLoading(true);
      loadLibraries();
    } else {
      // Clear libraries if user logs out
      setLibraries([]);
      setLoading(false);
    }
  }, [user]);

  const loadLibraries = async () => {
    try {
      const response = await api.get('/libraries/my-libraries');
      // Double-check: ensure all libraries have the current user as a member
      const verifiedLibraries = response.data.filter((lib: Library) => {
        return lib.members && lib.members.some((member: any) => member.user?.id === user?.id);
      });
      setLibraries(verifiedLibraries);
    } catch (error) {
      console.error('Error loading libraries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLibrary = async () => {
    setCreating(true);
    try {
      const response = await api.post('/libraries', {
        name: libraryName,
        description: libraryDescription,
      });
      setLibraries([response.data, ...libraries]);
      setCreateDialogOpen(false);
      setLibraryName('');
      setLibraryDescription('');
      setSnackbar({ open: true, message: 'Library created successfully!', severity: 'success' });
      navigate(`/libraries/${response.data.id}`);
    } catch (error: any) {
      console.error('Error creating library:', error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Failed to create library. Please try again.',
        severity: 'error' 
      });
    } finally {
      setCreating(false);
    }
  };

  const handleJoinLibrary = async () => {
    setJoining(true);
    try {
      const response = await api.post('/libraries/join', { code: joinCode.toUpperCase() });
      // Reload the full library list to ensure we have the correct libraries
      await loadLibraries();
      setJoinDialogOpen(false);
      setJoinCode('');
      setSnackbar({ open: true, message: 'Successfully joined library!', severity: 'success' });
      navigate(`/libraries/${response.data.id}`);
    } catch (error: any) {
      console.error('Error joining library:', error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Failed to join library. Please check the code and try again.',
        severity: 'error' 
      });
    } finally {
      setJoining(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar 
        position="sticky" 
        elevation={1}
        sx={{ 
          backgroundColor: '#6F4E37',
        }}
      >
        <Toolbar sx={{ py: 1.5, px: { xs: 2, sm: 3 } }}>
          <LibraryBooksIcon sx={{ mr: 2, fontSize: 28, color: 'white' }} />
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 600,
              color: 'white',
            }}
          >
            PhotoShare
          </Typography>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5, 
              mr: 1,
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 },
            }}
            onClick={() => navigate('/profile')}
          >
            <Avatar 
              src={user?.profilePhoto || undefined}
              sx={{ 
                width: 36, 
                height: 36, 
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                fontSize: 16,
                fontWeight: 600,
                color: 'white',
              }}
            >
              {user?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Typography 
              variant="body2" 
              sx={{ 
                display: { xs: 'none', sm: 'block' },
                fontWeight: 500,
                color: 'white',
              }}
            >
            {user?.username}
          </Typography>
          </Box>
          <IconButton 
            color="inherit" 
            onClick={logout}
            sx={{ 
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
            }}
            aria-label="logout"
          >
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ flex: 1, py: 4, px: { xs: 2, sm: 3 } }}>
        <Paper
          elevation={0}
          sx={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 2,
            p: 3,
            mb: 3,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          }}
        >
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 700,
              mb: 0.5,
              color: '#3E2723',
            }}
          >
          My Libraries
        </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#5D4037',
            }}
          >
            Manage your shared photo libraries
          </Typography>
        </Paper>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress size={60} sx={{ color: '#6F4E37' }} />
          </Box>
        ) : libraries.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              textAlign: 'center',
              py: 8,
              px: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: 2,
              border: '2px dashed rgba(111, 78, 55, 0.2)',
            }}
          >
            <LibraryBooksIcon 
              sx={{ 
                fontSize: 80, 
                color: '#6F4E37',
                opacity: 0.5,
                mb: 2 
              }} 
            />
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 600,
                mb: 1,
                color: '#3E2723',
              }}
            >
              No libraries yet
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}
            >
              Create a new library or join one with a code to get started sharing memories!
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
                sx={{
                  backgroundColor: '#6F4E37',
                  '&:hover': { backgroundColor: '#5A3E2A' },
                  px: 3,
                  py: 1.5,
                }}
              >
                Create Library
              </Button>
              <Button
                variant="outlined"
                startIcon={<PersonAddIcon />}
                onClick={() => setJoinDialogOpen(true)}
                sx={{
                  borderColor: '#6F4E37',
                  color: '#6F4E37',
                  '&:hover': { 
                    borderColor: '#5A3E2A',
                    backgroundColor: 'rgba(111, 78, 55, 0.08)',
                  },
                  px: 3,
                  py: 1.5,
                }}
              >
                Join Library
              </Button>
          </Box>
          </Paper>
        ) : (
          <Grid container spacing={2.5}>
          {libraries.map((library) => (
            <Grid item xs={12} sm={6} md={4} key={library.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid rgba(111, 78, 55, 0.1)',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(111, 78, 55, 0.15)',
                    borderColor: 'rgba(111, 78, 55, 0.3)',
                  },
                }}
              >
                  <CardActionArea
                onClick={() => navigate(`/libraries/${library.id}`)}
                    sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
              >
                    <Box
                      sx={{
                        backgroundColor: '#6F4E37',
                        color: 'white',
                        p: 2.5,
                        minHeight: 120,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box>
                        <Typography 
                          variant="h5" 
                          component="h2"
                          sx={{ 
                            fontWeight: 700,
                            mb: 1,
                            color: 'white',
                            lineHeight: 1.2,
                          }}
                        >
                    {library.name}
                  </Typography>
                  {library.description && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.9)',
                              mt: 1,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                      {library.description}
                    </Typography>
                  )}
                      </Box>
                    </Box>
                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CodeIcon sx={{ fontSize: 18, color: '#6F4E37' }} />
                          <Typography variant="body2" sx={{ color: '#5D4037', fontWeight: 500 }}>
                            Code: <strong style={{ color: '#6F4E37', letterSpacing: 1 }}>{library.code}</strong>
                  </Typography>
                        </Box>
                        <Divider sx={{ borderColor: 'rgba(111, 78, 55, 0.1)' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PeopleIcon sx={{ fontSize: 18, color: '#6F4E37' }} />
                          <Chip
                            label={`${library.members.length} member${library.members.length !== 1 ? 's' : ''}`}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(111, 78, 55, 0.08)',
                              color: '#6F4E37',
                              fontWeight: 500,
                              border: '1px solid rgba(111, 78, 55, 0.15)',
                            }}
                          />
                        </Box>
                      </Box>
                </CardContent>
                  </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
        )}
      </Container>

      {libraries.length > 0 && (
        <Box sx={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Fab
        color="primary"
            aria-label="create library"
        onClick={() => setCreateDialogOpen(true)}
            sx={{
              backgroundColor: '#6F4E37',
              '&:hover': { backgroundColor: '#5A3E2A' },
              boxShadow: 3,
            }}
      >
        <AddIcon />
      </Fab>
      <Fab
        color="secondary"
            aria-label="join library"
        onClick={() => setJoinDialogOpen(true)}
            sx={{
              backgroundColor: '#D4A574',
              '&:hover': { backgroundColor: '#B8935F' },
              boxShadow: 3,
            }}
      >
        <PersonAddIcon />
      </Fab>
        </Box>
      )}

      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600, fontSize: '1.5rem' }}>
          Create New Library
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="normal"
            label="Library Name"
            fullWidth
            variant="outlined"
            value={libraryName}
            onChange={(e) => setLibraryName(e.target.value)}
            sx={{ mb: 2 }}
            required
          />
          <TextField
            margin="normal"
            label="Description (optional)"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={libraryDescription}
            onChange={(e) => setLibraryDescription(e.target.value)}
            placeholder="What is this library for? (e.g., Family vacation, Wedding photos, etc.)"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button 
            onClick={() => setCreateDialogOpen(false)}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateLibrary} 
            disabled={!libraryName.trim() || creating}
            variant="contained"
            sx={{
              backgroundColor: '#6F4E37',
              '&:hover': { backgroundColor: '#5A3E2A' },
              px: 3,
            }}
          >
            {creating ? <CircularProgress size={20} color="inherit" /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={joinDialogOpen} 
        onClose={() => setJoinDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600, fontSize: '1.5rem' }}>
          Join Library
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter the 6-character code shared by the library owner
          </Typography>
          <TextField
            autoFocus
            margin="normal"
            label="Library Code"
            fullWidth
            variant="outlined"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            inputProps={{ 
              maxLength: 6,
              style: { 
                textTransform: 'uppercase',
                fontSize: '1.5rem',
                letterSpacing: 2,
                textAlign: 'center',
                fontWeight: 600,
              }
            }}
            placeholder="ABC123"
            sx={{
              '& .MuiInputBase-input': {
                textTransform: 'uppercase',
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button 
            onClick={() => setJoinDialogOpen(false)}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleJoinLibrary} 
            disabled={!joinCode.trim() || joinCode.length !== 6 || joining}
            variant="contained"
            sx={{
              backgroundColor: '#6F4E37',
              '&:hover': { backgroundColor: '#5A3E2A' },
              px: 3,
            }}
          >
            {joining ? <CircularProgress size={20} color="inherit" /> : 'Join'}
          </Button>
        </DialogActions>
      </Dialog>

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

