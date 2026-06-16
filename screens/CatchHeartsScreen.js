import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, StatusBar, Pressable, Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../utils/theme';
import { getCatchBest, setCatchBest } from '../utils/storage';

const { width, height } = Dimensions.get('window');
const ITEM_SIZE = 56;

const KINDS = [
  { emoji: '❤️', points: 1, weight: 60 },
  { emoji: '💖', points: 2, weight: 25 },
  { emoji: '💛', points: 3, weight: 10 },
  { emoji: '🌹', points: 5, weight: 5 },
];

const DIFFICULTIES = {
  facil:   { id: 'facil',   label: 'Fácil',   emoji: '🌱', seconds: 30, spawnEvery: 850, fallMin: 3400, fallMax: 5200 },
  medio:   { id: 'medio',   label: 'Médio',   emoji: '🔥', seconds: 30, spawnEvery: 600, fallMin: 2500, fallMax: 4000 },
  dificil: { id: 'dificil', label: 'Difícil', emoji: '💀', seconds: 35, spawnEvery: 420, fallMin: 1600, fallMax: 2800 },
};
const DIFF_LIST = Object.values(DIFFICULTIES);

function pickKind() {
  const total = KINDS.reduce((s, k) => s + k.weight, 0);
  let r = Math.random() * total;
  for (const k of KINDS) {
    if (r < k.weight) return k;
    r -= k.weight;
  }
  return KINDS[0];
}

