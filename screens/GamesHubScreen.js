import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, ScrollView, StatusBar, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../utils/theme';
import {
  getFlappyBest, getMemoryBestOverall, getCatchBest,
} from '../utils/storage';
import FlappyBirdScreen from './FlappyBirdScreen';
import MemoryGameScreen from './MemoryGameScreen';
import CatchHeartsScreen from './CatchHeartsScreen';

const GAMES = [
  {
    id: 'flappy',
    emoji: '🐦',
    title: 'Flappy Love',
    sub: 'Desvie dos canos e bata seu recorde',
    colors: ['#1A0A20', '#4B1A54', '#C0395A'],
    bestKey: 'flappy',
  },
  {
    id: 'memory',
    emoji: '🧠',
    title: 'Jogo da Memória',
    sub: 'Encontre todos os pares de corações',
    colors: ['#2C1654', '#7B1540', '#C0395A'],
    bestKey: 'memory',
  },
  {
    id: 'catch',
    emoji: '💝',
    title: 'Pega-Corações',
    sub: 'Pegue os corações antes que caiam',
    colors: ['#7B1540', '#C0395A', '#FF85A1'],
    bestKey: 'catch',
  },
];

function GameCard({ game, best, onPress, delay }) {
  const { theme } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const entry = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(entry, { toValue: 1, tension: 55, friction: 9, delay, useNativeDriver: true }).start();
  }, []);

  const bestLabel = game.bestKey === 'memory'
    ? (best > 0 ? `Recorde: ${best} jogadas` : 'Sem recorde ainda')
    : (best > 0 ? `Recorde: ${best}` : 'Sem recorde ainda');

  return (
    <Animated.View style={{
      opacity: entry,
      transform: [
        { scale },
        { translateY: entry.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) },
      ],
    }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start()}
      >
        <View style={styles.card}>
          <LinearGradient
            colors={game.colors}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text style={styles.cardEmoji}>{game.emoji}</Text>
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle}>{game.title}</Text>
            <Text style={styles.cardSub}>{game.sub}</Text>
            <View style={styles.bestChip}>
              <Text style={styles.bestChipTxt}>🏆 {bestLabel}</Text>
            </View>
          </View>
          <Text style={styles.cardArrow}>▶</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function GamesHubScreen({ onClose }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [active, setActive] = useState(null);
  const [bests, setBests] = useState({ flappy: 0, memory: 0, catch: 0 });

  const loadBests = () => {
    Promise.all([getFlappyBest(), getMemoryBestOverall(), getCatchBest()])
      .then(([flappy, memory, c]) => setBests({ flappy, memory, catch: c }));
  };

  useEffect(() => { loadBests(); }, []);

  const back = () => { setActive(null); loadBests(); };

  if (active === 'flappy') return <FlappyBirdScreen onBack={back} />;
  if (active === 'memory') return <MemoryGameScreen onBack={back} />;
  if (active === 'catch') return <CatchHeartsScreen onBack={back} />;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient colors={['#0D0518', '#1A0A20', theme.accentDark, '#3D1021']} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.badge}>🎮 CANTINHO DOS JOGOS</Text>
          <Text style={styles.title}>Pra passar o tempo</Text>
          <Text style={styles.sub}>Joguinhos que eu fiz pra você, Mary 💕</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
          <LinearGradient colors={[theme.accent, theme.accentLight]} style={styles.closeGrad}>
            <Text style={styles.closeTxt}>✕</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 30 }}
        showsVerticalScrollIndicator={false}
      >
        {GAMES.map((game, i) => (
          <GameCard
            key={game.id}
            game={game}
            best={bests[game.bestKey]}
            delay={i * 90}
            onPress={() => setActive(game.id)}
          />
        ))}

        <View style={styles.note}>
          <Text style={styles.noteTxt}>
            Mais joguinhos podem aparecer aqui com o tempo.{'\n'}
            Sempre que eu tiver uma ideia boa pra te distrair. 🌹
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingBottom: 8,
  },
  badge: { fontSize: 10, color: '#FFD700', letterSpacing: 2, fontWeight: '700', marginBottom: 4 },
  title: { fontSize: 26, fontWeight: '900', color: '#FFFFFF' },
  sub: { fontSize: 12, color: 'rgba(255,182,193,0.8)', fontStyle: 'italic', marginTop: 3 },
  closeBtn: { borderRadius: 50, overflow: 'hidden', marginTop: 4 },
  closeGrad: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  closeTxt: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },

  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, padding: 18, marginBottom: 14, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8, gap: 14,
  },
  cardEmoji: { fontSize: 44 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  cardSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 3 },
  bestChip: {
    alignSelf: 'flex-start', marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 50,
    paddingVertical: 4, paddingHorizontal: 12,
  },
  bestChipTxt: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  cardArrow: { color: 'rgba(255,255,255,0.85)', fontSize: 16, fontWeight: '900' },

  note: {
    marginTop: 8, padding: 18, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,182,193,0.15)',
  },
  noteTxt: { color: 'rgba(255,214,228,0.8)', fontSize: 13, textAlign: 'center', lineHeight: 21, fontStyle: 'italic' },
});
