import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  ImageBackground,
  Keyboard,
} from 'react-native';
import { SearchBar } from '@rneui/themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import MasonryList from './MasonryList';
import { useTheme } from '../context/ThemeContext';

const STORAGE_KEY = '@search_history';

const TOPICS = [
  { id: '1', name: 'Motivation', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=400&auto=format&fit=crop' },
  { id: '2', name: 'Love', image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=400&auto=format&fit=crop' },
  { id: '3', name: 'Success', image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=400&auto=format&fit=crop' },
  { id: '4', name: 'Wisdom', image: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?q=80&w=400&auto=format&fit=crop' },
  { id: '5', name: 'Life', image: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=400&auto=format&fit=crop' },
  { id: '6', name: 'Faith', image: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=400&auto=format&fit=crop' },
];

export default function SearchScreen({ onQuotePress }: any) {
  const { colors, isDarkMode } = useTheme();
  
  // --- State ---
  const [query, setQuery] = useState('');
  const [quotes, setQuotes] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]); // Initialized as []
  const [loading, setLoading] = useState(false);

  // --- Lifecycle ---
  useEffect(() => {
    (async () => {
      // Load Search History
      const val = await AsyncStorage.getItem(STORAGE_KEY);
      if (val) {
        const parsed = JSON.parse(val);
        setRecentSearches(parsed);
      }
      
      // Load Favorites for heart sync
      const { data: { user } } = await supabase.auth.getUser();
      const { data } = await supabase.from('favorites').select('quote_id').eq('user_id', user?.id);
      if (data) setFavorites(data.map((f: any) => f.quote_id));
      
      fetchQuotes(''); // Initial load
    })();
  }, []);

  const fetchQuotes = async (searchText: string) => {
    setLoading(true);
    let db = supabase.from('quotes').select('*').limit(30);
    
    if (searchText) {
      db = db.or(`content.ilike.%${searchText}%,author.ilike.%${searchText}%,category.ilike.%${searchText}%`);
    } else {
      db = db.order('created_at', { ascending: false });
    }

    const { data } = await db;
    if (data) setQuotes(data);
    setLoading(false);
  };

  const saveToHistory = async (text: string) => {
    if (!text.trim()) return;
    // Add new term to front, remove duplicates, limit to 6
    const newHistory = [text, ...recentSearches.filter(i => i !== text)].slice(0, 6);
    setRecentSearches(newHistory);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
  };

  const handleSearchSubmit = () => {
    if (!query.trim()) return;
    saveToHistory(query);
    fetchQuotes(query);
    Keyboard.dismiss();
  };

  const toggleFavorite = async (quote: any) => {
    const isFav = favorites.includes(quote.id);
    setFavorites(prev => isFav ? prev.filter(id => id !== quote.id) : [...prev, quote.id]);
    const { data: { user } } = await supabase.auth.getUser();
    if (isFav) await supabase.from('favorites').delete().match({ user_id: user?.id, quote_id: quote.id });
    else await supabase.from('favorites').insert({ user_id: user?.id, quote_id: quote.id });
  };

  const renderHeader = useMemo(() => {
    // Debugging data presence
    console.log('Recent Searches:', recentSearches);

    return (
      <View style={{ paddingHorizontal: 15, paddingTop: 10 }}>
        {/* 1. Search Bar */}
        <SearchBar 
          placeholder="Search quotes, authors..." 
          onChangeText={(t) => {
            setQuery(t);
            if (t === '') fetchQuotes('');
          }} 
          onSubmitEditing={handleSearchSubmit}
          value={query} 
          containerStyle={styles.searchContainer} 
          inputContainerStyle={[styles.searchInputContainer, { backgroundColor: colors.card, borderColor: colors.border }]} 
          inputStyle={{ color: colors.text }} 
          placeholderTextColor={colors.textSecondary}
          searchIcon={{ color: colors.primary }}
          autoCapitalize="none"
        />

        {/* 2. Topics List */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Browse Topics</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
          {TOPICS.map(t => (
            <TouchableOpacity 
              key={t.id} 
              onPress={() => { setQuery(t.name); fetchQuotes(t.name); saveToHistory(t.name); }} 
              style={styles.topicCard}
              activeOpacity={0.8}
            >
              <ImageBackground 
                source={{ uri: t.image }} 
                style={styles.topicImage} 
                imageStyle={{ borderRadius: 16 }}
              >
                <LinearGradient 
                  colors={['transparent', 'rgba(0,0,0,0.7)']} 
                  style={StyleSheet.absoluteFill} 
                />
                <Text style={styles.topicText}>{t.name}</Text>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 3. Recent Searches - FIXED SECTION */}
        {recentSearches.length > 0 && query === '' && (
          <View style={{ marginTop: 30 }}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: 14, opacity: 0.7, textTransform: 'uppercase' }]}>
              Recent Searches
            </Text>
            <View style={styles.historyGrid}>
              {recentSearches.map((item, idx) => (
                <TouchableOpacity 
                  key={`history-${idx}`} 
                  style={[styles.historyChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => { setQuery(item); fetchQuotes(item); }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '500' }}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 4. Results Label */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 30 }]}>
          {query ? `Results for "${query}"` : 'Recommended for You'}
        </Text>
      </View>
    );
  }, [query, colors, recentSearches]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? 50 : 0 }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <MasonryList 
        quotes={quotes} 
        favorites={favorites} 
        refreshing={loading} 
        onRefresh={() => fetchQuotes(query)} 
        // Logic for state-based detail navigation
        MapsTo={(s, p) => onQuotePress(p.quote)} 
        onToggleFavorite={toggleFavorite} 
        ListHeaderComponent={renderHeader} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchContainer: { 
    backgroundColor: 'transparent', 
    borderTopWidth: 0, 
    borderBottomWidth: 0, 
    padding: 0 
  },
  searchInputContainer: { 
    borderRadius: 14, 
    height: 50, 
    borderWidth: 1, 
    borderBottomWidth: 1 
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginTop: 20,
    letterSpacing: 0.5
  },
  topicCard: { 
    width: 130, 
    height: 90, 
    marginRight: 12 
  },
  topicImage: { 
    flex: 1, 
    justifyContent: 'flex-end', 
    padding: 12 
  },
  topicText: { 
    color: 'white', 
    fontWeight: 'bold', 
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 4
  },
  historyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12
  },
  historyChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    marginBottom: 10,
    borderWidth: 1,
    // Subtle shadow for chips
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  }
});