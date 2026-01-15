import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ActivityIndicator, 
  StatusBar, 
  BackHandler, 
  Platform 
} from 'react-native';
import { Session } from '@supabase/supabase-js';
import { Tab } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking'; // [ADDED]

// --- Context & Libs ---
import { supabase } from './lib/supabase';
import { scheduleDailyQuote, requestPermissions } from './utils/notificationScheduler';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// --- Components ---
import Auth from './components/Auth';
import Home from './components/Home';
import SearchScreen from './components/SearchScreen';
import Settings from './components/Settings';
import ProfileEdit from './components/ProfileEdit';
import ChangePassword from './components/ChangePassword';
import QuoteDetail from './components/QuoteDetail';
import ProfileScreen from './components/ProfileScreen';
import CollectionDetail from './components/CollectionDetail';
import QuoteOfTheDay from './components/QuoteOfTheDay';
import { Quote } from './components/QuoteCard';

// Configure Foreground Notification Behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function MainLayout() {
  const { colors, isDarkMode } = useTheme();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // 1. Navigation State (Manual State-Based Router)
  const [index, setIndex] = useState(0); // 0:Home, 1:Search, 2:Daily, 3:Settings, 4:Profile
  
  // Internal Sub-Navigation Stacks
  const [homeStack, setHomeStack] = useState<'feed' | 'detail'>('feed');
  const [settingsStack, setSettingsStack] = useState<'list' | 'edit' | 'password'>('list');
  const [profileStack, setProfileStack] = useState<'grid' | 'collection' | 'detail'>('grid');
  
  // 2. Data Persistence
  const [homeFeed, setHomeFeed] = useState<Quote[]>([]);
  const [screenData, setScreenData] = useState<any>({
    quote: null,
    sourceCollectionId: undefined,
    collectionId: undefined,
    collectionName: undefined,
  });

  // 3. FIX: Conditional Padding Calculation
  const dynamicPaddingTop = (index === 0 || index === 1) 
    ? 0 
    : (Platform.OS === 'android' ? StatusBar.currentHeight : 0);

  // 4. Navigation Engine
  const MapsTo = (target: string, params: any) => {
    setScreenData(params);
    if (target === 'QuoteDetail') {
      if (index === 0) setHomeStack('detail');
      if (index === 1) setProfileStack('detail'); 
      if (index === 4) setProfileStack('detail'); 
    }
    if (target === 'CollectionDetail') {
      setProfileStack('collection');
    }
  };

  // 5. Initialization & Deep Linking
  useEffect(() => {
    const init = async () => {
      await requestPermissions();
      await scheduleDailyQuote();
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };
    init();

    // [ADDED] Deep Linking Listener (For Widget)
    const handleDeepLink = (event: { url: string }) => {
      const { path, queryParams } = Linking.parse(event.url);
      if (path === 'daily' || event.url.includes('daily')) {
        setIndex(2); // Navigate to Daily Tab
      }
    };

    // Check if app was opened via link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink({ url });
    });

    // Listen for incoming links while app is open
    const linkingSub = Linking.addEventListener('url', handleDeepLink);

    // Notification Listener
    const notifSub = Notifications.addNotificationResponseReceivedListener(res => {
      if (res.notification.request.content.data.screen === 'QuoteOfTheDay') setIndex(2);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    
    return () => {
      notifSub.remove();
      linkingSub.remove();
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 6. Hardware Back Handler
  useEffect(() => {
    const backAction = () => {
      if (index === 0 && homeStack === 'detail') { setHomeStack('feed'); return true; }
      if (index === 3 && settingsStack !== 'list') { setSettingsStack('list'); return true; }
      if (index === 4) {
        if (profileStack === 'detail') { setProfileStack('collection'); return true; }
        if (profileStack === 'collection') { setProfileStack('grid'); return true; }
      }
      if (index !== 0) { setIndex(0); return true; }
      return false;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [index, homeStack, settingsStack, profileStack]);

  const handleTabChange = (newIndex: number) => {
    setIndex(newIndex);
    if (newIndex !== 0) setHomeStack('feed');
    if (newIndex !== 3) setSettingsStack('list');
    if (newIndex !== 4) setProfileStack('grid');
  };

  if (loading) return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );

  if (!session) return <Auth />;

  const isFullscreen = (homeStack === 'detail' || (index === 1 && profileStack === 'detail') || profileStack === 'detail' || profileStack === 'collection');

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: dynamicPaddingTop }]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        translucent 
        backgroundColor="transparent" 
      />

      <View style={styles.content}>
        {/* TAB 0: HOME */}
        {index === 0 && (
          homeStack === 'detail' && screenData.quote 
            ? <QuoteDetail quote={screenData.quote} onBack={() => setHomeStack('feed')} />
            : <Home feedData={homeFeed} setFeedData={setHomeFeed} onQuotePress={(q) => MapsTo('QuoteDetail', { quote: q })} />
        )}

        {/* TAB 1: SEARCH */}
        {index === 1 && (
            profileStack === 'detail' && screenData.quote ? 
            <QuoteDetail quote={screenData.quote} onBack={() => setProfileStack('grid')} /> :
            <SearchScreen onQuotePress={(q: Quote) => MapsTo('QuoteDetail', { quote: q })} />
        )}

        {/* TAB 2: DAILY */}
        {index === 2 && <QuoteOfTheDay />}

        {/* TAB 3: SETTINGS */}
        {index === 3 && (
          settingsStack === 'edit' ? <ProfileEdit onBack={() => setSettingsStack('list')} /> :
          settingsStack === 'password' ? <ChangePassword onBack={() => setSettingsStack('list')} /> :
          <Settings onNavigateToEdit={() => setSettingsStack('edit')} onNavigateToPassword={() => setSettingsStack('password')} />
        )}

        {/* TAB 4: PROFILE */}
        {index === 4 && (
          profileStack === 'collection' && screenData.collectionId ? 
            <CollectionDetail collectionId={screenData.collectionId} collectionName={screenData.collectionName || ''} onBack={() => setProfileStack('grid')} onQuotePress={(q, s) => MapsTo('QuoteDetail', { quote: q, sourceCollectionId: s })} /> :
          profileStack === 'detail' && screenData.quote ?
            <QuoteDetail quote={screenData.quote} sourceCollectionId={screenData.sourceCollectionId} onBack={() => setProfileStack('collection')} /> :
            <ProfileScreen onCollectionPress={(id, name) => MapsTo('CollectionDetail', { collectionId: id, collectionName: name })} />
        )}
      </View>

      {!isFullscreen && (
        <Tab
          value={index}
          onChange={handleTabChange}
          indicatorStyle={{ backgroundColor: 'transparent' }}
          style={{ 
            backgroundColor: colors.tabBar, 
            borderTopColor: colors.border, 
            borderTopWidth: 1,
            height: 85,
            paddingBottom: 25,
            paddingTop: 10,
          }}
        >
          <Tab.Item key="home" title="Home" titleStyle={[styles.tabLabel, { color: index === 0 ? colors.tabIconActive : colors.tabIconInactive }]} icon={<Ionicons name={index === 0 ? "home" : "home-outline"} color={index === 0 ? colors.tabIconActive : colors.tabIconInactive} size={22} />} />
          <Tab.Item key="search" title="Search" titleStyle={[styles.tabLabel, { color: index === 1 ? colors.tabIconActive : colors.tabIconInactive }]} icon={<Ionicons name={index === 1 ? "search" : "search-outline"} color={index === 1 ? colors.tabIconActive : colors.tabIconInactive} size={22} />} />
          <Tab.Item key="daily" title="Daily" titleStyle={[styles.tabLabel, { color: index === 2 ? colors.tabIconActive : colors.tabIconInactive }]} icon={<Ionicons name={index === 2 ? "sunny" : "sunny-outline"} color={index === 2 ? colors.tabIconActive : colors.tabIconInactive} size={22} />} />
          <Tab.Item key="settings" title="Settings" titleStyle={[styles.tabLabel, { color: index === 3 ? colors.tabIconActive : colors.tabIconInactive }]} icon={<Ionicons name={index === 3 ? "settings" : "settings-outline"} color={index === 3 ? colors.tabIconActive : colors.tabIconInactive} size={22} />} />
          <Tab.Item key="profile" title="Profile" titleStyle={[styles.tabLabel, { color: index === 4 ? colors.tabIconActive : colors.tabIconInactive }]} icon={<Ionicons name={index === 4 ? "person" : "person-outline"} color={index === 4 ? colors.tabIconActive : colors.tabIconInactive} size={22} />} />
        </Tab>
      )}
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainLayout />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  content: { 
    flex: 1, 
  },
  center: { 
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  tabLabel: { 
    fontSize: 10, 
    marginTop: 4 
  }
});