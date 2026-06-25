import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOVE_LETTERS, LOVE_PHRASES, SURPRISES } from '../constants/phrases';

const DEFAULT_START_DATE = '2024-01-01';

export const getDaysTogether = async () => {
  const dateStr = (await AsyncStorage.getItem('start_date')) || DEFAULT_START_DATE;
  const start = new Date(dateStr);
  const now = new Date();
  return Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
};

export const getStartDate = async () =>
  (await AsyncStorage.getItem('start_date')) || DEFAULT_START_DATE;

export const setStartDate = async (date) =>
  AsyncStorage.setItem('start_date', date);

export const getLetters = async () => {
  const data = await AsyncStorage.getItem('letters');
  return data ? JSON.parse(data) : LOVE_LETTERS;
};

export const saveLetters = async (letters) =>
  AsyncStorage.setItem('letters', JSON.stringify(letters));

export const getPhrases = async () => {
  const data = await AsyncStorage.getItem('phrases');
  return data ? JSON.parse(data) : LOVE_PHRASES;
};

export const savePhrases = async (phrases) =>
  AsyncStorage.setItem('phrases', JSON.stringify(phrases));

export const getTodayPhrase = async () => {
  try {
    const raw = await AsyncStorage.getItem('bot_daily_message');
    if (raw) {
      const bot = JSON.parse(raw);
      const today = new Date().toISOString().slice(0, 10);
      if (bot.text && bot.date === today) return bot.text;
    }
  } catch (_) {}
  const phrases = await getPhrases();
  const dayOfYear = Math.floor(
    (new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
  );
  return phrases[dayOfYear % phrases.length];
};

export const getFlappyBest = async () => {
  const v = await AsyncStorage.getItem('flappy_best');
  return v ? parseInt(v) : 0;
};

export const setFlappyBest = async (score) =>
  AsyncStorage.setItem('flappy_best', String(score));

// Jogo da memória: melhor = menor número de jogadas (0 = ainda não jogou),
// guardado por dificuldade (facil | medio | dificil)
export const getMemoryBest = async (diff = 'medio') => {
  const v = await AsyncStorage.getItem(`memory_best_${diff}`);
  return v ? parseInt(v) : 0;
};

export const setMemoryBest = async (diff, moves) => {
  const cur = await getMemoryBest(diff);
  if (cur === 0 || moves < cur) {
    await AsyncStorage.setItem(`memory_best_${diff}`, String(moves));
    return true;
  }
  return false;
};

// Melhor marca geral da memória (menor nº de jogadas entre as dificuldades)
export const getMemoryBestOverall = async () => {
  const vals = await Promise.all(['facil', 'medio', 'dificil'].map((d) => getMemoryBest(d)));
  const nonZero = vals.filter((v) => v > 0);
  return nonZero.length ? Math.min(...nonZero) : 0;
};

// Pega-corações: melhor = maior pontuação
export const getCatchBest = async () => {
  const v = await AsyncStorage.getItem('catch_best');
  return v ? parseInt(v) : 0;
};

export const setCatchBest = async (score) => {
  const cur = await getCatchBest();
  if (score > cur) {
    await AsyncStorage.setItem('catch_best', String(score));
    return true;
  }
  return false;
};

export const incrementOpenCount = async () => {
  const v = await AsyncStorage.getItem('open_count');
  const count = (v ? parseInt(v) : 0) + 1;
  await AsyncStorage.setItem('open_count', String(count));
  return count;
};

export const getOpenCount = async () => {
  const v = await AsyncStorage.getItem('open_count');
  return v ? parseInt(v) : 0;
};

export const getTodaySurprise = async () => {
  const today = new Date().toDateString();
  const lastDate = await AsyncStorage.getItem('surprise_date');

  // Usa lista remota se disponível, senão usa padrão
  let pool = SURPRISES;
  try {
    const raw = await AsyncStorage.getItem('remote_surprises');
    if (raw) {
      const remote = JSON.parse(raw);
      if (Array.isArray(remote) && remote.length > 0) pool = remote;
    }
  } catch (_) {}

  let idx = parseInt((await AsyncStorage.getItem('surprise_index')) || '0');

  if (lastDate !== today) {
    idx = (idx + 1) % pool.length;
    await AsyncStorage.setItem('surprise_date', today);
    await AsyncStorage.setItem('surprise_index', String(idx));
  }

  return pool[idx % pool.length];
};

export const getTheme = async () =>
  (await AsyncStorage.getItem('theme')) || 'rose';

export const setTheme = async (theme) =>
  AsyncStorage.setItem('theme', theme);

export const getFlappyGamesPlayed = async () => {
  const v = await AsyncStorage.getItem('flappy_games');
  return v ? parseInt(v) : 0;
};

export const incrementFlappyGames = async () => {
  const v = await AsyncStorage.getItem('flappy_games');
  const count = (v ? parseInt(v) : 0) + 1;
  await AsyncStorage.setItem('flappy_games', String(count));
  return count;
};

export const resetAll = async () => {
  const keys = [
    'start_date', 'letters', 'phrases', 'flappy_best',
    'open_count', 'surprise_date', 'surprise_index', 'theme', 'flappy_games',
    'memory_best_facil', 'memory_best_medio', 'memory_best_dificil', 'catch_best',
  ];
  await AsyncStorage.multiRemove(keys);
};
