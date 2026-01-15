import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { Input, Button, Icon, ListItem } from '@rneui/themed';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

interface AddToCollectionModalProps {
  visible: boolean;
  onClose: () => void;
  quoteId: string;
}

interface Collection {
  id: string;
  name: string;
}

export default function AddToCollectionModal({ visible, onClose, quoteId }: AddToCollectionModalProps) {
  const { colors, fontSizes } = useTheme();

  // --- State ---
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // --- 1. Fetch Collections on Mount ---
  useEffect(() => {
    if (visible) {
      fetchCollections();
    }
  }, [visible]);

  const fetchCollections = async () => {
    setFetching(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('collections')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      if (error) throw error;
      setCollections(data || []);
    } catch (error: any) {
      console.error('Error fetching collections:', error.message);
    } finally {
      setFetching(false);
    }
  };

  // --- 2. Add to Existing Collection ---
  const handleAddToCollection = async (collectionId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('collection_quotes')
        .insert({
          collection_id: collectionId,
          quote_id: quoteId,
        });

      // Handle unique constraint error (quote already in collection)
      if (error && error.code === '23505') {
        Alert.alert('Info', 'This quote is already in that collection.');
        onClose();
        return;
      }
      
      if (error) throw error;

      Alert.alert('Success', 'Saved to collection!');
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- 3. Create New & Save ---
  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      Alert.alert('Required', 'Please enter a name for the collection.');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create collection
      const { data, error } = await supabase
        .from('collections')
        .insert({
          name: newCollectionName.trim(),
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add quote to the newly created collection
      if (data) {
        await handleAddToCollection(data.id);
        setNewCollectionName('');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
      setLoading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.bottomSheet, { backgroundColor: colors.background }]}>
              {/* Header */}
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <Text style={[styles.title, { color: colors.text, fontSize: fontSizes.title }]}>
                  Save to Collection
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <Icon name="x" type="feather" color={colors.text} size={24} />
                </TouchableOpacity>
              </View>

              <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.content}
              >
                <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                    YOUR COLLECTIONS
                  </Text>
                  
                  {fetching ? (
                    <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
                  ) : collections.length === 0 ? (
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      No collections yet. Create your first one below!
                    </Text>
                  ) : (
                    collections.map((item) => (
                      <ListItem
                        key={item.id}
                        containerStyle={{ backgroundColor: 'transparent', paddingHorizontal: 0 }}
                        onPress={() => handleAddToCollection(item.id)}
                        disabled={loading}
                      >
                        <Icon name="folder" type="feather" color={colors.primary} size={20} />
                        <ListItem.Content>
                          <ListItem.Title style={{ color: colors.text, fontSize: fontSizes.body }}>
                            {item.name}
                          </ListItem.Title>
                        </ListItem.Content>
                        <Icon name="plus" type="feather" color={colors.textSecondary} size={16} />
                      </ListItem>
                    ))
                  )}
                </ScrollView>

                {/* Create New Section */}
                <View style={[styles.createSection, { borderTopColor: colors.border }]}>
                  <Input
                    placeholder="New Collection Name"
                    value={newCollectionName}
                    onChangeText={setNewCollectionName}
                    placeholderTextColor={colors.textSecondary}
                    inputContainerStyle={{ borderColor: colors.border }}
                    inputStyle={{ color: colors.text, fontSize: fontSizes.body }}
                    containerStyle={{ paddingHorizontal: 0 }}
                  />
                  <Button
                    title="Create & Save"
                    onPress={handleCreateCollection}
                    loading={loading}
                    buttonStyle={{ backgroundColor: colors.primary, borderRadius: 12 }}
                    titleStyle={{ color: colors.background, fontWeight: 'bold' }}
                    disabled={!newCollectionName.trim()}
                  />
                </View>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: 400,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollArea: {
    flex: 1,
    paddingTop: 15,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
    fontSize: 14,
  },
  createSection: {
    paddingTop: 15,
    borderTopWidth: 1,
    marginTop: 10,
  },
});