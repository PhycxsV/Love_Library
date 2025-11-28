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
  };
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

  useEffect(() => {
    loadData();
    setupSocket();
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [libraryId]);

  // Reload library data when switching to members tab to get updated member list
  useEffect(() => {
    if (activeTab === 'members' && libraryId) {
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
        setMessages((prev) => [...prev, message]);
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

  const handleSendMessage = () => {
    if (!messageText.trim() || !socket) return;

    socket.emit('send-message', {
      libraryId,
      content: messageText,
    });

    setMessageText('');
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
          >
            Messages
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
      ) : (
        <KeyboardAvoidingView
          style={styles.messagesContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isOwnMessage = item.user.id === user?.id;
              return (
                <View
                  style={[
                    styles.messageContainer,
                    isOwnMessage ? styles.ownMessage : styles.otherMessage,
                  ]}
                >
                  <Text
                    variant="bodySmall"
                    style={[
                      styles.messageAuthor,
                      isOwnMessage && styles.ownMessageAuthor,
                    ]}
                  >
                    {item.user.username}
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.messageText,
                      isOwnMessage && styles.ownMessageText,
                    ]}
                  >
                    {item.content}
                  </Text>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text>No messages yet. Start the conversation!</Text>
              </View>
            }
          />
          <View style={styles.messageInputContainer}>
            <TextInput
              mode="outlined"
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Type a message..."
              style={styles.messageInput}
              multiline
            />
            <Button
              mode="contained"
              onPress={handleSendMessage}
              disabled={!messageText.trim()}
            >
              Send
            </Button>
          </View>
        </KeyboardAvoidingView>
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
    backgroundColor: '#6F4E37', // Coffee Brown
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
    backgroundColor: 'rgba(111, 78, 55, 0.1)',
    color: '#6F4E37',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
  },
  ownerBadge: {
    backgroundColor: '#6F4E37',
    color: 'white',
  },
  youBadge: {
    backgroundColor: 'rgba(111, 78, 55, 0.15)',
    color: '#6F4E37',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
  },
});

