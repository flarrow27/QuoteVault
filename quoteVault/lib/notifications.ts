import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FFD700',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      // alert('Failed to get push token for push notification!');
      return;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      token = tokenData.data;
      console.log('Notification Token:', token);
    } catch (error) {
      console.log('Error fetching token:', error);
    }
  }

  return token;
}

export async function scheduleDailyQuoteNotification() {
  // Cancel existing notifications to avoid duplicates
  await Notifications.cancelAllScheduledNotificationsAsync();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Quote of the Day",
      body: "Your daily dose of wisdom is waiting.",
      sound: true,
    },
    trigger: {
      hour: 9,
      minute: 0,
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
    },
  });

  console.log("Daily notification scheduled for 9:00 AM.");
}