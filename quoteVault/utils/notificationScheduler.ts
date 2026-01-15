import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

/**
 * 1. Request Permission
 * We only ask for permission to show alerts/sounds.
 * We REMOVED getExpoPushTokenAsync to prevent the Expo Go error.
 */
export async function requestPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  // Android needs a channel to display anything
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-quotes', {
      name: 'Daily Quotes',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFD700',
    });
  }

  return finalStatus === 'granted';
}

/**
 * 2. Schedule Daily Quote
 * Stays local to the device. No server required.
 */
export async function scheduleDailyQuote(overrideHour?: number, overrideMinute?: number) {
  try {
    const savedHour = await AsyncStorage.getItem('reminder_hour');
    const savedMinute = await AsyncStorage.getItem('reminder_minute');

    const h = overrideHour !== undefined ? overrideHour : (savedHour ? parseInt(savedHour) : 9);
    const m = overrideMinute !== undefined ? overrideMinute : (savedMinute ? parseInt(savedMinute) : 0);

    // Fetch a quote to show in the notification body
    const { data } = await supabase.from('quotes').select('content').limit(1);
    const quoteBody = data && data[0] ? data[0].content : "Your daily wisdom is waiting.";

    // Clear old schedules
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule local notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Quote of the Day 🌿",
        body: `"${quoteBody}"`,
        data: { screen: 'QuoteOfTheDay' },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: h,
        minute: m,
      } as any,
    });

    console.log(`[Local Notify] Set for ${h}:${m.toString().padStart(2, '0')}`);
    
  } catch (error) {
    console.error('Notification Error:', error);
  }
}

export const cancelAllNotifications = () => Notifications.cancelAllScheduledNotificationsAsync();