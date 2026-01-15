import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

interface QuoteWidgetProps {
  quote: string;
  author: string;
  theme: 'Dark' | 'Light' | 'Gold';
}

export function QuoteWidget({ quote, author, theme }: QuoteWidgetProps) {
  // Theme Palettes
  const styles = {
    Dark: { bg: '#121212', text: '#FFFFFF', accent: '#FFD700' },
    Light: { bg: '#FFFFFF', text: '#121212', accent: '#C5A059' },
    Gold: { bg: '#FFD700', text: '#000000', accent: '#000000' },
  };

  const currentStyle = styles[theme] || styles.Dark;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: currentStyle.bg as any, // FIX: Cast to any
        borderRadius: 22,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
      }}
      clickAction="OPEN_APP"
      clickActionData={{ link: 'quotevault://daily' }}
    >
      {/* Quote Icon */}
      <TextWidget
        text="❝"
        style={{
          fontSize: 40,
          color: currentStyle.accent as any, // FIX: Cast to any
          marginBottom: 4,
          fontFamily: 'serif',
        }}
      />

      {/* Quote Text */}
      <TextWidget
        text={quote}
        style={{
          fontSize: 18,
          color: currentStyle.text as any, // FIX: Cast to any
          textAlign: 'center',
          fontWeight: 'bold',
          marginBottom: 12,
          fontFamily: 'serif', 
        }}
        maxLines={4}
      />

      {/* Author */}
      <TextWidget
        text={`— ${author.toUpperCase()}`}
        style={{
          fontSize: 12,
          color: currentStyle.text as any, // FIX: Cast to any
          letterSpacing: 2,
          fontWeight: 'bold',
          // REMOVED: opacity (Not supported in Widgets)
        }}
      />
    </FlexWidget>
  );
}