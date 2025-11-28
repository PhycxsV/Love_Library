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
import NotificationsIcon from '@mui/icons-material/Notifications';
import FavoriteIcon from '@mui/icons-material/Favorite';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { io, Socket } from 'socket.io-client';
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
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    message: string;
    sender: string;
    libraryId: string;
    libraryName: string;
    createdAt: string;
  }>>([]);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);

  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const API_URL = import.meta.env.PROD
    ? 'https://love-library-a28m.onrender.com'
    : 'http://localhost:5000';

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
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user]);

  const setupSocket = () => {
    try {
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }

      const token = localStorage.getItem('token');
      if (!token) return;

      const newSocket = io(API_URL, {
        auth: { token },
      });

      newSocket.on('connect', () => {
        console.log('Connected to socket for notifications');
        // Join all library rooms the user is a member of
        if (libraries.length > 0) {
          libraries.forEach((lib) => {
            newSocket.emit('join-library', lib.id);
          });
        }
      });

      newSocket.on('new-heart-message', (message: any) => {
        // Check if current user is a recipient
        const isRecipient = message.recipients?.some((r: any) => r.user.id === user?.id);
        if (isRecipient && message.user.id !== user?.id) {
          // Find the library name
          const library = libraries.find((lib) => lib.id === message.libraryId);
          const libraryName = library?.name || 'Unknown Library';
          
          // Add notification
          setNotifications((prev) => [
            {
              id: message.id,
              message: message.content.substring(0, 50) + (message.content.length > 50 ? '...' : ''),
              sender: message.user.username,
              libraryId: message.libraryId,
              libraryName,
              createdAt: message.createdAt,
            },
            ...prev,
          ]);

          // Show snackbar notification
          setSnackbar({
            open: true,
            message: `💕 New heart message from ${message.user.username} in ${libraryName}`,
            severity: 'success',
          });
        }
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('Socket setup error:', error);
    }
  };

  // Update socket when libraries change
  useEffect(() => {
    if (socket && libraries.length > 0) {
      libraries.forEach((lib) => {
        socket.emit('join-library', lib.id);
      });
    }
  }, [libraries, socket]);

  // Setup socket after libraries are loaded
  useEffect(() => {
    if (user && libraries.length > 0 && !socket) {
      setupSocket();
    }
  }, [libraries, user]);

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
        elevation={0}
        sx={{ 
          background: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Toolbar sx={{ py: 2, px: { xs: 2, sm: 3 } }}>
          <LibraryBooksIcon sx={{ mr: 2, fontSize: 32, color: 'white' }} />
          <Typography 
            variant="h5" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 700,
              color: 'white',
              letterSpacing: '-0.5px',
            }}
          >
            Love Library
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
            onClick={(e) => setNotificationAnchor(e.currentTarget)}
            sx={{
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
              mr: 1,
            }}
            aria-label="notifications"
          >
            <Badge badgeContent={notifications.length} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <Menu
            anchorEl={notificationAnchor}
            open={Boolean(notificationAnchor)}
            onClose={() => setNotificationAnchor(null)}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 320,
                maxHeight: 400,
                borderRadius: 2,
                backgroundColor: '#FFFBFD',
                overflow: 'auto',
              },
            }}
          >
            {notifications.length === 0 ? (
              <MenuItem disabled>
                <ListItemText primary="No new notifications" secondary="You're all caught up!" />
              </MenuItem>
            ) : (
              <>
                <MenuItem
                  onClick={() => {
                    setNotifications([]);
                    setNotificationAnchor(null);
                  }}
                  sx={{ justifyContent: 'center', borderBottom: '1px solid rgba(0,0,0,0.1)', py: 1 }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Clear all
                  </Typography>
                </MenuItem>
                {notifications.map((notification) => (
                  <MenuItem
                    key={notification.id}
                    onClick={() => {
                      setNotificationAnchor(null);
                      navigate(`/libraries/${notification.libraryId}`, { state: { openMessagesTab: true } });
                      // Remove this notification
                      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
                    }}
                    sx={{
                      py: 1.5,
                      borderBottom: '1px solid rgba(0,0,0,0.05)',
                      '&:hover': {
                        backgroundColor: 'rgba(233, 30, 99, 0.08)',
                      },
                    }}
                  >
                    <ListItemIcon>
                      <FavoriteIcon sx={{ color: '#E91E63', fontSize: 24 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1A1A1A' }}>
                          {notification.sender}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            {notification.libraryName}
                          </Typography>
                        </Box>
                      }
                    />
                  </MenuItem>
                ))}
              </>
            )}
          </Menu>
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

      <Container maxWidth="lg" sx={{ flex: 1, py: { xs: 3, sm: 4, md: 5 }, px: { xs: 2, sm: 3 } }}>
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h3" 
            component="h1" 
            sx={{ 
              fontWeight: 700,
              mb: 1,
              color: '#1A1A1A',
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
            }}
          >
            My Libraries
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#6B6B6B',
              fontSize: { xs: '0.875rem', sm: '1rem' },
            }}
          >
            Create and manage your shared photo libraries
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress size={60} sx={{ color: '#E91E63' }} />
          </Box>
        ) : libraries.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              textAlign: 'center',
              py: { xs: 6, sm: 8 },
              px: 4,
              backgroundColor: '#FFFFFF',
              borderRadius: 3,
              border: '2px dashed rgba(139, 111, 71, 0.2)',
              boxShadow: '0px 4px 16px rgba(0,0,0,0.08)',
            }}
          >
            <LibraryBooksIcon 
              sx={{ 
                fontSize: { xs: 64, sm: 80 }, 
                color: '#E91E63',
                opacity: 0.4,
                mb: 2 
              }} 
            />
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 600,
                mb: 1,
                color: '#1A1A1A',
              }}
            >
              No libraries yet
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#6B6B6B',
                mb: 4, 
                maxWidth: 400, 
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              Create a new library or join one with a code to get started sharing memories!
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                }}
              >
                Create Library
              </Button>
              <Button
                variant="outlined"
                startIcon={<PersonAddIcon />}
                onClick={() => setJoinDialogOpen(true)}
                size="large"
                sx={{
                  borderColor: '#E91E63',
                  color: '#E91E63',
                  '&:hover': { 
                    borderColor: '#C2185B',
                    backgroundColor: 'rgba(233, 30, 99, 0.08)',
                    borderWidth: 2,
                  },
                  px: 4,
                  py: 1.5,
                }}
              >
                Join Library
              </Button>
          </Box>
          </Paper>
        ) : (
          <Grid container spacing={3}>
          {libraries.map((library) => (
            <Grid item xs={12} sm={6} md={4} key={library.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#FFFBFD',
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0px 12px 32px rgba(139, 111, 71, 0.2)',
                    borderColor: 'rgba(139, 111, 71, 0.3)',
                  },
                }}
                onClick={() => navigate(`/libraries/${library.id}`)}
              >
                    <Box
                      sx={{
                        background: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)',
                        color: 'white',
                        p: 3,
                        minHeight: { xs: 100, sm: 120 },
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
                            fontSize: { xs: '1.25rem', sm: '1.5rem' },
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
                              lineHeight: 1.5,
                            }}
                          >
                      {library.description}
                    </Typography>
                  )}
                      </Box>
                    </Box>
                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <CodeIcon sx={{ fontSize: 20, color: '#E91E63' }} />
                          <Typography variant="body2" sx={{ color: '#6B6B6B', fontWeight: 500 }}>
                            Code: <strong style={{ color: '#E91E63', letterSpacing: 1, fontSize: '1.1em' }}>{library.code}</strong>
                  </Typography>
                        </Box>
                        <Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.06)' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <PeopleIcon sx={{ fontSize: 20, color: '#E91E63' }} />
                          <Chip
                            label={`${library.members.length} member${library.members.length !== 1 ? 's' : ''}`}
                            size="small"
                            sx={{
                              backgroundColor: 'rgba(233, 30, 99, 0.1)',
                              color: '#E91E63',
                              fontWeight: 600,
                              border: '1px solid rgba(233, 30, 99, 0.2)',
                              height: 28,
                            }}
                          />
                        </Box>
                      </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        )}
      </Container>

      {libraries.length > 0 && (
        <Box sx={{ position: 'fixed', bottom: { xs: 16, sm: 24 }, right: { xs: 16, sm: 24 }, display: 'flex', flexDirection: 'column', gap: 2, zIndex: 1000 }}>
      <Fab
        color="primary"
            aria-label="create library"
        onClick={() => setCreateDialogOpen(true)}
            size="large"
            sx={{
              background: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)',
              '&:hover': { 
                background: 'linear-gradient(135deg, #F06292 0%, #E91E63 100%)',
                transform: 'scale(1.05)',
              },
              boxShadow: '0px 8px 24px rgba(233, 30, 99, 0.4)',
              transition: 'all 0.3s ease',
            }}
      >
        <AddIcon />
      </Fab>
      <Fab
        color="secondary"
            aria-label="join library"
        onClick={() => setJoinDialogOpen(true)}
            size="large"
            sx={{
              background: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)',
              '&:hover': { 
                background: 'linear-gradient(135deg, #F06292 0%, #E91E63 100%)',
                transform: 'scale(1.05)',
              },
              boxShadow: '0px 8px 24px rgba(233, 30, 99, 0.4)',
              transition: 'all 0.3s ease',
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
        <DialogTitle sx={{ pb: 2, fontWeight: 700, fontSize: '1.5rem', color: '#1A1A1A' }}>
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
            size="large"
            sx={{
              px: 4,
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
        <DialogTitle sx={{ pb: 2, fontWeight: 700, fontSize: '1.5rem', color: '#1A1A1A' }}>
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
            size="large"
            sx={{
              px: 4,
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

