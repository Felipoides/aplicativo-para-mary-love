import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getPhrases } from './storage';
import * as Notifications from 'expo-notifications';

// No Expo Go SDK 53+, notificações remotas foram removidas.
// Notificações locais ainda funcionam, mas setNotificationHandler pode lançar.
// Usamos try/catch em cada chamada individualmente.
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
} catch (_) {}

const NOTIF_TITLES = [
  '💖 oi',
  '🌹 passando aqui',
  '✨ lembrei de você',
  '💌 só pra falar',
  '🌸 ei',
  '💫 uma coisinha',
  '🦋 oi sumida',
  '💝 tô aqui',
  '☀️ olha só',
  '🎯 rapidinho',
];

const STORAGE_KEY = 'notif_interval_hours';

export const NOTIFICATION_INTERVALS = [
  { label: '30 min', value: 0.5 },
  { label: '1 hora', value: 1 },
  { label: '2 horas', value: 2 },
  { label: '3 horas', value: 3 },
  { label: '4 horas', value: 4 },
  { label: '6 horas', value: 6 },
  { label: '12 horas', value: 12 },
  { label: 'Desativado', value: 0 },
];

export async function requestNotificationPermission() {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (_) { return false; }
}

export async function getNotificationInterval() {
  const v = await AsyncStorage.getItem(STORAGE_KEY);
  return v !== null ? parseFloat(v) : 1;
}

export async function setNotificationInterval(hours) {
  await AsyncStorage.setItem(STORAGE_KEY, String(hours));
}

export async function scheduleHourlyNotifications(intervalHours) {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const hours = intervalHours !== undefined ? intervalHours : await getNotificationInterval();
    if (hours === 0) return false;

    const granted = await requestNotificationPermission();
    if (!granted) return false;

    const phrases = await getPhrases();
    const now = new Date();
    const totalSlots = Math.min(Math.floor(24 / hours), 48);

    for (let i = 1; i <= totalSlots; i++) {
      const fireTime = new Date(now.getTime() + i * hours * 60 * 60 * 1000);
      const phraseIdx = (now.getHours() + i) % phrases.length;
      const titleIdx = (now.getHours() + i) % NOTIF_TITLES.length;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: NOTIF_TITLES[titleIdx],
          body: phrases[phraseIdx],
          sound: true,
          ...(Platform.OS === 'android' && {
            color: '#C0395A',
            vibrate: [0, 250, 250, 250],
          }),
        },
        trigger: { date: fireTime },
      });
    }

    return true;
  } catch (_) { return false; }
}

export async function cancelAllNotifications() {
  try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch (_) {}
}

export async function getScheduledCount() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.length;
  } catch (_) { return 0; }
}

export async function sendTestNotification(phrase) {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return false;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💌 Frase do dia para Mary',
        body: phrase,
        sound: true,
      },
      trigger: { seconds: 3 },
    });
    return true;
  } catch (_) { return false; }
}
