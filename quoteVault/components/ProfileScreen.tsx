import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { Avatar } from '@rneui/themed';
import { LinearGradient } from 'expo-linear-gradient'; // New Dependency
import { supabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 45) / 2; // Precise spacing for 2 columns

interface Collection {
  id: string;
  name: string;
}

interface ProfileScreenProps {
  onCollectionPress: (id: string, name: string) => void;
}

// --- HELPER: Dynamic Gradient Logic ---
const getGradientColors = (name: string): string[] => {
  const presets = [
    ['#C5A059', '#121212'], // Gold/Black
    ['#1e3a8a', '#581c87'], // Deep Blue/Purple
    ['#059669', '#1e293b'], // Emerald/Slate
    ['#f97316', '#991b1b'], // Orange/Red
  ];
  // Simple hashing based on string length and first char code
  const index = (name.length + (name.charCodeAt(0) || 0)) % presets.length;
  return presets[index];
};

// --- SUB-COMPONENT: Album-Style Collection Card ---
const CollectionCard = ({ item, onPress }: { item: Collection; onPress: () => void }) => {
  const { colors } = useTheme();
  const gradient = getGradientColors(item.name);

  return (
    <TouchableOpacity 
      style={styles.cardTouch} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={gradient as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.albumCover, { borderColor: colors.border }]}
      >
        {/* Subtle Texture Watermark */}
        <Text style={styles.watermark}>"</Text>

        {/* Bottom Label Section */}
        <View style={styles.cardFooter}>
          <Text style={styles.collectionTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.collectionSubtitle}>Collection</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// --- MAIN COMPONENT ---
export default function ProfileScreen({ onCollectionPress }: ProfileScreenProps) {
  const { colors, isDarkMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUser(user);

      const { data: colData, error } = await supabase
        .from('collections')
        .select('id, name')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCollections(colData || []);
    } catch (error: any) {
      console.error('Error:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Avatar
        size={110}
        rounded
        source={user?.user_metadata?.avatar_url ? { uri: user.user_metadata.avatar_url } : undefined}
        title={!user?.user_metadata?.avatar_url ? getInitials(user?.user_metadata?.full_name || user?.email) : undefined}
        containerStyle={[styles.avatar, { borderColor: colors.primary }]}
        titleStyle={{ color: colors.primary, fontWeight: 'bold' }}
      />
      <Text style={[styles.nameText, { color: colors.text }]}>
        {user?.user_metadata?.full_name || 'Collector'}
      </Text>
      <Text style={[styles.emailText, { color: colors.textSecondary }]}>
        {user?.email}
      </Text>

      {/* Tabs / Divider */}
      <View style={styles.tabSection}>
        <Text style={[styles.tabLabel, { color: colors.text }]}>Collections</Text>
        <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <FlatList
        data={collections}
        keyExtractor={(item) => item.id}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <CollectionCard 
            item={item} 
            onPress={() => onCollectionPress(item.id, item.name)} 
          />
        )}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              The vault is empty. Save a quote to create your first collection.
            </Text>
          </View>
        }
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
  listContent: {
    paddingBottom: 40,
    paddingHorizontal: 15,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  
  // Header
  headerContainer: {
    paddingTop: Platform.OS === 'android' ? 20 : 10,
    alignItems: 'center',
    marginBottom: 30, // Increased whitespace per requirement
  },
  avatar: {
    backgroundColor: '#1E1E1E',
    borderWidth: 3,
    marginBottom: 15,
  },
  nameText: {
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  emailText: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.6,
  },

  // Tab Section
  tabSection: {
    marginTop: 40,
    width: '100%',
    alignItems: 'center',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  activeIndicator: {
    height: 3,
    width: 30,
    borderRadius: 2,
  },

  // Premium Card
  cardTouch: {
    width: COLUMN_WIDTH,
    marginBottom: 15,
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  albumCover: {
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 12,
  },
  watermark: {
    position: 'absolute',
    top: -10,
    right: 5,
    fontSize: 100,
    color: '#FFF',
    opacity: 0.1,
    fontWeight: '900',
  },
  cardFooter: {
    zIndex: 2,
  },
  collectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  collectionSubtitle: {
    color: '#FFF',
    fontSize: 11,
    opacity: 0.7,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Empty State
  emptyContainer: {
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
  },
});