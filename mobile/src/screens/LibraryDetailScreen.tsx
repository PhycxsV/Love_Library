import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Image, KeyboardAvoidingView, Platform, ImageBackground, Alert } from 'react-native';
import { TextInput, Button, Text, Card, FAB, IconButton } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import api from '../config/api';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

interface Photo {
  id: string;
  imageUrl: string;
  description?: string;
  user: {
    id: string;
    username: string;
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

const API_URL = __DEV__ ? 'http://localhost:5000' : 'https://your-production-api.com';

export default function LibraryDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { libraryId } = route.params as { libraryId: string };
  const { user } = useAuth();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeTab, setActiveTab] = useState<'photos' | 'messages' | 'members'>('photos');
  const [library, setLibrary] = useState<any>(null);
  const [removingMember, setRemovingMember] = useState<string | null>(null);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
  const [messageFilter, setMessageFilter] = useState<'all' | 'received' | 'sent'>('all');

  useEffect(() => {
    loadData();
    setupSocket();
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [libraryId]);

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

  // Ensure library data is loaded when send dialog opens
  useEffect(() => {
    if (showSendDialog && (!library || !library.members) && libraryId) {
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
  }, [showSendDialog, library, libraryId]);

  const setupSocket = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const newSocket = io(API_URL, {
        auth: { token },
      });

      newSocket.on('connect', () => {
        newSocket.emit('join-library', libraryId);
      });

      newSocket.on('new-message', (message: Message) => {
        setMessages((prev) => [message, ...prev]);
      });

      newSocket.on('new-heart-message', (message: Message) => {
        setMessages((prev) => {
          const exists = prev.some(m => m.id === message.id);
          if (exists) return prev;
          return [message, ...prev];
        });
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
      setPhotos(photosRes.data);
      setMessages(messagesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!library) return;
    
    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member from the library?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemovingMember(memberId);
            try {
              await api.delete(`/libraries/${libraryId}/members/${memberId}`);
              // Reload library data
              const libraryRes = await api.get(`/libraries/${libraryId}`);
              setLibrary(libraryRes.data);
              Alert.alert('Success', 'Member removed successfully');
            } catch (error: any) {
              console.error('Error removing member:', error);
              Alert.alert('Error', error.response?.data?.error || 'Failed to remove member');
            } finally {
              setRemovingMember(null);
            }
          },
        },
      ]
    );
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadPhoto(result.assets[0].uri);
    }
  };

  const uploadPhoto = async (uri: string) => {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);
      formData.append('libraryId', libraryId);

      const response = await api.post('/photos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setPhotos([response.data, ...photos]);
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      alert(error.response?.data?.error || 'Failed to upload photo');
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || selectedRecipients.length === 0) return;

    try {
      const response = await api.post(`/messages/library/${libraryId}`, {
        content: messageText,
        recipientIds: selectedRecipients,
      });

      setMessages([response.data, ...messages]);
      setMessageText('');
      setSelectedRecipients([]);
      setShowSendDialog(false);
      Alert.alert('Success', 'Heart message sent! 💕');
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to send message');
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/background.jpg')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.container}>
        <View style={styles.header}>
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <View style={styles.tabs}>
          <Button
            mode={activeTab === 'photos' ? 'contained' : 'outlined'}
            onPress={() => setActiveTab('photos')}
            style={styles.tabButton}
          >
            Photos
          </Button>
          <Button
            mode={activeTab === 'messages' ? 'contained' : 'outlined'}
            onPress={() => setActiveTab('messages')}
            style={styles.tabButton}
            icon="heart"
          >
            Hearts
          </Button>
          <Button
            mode={activeTab === 'members' ? 'contained' : 'outlined'}
            onPress={() => setActiveTab('members')}
            style={styles.tabButton}
          >
            Members
          </Button>
        </View>
      </View>

      {activeTab === 'photos' ? (
        <FlatList
          data={photos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.photoCard}>
              <Image source={{ uri: item.imageUrl }} style={styles.photo} />
              <Card.Content>
                {item.description && (
                  <Text variant="bodyMedium" style={styles.description}>
                    {item.description}
                  </Text>
                )}
                <Text variant="bodySmall" style={styles.photoAuthor}>
                  by {item.user.username}
                </Text>
              </Card.Content>
            </Card>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text>No photos yet. Tap the + button to add one!</Text>
            </View>
          }
        />
      ) : activeTab === 'messages' ? (
        <View style={styles.messagesContainer}>
          {/* Message Filter Tabs */}
          <Card style={styles.filterCard}>
            <Card.Content style={styles.filterContent}>
              <View style={styles.filterButtons}>
                <Button
                  mode={messageFilter === 'all' ? 'contained' : 'outlined'}
                  onPress={() => setMessageFilter('all')}
                  style={[styles.filterButton, messageFilter === 'all' && styles.filterButtonActive]}
                  labelStyle={[styles.filterButtonLabel, messageFilter === 'all' && styles.filterButtonLabelActive]}
                >
                  All
                </Button>
                <Button
                  mode={messageFilter === 'received' ? 'contained' : 'outlined'}
                  onPress={() => setMessageFilter('received')}
                  style={[styles.filterButton, messageFilter === 'received' && styles.filterButtonActive]}
                  labelStyle={[styles.filterButtonLabel, messageFilter === 'received' && styles.filterButtonLabelActive]}
                >
                  Received
                </Button>
                <Button
                  mode={messageFilter === 'sent' ? 'contained' : 'outlined'}
                  onPress={() => setMessageFilter('sent')}
                  style={[styles.filterButton, messageFilter === 'sent' && styles.filterButtonActive]}
                  labelStyle={[styles.filterButtonLabel, messageFilter === 'sent' && styles.filterButtonLabelActive]}
                >
                  Sent
                </Button>
              </View>
            </Card.Content>
          </Card>
          )}

          {messages.length === 0 ? (
            <View style={styles.empty}>
              <Text variant="headlineSmall" style={styles.emptyTitle}>
                💕
              </Text>
              <Text variant="titleMedium" style={styles.emptyText}>
                No heart messages yet
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                Send a sweet message to someone special
              </Text>
              <Button
                mode="contained"
                icon="heart"
                onPress={() => setShowSendDialog(true)}
                style={styles.sendButton}
              >
                Send Heart Message
              </Button>
            </View>
          ) : (() => {
            const filteredMessages = messages.filter((message) => {
              if (messageFilter === 'all') return true;
              if (messageFilter === 'sent') return message.user.id === user?.id;
              if (messageFilter === 'received') return message.user.id !== user?.id;
              return true;
            });

            return filteredMessages.length === 0 ? (
              <View style={styles.empty}>
                <Text variant="headlineSmall" style={styles.emptyTitle}>
                  💕
                </Text>
                <Text variant="titleMedium" style={styles.emptyText}>
                  No {messageFilter === 'sent' ? 'sent' : messageFilter === 'received' ? 'received' : ''} messages
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  {messageFilter === 'sent' 
                    ? 'You haven\'t sent any heart messages yet'
                    : messageFilter === 'received'
                    ? 'No one has sent you heart messages yet'
                    : 'Send a sweet message to someone special'}
                </Text>
                {messageFilter === 'all' && (
                  <Button
                    mode="contained"
                    icon="heart"
                    onPress={() => setShowSendDialog(true)}
                    style={styles.sendButton}
                  >
                    Send Heart Message
                  </Button>
                )}
              </View>
          ) : (
            <>
              {/* Header with Send Button - Only show when there are messages */}
              <Card style={styles.messagesHeaderCard}>
                <Card.Content style={styles.messagesHeaderContent}>
                  <Button
                    mode="contained"
                    icon="heart"
                    onPress={() => setShowSendDialog(true)}
                    style={styles.sendButtonTop}
                    contentStyle={styles.sendButtonContent}
                  >
                    Send Heart Message
                  </Button>
                </Card.Content>
              </Card>
              <FlatList
                data={filteredMessages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.messagesList}
              renderItem={({ item }) => {
                const isExpanded = expandedMessageId === item.id;
                const recipientNames = item.recipients?.map(r => r.user.username).join(', ') || '';
                
                return (
                  <Card
                    style={[
                      styles.heartMessageCard,
                      isExpanded && styles.heartMessageCardExpanded,
                    ]}
                    onPress={() => setExpandedMessageId(isExpanded ? null : item.id)}
                  >
                    <Card.Content>
                      <View style={styles.messageHeader}>
                        <View style={styles.messageUserInfo}>
                          <Avatar.Text
                            size={32}
                            label={item.user.username.charAt(0).toUpperCase()}
                            style={styles.messageAvatar}
                          />
                          <View style={styles.messageUserDetails}>
                            <Text variant="titleSmall" style={styles.messageUsername}>
                              {item.user.username}
                            </Text>
                            <Text variant="bodySmall" style={styles.messageDate}>
                              {new Date(item.createdAt).toLocaleDateString()}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.heartIcon}>💕</Text>
                      </View>
                      <Text
                        variant="bodyMedium"
                        style={styles.messageContent}
                        numberOfLines={isExpanded ? undefined : 3}
                      >
                        {item.content}
                      </Text>
                      {item.recipients && item.recipients.length > 0 && (
                        <View style={styles.recipientsContainer}>
                          <Text variant="bodySmall" style={styles.recipientsText}>
                            To: {recipientNames}
                          </Text>
                        </View>
                      )}
                      {!isExpanded && (
                        <Text variant="bodySmall" style={styles.expandHint}>
                          Tap to read full message
                        </Text>
                      )}
                    </Card.Content>
                    </Card>
                  );
                }}
              />
            </>
          );
          })()}

          {/* Send Heart Message Dialog */}
          {showSendDialog && (
            <View style={styles.dialogOverlay}>
              <Card style={styles.sendDialog}>
                <Card.Title
                  title="Send Heart Message"
                  subtitle="Choose who to send to"
                  left={(props) => <Avatar.Icon {...props} icon="heart" style={{ backgroundColor: '#e91e63' }} />}
                  right={(props) => (
                    <IconButton
                      {...props}
                      icon="close"
                      onPress={() => {
                        setShowSendDialog(false);
                        setMessageText('');
                        setSelectedRecipients([]);
                      }}
                    />
                  )}
                />
                <Card.Content>
                  <Text variant="titleSmall" style={styles.recipientLabel}>
                    Recipients
                  </Text>
                  {library && library.members && (
                    <View style={styles.recipientList}>
                      {library.members
                        .filter((member: any) => member.user.id !== user?.id)
                        .map((member: any) => (
                          <View key={member.user.id} style={styles.recipientItem}>
                            <Checkbox
                              status={selectedRecipients.includes(member.user.id) ? 'checked' : 'unchecked'}
                              onPress={() => {
                                if (selectedRecipients.includes(member.user.id)) {
                                  setSelectedRecipients(selectedRecipients.filter(id => id !== member.user.id));
                                } else {
                                  setSelectedRecipients([...selectedRecipients, member.user.id]);
                                }
                              }}
                            />
                            <Avatar.Text
                              size={32}
                              label={member.user.username.charAt(0).toUpperCase()}
                              style={styles.recipientAvatar}
                            />
                            <Text variant="bodyMedium" style={styles.recipientName}>
                              {member.user.username}
                            </Text>
                          </View>
                        ))}
                    </View>
                  )}
                  <TextInput
                    mode="outlined"
                    label="Your Heart Message"
                    value={messageText}
                    onChangeText={setMessageText}
                    placeholder="Write something sweet..."
                    multiline
                    numberOfLines={4}
                    style={styles.messageInputDialog}
                    maxLength={1000}
                  />
                  <Text variant="bodySmall" style={styles.charCount}>
                    {messageText.length}/1000 characters
                  </Text>
                </Card.Content>
                <Card.Actions>
                  <Button
                    onPress={() => {
                      setShowSendDialog(false);
                      setMessageText('');
                      setSelectedRecipients([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    icon="heart"
                    onPress={handleSendMessage}
                    disabled={!messageText.trim() || selectedRecipients.length === 0}
                  >
                    Send
                  </Button>
                </Card.Actions>
              </Card>
            </View>
          )}
        </View>
      ) : activeTab === 'members' ? (
        <FlatList
          data={library?.members || []}
          keyExtractor={(item: any) => item.id}
          renderItem={({ item: member }: { item: any }) => {
            const isOwner = member.role === 'owner';
            const isCurrentUser = member.user.id === user?.id;
            const canRemove = library?.createdBy === user?.id && !isOwner && !isCurrentUser;
            
            return (
              <Card style={styles.memberCard}>
                <Card.Content style={styles.memberContent}>
                  <View style={styles.memberInfo}>
                    <Text variant="titleMedium" style={styles.memberName}>
                      {member.user.username}
                    </Text>
                    <Text variant="bodySmall" style={styles.memberEmail}>
                      {member.user.email}
                    </Text>
                    <View style={styles.memberBadges}>
                      <Text
                        variant="labelSmall"
                        style={[
                          styles.memberBadge,
                          isOwner && styles.ownerBadge,
                        ]}
                      >
                        {isOwner ? 'Owner' : 'Member'}
                      </Text>
                      {isCurrentUser && (
                        <Text variant="labelSmall" style={styles.youBadge}>
                          You
                        </Text>
                      )}
                    </View>
                  </View>
                  {canRemove && (
                    <IconButton
                      icon="delete"
                      iconColor="#d32f2f"
                      onPress={() => handleRemoveMember(member.user.id)}
                      disabled={removingMember === member.user.id}
                    />
                  )}
                </Card.Content>
              </Card>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text>No members found</Text>
            </View>
          }
        />
      ) : null}

      {activeTab === 'photos' && (
        <FAB icon="camera" style={styles.fab} onPress={handlePickImage} />
      )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    elevation: 2,
  },
  tabs: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  tabButton: {
    marginHorizontal: 4,
  },
  photoCard: {
    margin: 8,
    elevation: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  photo: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  description: {
    marginTop: 8,
  },
  photoAuthor: {
    marginTop: 4,
    color: '#666',
  },
  messagesContainer: {
    flex: 1,
  },
  messageContainer: {
    margin: 8,
    padding: 12,
    borderRadius: 8,
    maxWidth: '80%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#E91E63', // Coffee Brown
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  messageAuthor: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ownMessageAuthor: {
    color: '#FFFFFF',
  },
  messageText: {
    color: '#000000',
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  messageInputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    marginRight: 8,
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  memberCard: {
    margin: 8,
    elevation: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  memberContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontWeight: 'bold',
    color: '#3E2723',
  },
  memberEmail: {
    color: '#666',
    marginTop: 4,
  },
  memberBadges: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  memberBadge: {
    backgroundColor: 'rgba(233, 30, 99, 0.1)',
    color: '#E91E63',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
  },
  ownerBadge: {
    backgroundColor: '#E91E63',
    color: 'white',
  },
  youBadge: {
    backgroundColor: 'rgba(233, 30, 99, 0.12)',
    color: '#E91E63',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
  },
  heartMessageCard: {
    margin: 8,
    marginBottom: 12,
    elevation: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(233, 30, 99, 0.2)',
  },
  heartMessageCardExpanded: {
    borderColor: '#E91E63',
    backgroundColor: 'rgba(233, 30, 99, 0.08)',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  messageUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  messageAvatar: {
    backgroundColor: '#E91E63',
    marginRight: 12,
  },
  messageUserDetails: {
    flex: 1,
  },
  messageUsername: {
    fontWeight: '600',
    color: '#3E2723',
  },
  messageDate: {
    color: '#666',
    marginTop: 2,
  },
  heartIcon: {
    fontSize: 24,
  },
  messageContent: {
    color: '#3E2723',
    lineHeight: 22,
    marginBottom: 8,
  },
  recipientsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(233, 30, 99, 0.1)',
  },
  recipientsText: {
    color: '#666',
    fontSize: 12,
  },
  expandHint: {
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
    fontSize: 11,
  },
  messagesList: {
    padding: 8,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontWeight: '600',
    color: '#3E2723',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  sendButton: {
    backgroundColor: '#E91E63',
    paddingHorizontal: 24,
  },
  messagesHeaderCard: {
    margin: 8,
    marginBottom: 12,
    elevation: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  messagesHeaderContent: {
    paddingVertical: 8,
  },
  sendButtonTop: {
    backgroundColor: '#E91E63',
    width: '100%',
  },
  sendButtonContent: {
    paddingVertical: 4,
  },
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sendDialog: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  recipientLabel: {
    fontWeight: '600',
    color: '#3E2723',
    marginBottom: 12,
  },
  recipientList: {
    marginBottom: 16,
    maxHeight: 150,
  },
  recipientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  recipientAvatar: {
    backgroundColor: '#E91E63',
    marginLeft: 8,
    marginRight: 12,
  },
  recipientName: {
    flex: 1,
    color: '#3E2723',
  },
  messageInputDialog: {
    marginTop: 8,
  },
  charCount: {
    textAlign: 'right',
    color: '#999',
    marginTop: 4,
  },
});

