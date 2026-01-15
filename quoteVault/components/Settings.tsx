import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
  SafeAreaView,
} from 'react-native';
import { ListItem, Icon, Switch, Button } from '@rneui/themed';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useTheme, ThemeName, FontScale } from '../context/ThemeContext';
import { scheduleDailyQuote, cancelAllNotifications } from '../utils/notificationScheduler';

// [ADDED] Widget Theme Logic
import { requestWidgetUpdate } from 'react-native-android-widget';
import { widgetTaskHandler } from '../widget-task-handler'; // Ensure this path is correct

interface SettingsProps {
  onNavigateToEdit?: () => void;
  onNavigateToPassword?: () => void;
}

export default function Settings({ onNavigateToEdit, onNavigateToPassword }: SettingsProps) {
  const { 
    colors, 
    fontSizes, 
    themeName, 
    isDarkMode, 
    fontScale,
    setThemeName, 
    toggleDarkMode, 
    setFontScale 
  } = useTheme();

  // --- State ---
  const [pushEnabled, setPushEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState(new Date(new Date().setHours(9, 0, 0, 0)));
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showFontModal, setShowFontModal] = useState(false);
  
  // [ADDED] Widget State
  const [widgetTheme, setWidgetTheme] = useState('Dark');
  const [showWidgetModal, setShowWidgetModal] = useState(false);

  // --- Persistence Logic ---
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedHour = await AsyncStorage.getItem('reminder_hour');
        const savedMinute = await AsyncStorage.getItem('reminder_minute');
        const savedPush = await AsyncStorage.getItem('push_enabled');
        const savedWidget = await AsyncStorage.getItem('widget_theme'); // [ADDED]

        if (savedHour !== null && savedMinute !== null) {
          const d = new Date();
          d.setHours(parseInt(savedHour), parseInt(savedMinute), 0, 0);
          setReminderTime(d);
        }
        if (savedPush !== null) setPushEnabled(savedPush === 'true');
        if (savedWidget !== null) setWidgetTheme(savedWidget); // [ADDED]
      } catch (e) { console.error(e); }
    };
    loadSettings();
  }, []);

  const handleTimeChange = async (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTimePicker(Platform.OS === 'ios'); 
    if (selectedDate) {
      setReminderTime(selectedDate);
      await AsyncStorage.setItem('reminder_hour', selectedDate.getHours().toString());
      await AsyncStorage.setItem('reminder_minute', selectedDate.getMinutes().toString());
      if (pushEnabled) await scheduleDailyQuote(selectedDate.getHours(), selectedDate.getMinutes());
    }
  };

  // [ADDED] Widget Theme Handler
  const handleWidgetThemeChange = async (theme: string) => {
    setWidgetTheme(theme);
    await AsyncStorage.setItem('widget_theme', theme);
    setShowWidgetModal(false);
    // Optional: Trigger immediate update if you have the widget ID, 
    // but usually the background task picks it up on next run.
  };

  const handleTogglePush = async (value: boolean) => {
    setPushEnabled(value);
    await AsyncStorage.setItem('push_enabled', value.toString());
    if (value) await scheduleDailyQuote(reminderTime.getHours(), reminderTime.getMinutes());
    else await cancelAllNotifications();
  };

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: () => supabase.auth.signOut() }
    ]);
  };

  // --- Render Helpers ---
  const renderSectionHeader = (title: string) => (
    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>{title.toUpperCase()}</Text>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.mainHeader, { color: colors.text }]}>Settings</Text>

        {/* --- ACCOUNT --- */}
        {renderSectionHeader('Account')}
        <View style={[styles.groupedContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ListItem containerStyle={styles.listItem} onPress={onNavigateToEdit} bottomDivider>
            <Icon name="user" type="feather" color={colors.primary} size={20} />
            <ListItem.Content><ListItem.Title style={[styles.rowTitle, { color: colors.text, fontSize: fontSizes.body }]}>Edit Profile</ListItem.Title></ListItem.Content>
            <ListItem.Chevron color={colors.textSecondary} />
          </ListItem>
          <ListItem containerStyle={styles.listItem} onPress={onNavigateToPassword}>
            <Icon name="lock" type="feather" color={colors.primary} size={20} />
            <ListItem.Content><ListItem.Title style={[styles.rowTitle, { color: colors.text, fontSize: fontSizes.body }]}>Change Password</ListItem.Title></ListItem.Content>
            <ListItem.Chevron color={colors.textSecondary} />
          </ListItem>
        </View>

        {/* --- NOTIFICATIONS --- */}
        {renderSectionHeader('Notifications')}
        <View style={[styles.groupedContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ListItem containerStyle={styles.listItem} bottomDivider>
            <Icon name="bell" type="feather" color={colors.primary} size={20} />
            <ListItem.Content><ListItem.Title style={[styles.rowTitle, { color: colors.text, fontSize: fontSizes.body }]}>Push Notifications</ListItem.Title></ListItem.Content>
            <Switch 
              value={pushEnabled} 
              onValueChange={handleTogglePush} 
              trackColor={{ false: '#767577', true: '#C5A059' }} 
              thumbColor={Platform.OS === 'ios' ? undefined : '#f4f3f4'}
            />
          </ListItem>
          <ListItem containerStyle={styles.listItem} onPress={() => setShowTimePicker(true)}>
            <Icon name="clock" type="feather" color={colors.primary} size={20} />
            <ListItem.Content><ListItem.Title style={[styles.rowTitle, { color: colors.text, fontSize: fontSizes.body }]}>Daily Reminder</ListItem.Title></ListItem.Content>
            <Text style={{ color: colors.textSecondary, fontSize: fontSizes.body }}>
              {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </ListItem>
          {showTimePicker && (
            <DateTimePicker value={reminderTime} mode="time" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handleTimeChange} />
          )}
        </View>

        {/* --- APPEARANCE --- */}
        {renderSectionHeader('Appearance')}
        <View style={[styles.groupedContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ListItem containerStyle={styles.listItem} bottomDivider>
            <Icon name="moon" type="feather" color={colors.primary} size={20} />
            <ListItem.Content><ListItem.Title style={[styles.rowTitle, { color: colors.text, fontSize: fontSizes.body }]}>Dark Mode</ListItem.Title></ListItem.Content>
            <Switch 
              value={isDarkMode} 
              onValueChange={toggleDarkMode} 
              trackColor={{ false: '#767577', true: '#C5A059' }} 
            />
          </ListItem>
          <ListItem containerStyle={styles.listItem} bottomDivider onPress={() => setShowThemeModal(true)}>
            <Icon name="droplet" type="feather" color={colors.primary} size={20} />
            <ListItem.Content><ListItem.Title style={[styles.rowTitle, { color: colors.text, fontSize: fontSizes.body }]}>App Theme</ListItem.Title></ListItem.Content>
            <Text style={{ color: colors.textSecondary, fontSize: fontSizes.body }}>{themeName}</Text>
            <ListItem.Chevron color={colors.textSecondary} />
          </ListItem>
          
          {/* [ADDED] Widget Theme Row */}
          <ListItem containerStyle={styles.listItem} bottomDivider onPress={() => setShowWidgetModal(true)}>
            <Icon name="grid" type="feather" color={colors.primary} size={20} />
            <ListItem.Content><ListItem.Title style={[styles.rowTitle, { color: colors.text, fontSize: fontSizes.body }]}>Widget Style</ListItem.Title></ListItem.Content>
            <Text style={{ color: colors.textSecondary, fontSize: fontSizes.body }}>{widgetTheme}</Text>
            <ListItem.Chevron color={colors.textSecondary} />
          </ListItem>

          <ListItem containerStyle={styles.listItem} onPress={() => setShowFontModal(true)}>
            <Icon name="type" type="feather" color={colors.primary} size={20} />
            <ListItem.Content><ListItem.Title style={[styles.rowTitle, { color: colors.text, fontSize: fontSizes.body }]}>Font Size</ListItem.Title></ListItem.Content>
            <Icon name="chevron-right" type="feather" color={colors.textSecondary} size={16} />
          </ListItem>
        </View>

        {/* LOGOUT */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={[styles.logoutText, { fontSize: fontSizes.body }]}>Log Out</Text>
        </TouchableOpacity>

        {/* FOOTER */}
        <View style={styles.footer}>
            <Text style={[styles.footerBrand, { color: colors.text }]}>QuoteVault</Text>
            <Text style={[styles.footerInfo, { color: colors.textSecondary }]}>Version 1.0.0</Text>
            <Text style={[styles.footerInfo, { color: colors.textSecondary }]}>© 2026 All rights reserved</Text>
        </View>
      </ScrollView>

      {/* Theme Modal */}
      <Modal visible={showThemeModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select App Theme</Text>
            {(['Classic', 'Ocean', 'Nature'] as ThemeName[]).map((name) => (
              <ListItem key={name} containerStyle={{ backgroundColor: 'transparent' }} onPress={() => { setThemeName(name); setShowThemeModal(false); }}>
                <ListItem.Content><ListItem.Title style={{ color: colors.text, fontWeight: themeName === name ? 'bold' : '400' }}>{name}</ListItem.Title></ListItem.Content>
                {themeName === name && <Icon name="check" type="feather" color={colors.primary} size={18} />}
              </ListItem>
            ))}
            <Button title="Cancel" type="clear" onPress={() => setShowThemeModal(false)} titleStyle={{ color: colors.primary, fontWeight: 'bold' }} />
          </View>
        </View>
      </Modal>
      
      {/* [ADDED] Widget Modal */}
      <Modal visible={showWidgetModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Widget Style</Text>
            {['Dark', 'Light', 'Gold'].map((name) => (
              <ListItem key={name} containerStyle={{ backgroundColor: 'transparent' }} onPress={() => handleWidgetThemeChange(name)}>
                <ListItem.Content><ListItem.Title style={{ color: colors.text, fontWeight: widgetTheme === name ? 'bold' : '400' }}>{name}</ListItem.Title></ListItem.Content>
                {widgetTheme === name && <Icon name="check" type="feather" color={colors.primary} size={18} />}
              </ListItem>
            ))}
            <Button title="Cancel" type="clear" onPress={() => setShowWidgetModal(false)} titleStyle={{ color: colors.primary, fontWeight: 'bold' }} />
          </View>
        </View>
      </Modal>

      {/* Font Modal */}
      <Modal visible={showFontModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Text Size</Text>
            {[{ l: 'Small', v: 0.8 }, { l: 'Medium', v: 1.0 }, { l: 'Large', v: 1.2 }].map((o) => (
              <ListItem key={o.l} containerStyle={{ backgroundColor: 'transparent' }} onPress={() => { setFontScale(o.v as FontScale); setShowFontModal(false); }}>
                <ListItem.Content><ListItem.Title style={{ color: colors.text, fontWeight: fontScale === o.v ? 'bold' : '400' }}>{o.l}</ListItem.Title></ListItem.Content>
                {fontScale === o.v && <Icon name="check" type="feather" color={colors.primary} size={18} />}
              </ListItem>
            ))}
            <Button title="Cancel" type="clear" onPress={() => setShowFontModal(false)} titleStyle={{ color: colors.primary, fontWeight: 'bold' }} />
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { 
    flexGrow: 1, 
    paddingBottom: 40 
  },
  mainHeader: {
    fontSize: 34,
    fontWeight: 'bold',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 20,
    marginTop: 25,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  groupedContainer: {
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  listItem: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
  },
  rowTitle: {
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 40,
    alignItems: 'center',
    padding: 15,
  },
  logoutText: {
    color: '#FF5252',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
  },
  footerBrand: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: 1,
  },
  footerInfo: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  }
});