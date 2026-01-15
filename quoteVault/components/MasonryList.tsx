import React, { useMemo, ReactNode } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Quote } from './QuoteCard';
import { useTheme } from '../context/ThemeContext';

interface MasonryListProps {
  quotes: Quote[];
  favorites: string[];
  refreshing: boolean;
  onRefresh?: () => void;
  MapsTo: (screen: string, params: { quote: Quote; sourceCollectionId?: string }) => void;
  onToggleFavorite: (quote: Quote) => void;
  sourceCollectionId?: string;
  ListHeaderComponent?: ReactNode; 
}

const MasonryCard = ({ quote, isFavorite, onPress, onHeartPress }: any) => {
  const { colors, fontSizes, isDarkMode } = useTheme();

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress} 
      style={[
        styles.cardContainer, 
        { 
          backgroundColor: colors.card, 
          borderColor: colors.border 
        }
      ]}
    >
      <View style={[
        styles.categoryBadge, 
        { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
      ]}>
        <Text style={[styles.categoryText, { color: colors.primary }]}>
          {quote.category.toUpperCase()}
        </Text>
      </View>

      <Text style={[
        styles.quoteText, 
        { 
          color: colors.text, 
          fontSize: fontSizes.body,
          lineHeight: fontSizes.body * 1.4 
        }
      ]}>
        "{quote.content}"
      </Text>

      <View style={styles.footer}>
        <View style={styles.authorContainer}>
          <View style={[styles.line, { backgroundColor: colors.primary }]} />
          <Text 
            style={[styles.authorText, { color: colors.textSecondary }]} 
            numberOfLines={1}
          >
            {quote.author}
          </Text>
        </View>

        <TouchableOpacity 
          onPress={onHeartPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[styles.heartButton, { backgroundColor: isFavorite ? 'rgba(255, 82, 82, 0.15)' : 'transparent' }]}
        >
          <Ionicons 
            name={isFavorite ? 'heart' : 'heart-outline'} 
            size={20} 
            color={isFavorite ? '#FF5252' : colors.textSecondary} 
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const MasonryList: React.FC<MasonryListProps> = ({
  quotes,
  favorites,
  onRefresh,
  refreshing,
  MapsTo,
  onToggleFavorite,
  sourceCollectionId,
  ListHeaderComponent,
}) => {
  const { colors } = useTheme();
  
  const { col1, col2 } = useMemo(() => {
    const c1: Quote[] = [];
    const c2: Quote[] = [];
    quotes.forEach((q, i) => (i % 2 === 0 ? c1.push(q) : c2.push(q)));
    return { col1: c1, col2: c2 };
  }, [quotes]);

  return (
    <ScrollView
      // FIX 1 & 2: Main container fills all space with no external gaps
      style={[
        styles.scrollContainer, 
        { backgroundColor: colors.background }
      ]}
      // FIX 3: Internal padding for scroll clearance without layout gaps
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        ) : undefined
      }
    >
      {ListHeaderComponent}

      <View style={styles.masonryContainer}>
        <View style={[styles.column, { marginRight: 5 }]}>
          {col1.map((item) => (
            <MasonryCard 
              key={item.id} 
              quote={item} 
              isFavorite={favorites.includes(item.id)}
              onPress={() => MapsTo('QuoteDetail', { quote: item, sourceCollectionId })}
              onHeartPress={() => onToggleFavorite(item)}
            />
          ))}
        </View>

        <View style={[styles.column, { marginLeft: 5 }]}>
          {col2.map((item) => (
            <MasonryCard 
              key={item.id} 
              quote={item} 
              isFavorite={favorites.includes(item.id)}
              onPress={() => MapsTo('QuoteDetail', { quote: item, sourceCollectionId })}
              onHeartPress={() => onToggleFavorite(item)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,           // Ensure full height
    marginBottom: 0,   // Remove any gap
    paddingBottom: 0,  // Remove any gap
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 100, // Clearance for Bottom Tab Bar
    marginBottom: 0,    // Strictly no margin here
  },
  masonryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    alignItems: 'flex-start',
    marginTop: 10,
  },
  column: {
    flex: 1,
  },
  cardContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  quoteText: {
    fontWeight: '500',
    marginBottom: 20,
    fontFamily: 'System',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  line: {
    width: 15,
    height: 1,
    marginRight: 6,
  },
  authorText: {
    fontSize: 12,
    fontStyle: 'italic',
    flex: 1,
  },
  heartButton: {
    padding: 6,
    borderRadius: 20,
  },
});

export default MasonryList;