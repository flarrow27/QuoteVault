import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeName = 'Classic' | 'Ocean' | 'Nature';
export type FontScale = 0.8 | 1.0 | 1.2;

const THEMES: any = {
  Classic: {
    dark: { background: '#121212', card: '#1E1E1E', text: '#FFFFFF', textSecondary: '#AAAAAA', primary: '#FFD700', border: '#333333', tabBar: '#000000', tabIconActive: '#FFFFFF', tabIconInactive: '#666666' },
    light: { background: '#FFFFFF', card: '#F5F5F5', text: '#121212', textSecondary: '#666666', primary: '#FFD700', border: '#E0E0E0', tabBar: '#FFFFFF', tabIconActive: '#000000', tabIconInactive: '#999999' }
  },
  Ocean: {
    dark: { background: '#0D1B2A', card: '#1B263B', text: '#E0E1DD', textSecondary: '#778DA9', primary: '#00E5FF', border: '#415A77', tabBar: '#0A1622', tabIconActive: '#00E5FF', tabIconInactive: '#415A77' },
    light: { background: '#F0F8FF', card: '#FFFFFF', text: '#0D1B2A', textSecondary: '#555555', primary: '#0099CC', border: '#B0C4DE', tabBar: '#FFFFFF', tabIconActive: '#0099CC', tabIconInactive: '#A0A0A0' }
  },
  Nature: {
    dark: { background: '#1A2F1A', card: '#2C402C', text: '#F0FFF0', textSecondary: '#A0CFA0', primary: '#90EE90', border: '#3E553E', tabBar: '#142514', tabIconActive: '#90EE90', tabIconInactive: '#507050' },
    light: { background: '#F5F5DC', card: '#FFFFFF', text: '#2F4F4F', textSecondary: '#6B8E23', primary: '#556B2F', border: '#D2B48C', tabBar: '#EFEFDE', tabIconActive: '#556B2F', tabIconInactive: '#A9A9A9' }
  }
};

const ThemeContext = createContext<any>({});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeName, setThemeNameState] = useState<ThemeName>('Classic');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [fontScale, setFontScaleState] = useState<FontScale>(1.0);

  useEffect(() => {
    (async () => {
      const savedTheme = await AsyncStorage.getItem('@app_theme');
      const savedMode = await AsyncStorage.getItem('@app_mode');
      const savedFont = await AsyncStorage.getItem('@app_font');
      if (savedTheme) setThemeNameState(savedTheme as ThemeName);
      if (savedMode) setIsDarkMode(savedMode === 'true');
      if (savedFont) setFontScaleState(parseFloat(savedFont) as FontScale);
    })();
  }, []);

  const setThemeName = (n: ThemeName) => { setThemeNameState(n); AsyncStorage.setItem('@app_theme', n); };
  const toggleDarkMode = () => { const m = !isDarkMode; setIsDarkMode(m); AsyncStorage.setItem('@app_mode', String(m)); };
  const setFontScale = (s: FontScale) => { setFontScaleState(s); AsyncStorage.setItem('@app_font', String(s)); };

  const colors = THEMES[themeName][isDarkMode ? 'dark' : 'light'];
  const fontSizes = { body: 16 * fontScale, title: 20 * fontScale, quote: 22 * fontScale, author: 14 * fontScale };

  return (
    <ThemeContext.Provider value={{ themeName, isDarkMode, fontScale, colors, fontSizes, setThemeName, toggleDarkMode, setFontScale }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);