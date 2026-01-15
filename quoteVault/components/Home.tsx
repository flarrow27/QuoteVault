import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { Quote } from './QuoteCard';
import MasonryList from './MasonryList';
import { useTheme } from '../context/ThemeContext';

interface HomeProps {
  onQuotePress: (quote: Quote) => void;
  feedData: Quote[]; // Persisted data from App.tsx
  setFeedData: (data: Quote[]) => void; // Setter from App.tsx
}

export default function Home({ onQuotePress, feedData, setFeedData }: HomeProps) {
  const { colors, isDarkMode } = useTheme();

  // --- Local State ---
  const [activeTab, setActiveTab] = useState<'foryou' | 'favorites'>('foryou');
  const [favoriteQuotes, setFavoriteQuotes] = useState<Quote[]>([]); // Actual objects for Fav tab
  const [favorites, setFavorites] = useState<string[]>([]); // IDs for heart syncing
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // --- Lifecycle ---
  useEffect(() => {
    const init = async () => {
      if (!refreshing) setLoading(true);
      
      // 1. Always fetch favorite IDs to ensure hearts are synced with other tabs
      await fetchUserFavoriteIds();

      // 2. Load Feed Data only if it's empty
      if (activeTab === 'foryou') {
        if (feedData.length === 0) {
          await fetchRandomQuotes();
        }
      } else {
        await fetchFavoriteQuotes();
      }

      setLoading(false);
      setRefreshing(false);
    };

    init();
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    // Overwrites existing data with a fresh batch
    if (activeTab === 'foryou') {
      fetchRandomQuotes();
    } else {
      fetchFavoriteQuotes();
    }
  };

  // --- Data Fetching ---

  const fetchUserFavoriteIds = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('favorites')
      .select('quote_id')
      .eq('user_id', user.id);

    if (data) {
      setFavorites(data.map((f: any) => f.quote_id));
    }
  };

  const fetchRandomQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .limit(100); 

      if (error) throw error;

      if (data) {
        const shuffled = [...data].sort(() => 0.5 - Math.random());
        // Update the PERSISTENT state in App.tsx
        setFeedData(shuffled);
      }
    } catch (error: any) {
      console.error('Fetch error:', error.message);
    } finally {
        setRefreshing(false);
    }
  };

  const fetchFavoriteQuotes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('favorites')
        .select(`quotes (*)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const formatted = data
          .map((item: any) => item.quotes)
          .filter((q: any) => q !== null) as Quote[];
        setFavoriteQuotes(formatted);
      }
    } catch (error: any) {
      console.error(error);
    } finally {
        setRefreshing(false);
    }
  };

  // --- Interaction ---

  const toggleFavorite = async (quote: Quote) => {
    const quoteId = quote.id;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const isFav = favorites.includes(quoteId);

    // Optimistic Update
    setFavorites(prev => isFav ? prev.filter(id => id !== quoteId) : [...prev, quoteId]);
    if (activeTab === 'favorites') {
      setFavoriteQuotes(prev => prev.filter(q => q.id !== quoteId));
    }

    try {
      if (isFav) {
        await supabase.from('favorites').delete().match({ user_id: user.id, quote_id: quoteId });
      } else {
        await supabase.from('favorites').insert({ user_id: user.id, quote_id: quoteId });
      }
    } catch (error) {
      Alert.alert("Error", "Could not update favorite");
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            onPress={() => setActiveTab('foryou')} 
            style={styles.tabTouch}
            activeOpacity={0.7}
          >
            <Text style={{ 
              fontSize: 18, 
              fontWeight: 'bold', 
              color: activeTab === 'foryou' ? colors.text : colors.textSecondary 
            }}>
              For You
            </Text>
            {activeTab === 'foryou' && <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />}
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity 
            onPress={() => setActiveTab('favorites')}
            style={styles.tabTouch}
            activeOpacity={0.7}
          >
            <Text style={{ 
              fontSize: 18, 
              fontWeight: 'bold', 
              color: activeTab === 'favorites' ? colors.text : colors.textSecondary 
            }}>
              Favorites
            </Text>
            {activeTab === 'favorites' && <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />}
          </TouchableOpacity>
        </View>

        <Text style={[styles.brandTitle, { color: colors.primary }]}>QuoteVault</Text>
      </View>

      {/* CONTENT */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <MasonryList
            // Use feedData for the main feed, local state for favorites tab
            quotes={activeTab === 'foryou' ? feedData : favoriteQuotes}
            favorites={favorites}
            refreshing={refreshing}
            onRefresh={onRefresh}
            MapsTo={(screen, params) => onQuotePress(params.quote)}
            onToggleFavorite={toggleFavorite}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 20,
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    zIndex: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabTouch: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    height: 4,
    width: 4,
    borderRadius: 2,
    marginTop: 4,
    position: 'absolute',
    bottom: -8,
  },
  divider: {
    width: 1,
    height: 16,
    marginHorizontal: 15,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.5,
  },
});