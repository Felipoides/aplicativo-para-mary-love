import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getPhrases } from './storage';

// ─────────────────────────────────────────────────────────────
// Sistema de notificações — Mary Love
//
// Observações importantes:
// • No Expo Go (SDK 53+) as notificações REMOTAS (push) foram removidas.
//   As notificações LOCAIS continuam funcionando — é o que usamos aqui.
// • A "notificação de teste" do painel admin chega via Firebase: o app
//   escuta o Firestore e dispara uma notificação local (precisa estar aberto).
// • Para push real com o app fechado seria necessário um build de
//   desenvolvimento + Expo Push Tokens.
// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'notif_interval_hours';
const ANDROID_CHANNEL_ID = 'love-messages';
const ACCENT = '#C0395A';

// Janela de silêncio: não agenda nada de madrugada para não acordar a Mary.
// Notificações só caem entre QUIET_END (08h) e QUIET_START (23h).
const QUIET_START = 23;
const QUIET_END = 8;

// Quantas notificações no máximo manter agendadas de uma vez.
const MAX_SCHEDULED = 48;

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

// ── Setup (handler de primeiro plano + canal Android) ──────────

// O handler define como a notificação aparece com o app aberto.
// Setado no carregamento do módulo para já valer na primeira notificação.
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      // chave antiga, mantida por compatibilidade
      shouldShowAlert: true,
    }),
  });
} catch (_) {}

let channelReady = false;
async function ensureAndroidChannel() {
  if (Platform.OS !== 'android' || channelReady) return;
  try {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Mensagens de amor',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: ACCENT,
      sound: 'default',
    });
    channelReady = true;
  } catch (_) {}
}

// Chamado uma vez quando o app abre.
export async function setupNotifications() {
  await ensureAndroidChannel();
}

// ── Permissões ─────────────────────────────────────────────────

export async function requestNotificationPermission() {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (_) {
    return false;
  }
}

// ── Preferência de intervalo (local) ───────────────────────────

export async function getNotificationInterval() {
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEY);
    return v !== null ? parseFloat(v) : 1;
  } catch (_) {
    return 1;
  }
}

export async function setNotificationInterval(hours) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, String(hours));
  } catch (_) {}
}

// ── Disparo imediato (helper) ──────────────────────────────────

async function fireNotification(title, body, delaySeconds = 1) {
  await ensureAndroidChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      ...(Platform.OS === 'android' && { color: ACCENT, vibrate: [0, 250, 250, 250] }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(1, delaySeconds),
      channelId: ANDROID_CHANNEL_ID,
    },
  });
}

// Notificação de teste vinda do painel admin (via Firebase).
export async function presentTestNotification(title, body) {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return false;
    await fireNotification(title || '💖 Mensagem de teste', body || 'Funcionou! 💕', 1);
    return true;
  } catch (_) {
    return false;
  }
}

// Notificação de teste disparada de dentro do app (tela de desenvolvedor).
export async function sendTestNotification(phrase) {
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return false;
    await fireNotification('💌 Frase do dia para Mary', phrase, 3);
    return true;
  } catch (_) {
    return false;
  }
}

// ── Agendamento recorrente ─────────────────────────────────────

function isQuietHour(date) {
  const h = date.getHours();
  return h >= QUIET_START || h < QUIET_END;
}

// Reagenda o lote de notificações das próximas 24h, uma para cada slot
// do intervalo escolhido, com frases e títulos alternados.
export async function scheduleHourlyNotifications(intervalHours) {
  try {
    await cancelAllNotifications();

    const hours = intervalHours !== undefined ? intervalHours : await getNotificationInterval();
    if (!hours || hours <= 0) return false;

    const granted = await requestNotificationPermission();
    if (!granted) return false;

    await ensureAndroidChannel();

    const phrases = await getPhrases();
    if (!phrases || phrases.length === 0) return false;

    const now = new Date();
    const totalSlots = Math.min(Math.floor(24 / hours), MAX_SCHEDULED);
    let scheduled = 0;

    for (let i = 1; i <= totalSlots; i++) {
      const fireTime = new Date(now.getTime() + i * hours * 60 * 60 * 1000);
      if (isQuietHour(fireTime)) continue;

      const phrase = phrases[(now.getHours() + i) % phrases.length];
      const title = NOTIF_TITLES[(now.getHours() + i) % NOTIF_TITLES.length];

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: phrase,
          sound: 'default',
          ...(Platform.OS === 'android' && { color: ACCENT, vibrate: [0, 250, 250, 250] }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: fireTime,
          channelId: ANDROID_CHANNEL_ID,
        },
      });
      scheduled++;
    }

    return scheduled > 0;
  } catch (_) {
    return false;
  }
}

export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (_) {}
}

export async function getScheduledCount() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.length;
  } catch (_) {
    return 0;
  }
}
