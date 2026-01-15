import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Card } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import ShareButton from './ShareButton';
import { useTheme } from '../context/ThemeContext';

export interface Quote {
  id: string;
  content: string;
  author: string;
  category: string;
}

interface QuoteCardProps {
  quote: Quote;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

const QuoteCard: React.FC<QuoteCardProps> = ({ quote, isFavorite, onToggleFavorite }) => {
  const { colors, fontSizes, isDarkMode } = useTheme();

  return (
    <Card 
      containerStyle={[
        styles.cardContainer, 
        { 
          backgroundColor: colors.card, 
          borderColor: colors.border 
        }
      ]}
    >
      {/* Header: Category Badge and Icons */}
      <View style={styles.headerRow}>
        <View style={[styles.categoryBadge, { backgroundColor: isDarkMode ? '#333' : '#E0E0E0' }]}>
          <Text style={[styles.categoryText, { color: colors.primary }]}>
            {quote.category.toUpperCase()}
          </Text>
        </View>

        <View style={styles.iconRow}>
          {/* Favorite Heart */}
          <TouchableOpacity onPress={onToggleFavorite} activeOpacity={0.7}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              color={isFavorite ? colors.primary : colors.textSecondary}
              size={28}
            />
          </TouchableOpacity>
          
          {/* Share Button */}
          <ShareButton content={quote.content} author={quote.author} />
        </View>
      </View>

      {/* Main Content: The Quote */}
      <View style={styles.contentContainer}>
        <Text style={[
          styles.quoteText, 
          { 
            color: colors.text, 
            fontSize: fontSizes.quote, // Dynamic Font Size
            lineHeight: fontSizes.quote * 1.4 // Adjust line height relative to font size
          }
        ]}>
          "{quote.content}"
        </Text>
      </View>

      {/* Footer: Author */}
      <View style={styles.footerRow}>
        <Text style={[
          styles.authorText, 
          { 
            color: colors.textSecondary,
            fontSize: fontSizes.author
          }
        ]}>
          — {quote.author}
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginVertical: 10,
    marginHorizontal: 15,
    // Subtle Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  contentContainer: {
    marginBottom: 20,
  },
  quoteText: {
    fontWeight: '500',
    fontFamily: 'System',
  },
  footerRow: {
    alignItems: 'flex-end',
  },
  authorText: {
    fontStyle: 'italic',
  },
});

export default QuoteCard;