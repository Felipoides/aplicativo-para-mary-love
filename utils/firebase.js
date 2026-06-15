import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
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
    db = getFirestore(app);
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

// Sincroniza tudo ao abrir o app.
// Retorna o que foi aplicado para uso imediato (ex: reagendar notificações).
export async function syncFromFirebase() {
  const [notifData, phrasesData, surprisesData, startDateData, specialMsgData] = await Promise.all([
    fetchDoc('config/notifications'),
    fetchDoc('config/phrases'),
    fetchDoc('config/surprises'),
    fetchDoc('config/startDate'),
    fetchDoc('config/specialMessage'),
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

  // Mensagem especial: guarda localmente para o app exibir
  const specialMsg = specialMsgData && specialMsgData.text ? specialMsgData : null;
  if (specialMsg) {
    await AsyncStorage.setItem('special_message', JSON.stringify(specialMsg));
  } else {
    await AsyncStorage.removeItem('special_message');
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
