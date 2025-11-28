import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { FAB, Card, Text, Button, TextInput, Dialog, Portal } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import api from '../config/api';
import { theme } from '../theme';

interface Library {
  id: string;
  name: string;
  code: string;
  description?: string;
  members: any[];
}

export default function LibraryListScreen() {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [joinDialogVisible, setJoinDialogVisible] = useState(false);
  const [libraryName, setLibraryName] = useState('');
  const [libraryDescription, setLibraryDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const { logout, user } = useAuth();
  const navigation = useNavigation();

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
    try {
      const response = await api.post('/libraries', {
        name: libraryName,
        description: libraryDescription,
      });
      setLibraries([response.data, ...libraries]);
      setCreateDialogVisible(false);
      setLibraryName('');
      setLibraryDescription('');
      navigation.navigate('LibraryDetail' as never, { libraryId: response.data.id } as never);
    } catch (error: any) {
      console.error('Error creating library:', error);
      alert(error.response?.data?.error || 'Failed to create library');
    }
  };

  const handleJoinLibrary = async () => {
    try {
      const response = await api.post('/libraries/join', { code: joinCode.toUpperCase() });
      // Reload the full library list to ensure we have the correct libraries
      await loadLibraries();
      setJoinDialogVisible(false);
      setJoinCode('');
      navigation.navigate('LibraryDetail' as never, { libraryId: response.data.id } as never);
    } catch (error: any) {
      console.error('Error joining library:', error);
      alert(error.response?.data?.error || 'Failed to join library');
    }
  };

  return (
    <View style={styles.backgroundImage}>
      <View style={styles.container}>
        <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          My Libraries
        </Text>
        <Button onPress={logout}>Logout</Button>
      </View>

      <FlatList
        data={libraries}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadLibraries} />
        }
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => navigation.navigate('LibraryDetail' as never, { libraryId: item.id } as never)}
          >
            <Card.Content>
              <Text variant="titleLarge">{item.name}</Text>
              <Text variant="bodyMedium" style={styles.code}>
                Code: {item.code}
              </Text>
              {item.description && (
                <Text variant="bodySmall" style={styles.description}>
                  {item.description}
                </Text>
              )}
              <Text variant="bodySmall" style={styles.members}>
                {item.members.length} member{item.members.length !== 1 ? 's' : ''}
              </Text>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text>No libraries yet. Create or join one to get started!</Text>
          </View>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setCreateDialogVisible(true)}
      />

      <Portal>
        <Dialog
          visible={createDialogVisible}
          onDismiss={() => setCreateDialogVisible(false)}
        >
          <Dialog.Title>Create Library</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Library Name"
              value={libraryName}
              onChangeText={setLibraryName}
              mode="outlined"
              style={styles.dialogInput}
            />
            <TextInput
              label="Description (optional)"
              value={libraryDescription}
              onChangeText={setLibraryDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreateDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleCreateLibrary} disabled={!libraryName.trim()}>
              Create
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={joinDialogVisible}
          onDismiss={() => setJoinDialogVisible(false)}
        >
          <Dialog.Title>Join Library</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Library Code"
              value={joinCode}
              onChangeText={setJoinCode}
              mode="outlined"
              autoCapitalize="characters"
              maxLength={6}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setJoinDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleJoinLibrary} disabled={!joinCode.trim()}>
              Join
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <FAB
        icon="account-plus"
        style={[styles.fab, styles.joinFab]}
        onPress={() => setJoinDialogVisible(true)}
        label="Join"
      />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    elevation: 2,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  card: {
    margin: 8,
    elevation: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  code: {
    marginTop: 4,
    color: '#666',
  },
  description: {
    marginTop: 8,
    color: '#888',
  },
  members: {
    marginTop: 8,
    color: '#E91E63', // Coffee Brown
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
  joinFab: {
    bottom: 80,
  },
  dialogInput: {
    marginBottom: 16,
  },
});

