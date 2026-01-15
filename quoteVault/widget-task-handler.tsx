import React from 'react';
import { requestWidgetUpdate } from 'react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuoteWidget } from './components/QuoteWidget';

export async function widgetTaskHandler(props: any) {
  const widgetInfo = props.widgetInfo;
  const widgetName = widgetInfo.widgetName;

  try {
    // 1. Get Today's Date Key
    const dateString = new Date().toISOString().split('T')[0];
    const storageKey = `daily_quote_${dateString}`;

    // 2. Fetch Data
    const storedQuote = await AsyncStorage.getItem(storageKey);
    const storedTheme = await AsyncStorage.getItem('widget_theme');
    
    // Defaults if data is missing
    let quoteData = { content: "Open App to see today's insight.", author: "QuoteVault" };
    let theme = 'Dark';

    if (storedQuote) {
      quoteData = JSON.parse(storedQuote);
    }
    
    if (storedTheme) {
      theme = storedTheme;
    }

    // 3. Render the Widget
    // FIX: Cast configuration object to 'any' to allow widgetId
    requestWidgetUpdate({
      widgetName,
      renderWidget: () => (
        <QuoteWidget 
          quote={quoteData.content} 
          author={quoteData.author} 
          theme={theme as any} 
        />
      ),
      widgetId: widgetInfo.widgetId,
    } as any);
    
  } catch (error) {
    console.error('Widget Update Failed:', error);
  }
}