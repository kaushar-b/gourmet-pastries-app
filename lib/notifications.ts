import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ─────────────────────────────────────────────────────────────────────────
// NOTIFICATION CHANNELS (Android only)
// Currently using default system sound for all channels.
// REMINDER: to add custom ping sounds later —
//   1. Drop .wav files in assets/sounds/
//   2. Add them to app.json's expo-notifications plugin "sounds" array
//   3. Change sound: 'default' below to your filename (e.g. 'manager_ping.wav')
//   4. Rebuild (sounds are native, need a new EAS build)
// ─────────────────────────────────────────────────────────────────────────
export const CHANNELS = {
  MANAGER: 'manager-orders',
  DRIVER: 'driver-orders',
  CUSTOMER: 'customer-updates',
} as const;

export async function setupNotificationChannels() {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(CHANNELS.MANAGER, {
    name: 'Manager Orders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
  });

  await Notifications.setNotificationChannelAsync(CHANNELS.DRIVER, {
    name: 'Driver Orders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
  });

  await Notifications.setNotificationChannelAsync(CHANNELS.CUSTOMER, {
    name: 'Order Updates',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    vibrationPattern: [0, 250, 250, 250],
  });
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  await setupNotificationChannels();

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    null;

  if (!projectId) return null;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (err: any) {
    try {
      const { ref: dbRef, set: dbSet } = await import('firebase/database');
      const { db } = await import('./firebase');
      await dbSet(dbRef(db, 'debug/pushTokenError'), {
        error: err?.message ?? String(err),
        projectId,
        timestamp: Date.now(),
      });
    } catch {}
    return null;
  }
}

export async function sendPushNotification(
  to: string,
  title: string,
  body: string,
  channelId: string
): Promise<void> {
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        title,
        body,
        sound: 'default',
        channelId,
        priority: 'high',
      }),
    });
  } catch {
    // Push failures should never block the main action
  }
}
