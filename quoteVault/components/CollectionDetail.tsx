import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import MasonryList from './MasonryList';
import { Quote } from './QuoteCard';
import CustomAlert from './CustomAlert'; // 1. Import CustomAlert

interface CollectionDetailProps {
  collectionId: string;
  collectionName: string;
  onBack: () => void;
  onQuotePress: (quote: Quote, sourceId?: string) => void;
}

export default function CollectionDetail({
  collectionId,
  collectionName,
  onBack,
  onQuotePress,
}: CollectionDetailProps) {
  const { colors } = useTheme();

  // --- State ---
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 2. State for Custom Alert
  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);

  useEffect(() => {
    loadCollectionData();
  }, [collectionId]);

  const loadCollectionData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: favData } = await supabase
        .from('favorites')
        .select('quote_id')
        .eq('user_id', user.id);
      
      if (favData) setFavorites(favData.map((f: any) => f.quote_id));

      const { data, error } = await supabase
        .from('collection_quotes')
        .select(`
          quotes (
            id,
            content,
            author,
            category
          )
        `)
        .eq('collection_id', collectionId);

      if (error) throw error;

      if (data) {
        const flattenedQuotes = data
          .map((item: any) => item.quotes)
          .filter((q: any) => q !== null);
        setQuotes(flattenedQuotes);
      }
    } catch (error: any) {
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- 3. Refactored Deletion Logic ---

  // Called when clicking the Trash Icon
  const handleDeletePress = () => {
    setDeleteAlertVisible(true);
  };

  // Called when clicking "Delete" inside the CustomAlert
  const handleConfirmDelete = async () => {
    setDeleteAlertVisible(false); // Close alert first
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId);

      if (error) throw error;
      
      onBack(); // Return to Profile Grid
    } catch (error: any) {
      Alert.alert('Error', 'Could not delete collection.');
      setLoading(false);
    }
  };

  const toggleFavorite = async (quote: Quote) => {
    const quoteId = quote.id;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isFav = favorites.includes(quoteId);
    setFavorites((prev) => (isFav ? prev.filter((id) => id !== quoteId) : [...prev, quoteId]));

    try {
      if (isFav) {
        await supabase.from('favorites').delete().eq('user_id', user.id).eq('quote_id', quoteId);
      } else {
        await supabase.from('favorites').insert({ user_id: user.id, quote_id: quoteId });
      }
    } catch (error) {
      console.error('Favorite sync error');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {collectionName}
          </Text>
        </View>

        <TouchableOpacity onPress={handleDeletePress} style={styles.iconBtn}>
          <Ionicons name="trash-outline" size={22} color="#FF5252" />
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <MasonryList
          quotes={quotes}
          favorites={favorites}
          refreshing={false}
          onRefresh={loadCollectionData}
          sourceCollectionId={collectionId} 
          MapsTo={(screen, params) => onQuotePress(params.quote, params.sourceCollectionId)}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {/* 4. Custom Delete Alert */}
      <CustomAlert
        visible={deleteAlertVisible}
        title="Delete Collection"
        message={`Are you sure you want to delete "${collectionName}"? All organization for these quotes within this vault will be lost.`}
        onCancel={() => setDeleteAlertVisible(false)}
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        isDestructive={true}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: Platform.OS === 'android' ? 30 : 0,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 15,
    flex: 1,
  },
  iconBtn: {
    padding: 8,
  },
});