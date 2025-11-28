import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  TextField,
  Paper,
  Grid,
  AppBar,
  Toolbar,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  Avatar,
  CircularProgress,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Snackbar,
  Alert,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Divider,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CollectionsIcon from '@mui/icons-material/Collections';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import CommentIcon from '@mui/icons-material/Comment';
import DeleteIcon from '@mui/icons-material/Delete';
import ReplyIcon from '@mui/icons-material/Reply';
import StarIcon from '@mui/icons-material/Star';
import AddIcon from '@mui/icons-material/Add';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PersonIcon from '@mui/icons-material/Person';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import api from '../config/api';
import { useAuth } from '../context/AuthContext';
import { io, Socket } from 'socket.io-client';

interface Photo {
  id: string;
  imageUrl: string;
  description?: string;
  isHighlight?: boolean;
  user: {
    id: string;
    username: string;
    profilePhoto?: string | null;
  };
  createdAt: string;
}

interface Message {
  id: string;
  content: string;
  user: {
    id: string;
    username: string;
    profilePhoto?: string | null;
  };
  recipients?: {
    id: string;
    user: {
      id: string;
      username: string;
      profilePhoto?: string | null;
    };
  }[];
  createdAt: string;
}

interface PhotoComment extends Message {
  photoId?: string;
  replyToId?: string | null;
  replyTo?: {
    id: string;
    user: {
      username: string;
    };
  } | null;
}

const API_URL = import.meta.env.DEV
  ? 'http://localhost:5000'
  : 'https://love-library-a28m.onrender.com';

