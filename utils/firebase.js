import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore, initializeFirestore, doc, getDoc, setDoc, deleteDoc, onSnapshot,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyAXwU0da1u5ATmJecTRnLBalFB6Sbnig_E',
  authDomain: 'mary-love-2601d.firebaseapp.com',
  projectId: 'mary-love-2601d',
  storageBucket: 'mary-love-2601d.firebasestorage.app',
  messagingSenderId: '687041657673',
  appId: '1:687041657673:web:a99f393aa2b9423124b898',
};

let db = null;

function getDb() {
  if (db) return db;
  try {
    const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
    // Long polling deixa o realtime (onSnapshot) confiável no React Native.
    try {
      db = initializeFirestore(app, { experimentalForceLongPolling: true });
    } catch (_) {
      // Já inicializado (ex: hot reload) — reaproveita.
      db = getFirestore(app);
    }
  } catch (_) {}
  return db;
}

async function fetchDoc(path) {
  try {
    const firestore = getDb();
    if (!firestore) return null;
    const snap = await getDoc(doc(firestore, ...path.split('/')));
    return snap.exists() ? snap.data() : null;
  } catch (_) {
    return null;
  }
}

async function writeDoc(path, data) {
  try {
    const firestore = getDb();
    if (!firestore) return false;
    await setDoc(doc(firestore, ...path.split('/')), {
      ...data,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (_) {
    return false;
  }
}

// Salva o push token do Expo no Firestore para o painel admin usar.
export async function savePushToken(token) {
  if (!token) return;
  await writeDoc('config/pushToken', { token });
}

// ── Carinho: humor, desejos, saudade e áudios ────────────────
export async function getSavedMood() {
  try {
    const raw = await AsyncStorage.getItem('mary_mood');
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export async function saveMood(mood) {
  if (!mood?.id) return false;
  const payload = {
    id: mood.id,
    emoji: mood.emoji || '💗',
    label: mood.label || 'Meu humor',
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem('mary_mood', JSON.stringify(payload));
  return writeDoc('config/maryMood', payload);
}

export async function getAffectionData() {
  const [wishesData, audiosData] = await Promise.all([
    fetchDoc('config/wishes'),
    fetchDoc('config/audios'),
  ]);

  if (Array.isArray(wishesData?.list)) {
    await AsyncStorage.setItem('mary_wishes', JSON.stringify(wishesData.list));
  }
  if (Array.isArray(audiosData?.list)) {
    await AsyncStorage.setItem('mary_audios', JSON.stringify(audiosData.list));
  }

  try {
    const [wishesRaw, audiosRaw] = await Promise.all([
      AsyncStorage.getItem('mary_wishes'),
      AsyncStorage.getItem('mary_audios'),
    ]);
    return {
      wishes: wishesRaw ? JSON.parse(wishesRaw) : [],
      audios: audiosRaw ? JSON.parse(audiosRaw) : [],
    };
  } catch (_) {
    return { wishes: [], audios: [] };
  }
}

export async function sendMissingYou() {
  const current = await fetchDoc('config/missingYou');
  const count = Number(current?.count || 0) + 1;
  const payload = {
    active: true,
    count,
    lastSentAt: new Date().toISOString(),
    message: 'A Mary apertou o botão de saudade e queria você pertinho agora. 💗',
  };
  await AsyncStorage.setItem('last_missing_you', JSON.stringify(payload));
  return writeDoc('config/missingYou', payload);
}

// Sincroniza tudo ao abrir o app.
// Retorna o que foi aplicado para uso imediato (ex: reagendar notificações).
export async function syncFromFirebase() {
  const [notifData, phrasesData, surprisesData, startDateData, specialMsgData, wishesData, audiosData] = await Promise.all([
    fetchDoc('config/notifications'),
    fetchDoc('config/phrases'),
    fetchDoc('config/surprises'),
    fetchDoc('config/startDate'),
    fetchDoc('config/specialMessage'),
    fetchDoc('config/wishes'),
    fetchDoc('config/audios'),
  ]);

  let intervalHours = null;

  if (notifData && typeof notifData.intervalHours === 'number') {
    intervalHours = notifData.intervalHours;
    await AsyncStorage.setItem('notif_interval_hours', String(intervalHours));
  }

  if (phrasesData && Array.isArray(phrasesData.list)) {
    await AsyncStorage.setItem('phrases', JSON.stringify(phrasesData.list));
  }

  if (surprisesData && Array.isArray(surprisesData.list)) {
    await AsyncStorage.setItem('remote_surprises', JSON.stringify(surprisesData.list));
  }

  if (startDateData && startDateData.date) {
    await AsyncStorage.setItem('start_date', startDateData.date);
  }

  if (wishesData && Array.isArray(wishesData.list)) {
    await AsyncStorage.setItem('mary_wishes', JSON.stringify(wishesData.list));
  }

  if (audiosData && Array.isArray(audiosData.list)) {
    await AsyncStorage.setItem('mary_audios', JSON.stringify(audiosData.list));
  }

  // Mensagem especial: guarda localmente para o app exibir
  const specialMsg = specialMsgData && specialMsgData.text ? specialMsgData : null;
  if (specialMsg) {
    await AsyncStorage.setItem('special_message', JSON.stringify(specialMsg));
  } else {
    await AsyncStorage.removeItem('special_message');
  }

  // Mensagem do Bot do Amor: pega a mais recente do histórico
  const botSnap = await fetchDoc('config/botHistory');
  if (botSnap && Array.isArray(botSnap.list) && botSnap.list.length > 0) {
    const latest = botSnap.list[0];
    await AsyncStorage.setItem('bot_daily_message', JSON.stringify(latest));
  }

  return { intervalHours, specialMsg };
}

// Lê a mensagem especial salva localmente (já sincronizada)
export async function getSpecialMessage() {
  try {
    const raw = await AsyncStorage.getItem('special_message');
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

// Marca mensagem especial como vista (para não mostrar de novo)
export async function dismissSpecialMessage() {
  await AsyncStorage.removeItem('special_message');
}

// ── Notificação de teste (painel admin → celular) ──────────────
// O admin escreve em config/testNotification e o app, escutando em tempo
// real, dispara uma notificação local. Só funciona com o app aberto.
const TEST_SEEN_KEY = 'last_test_notif_id';
const TEST_MAX_AGE_MS = 5 * 60 * 1000; // ignora testes com mais de 5 min

let testUnsub = null;

export function listenForTestNotification(onTest) {
  try {
    const firestore = getDb();
    if (!firestore) return () => {};

    // Evita listeners duplicados (ex: hot reload).
    if (testUnsub) { testUnsub(); testUnsub = null; }

    const ref = doc(firestore, 'config', 'testNotification');
    testUnsub = onSnapshot(
      ref,
      async (snap) => {
        try {
          if (!snap.exists()) return;
          const data = snap.data();
          if (!data || data.id == null) return;

          const id = String(data.id);
          const lastId = await AsyncStorage.getItem(TEST_SEEN_KEY);
          if (id === lastId) return; // já tratado

          await AsyncStorage.setItem(TEST_SEEN_KEY, id);

          // Só dispara testes recentes — assim um teste antigo não aparece
          // do nada quando a Mary reabre o app dias depois.
          const createdAt = Number(data.createdAt) || 0;
          if (createdAt && Date.now() - createdAt > TEST_MAX_AGE_MS) return;

          onTest({
            title: data.title || '💖 Mensagem de teste',
            body: data.body || 'Funcionou! 💕',
          });
        } catch (_) {}
      },
      () => {}
    );

    return () => { if (testUnsub) { testUnsub(); testUnsub = null; } };
  } catch (_) {
    return () => {};
  }
}