// A posição é animada via `top` (layout) com useNativeDriver:false, de propósito:
// assim a área de toque acompanha o coração caindo e dá pra pegá-lo de verdade.
function FallingItem({ item, onCatch }) {
  const top = useRef(new Animated.Value(-ITEM_SIZE)).current;
  const scale = useRef(new Animated.Value(0)).current;
  const caught = useRef(false);

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, tension: 120, friction: 6, useNativeDriver: false }).start();
    Animated.timing(top, {
      toValue: height + ITEM_SIZE,
      duration: item.duration,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !caught.current) onCatch(item.id, null);
    });
  }, []);

  const handle = () => {
    if (caught.current) return;
    caught.current = true;
    top.stopAnimation();
    Animated.timing(scale, { toValue: 1.7, duration: 130, useNativeDriver: false }).start(() => {
      onCatch(item.id, item.kind);
    });
  };

  return (
    <Animated.View style={[styles.item, { left: item.x, top, transform: [{ scale }] }]}>
      <Pressable onPress={handle} hitSlop={16} style={styles.itemHit}>
        <Text style={styles.itemEmoji}>{item.kind.emoji}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function CatchHeartsScreen({ onBack }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [diff, setDiff] = useState('medio');
  const [stage, setStage] = useState('intro'); // intro | playing | over
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [best, setBest] = useState(0);
  const [items, setItems] = useState([]);
  const [newRecord, setNewRecord] = useState(false);

  const idRef = useRef(0);
  const spawnRef = useRef(null);
  const timerRef = useRef(null);
  const scoreRef = useRef(0);
  const popScale = useRef(new Animated.Value(1)).current;

  useEffect(() => { getCatchBest().then(setBest); }, []);

  const cleanup = useCallback(() => {
    if (spawnRef.current) clearInterval(spawnRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    spawnRef.current = null;
    timerRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const endGame = useCallback(async () => {
    cleanup();
    setStage('over');
    setItems([]);
    const finalScore = scoreRef.current;
    const isRecord = await setCatchBest(finalScore);
    setNewRecord(isRecord);
    if (isRecord) setBest(finalScore);
  }, [cleanup]);

  const start = (chosen) => {
    const conf = DIFFICULTIES[chosen || diff];
    cleanup();
    scoreRef.current = 0;
    idRef.current = 0;
    setScore(0);
    setTimeLeft(conf.seconds);
    setItems([]);
    setNewRecord(false);
    setStage('playing');

    spawnRef.current = setInterval(() => {
      const kind = pickKind();
      const id = ++idRef.current;
      const x = Math.random() * (width - ITEM_SIZE - 16) + 8;
      const duration = conf.fallMin + Math.random() * (conf.fallMax - conf.fallMin);
      setItems((cur) => [...cur, { id, x, kind, duration }]);
    }, conf.spawnEvery);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { endGame(); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const handleCatch = useCallback((id, kind) => {
    setItems((cur) => cur.filter((it) => it.id !== id));
    if (kind) {
      scoreRef.current += kind.points;
      setScore(scoreRef.current);
      popScale.stopAnimation();
      popScale.setValue(1);
      Animated.sequence([
        Animated.timing(popScale, { toValue: 1.22, duration: 90, useNativeDriver: true }),
        Animated.spring(popScale, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]).start();
    }
  }, [popScale]);

  const exitToIntro = () => { cleanup(); setItems([]); setStage('intro'); };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={theme.home} style={StyleSheet.absoluteFill} />
      <View style={styles.scrim} />

      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={stage === 'playing' ? exitToIntro : onBack} style={styles.backBtn} activeOpacity={0.8}>
          <Text style={styles.backTxt}>← Voltar</Text>
        </TouchableOpacity>
        <Animated.Text style={[styles.score, { transform: [{ scale: popScale }] }]}>💕 {score}</Animated.Text>
        <View style={styles.timer}>
          <Text style={styles.timerTxt}>⏱ {timeLeft}s</Text>
        </View>
      </View>

      {/* itens caindo */}
      {stage === 'playing' && items.map((it) => (
        <FallingItem key={it.id} item={it} onCatch={handleCatch} />
      ))}

      {/* tela inicial + escolha de dificuldade */}
      {stage === 'intro' && (
        <View style={styles.center}>
          <Text style={styles.bigEmoji}>💝</Text>
          <Text style={styles.startTitle}>Pega-Corações</Text>
          <Text style={styles.startSub}>
            Toque nos corações que caem antes que sumam.{'\n'}
            Os dourados e as rosas valem mais! 🌹
          </Text>

          <View style={styles.legend}>
            {KINDS.map((k) => (
              <View key={k.emoji} style={styles.legendItem}>
                <Text style={styles.legendEmoji}>{k.emoji}</Text>
                <Text style={styles.legendPts}>+{k.points}</Text>
              </View>
            ))}
          </View>

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
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity onPress={() => start()} activeOpacity={0.85} style={styles.startBtnWrap}>
            <LinearGradient colors={[theme.accent, theme.accentDark]} style={styles.startBtn}>
              <Text style={styles.startBtnTxt}>▶ Começar</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.bestTxt}>Recorde: {best} 💖</Text>
        </View>
      )}

      {/* fim de jogo */}
      {stage === 'over' && (
        <View style={styles.center}>
          <Text style={styles.bigEmoji}>{newRecord ? '🏆' : '💖'}</Text>
          <Text style={styles.startTitle}>{newRecord ? 'Novo recorde!' : 'Acabou o tempo!'}</Text>
          <Text style={styles.finalScore}>{score} pontos</Text>
          <Text style={styles.startSub}>
            {newRecord
              ? 'Você é boa nisso! Igual é boa em me deixar feliz. 💕'
              : `Seu recorde é ${best}. Bora tentar de novo?`}
          </Text>
          <TouchableOpacity onPress={() => start()} activeOpacity={0.85} style={styles.startBtnWrap}>
            <LinearGradient colors={[theme.accent, theme.accentDark]} style={styles.startBtn}>
              <Text style={styles.startBtnTxt}>🔁 Jogar de novo</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={exitToIntro} style={{ marginTop: 12 }}>
            <Text style={styles.backLink}>Trocar dificuldade</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(20,5,25,0.28)' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 10, zIndex: 50,
  },
  backBtn: { paddingVertical: 6, paddingHorizontal: 10 },
  backTxt: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  score: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 5 },
  timer: {
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 50,
    paddingVertical: 6, paddingHorizontal: 14,
  },
  timerTxt: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  item: { position: 'absolute', width: ITEM_SIZE, height: ITEM_SIZE, alignItems: 'center', justifyContent: 'center' },
  itemHit: { width: ITEM_SIZE, height: ITEM_SIZE, alignItems: 'center', justifyContent: 'center' },
  itemEmoji: { fontSize: 42 },

  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 30 },
  bigEmoji: { fontSize: 66, marginBottom: 12 },
  startTitle: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.3)', textShadowRadius: 6 },
  startSub: { fontSize: 14, color: 'rgba(255,255,255,0.92)', textAlign: 'center', marginTop: 12, lineHeight: 21, fontStyle: 'italic' },
  finalScore: { fontSize: 40, fontWeight: '900', color: '#FFD700', marginTop: 8 },

  legend: { flexDirection: 'row', gap: 18, marginTop: 18 },
  legendItem: { alignItems: 'center' },
  legendEmoji: { fontSize: 26 },
  legendPts: { color: '#FFFFFF', fontWeight: '800', fontSize: 13, marginTop: 2 },

  diffLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginTop: 24, textTransform: 'uppercase' },
  diffRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  diffBtn: {
    alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', minWidth: 84,
  },
  diffEmoji: { fontSize: 22, marginBottom: 2 },
  diffTxt: { color: 'rgba(255,255,255,0.9)', fontWeight: '800', fontSize: 13 },

  startBtnWrap: { marginTop: 24, borderRadius: 50, overflow: 'hidden' },
  startBtn: { paddingVertical: 15, paddingHorizontal: 44, borderRadius: 50 },
  startBtnTxt: { color: '#FFFFFF', fontWeight: '900', fontSize: 17 },
  bestTxt: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 16, fontWeight: '700' },
  backLink: { color: 'rgba(255,255,255,0.85)', fontSize: 13, textDecorationLine: 'underline' },
});