export default function LibraryDetailPage() {
  const { id: libraryId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'photos' | 'messages' | 'members'>('photos');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [messageFilter, setMessageFilter] = useState<'all' | 'received' | 'sent'>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [uploading, setUploading] = useState(false);
  const [libraryName, setLibraryName] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [photoComments, setPhotoComments] = useState<PhotoComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState<PhotoComment | null>(null);
  const [deletingPhoto, setDeletingPhoto] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const selectedPhotoRef = useRef<Photo | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoDescription, setPhotoDescription] = useState('');
  const [isHighlight, setIsHighlight] = useState(false);
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(false);
  const [welcomeView, setWelcomeView] = useState<'description' | 'highlights'>('description');
  const [libraryDescription, setLibraryDescription] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Photo[]>([]);
  const [loadingHighlights, setLoadingHighlights] = useState(false);
  const [currentHighlightIndex, setCurrentHighlightIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [library, setLibrary] = useState<any>(null);
  const [removingMember, setRemovingMember] = useState<string | null>(null);

  useEffect(() => {
    if (libraryId) {
      loadData();
      setupSocket();
      // Check if we should open messages tab from notification
      if (location.state?.openMessagesTab) {
        setActiveTab('messages');
      }
    }
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [libraryId, location.state]);

  // Reload library data when switching to members or messages tab to get updated member list
  useEffect(() => {
    if ((activeTab === 'members' || activeTab === 'messages') && libraryId) {
      const reloadLibrary = async () => {
        try {
          const libraryRes = await api.get(`/libraries/${libraryId}`);
          setLibrary(libraryRes.data);
        } catch (error) {
          console.error('Error reloading library data:', error);
        }
      };
      reloadLibrary();
    }
  }, [activeTab, libraryId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [photoComments]);

  const setupSocket = () => {
    try {
      // Disconnect existing socket if any
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
      }

      const token = localStorage.getItem('token');
      const newSocket = io(API_URL, {
        auth: { token },
      });

      newSocket.on('connect', () => {
        newSocket.emit('join-library', libraryId);
      });

      newSocket.on('new-message', (message: Message) => {
        setMessages((prev) => {
          // Check if message already exists to prevent duplicates
          const exists = prev.some(m => m.id === message.id);
          if (exists) return prev;
          return [message, ...prev];
        });
      });

      newSocket.on('new-heart-message', (message: Message) => {
        setMessages((prev) => {
          // Check if message already exists to prevent duplicates
          const exists = prev.some(m => m.id === message.id);
          if (exists) return prev;
          return [message, ...prev];
        });
      });

      newSocket.on('new-photo-comment', (data: { photoId: string; comment: PhotoComment }) => {
        // Use ref to get current selectedPhoto value
        if (selectedPhotoRef.current && selectedPhotoRef.current.id === data.photoId) {
          setPhotoComments((prev) => {
            // Check if comment already exists to prevent duplicates
            const exists = prev.some(c => c.id === data.comment.id);
            if (exists) return prev;
            return [...prev, data.comment];
          });
        }
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('Socket setup error:', error);
    }
  };

  const loadData = async () => {
    try {
      const [libraryRes, photosRes, messagesRes] = await Promise.all([
        api.get(`/libraries/${libraryId}`),
        api.get(`/photos/library/${libraryId}`),
        api.get(`/messages/library/${libraryId}`),
      ]);
      setLibrary(libraryRes.data);
      setLibraryName(libraryRes.data.name);
      setLibraryDescription(libraryRes.data.description);
      setPhotos(photosRes.data);
      setMessages(messagesRes.data);
      
      // Load highlights and show welcome modal every time
      loadHighlights();
      setWelcomeModalOpen(true);
      setWelcomeView('description');
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHighlights = async (forceReload = false) => {
    if (highlights.length > 0 && !forceReload) return; // Already loaded
    setLoadingHighlights(true);
    try {
      const response = await api.get(`/photos/library/${libraryId}/highlights`);
      setHighlights(response.data);
    } catch (error) {
      console.error('Error loading highlights:', error);
    } finally {
      setLoadingHighlights(false);
    }
  };

  const handleNextInWelcome = () => {
    if (welcomeView === 'description') {
      loadHighlights();
      setWelcomeView('highlights');
      setCurrentHighlightIndex(0);
    } else {
      handleCloseWelcome();
    }
  };

  const handleCloseWelcome = () => {
    setWelcomeModalOpen(false);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to remove this member from the library?')) {
      return;
    }

    setRemovingMember(memberId);
    try {
      await api.delete(`/libraries/${libraryId}/members/${memberId}`);
      // Reload library data to get updated members list
      const libraryRes = await api.get(`/libraries/${libraryId}`);
      setLibrary(libraryRes.data);
      setSnackbar({ open: true, message: 'Member removed successfully', severity: 'success' });
    } catch (error: any) {
      console.error('Error removing member:', error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Failed to remove member',
        severity: 'error' 
      });
    } finally {
      setRemovingMember(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setSnackbar({ open: true, message: 'File size must be less than 10MB', severity: 'error' });
      e.target.value = '';
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(url);
    setUploadModalOpen(true);
    e.target.value = '';
  };

  const handleCloseUploadModal = () => {
    setUploadModalOpen(false);
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setPhotoDescription('');
    setIsHighlight(false);
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('libraryId', libraryId!);
      if (photoDescription.trim()) {
        formData.append('description', photoDescription.trim());
      }
      formData.append('isHighlight', isHighlight.toString());

      const response = await api.post('/photos', formData);
      setPhotos([response.data, ...photos]);
      setSnackbar({ open: true, message: 'Photo uploaded successfully!', severity: 'success' });
      handleCloseUploadModal();
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Failed to upload photo',
        severity: 'error' 
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || selectedRecipients.length === 0) return;

    try {
      // Use API endpoint for heart messages with recipients
      const response = await api.post(`/messages/library/${libraryId}`, {
        content: messageText,
        recipientIds: selectedRecipients,
      });

      setMessages([response.data, ...messages]);
      setMessageText('');
      setSelectedRecipients([]);
      setShowSendDialog(false);
      setSnackbar({ open: true, message: 'Heart message sent! 💕', severity: 'success' });
    } catch (error: any) {
      console.error('Error sending message:', error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Failed to send message',
        severity: 'error' 
      });
    }
  };

  const handleOpenPhoto = async (photo: Photo) => {
    setSelectedPhoto(photo);
    selectedPhotoRef.current = photo;
    setLoadingComments(true);
    try {
      const response = await api.get(`/messages/photo/${photo.id}`);
      setPhotoComments(response.data);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleClosePhoto = () => {
    setSelectedPhoto(null);
    selectedPhotoRef.current = null;
    setPhotoComments([]);
    setCommentText('');
  };

  const handleSendComment = () => {
    if (!commentText.trim() || !socket || !selectedPhoto) return;

    socket.emit('send-message', {
      libraryId,
      photoId: selectedPhoto.id,
      replyToId: replyingTo?.id || null,
      content: commentText,
    });

    setCommentText('');
    setReplyingTo(null);
  };

  const handleDeletePhoto = async () => {
    if (!selectedPhoto) return;

    if (!window.confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
      return;
    }

    setDeletingPhoto(true);
    try {
      await api.delete(`/photos/${selectedPhoto.id}`);
      setPhotos(photos.filter(p => p.id !== selectedPhoto.id));
      setSnackbar({ open: true, message: 'Photo deleted successfully', severity: 'success' });
      handleClosePhoto();
    } catch (error: any) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Failed to delete photo',
        severity: 'error' 
      });
    } finally {
      setDeletingPhoto(false);
    }
  };

  const handleReply = (comment: PhotoComment) => {
    setReplyingTo(comment);
    // Focus on comment input
    setTimeout(() => {
      const input = document.querySelector('[placeholder="Write a comment..."]') as HTMLInputElement;
      input?.focus();
    }, 100);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky" elevation={0} sx={{ background: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Toolbar sx={{ px: { xs: 1, sm: 2 }, py: 1.5, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
          <IconButton 
            edge="start" 
            color="inherit" 
            onClick={() => navigate('/libraries')}
            sx={{ mr: 1, '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' } }}
          >
            <ArrowBackIcon />
          </IconButton>
          {libraryName && (
            <Typography 
              variant="h5" 
              sx={{ 
                flexGrow: { xs: 0, sm: 1 },
                mr: 2,
                fontWeight: 700,
                color: 'white',
                display: { xs: 'none', sm: 'block' },
                letterSpacing: '-0.5px',
              }}
            >
              {libraryName}
            </Typography>
          )}
          <Tabs
            value={activeTab === 'photos' ? 0 : activeTab === 'messages' ? 1 : 2}
            onChange={(_, v) => {
              if (v === 0) setActiveTab('photos');
              else if (v === 1) setActiveTab('messages');
              else setActiveTab('members');
            }}
            sx={{ flexGrow: { xs: 1, sm: 0 } }}
            textColor="inherit"
            indicatorColor="secondary"
          >
            <Tab label="Photos" />
            <Tab label="Heart Messages" icon={<FavoriteIcon sx={{ fontSize: 18 }} />} iconPosition="start" />
            <Tab label="Members" />
          </Tabs>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ flex: 1, py: 4, px: { xs: 2, sm: 3 } }}>
        {activeTab === 'photos' ? (
          <>
            {photos.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  backgroundColor: '#FFFBFD',
                  borderRadius: 2,
                  p: 3,
                  mb: 3,
                  textAlign: 'center',
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1A1A1A' }}>
                  Photos
                </Typography>
              </Paper>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  backgroundColor: '#FFFBFD',
                  borderRadius: 2,
                  p: 3,
                  mb: 3,
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1A1A1A' }}>
                    Photos
                  </Typography>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<AddIcon />}
                    sx={{
                      backgroundColor: '#E91E63',
                      '&:hover': { backgroundColor: '#C2185B' },
                    }}
                  >
                    Upload a photo
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleFileSelect}
                    />
                  </Button>
                </Box>
              </Paper>
            )}

            {photos.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: 8,
                  textAlign: 'center',
                  backgroundColor: '#FFFBFD',
                  borderRadius: 2,
                }}
              >
                <CollectionsIcon sx={{ fontSize: 80, color: '#E91E63', opacity: 0.5, mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1A1A1A' }}>
                  No photos yet
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Upload one to get started!
                </Typography>
              <Button
                variant="contained"
                component="label"
                startIcon={<PhotoCameraIcon />}
                  sx={{
                    backgroundColor: '#E91E63',
                    '&:hover': { backgroundColor: '#C2185B' },
                  }}
              >
                Upload Photo
                <input
                  type="file"
                  hidden
                  accept="image/*"
                    onChange={handleFileSelect}
                />
              </Button>
              </Paper>
            ) : (
              <>
                <Grid container spacing={2}>
                {photos.map((photo) => (
                  <Grid item xs={6} sm={4} md={3} key={photo.id}>
                    <Card
                      onClick={() => handleOpenPhoto(photo)}
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid rgba(233, 30, 99, 0.1)',
                        transition: 'all 0.2s ease-in-out',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(233, 30, 99, 0.15)',
                        },
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={photo.imageUrl}
                      alt={photo.description || 'Photo'}
                        sx={{
                          width: '100%',
                          height: 200,
                          objectFit: 'cover',
                        }}
                    />
                      <CardContent sx={{ p: 1.5, flex: 1 }}>
                    {photo.description && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              mb: 1,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                          {photo.description}
                        </Typography>
                        )}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar 
                            sx={{ 
                              width: 20, 
                              height: 20, 
                              fontSize: 12,
                              bgcolor: '#E91E63',
                            }}
                          >
                            {photo.user.username.charAt(0).toUpperCase()}
                          </Avatar>
                        <Typography variant="caption" color="text.secondary">
                            {photo.user.username}
                        </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
                </Grid>
              </>
            )}
          </>
        ) : activeTab === 'messages' ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {messages.length === 0 ? (
              <Paper
                elevation={0}
                sx={{
                  p: 6,
                  textAlign: 'center',
                  backgroundColor: '#FFFBFD',
                  borderRadius: 2,
                }}
              >
                <FavoriteBorderIcon sx={{ fontSize: 64, color: '#E91E63', opacity: 0.3, mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1A1A1A' }}>
                  No heart messages yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Send a sweet message to someone special
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<FavoriteIcon />}
                  onClick={() => setShowSendDialog(true)}
                  sx={{
                    backgroundColor: '#E91E63',
                    '&:hover': { backgroundColor: '#C2185B' },
                  }}
                >
                  Send Heart Message
                </Button>
              </Paper>
            ) : (
              <>
                {/* Message Filter Tabs */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 1,
                    backgroundColor: '#FFFBFD',
                    borderRadius: 2,
                    border: '1px solid rgba(233, 30, 99, 0.1)',
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant={messageFilter === 'all' ? 'contained' : 'text'}
                      onClick={() => setMessageFilter('all')}
                      sx={{
                        flex: 1,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        ...(messageFilter === 'all' && {
                          background: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)',
                          color: 'white',
                        }),
                        ...(messageFilter !== 'all' && {
                          color: '#6B6B6B',
                          '&:hover': {
                            backgroundColor: 'rgba(233, 30, 99, 0.08)',
                          },
                        }),
                      }}
                    >
                      All
                    </Button>
                    <Button
                      variant={messageFilter === 'received' ? 'contained' : 'text'}
                      onClick={() => setMessageFilter('received')}
                      sx={{
                        flex: 1,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        ...(messageFilter === 'received' && {
                          background: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)',
                          color: 'white',
                        }),
                        ...(messageFilter !== 'received' && {
                          color: '#6B6B6B',
                          '&:hover': {
                            backgroundColor: 'rgba(233, 30, 99, 0.08)',
                          },
                        }),
                      }}
                    >
                      Received
                    </Button>
                    <Button
                      variant={messageFilter === 'sent' ? 'contained' : 'text'}
                      onClick={() => setMessageFilter('sent')}
                      sx={{
                        flex: 1,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        ...(messageFilter === 'sent' && {
                          background: 'linear-gradient(135deg, #E91E63 0%, #C2185B 100%)',
                          color: 'white',
                        }),
                        ...(messageFilter !== 'sent' && {
                          color: '#6B6B6B',
                          '&:hover': {
                            backgroundColor: 'rgba(233, 30, 99, 0.08)',
                          },
                        }),
                      }}
                    >
                      Sent
                    </Button>
                  </Box>
                </Paper>

                {/* Header with Send Button - Only show when there are messages */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    backgroundColor: '#FFFBFD',
                    borderRadius: 2,
                  }}
                >
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<FavoriteIcon />}
                    onClick={() => setShowSendDialog(true)}
                    sx={{
                      backgroundColor: '#E91E63',
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      fontSize: '1rem',
                      fontWeight: 600,
                      boxShadow: '0 4px 12px rgba(233, 30, 99, 0.3)',
                      '&:hover': {
                        backgroundColor: '#C2185B',
                        boxShadow: '0 6px 16px rgba(233, 30, 99, 0.4)',
                        transform: 'translateY(-2px)',
                      },
                      transition: 'all 0.2s ease',
                      width: '100%',
                    }}
                  >
                    Send Heart Message
                  </Button>
                </Paper>

                {/* Heart Messages Grid */}
                <Grid container spacing={2}>
                  {messages
                    .filter((message) => {
                      if (messageFilter === 'all') return true;
                      if (messageFilter === 'sent') return message.user.id === user?.id;
                      if (messageFilter === 'received') return message.user.id !== user?.id;
                      return true;
                    })
                    .map((message) => {
                    const recipientNames = message.recipients?.map(r => r.user.username).join(', ') || '';
                    
                    return (
                    <Grid item xs={12} sm={6} md={4} key={message.id}>
                      <Card
                        onClick={() => {
                          setSelectedMessage(message);
                          setShowMessageModal(true);
                        }}
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 3,
                          overflow: 'hidden',
                          border: '2px solid',
                          borderColor: 'rgba(233, 30, 99, 0.2)',
                          background: '#FFFBFD',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 24px rgba(233, 30, 99, 0.2)',
                            borderColor: '#E91E63',
                          },
                        }}
                      >
                        <Box
                          sx={{
                            p: 2.5,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.5,
                          }}
                        >
                          {/* Header */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              src={message.user.profilePhoto || undefined}
                              sx={{
                                width: 40,
                                height: 40,
                                bgcolor: '#E91E63',
                                fontSize: 16,
                              }}
                            >
                              {message.user.username.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1A1A1A' }}>
                                {message.user.username}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(message.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                            <FavoriteIcon sx={{ color: '#E91E63', fontSize: 24, opacity: 0.6 }} />
                          </Box>

                          {/* Message Preview */}
                          <Box
                            sx={{
                              minHeight: 60,
                              maxHeight: 60,
                              overflow: 'hidden',
                            }}
                          >
                            <Typography
                              variant="body1"
                              sx={{
                                color: '#1A1A1A',
                                lineHeight: 1.6,
                                wordBreak: 'break-word',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {message.content}
                            </Typography>
                          </Box>

                          {/* Recipients */}
                          {message.recipients && message.recipients.length > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <PersonIcon sx={{ fontSize: 16, color: '#E91E63', opacity: 0.7 }} />
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                                To: {recipientNames}
                              </Typography>
                            </Box>
                          )}

                          {/* Click hint */}
                          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic', mt: 0.5 }}>
                            Click to read full message
                          </Typography>
                        </Box>
                      </Card>
                    </Grid>
                  );
                  })}
                </Grid>
              </>
            )}

            {/* View Heart Message Modal */}
            <Dialog
              open={showMessageModal}
              onClose={() => {
                setShowMessageModal(false);
                setSelectedMessage(null);
              }}
              maxWidth="sm"
              fullWidth
              PaperProps={{
                sx: {
                  borderRadius: 3,
                  backgroundColor: '#FFFBFD',
                }
              }}
            >
              {selectedMessage && (
                <>
                  <DialogTitle sx={{ pb: 2, borderBottom: '1px solid rgba(233, 30, 99, 0.1)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        src={selectedMessage.user.profilePhoto || undefined}
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: '#E91E63',
                          fontSize: 20,
                        }}
                      >
                        {selectedMessage.user.username.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1A1A1A' }}>
                          {selectedMessage.user.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(selectedMessage.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                      </Box>
                      <FavoriteIcon sx={{ color: '#E91E63', fontSize: 28 }} />
                    </Box>
                  </DialogTitle>
                  <DialogContent sx={{ pt: 3, pb: 2 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        color: '#1A1A1A',
                        lineHeight: 1.8,
                        wordBreak: 'break-word',
                        whiteSpace: 'pre-wrap',
                        mb: 2,
                      }}
                    >
                      {selectedMessage.content}
                    </Typography>
                    {selectedMessage.recipients && selectedMessage.recipients.length > 0 && (
                      <Box sx={{ 
                        mt: 2, 
                        pt: 2, 
                        borderTop: '1px solid rgba(233, 30, 99, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                      }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#E91E63', mb: 1 }}>
                          Recipients:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {selectedMessage.recipients.map((recipient) => (
                            <Chip
                              key={recipient.user.id}
                              avatar={
                                <Avatar
                                  src={recipient.user.profilePhoto || undefined}
                                  sx={{ width: 24, height: 24, bgcolor: '#E91E63', fontSize: 12 }}
                                >
                                  {recipient.user.username.charAt(0).toUpperCase()}
                                </Avatar>
                              }
                              label={recipient.user.username}
                              size="small"
                              sx={{
                                backgroundColor: 'rgba(233, 30, 99, 0.1)',
                                color: '#E91E63',
                                border: '1px solid rgba(233, 30, 99, 0.2)',
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </DialogContent>
                  <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button
                      onClick={() => {
                        setShowMessageModal(false);
                        setSelectedMessage(null);
                      }}
                      variant="outlined"
                      sx={{
                        borderColor: '#E91E63',
                        color: '#E91E63',
                        '&:hover': {
                          borderColor: '#C2185B',
                          backgroundColor: 'rgba(233, 30, 99, 0.08)',
                        },
                      }}
                    >
                      Close
                    </Button>
                  </DialogActions>
                </>
              )}
            </Dialog>

            {/* Send Heart Message Dialog */}
            <Dialog
              open={showSendDialog}
              onClose={() => {
                setShowSendDialog(false);
                setMessageText('');
                setSelectedRecipients([]);
              }}
              TransitionProps={{
                onEnter: () => {
                  // Ensure library data is loaded when dialog opens
                  if (!library || !library.members) {
                    const reloadLibrary = async () => {
                      try {
                        const libraryRes = await api.get(`/libraries/${libraryId}`);
                        setLibrary(libraryRes.data);
                      } catch (error) {
                        console.error('Error loading library data:', error);
                      }
                    };
                    reloadLibrary();
                  }
                }
              }}
              maxWidth="sm"
              fullWidth
              PaperProps={{
                sx: {
                  borderRadius: 3,
                }
              }}
            >
              <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FavoriteIcon sx={{ color: '#E91E63', opacity: 0.6 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Send Heart Message
                  </Typography>
                </Box>
                <IconButton onClick={() => {
                  setShowSendDialog(false);
                  setMessageText('');
                  setSelectedRecipients([]);
                }} size="small">
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
                  {/* Recipient Selection */}
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#1A1A1A' }}>
                      Choose Recipients
                    </Typography>
                    {library && library.members && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {library.members
                          .filter((member: any) => member.user.id !== user?.id)
                          .map((member: any) => (
                            <FormControlLabel
                              key={member.user.id}
                              control={
                                <Checkbox
                                  checked={selectedRecipients.includes(member.user.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedRecipients([...selectedRecipients, member.user.id]);
                                    } else {
                                      setSelectedRecipients(selectedRecipients.filter(id => id !== member.user.id));
                                    }
                                  }}
                                  sx={{
                                    color: '#E91E63',
                                    '&.Mui-checked': {
                                      color: '#E91E63',
                                    },
                                  }}
                                />
                              }
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar
                                    src={member.user.profilePhoto || undefined}
                                    sx={{ width: 24, height: 24, bgcolor: '#E91E63', fontSize: 12 }}
                                  >
                                    {member.user.username.charAt(0).toUpperCase()}
                                  </Avatar>
                                  <Typography variant="body2">{member.user.username}</Typography>
                                </Box>
                              }
                            />
                          ))}
                      </Box>
                    )}
                  </Box>

                  {/* Message Input */}
                  <TextField
                    label="Your Heart Message"
                    fullWidth
                    multiline
                    rows={4}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Write something sweet..."
                    variant="outlined"
                    inputProps={{ maxLength: 1000 }}
                    helperText={`${messageText.length}/1000 characters`}
                  />
                </Box>
              </DialogContent>
              <DialogActions sx={{ p: 3, pt: 2 }}>
                <Button
                  onClick={() => {
                    setShowSendDialog(false);
                    setMessageText('');
                    setSelectedRecipients([]);
                  }}
                  sx={{ color: 'text.secondary' }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendMessage}
                  variant="contained"
                  disabled={!messageText.trim() || selectedRecipients.length === 0}
                  startIcon={<FavoriteIcon />}
                  sx={{
                    backgroundColor: '#E91E63',
                    '&:hover': { backgroundColor: '#C2185B' },
                    px: 3,
                  }}
                >
                  Send
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        ) : activeTab === 'members' ? (
          <Paper
            elevation={0}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: 2,
              p: 3,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1A1A1A', mb: 3 }}>
              Library Members
            </Typography>
            {library && library.members && library.members.length > 0 ? (
              <List>
                {library.members.map((member: any) => {
                  const isOwner = member.role === 'owner';
                  const isCurrentUser = member.user.id === user?.id;
                  const canRemove = library.createdBy === user?.id && !isOwner && !isCurrentUser;
                  
                  return (
                    <ListItem
                      key={member.id}
                      sx={{
                        border: '1px solid rgba(233, 30, 99, 0.1)',
                        borderRadius: 2,
                        mb: 2,
                        bgcolor: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(233, 30, 99, 0.02)',
                        },
                      }}
                      secondaryAction={
                        canRemove ? (
                          <IconButton
                            edge="end"
                            onClick={() => handleRemoveMember(member.user.id)}
                            disabled={removingMember === member.user.id}
                            sx={{
                              color: '#d32f2f',
                              '&:hover': {
                                bgcolor: 'rgba(211, 47, 47, 0.08)',
                              },
                            }}
                          >
                            {removingMember === member.user.id ? (
                              <CircularProgress size={20} />
                            ) : (
                              <DeleteIcon />
                            )}
                          </IconButton>
                        ) : null
                      }
                    >
                      <Avatar
                        sx={{
                          bgcolor: '#E91E63',
                          mr: 2,
                          width: 48,
                          height: 48,
                        }}
                        src={member.user.profilePhoto || undefined}
                      >
                        {member.user.username?.charAt(0).toUpperCase() || 'U'}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#1A1A1A' }}>
                          {member.user.username}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {member.user.email}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip
                            label={isOwner ? 'Owner' : 'Member'}
                            size="small"
                            sx={{
                              bgcolor: isOwner ? '#E91E63' : 'rgba(233, 30, 99, 0.1)',
                              color: isOwner ? 'white' : '#E91E63',
                              fontWeight: 500,
                              height: 20,
                              fontSize: '0.7rem',
                            }}
                          />
                          {isCurrentUser && (
                            <Chip
                              label="You"
                              size="small"
                              sx={{
                                bgcolor: 'rgba(233, 30, 99, 0.15)',
                                color: '#E91E63',
                                fontWeight: 500,
                                height: 20,
                                fontSize: '0.7rem',
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No members found
                </Typography>
              </Box>
            )}
          </Paper>
        ) : null}
      </Container>

      {/* Upload Photo Modal */}
      <Dialog
        open={uploadModalOpen}
        onClose={handleCloseUploadModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Upload Photo
          </Typography>
          <IconButton onClick={handleCloseUploadModal} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Photo Preview */}
            {previewUrl && (
              <Box
                sx={{
                  width: '100%',
                  maxHeight: 400,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#f5f5f5',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid rgba(0,0,0,0.1)',
                }}
              >
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 400,
                    objectFit: 'contain',
                  }}
                />
              </Box>
            )}

            {/* Caption Field */}
            <TextField
              label="Caption (optional)"
              fullWidth
              multiline
              rows={3}
              value={photoDescription}
              onChange={(e) => setPhotoDescription(e.target.value)}
              placeholder="Add a caption to your photo..."
              variant="outlined"
            />

            {/* Highlights Checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={isHighlight}
                  onChange={(e) => setIsHighlight(e.target.checked)}
                  icon={<StarIcon sx={{ color: 'rgba(233, 30, 99, 0.3)' }} />}
                  checkedIcon={<StarIcon sx={{ color: '#D4AF37' }} />}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Make this a highlight
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Highlights appear prominently in your library
                  </Typography>
                </Box>
              }
            />
          </Box>
        </DialogContent>
        <Box sx={{ px: 3, pb: 2.5, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            onClick={handleCloseUploadModal}
            sx={{ color: 'text.secondary' }}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmUpload}
            variant="contained"
            disabled={uploading || !selectedFile}
            sx={{
              backgroundColor: '#E91E63',
              '&:hover': { backgroundColor: '#C2185B' },
              px: 3,
            }}
          >
            {uploading ? (
              <>
                <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                Uploading...
              </>
            ) : (
              'Upload'
            )}
          </Button>
        </Box>
      </Dialog>

      {/* Photo Detail Modal */}
      <Dialog
        open={!!selectedPhoto}
        onClose={handleClosePhoto}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
          }
        }}
      >
        {selectedPhoto && (
          <>
            <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  src={selectedPhoto.user.profilePhoto || undefined}
                  sx={{ width: 32, height: 32, bgcolor: '#E91E63', fontSize: 14 }}
                >
                  {selectedPhoto.user.username.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {selectedPhoto.user.username}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {selectedPhoto.user.id === user?.id && (
                  <IconButton 
                    onClick={handleDeletePhoto} 
                    size="small"
                    disabled={deletingPhoto}
                    sx={{ 
                      color: 'error.main',
                      '&:hover': { backgroundColor: 'error.light', color: 'error.dark' }
                    }}
                  >
                    {deletingPhoto ? <CircularProgress size={20} /> : <DeleteIcon />}
                  </IconButton>
                )}
                <IconButton onClick={handleClosePhoto} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 0, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, maxHeight: '70vh' }}>
              <Box
                sx={{
                  width: { xs: '100%', md: '60%' },
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    height: { xs: 300, md: 'auto' },
                    minHeight: { md: 400 },
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#000',
                  }}
                >
                  <img
                    src={selectedPhoto.imageUrl}
                    alt={selectedPhoto.description || 'Photo'}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                    }}
                  />
                </Box>
                {selectedPhoto.description && (
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: '#fff',
                      borderTop: { md: '1px solid rgba(0,0,0,0.12)' },
                      borderRight: { md: '1px solid rgba(0,0,0,0.12)' },
                    }}
                  >
                    <Typography variant="body1" sx={{ color: '#1A1A1A', lineHeight: 1.6 }}>
                      {selectedPhoto.description}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Box
                sx={{
                  width: { xs: '100%', md: '40%' },
                  display: 'flex',
                  flexDirection: 'column',
                  borderLeft: { md: '1px solid rgba(0,0,0,0.12)' },
                  borderTop: { xs: '1px solid rgba(0,0,0,0.12)', md: 'none' },
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    overflow: 'auto',
                    p: 2,
                    minHeight: 200,
                    maxHeight: { xs: 300, md: 'calc(70vh - 120px)' },
                  }}
                >
                  {loadingComments ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress size={30} />
                    </Box>
                  ) : photoComments.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CommentIcon sx={{ fontSize: 48, color: 'rgba(233, 30, 99, 0.3)', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        No comments yet. Be the first to comment!
                      </Typography>
                    </Box>
                  ) : (
                    <List sx={{ py: 0 }}>
                      {photoComments.map((comment) => {
                        const isOwnComment = comment.user.id === user?.id;
                        return (
                          <ListItem key={comment.id} sx={{ px: 0, py: 1.5 }}>
                            <Box sx={{ width: '100%' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Avatar
                                  src={comment.user.profilePhoto || undefined}
                                  sx={{ width: 24, height: 24, bgcolor: '#E91E63', fontSize: 12 }}
                                >
                                  {comment.user.username.charAt(0).toUpperCase()}
                                </Avatar>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                  {comment.user.username}
                                </Typography>
                                {comment.replyTo && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <ReplyIcon sx={{ fontSize: 12 }} />
                                    {comment.replyTo.user.username}
                                  </Typography>
                                )}
                              </Box>
                              {comment.replyTo && (
                                <Box
                                  sx={{
                                    ml: 4,
                                    mb: 0.5,
                                    pl: 1.5,
                                    borderLeft: '2px solid rgba(233, 30, 99, 0.2)',
                                  }}
                                >
                                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                    {comment.replyTo.content}
                                  </Typography>
                                </Box>
                              )}
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                <Typography variant="body2" sx={{ pl: 4, flex: 1 }}>
                                  {comment.content}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => handleReply(comment)}
                                  sx={{ 
                                    p: 0.5,
                                    color: 'text.secondary',
                                    '&:hover': { color: '#E91E63' }
                                  }}
                                >
                                  <ReplyIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Box>
                            </Box>
                          </ListItem>
                        );
                      })}
                      <div ref={commentsEndRef} />
                    </List>
                  )}
                </Box>
                <Divider />
                <Box sx={{ p: 2 }}>
                  {replyingTo && (
                    <Box
                      sx={{
                        mb: 1,
                        p: 1,
                        bgcolor: 'rgba(233, 30, 99, 0.08)',
                        borderRadius: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ReplyIcon sx={{ fontSize: 16, color: '#E91E63' }} />
                        <Typography variant="caption" color="text.secondary">
                          Replying to <strong>{replyingTo.user.username}</strong>
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={handleCancelReply} sx={{ p: 0.5 }}>
                        <CloseIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder={replyingTo ? `Reply to ${replyingTo.user.username}...` : "Write a comment..."}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendComment();
                        }
                      }}
                      multiline
                      maxRows={3}
                    />
                    <IconButton
                      color="primary"
                      onClick={handleSendComment}
                      disabled={!commentText.trim() || !socket}
                      sx={{
                        backgroundColor: '#E91E63',
                        color: 'white',
                        '&:hover': { backgroundColor: '#C2185B' },
                        '&.Mui-disabled': {
                          backgroundColor: 'rgba(233, 30, 99, 0.3)',
                          color: 'rgba(255, 255, 255, 0.5)',
                        },
                      }}
                    >
                      <SendIcon />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            </DialogContent>
          </>
        )}
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

      {/* Welcome Modal */}
      <Dialog
        open={welcomeModalOpen}
        onClose={() => {}} // Prevent closing by clicking outside
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh',
            overflow: 'hidden',
          }
        }}
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
          }
        }}
      >
        {welcomeView === 'description' ? (
          <>
            <Box
              sx={{
                background: 'linear-gradient(135deg, #E91E63 0%, #E91E63 100%)',
                p: 4,
                textAlign: 'center',
                color: 'white',
              }}
            >
              <LibraryBooksIcon 
                sx={{ 
                  fontSize: 64, 
                  mb: 2,
                  opacity: 0.9,
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                }} 
              />
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 1,
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              >
                Welcome to my library
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  opacity: 0.95,
                  fontSize: '0.95rem',
                }}
              >
                Let's get you started
              </Typography>
            </Box>
            <DialogContent sx={{ p: 4, pt: 4 }}>
              <Box sx={{ textAlign: 'center', py: 3 }}>
                {libraryDescription ? (
                  <>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: '#1A1A1A', 
                        lineHeight: 2,
                        fontSize: '1.15rem',
                        mb: 3,
                        px: 2,
                      }}
                    >
                      {libraryDescription}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 1,
                        mt: 2,
                      }}
                    >
                      {[1, 2, 3].map((i) => (
                        <Box
                          key={i}
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: '#E91E63',
                            opacity: 0.3,
                          }}
                        />
                      ))}
                    </Box>
                  </>
                ) : (
                  <Box sx={{ py: 2 }}>
                    <LibraryBooksIcon 
                      sx={{ 
                        fontSize: 48, 
                        color: '#E91E63', 
                        opacity: 0.2, 
                        mb: 2 
                      }} 
                    />
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: 'text.secondary', 
                        fontStyle: 'italic',
                        fontSize: '1rem',
                      }}
                    >
                      No description available for this library.
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0, justifyContent: 'flex-end' }}>
              <Button
                onClick={handleNextInWelcome}
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  backgroundColor: '#E91E63',
                  color: 'white',
                  px: 4,
                  py: 1.2,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(233, 30, 99, 0.3)',
                  '&:hover': { 
                    backgroundColor: '#C2185B',
                    boxShadow: '0 6px 16px rgba(233, 30, 99, 0.4)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Next
              </Button>
            </DialogActions>
          </>
        ) : (
          <>
            <Box
              sx={{
                background: 'linear-gradient(135deg, #E91E63 0%, #E91E63 100%)',
                p: 3,
                textAlign: 'center',
                color: 'white',
              }}
            >
              <StarIcon 
                sx={{ 
                  fontSize: 48, 
                  mb: 1.5,
                  opacity: 0.95,
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                }} 
              />
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700,
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }}
              >
                Highlights
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  opacity: 0.9,
                  mt: 0.5,
                }}
              >
                Featured moments from this library
              </Typography>
            </Box>
            <DialogContent sx={{ p: 0, maxHeight: '70vh', overflow: 'hidden', position: 'relative' }}>
              {loadingHighlights ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress sx={{ color: '#E91E63' }} />
                </Box>
              ) : highlights.length > 0 ? (
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    minHeight: '400px',
                    overflow: 'hidden',
                  }}
                  onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
                  onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
                  onTouchEnd={() => {
                    if (!touchStart || !touchEnd) return;
                    const distance = touchStart - touchEnd;
                    const isLeftSwipe = distance > 50;
                    const isRightSwipe = distance < -50;
                    
                    if (isLeftSwipe && currentHighlightIndex < highlights.length - 1) {
                      setCurrentHighlightIndex(currentHighlightIndex + 1);
                    }
                    if (isRightSwipe && currentHighlightIndex > 0) {
                      setCurrentHighlightIndex(currentHighlightIndex - 1);
                    }
                    
                    setTouchStart(null);
                    setTouchEnd(null);
                  }}
                >
                  {/* Slideshow Container */}
                  <Box
                    sx={{
                      display: 'flex',
                      transition: 'transform 0.3s ease-in-out',
                      transform: `translateX(-${currentHighlightIndex * 100}%)`,
                      height: '100%',
                    }}
                  >
                    {highlights.map((photo, index) => (
                      <Box
                        key={photo.id}
                        sx={{
                          minWidth: '100%',
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          position: 'relative',
                        }}
                      >
                        {/* Image */}
                        <Box
                          sx={{
                            position: 'relative',
                            width: '100%',
                            flex: 1,
                            minHeight: '300px',
                            maxHeight: '500px',
                            cursor: 'pointer',
                            overflow: 'hidden',
                          }}
                          onClick={() => {
                            handleCloseWelcome();
                            setTimeout(() => handleOpenPhoto(photo), 300);
                          }}
                        >
                          <Box
                            component="img"
                            src={photo.imageUrl}
                            alt={photo.description || 'Highlight'}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              backgroundColor: '#000',
                            }}
                          />
                          {/* Star Badge */}
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 16,
                              right: 16,
                              bgcolor: 'rgba(233, 30, 99, 0.9)',
                              borderRadius: '50%',
                              p: 1,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            }}
                          >
                            <StarIcon sx={{ fontSize: 20, color: 'white' }} />
                          </Box>
                          {/* Photo Counter */}
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 16,
                              left: 16,
                              bgcolor: 'rgba(0, 0, 0, 0.6)',
                              borderRadius: 2,
                              px: 1.5,
                              py: 0.5,
                              backdropFilter: 'blur(8px)',
                            }}
                          >
                            <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                              {index + 1} / {highlights.length}
                            </Typography>
                          </Box>
                        </Box>
                        
                        {/* Caption */}
                        {photo.description && (
                          <Box
                            sx={{
                              p: 3,
                              backgroundColor: '#FFFBFD',
                              borderTop: '1px solid rgba(233, 30, 99, 0.1)',
                            }}
                          >
                            <Typography
                              variant="body1"
                              sx={{
                                color: '#1A1A1A',
                                lineHeight: 1.6,
                                textAlign: 'center',
                                fontWeight: 500,
                              }}
                            >
                              {photo.description}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>

                  {/* Navigation Arrows */}
                  {highlights.length > 1 && (
                    <>
                      <IconButton
                        onClick={() => setCurrentHighlightIndex(Math.max(0, currentHighlightIndex - 1))}
                        disabled={currentHighlightIndex === 0}
                        sx={{
                          position: 'absolute',
                          left: 16,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          color: '#E91E63',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 1)',
                          },
                          '&.Mui-disabled': {
                            opacity: 0.3,
                          },
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                          zIndex: 10,
                        }}
                      >
                        <ChevronLeftIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => setCurrentHighlightIndex(Math.min(highlights.length - 1, currentHighlightIndex + 1))}
                        disabled={currentHighlightIndex === highlights.length - 1}
                        sx={{
                          position: 'absolute',
                          right: 16,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          color: '#E91E63',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 1)',
                          },
                          '&.Mui-disabled': {
                            opacity: 0.3,
                          },
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                          zIndex: 10,
                        }}
                      >
                        <ChevronRightIcon />
                      </IconButton>
                    </>
                  )}

                  {/* Dots Indicator */}
                  {highlights.length > 1 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 16,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: 1,
                        zIndex: 10,
                      }}
                    >
                      {highlights.map((_, index) => (
                        <Box
                          key={index}
                          onClick={() => setCurrentHighlightIndex(index)}
                          sx={{
                            width: currentHighlightIndex === index ? 24 : 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: currentHighlightIndex === index ? '#E91E63' : 'rgba(255, 255, 255, 0.5)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                          }}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <StarIcon 
                    sx={{ 
                      fontSize: 72, 
                      color: '#E91E63', 
                      opacity: 0.15, 
                      mb: 2 
                    }} 
                  />
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                    sx={{ fontSize: '1rem' }}
                  >
                    No highlights yet
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ mt: 1, fontSize: '0.875rem', opacity: 0.7 }}
                  >
                    Highlights will appear here when added
                  </Typography>
          </Box>
        )}
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 2, justifyContent: 'flex-end' }}>
              <Button
                onClick={handleCloseWelcome}
                variant="contained"
                startIcon={<CheckCircleIcon />}
                sx={{
                  backgroundColor: '#E91E63',
                  color: 'white',
                  px: 4,
                  py: 1.2,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  boxShadow: '0 4px 12px rgba(233, 30, 99, 0.3)',
                  '&:hover': { 
                    backgroundColor: '#C2185B',
                    boxShadow: '0 6px 16px rgba(233, 30, 99, 0.4)',
                    transform: 'translateY(-1px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                Got it
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

    </Box>
  );
}

