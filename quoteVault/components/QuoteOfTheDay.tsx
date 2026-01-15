import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ImageBackground,
  Platform,
  TouchableOpacity,
  Share,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import { Quote } from './QuoteCard';

// Image mapping for the visual card
const CATEGORY_IMAGES: Record<string, string> = {
  Motivation: 'https://images.unsplash.com/photo-1497561813398-8fcc7a37b567?q=80&w=1000&auto=format&fit=crop',
  Love: 'https://images.unsplash.com/photo-1518568814500-bf0f8d125f46?q=80&w=1000&auto=format&fit=crop',
  Success: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1000&auto=format&fit=crop',
  Wisdom: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1000&auto=format&fit=crop',
  Humor: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1000&auto=format&fit=crop',
  Life: 'https://images.unsplash.com/photo-1504198458649-3128b932f49e?q=80&w=1000&auto=format&fit=crop',
  Default: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?q=80&w=1000&auto=format&fit=crop',
};

export default function QuoteOfTheDay() {
  const { colors, fontSizes } = useTheme();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTodayQuote();
  }, []);

  const getTodayQuote = async () => {
    setLoading(true);
    const dateString = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    const storageKey = `daily_quote_${dateString}`;

    try {
      // 1. Check local storage first
      const storedQuote = await AsyncStorage.getItem(storageKey);
      
      if (storedQuote) {
        setQuote(JSON.parse(storedQuote));
      } else {
        // 2. Fetch a fresh random quote from Supabase
        // We fetch 50 and pick 1 randomly to ensure variety without complex SQL
        const { data, error } = await supabase
          .from('quotes')
          .select('*')
          .limit(50);

        if (error) throw error;

        if (data && data.length > 0) {
          const randomQuote = data[Math.floor(Math.random() * data.length)];
          
          // 3. Save to storage for the rest of the day
          await AsyncStorage.setItem(storageKey, JSON.stringify(randomQuote));
          setQuote(randomQuote);
          
          // Optional: Cleanup old daily quotes to save space
          // This is a "Senior" move to prevent storage bloat
          const allKeys = await AsyncStorage.getAllKeys();
          const oldKeys = allKeys.filter(key => key.startsWith('daily_quote_') && key !== storageKey);
          if (oldKeys.length > 0) await AsyncStorage.multiRemove(oldKeys);
        }
      }
    } catch (error) {
      console.error('Error fetching daily quote:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!quote) return;
    try {
      await Share.share({
        message: `"${quote.content}" — ${quote.author}\n\nShared from QuoteVault`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const bgImage = quote ? (CATEGORY_IMAGES[quote.category] || CATEGORY_IMAGES.Default) : CATEGORY_IMAGES.Default;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerSubtitle, { color: colors.primary }]}>
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </Text>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Quote of the Day</Text>
      </View>

      {/* Main Visual Card */}
      <View style={styles.cardContainer}>
        <ImageBackground
          source={{ uri: bgImage }}
          style={styles.imageBg}
          imageStyle={{ borderRadius: 24 }}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          >
            <FontAwesome name="quote-left" size={40} color="#FFD700" style={styles.quoteIcon} />
            
            <Text style={[styles.quoteText, { fontSize: fontSizes.quote + 4 }]}>
              {quote?.content}
            </Text>
            
            <View style={styles.divider} />
            
            <Text style={styles.authorText}>
              {quote?.author.toUpperCase()}
            </Text>
          </LinearGradient>
        </ImageBackground>
      </View>

      {/* Simple Footer Action */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.shareBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleShare}
        >
          <Ionicons name="share-social-outline" size={24} color={colors.primary} />
          <Text style={[styles.shareText, { color: colors.text }]}>Share this insight</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 25,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    marginBottom: 20,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  cardContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  imageBg: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  gradient: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  quoteIcon: {
    opacity: 0.6,
    marginBottom: 20,
  },
  quoteText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: 'bold',
    lineHeight: 38,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  divider: {
    width: 40,
    height: 4,
    backgroundColor: '#FFD700',
    marginVertical: 25,
    borderRadius: 2,
  },
  authorText: {
    color: '#E0E0E0',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 3,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 30,
    borderWidth: 1,
  },
  shareText: {
    marginLeft: 12,
    fontWeight: 'bold',
    fontSize: 16,
  },
});