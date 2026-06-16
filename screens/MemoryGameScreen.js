import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar, Pressable, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../utils/theme';
import { getMemoryBest, setMemoryBest } from '../utils/storage';

const { width } = Dimensions.get('window');

const EMOJIS = ['❤️', '🌹', '💖', '🌸', '💌', '🦋', '⭐', '💍', '🍫', '🌙', '🐻', '🎀'];
const COLS = 4;
const GAP = 10;
const H_PAD = 20;
const CARD_SIZE = Math.floor((width - H_PAD * 2 - GAP * (COLS - 1)) / COLS);

const DIFFICULTIES = {
  facil:   { id: 'facil',   label: 'Fácil',   emoji: '🌱', pairs: 6 },
  medio:   { id: 'medio',   label: 'Médio',   emoji: '🔥', pairs: 8 },
  dificil: { id: 'dificil', label: 'Difícil', emoji: '💀', pairs: 12 },
};
const DIFF_LIST = Object.values(DIFFICULTIES);

function buildDeck(pairs) {
  const chosen = EMOJIS.slice(0, pairs);
  return [...chosen, ...chosen]
    .map((emoji, i) => ({ key: i, emoji, matched: false }))
    .sort(() => Math.random() - 0.5);
}

function Card({ item, flipped, onPress, accent }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: flipped || item.matched ? 1 : 0,
      tension: 70, friction: 9, useNativeDriver: true,
    }).start();
  }, [flipped, item.matched]);

  const frontOpacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });
  const backOpacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0] });
  const scale = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.92, 1] });

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.card, { width: CARD_SIZE, height: CARD_SIZE, transform: [{ scale }] }]}>
        {/* Verso */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.cardFace, { opacity: backOpacity }]}>
          <LinearGradient
            colors={[accent, '#1A0A20']}
            style={[StyleSheet.absoluteFill, styles.cardInner]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text style={styles.cardBackEmoji}>💕</Text>
        </Animated.View>
        {/* Frente */}
        <Animated.View style={[
          StyleSheet.absoluteFill, styles.cardFace, styles.cardFront,
          item.matched && { borderColor: accent, borderWidth: 2 },
          { opacity: frontOpacity },
        ]}>
          <Text style={styles.cardEmoji}>{item.emoji}</Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

export default function MemoryGameScreen({ onBack }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [diff, setDiff] = useState('medio');
  const [stage, setStage] = useState('intro'); // intro | playing
  const [deck, setDeck] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matchedCount, setMatchedCount] = useState(0);
  const [moves, setMoves] = useState(0);
  const [best, setBest] = useState(0);
  const [won, setWon] = useState(false);
  const [newRecord, setNewRecord] = useState(false);
  const lock = useRef(false);

  const winScale = useRef(new Animated.Value(0.8)).current;
  const winOpacity = useRef(new Animated.Value(0)).current;

  const pairs = DIFFICULTIES[diff].pairs;

  useEffect(() => { getMemoryBest(diff).then(setBest); }, [diff]);

  const startGame = useCallback((chosen) => {
    const d = chosen || diff;
    setDiff(d);
    setDeck(buildDeck(DIFFICULTIES[d].pairs));
    setFlipped([]);
    setMatchedCount(0);
    setMoves(0);
    setWon(false);
    setNewRecord(false);
    lock.current = false;
    winScale.setValue(0.8);
    winOpacity.setValue(0);
    setStage('playing');
  }, [diff]);

  const handlePress = (index) => {
    if (lock.current) return;
    if (flipped.length >= 2) return;
    if (deck[index].matched) return;
    if (flipped.includes(index)) return;
    if (flipped.length === 0) {
      setFlipped([index]);
      return;
    }
    const first = flipped[0];
    setFlipped([first, index]);
    setMoves((m) => m + 1);

    if (deck[first].emoji === deck[index].emoji) {
      setTimeout(() => {
        setDeck((d) => d.map((c, i) => (i === first || i === index ? { ...c, matched: true } : c)));
        setFlipped([]);
        setMatchedCount((c) => c + 1);
      }, 350);
    } else {
      lock.current = true;
      setTimeout(() => {
        setFlipped([]);
        lock.current = false;
      }, 800);
    }
  };

  useEffect(() => {
    if (stage === 'playing' && matchedCount === pairs && pairs > 0 && !won) {
      setWon(true);
      (async () => {
        const isRecord = await setMemoryBest(diff, moves);
        setNewRecord(isRecord);
        if (isRecord) setBest(moves);
      })();
      Animated.parallel([
        Animated.spring(winScale, { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }),
        Animated.timing(winOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [matchedCount]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#0D0518', '#1A0A20', theme.accentDark]} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={stage === 'playing' ? () => setStage('intro') : onBack} style={styles.backBtn} activeOpacity={0.8}>
          <Text style={styles.backTxt}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🧠 Jogo da Memória</Text>
        <View style={{ width: 70 }} />
      </View>

      {stage === 'intro' ? (
        <View style={styles.center}>
          <Text style={styles.introEmoji}>🧠</Text>
          <Text style={styles.introTitle}>Jogo da Memória</Text>
          <Text style={styles.introSub}>
            Vire as cartas e encontre todos os pares de corações.{'\n'}
            Quanto menos jogadas, melhor! 💕
          </Text>

          <Text style={styles.diffLabel}>Escolha a dificuldade</Text>
          <View style={styles.diffRow}>
            {DIFF_LIST.map((d) => {
              const active = diff === d.id;
              return (
                <TouchableOpacity
                  key={d.id}
                  onPress={() => setDiff(d.id)}
                  activeOpacity={0.85}
                  style={[styles.diffBtn, active && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                >
                  <Text style={styles.diffEmoji}>{d.emoji}</Text>
                  <Text style={[styles.diffTxt, active && { color: '#FFFFFF' }]}>{d.label}</Text>
                  <Text style={[styles.diffPairs, active && { color: 'rgba(255,255,255,0.85)' }]}>{d.pairs} pares</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity onPress={() => startGame()} activeOpacity={0.85} style={styles.startBtnWrap}>
            <LinearGradient colors={[theme.accent, theme.accentDark]} style={styles.startBtn}>
              <Text style={styles.startBtnTxt}>▶ Começar</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.bestTxt}>Recorde ({DIFFICULTIES[diff].label}): {best || '—'} jogadas 💖</Text>
        </View>
      ) : (
        <>
          <View style={styles.statsRow}>
            <View style={styles.stat}><Text style={styles.statNum}>{moves}</Text><Text style={styles.statLbl}>jogadas</Text></View>
            <View style={styles.stat}><Text style={styles.statNum}>{matchedCount}/{pairs}</Text><Text style={styles.statLbl}>pares</Text></View>
            <View style={styles.stat}><Text style={styles.statNum}>{best || '—'}</Text><Text style={styles.statLbl}>recorde</Text></View>
          </View>

          <ScrollView contentContainerStyle={styles.boardScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.board}>
              {deck.map((item, i) => (
                <Card
                  key={item.key}
                  item={item}
                  flipped={flipped.includes(i)}
                  accent={theme.accent}
                  onPress={() => handlePress(i)}
                />
              ))}
            </View>
          </ScrollView>
        </>
      )}

      {won && (
        <View style={styles.winOverlay}>
          <Animated.View style={[styles.winCard, { opacity: winOpacity, transform: [{ scale: winScale }] }]}>
            <LinearGradient
              colors={[theme.accent, theme.accentDark]}
              style={StyleSheet.absoluteFill}
              borderRadius={26}
            />
            <Text style={styles.winEmoji}>🎉</Text>
            <Text style={styles.winTitle}>Você venceu, Mary!</Text>
            <Text style={styles.winSub}>
              {newRecord
                ? `Novo recorde no ${DIFFICULTIES[diff].label}! Só ${moves} jogadas 🏆`
                : `Completou em ${moves} jogadas 💖`}
            </Text>
            <Text style={styles.winNote}>
              Cada par é um motivo a mais pra eu gostar de você.
            </Text>
            <TouchableOpacity style={styles.winBtn} onPress={() => startGame()} activeOpacity={0.85}>
              <Text style={styles.winBtnTxt}>Jogar de novo 🔁</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setWon(false); setStage('intro'); }} style={{ marginTop: 12 }}>
              <Text style={styles.winBack}>Trocar dificuldade</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 10,
  },
  backBtn: { paddingVertical: 6, paddingHorizontal: 10, width: 70 },
  backTxt: { color: '#FFD6E4', fontSize: 14, fontWeight: '700' },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  introEmoji: { fontSize: 64, marginBottom: 12 },
  introTitle: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', textAlign: 'center' },
  introSub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 12, lineHeight: 21, fontStyle: 'italic' },

  diffLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 26, textTransform: 'uppercase' },
  diffRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  diffBtn: {
    alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)', minWidth: 92,
  },
  diffEmoji: { fontSize: 22, marginBottom: 3 },
  diffTxt: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  diffPairs: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 2 },

  startBtnWrap: { marginTop: 26, borderRadius: 50, overflow: 'hidden' },
  startBtn: { paddingVertical: 15, paddingHorizontal: 44, borderRadius: 50 },
  startBtnTxt: { color: '#FFFFFF', fontWeight: '900', fontSize: 17 },
  bestTxt: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 16, fontWeight: '700' },

  statsRow: { flexDirection: 'row', justifyContent: 'center', gap: 28, marginTop: 6, marginBottom: 12 },
  stat: { alignItems: 'center' },
  statNum: { color: '#FFD700', fontSize: 22, fontWeight: '900' },
  statLbl: { color: 'rgba(255,182,193,0.7)', fontSize: 11, marginTop: 2 },

  boardScroll: { paddingBottom: 30, alignItems: 'center' },
  board: {
    flexDirection: 'row', flexWrap: 'wrap', gap: GAP,
    paddingHorizontal: H_PAD, justifyContent: 'center',
    width: '100%',
  },
  card: { borderRadius: 14 },
  cardFace: {
    borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', backfaceVisibility: 'hidden',
  },
  cardInner: { borderRadius: 14 },
  cardFront: { backgroundColor: '#FFFFFF' },
  cardBackEmoji: { fontSize: 26, opacity: 0.85 },
  cardEmoji: { fontSize: 34 },

  winOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center', padding: 28,
  },
  winCard: {
    width: '100%', borderRadius: 26, padding: 30, alignItems: 'center', overflow: 'hidden',
  },
  winEmoji: { fontSize: 56, marginBottom: 10 },
  winTitle: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', textAlign: 'center' },
  winSub: { fontSize: 15, color: 'rgba(255,255,255,0.95)', marginTop: 8, textAlign: 'center', fontWeight: '700' },
  winNote: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 14, textAlign: 'center', fontStyle: 'italic', lineHeight: 20 },
  winBtn: {
    marginTop: 22, backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 13, paddingHorizontal: 30, borderRadius: 50,
  },
  winBtnTxt: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  winBack: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textDecorationLine: 'underline' },
});
