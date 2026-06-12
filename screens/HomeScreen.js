import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Animated, Dimensions, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FloatingHearts from '../components/FloatingHearts';
import { getDaysTogether, getTodayPhrase, incrementOpenCount } from '../utils/storage';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigate, onUnlockDev }) {
  const insets = useSafeAreaInsets();
  const [days, setDays] = useState(0);
  const [phrase, setPhrase] = useState('');
  const [tapCount, setTapCount] = useState(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const counterScale = useRef(new Animated.Value(0.8)).current;
  const tapTimer = useRef(null);

  useEffect(() => {
    incrementOpenCount();
    getDaysTogether().then(setDays);
    getTodayPhrase().then(setPhrase);

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.spring(counterScale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();

    const heartbeat = () => {
      Animated.sequence([
        Animated.timing(heartScale, { toValue: 1.25, duration: 280, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 1.12, duration: 180, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.delay(1600),
      ]).start(heartbeat);
    };
    heartbeat();
  }, []);

  const handleSecretTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => setTapCount(0), 3000);
    if (newCount >= 7) {
      setTapCount(0);
      onUnlockDev && onUnlockDev();
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#0D0008', '#1A0010', '#3B0A20', '#5C1030', '#7B1540', '#3B0A20']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      <FloatingHearts count={10} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity onPress={handleSecretTap} activeOpacity={0.85}>
            <Animated.Text style={[styles.bigHeart, { transform: [{ scale: heartScale }] }]}>
              💖
            </Animated.Text>
          </TouchableOpacity>
          <Text style={styles.title}>Para Mary</Text>
          <Text style={styles.subtitle}>
            Um universo criado com carinho,{'\n'}só para você, meu amor.
          </Text>
        </Animated.View>

        {/* Days Counter */}
        <Animated.View style={[styles.counterWrap, { opacity: fadeAnim, transform: [{ scale: counterScale }] }]}>
          <LinearGradient
            colors={['rgba(80,10,30,0.95)', 'rgba(140,20,55,0.95)']}
            style={styles.counterGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.counterInner}>
            <Text style={styles.counterEmoji}>🗓️</Text>
            <Text style={styles.counterNum}>{days}</Text>
            <Text style={styles.counterLabel}>dias de amor vividos juntos</Text>
            <View style={styles.counterDivider} />
            <Text style={styles.counterSub}>e cada um guardado com cuidado ❤️</Text>
          </View>
        </Animated.View>

        {/* Daily Phrase */}
        <Animated.View style={[styles.phraseCard, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={['rgba(60,10,25,0.92)', 'rgba(90,15,35,0.88)']}
            style={StyleSheet.absoluteFill}
            borderRadius={20}
          />
          <Text style={styles.phraseTitle}>💌 Frase do Dia</Text>
          <Text style={styles.phraseText}>{phrase}</Text>
        </Animated.View>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>Feito com amor, só pra você 🌹</Text>

        {/* Action Cards */}
        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.82}
            onPress={() => navigate('letters')}
          >
            <LinearGradient colors={['#3B0A1E', '#6B1030', '#8B1E3F']} style={styles.cardGrad} borderRadius={18}>
              <Text style={styles.cardEmoji}>💌</Text>
              <Text style={styles.cardTitle}>Cartas{'\n'}de Amor</Text>
              <Text style={styles.cardSub}>Palavras do coração</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.82}
            onPress={() => navigate('surprises')}
          >
            <LinearGradient colors={['#3A2800', '#7A5800', '#A07010']} style={styles.cardGrad} borderRadius={18}>
              <Text style={styles.cardEmoji}>💝</Text>
              <Text style={styles.cardTitle}>Surpresa{'\n'}do Dia</Text>
              <Text style={styles.cardSub}>Uma nova todo dia</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Game Banner */}
        <TouchableOpacity
          style={styles.gameBanner}
          activeOpacity={0.85}
          onPress={() => navigate('game')}
        >
          <LinearGradient
            colors={['#1A0A20', '#2C1654', '#8B2252', '#C0395A']}
            style={styles.gameBannerGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.gameBannerContent}>
            <Text style={styles.gameBannerEmoji}>🎮</Text>
            <View style={styles.gameBannerText}>
              <Text style={styles.gameBannerTitle}>Flappy Love</Text>
              <Text style={styles.gameBannerSub}>Um joguinho criado só pra você se divertir 💕</Text>
            </View>
            <Text style={styles.gameBannerArrow}>▶</Text>
          </View>
          <Text style={styles.gameBannerStars}>✨ 💫 ⭐ 💫 ✨</Text>
        </TouchableOpacity>

        {/* About Card */}
        <View style={styles.aboutCard}>
          <LinearGradient
            colors={['rgba(45,5,18,0.92)', 'rgba(70,10,28,0.88)']}
            style={StyleSheet.absoluteFill}
            borderRadius={20}
          />
          <Text style={styles.aboutEmoji}>🌸</Text>
          <Text style={styles.aboutText}>
            Este aplicativo foi feito linha por linha, pensando em cada detalhe que pudesse te fazer sorrir.
            Em cada animação, em cada palavra, há uma intenção de mostrar o quanto você é especial pra mim.
            {'\n\n'}Você merece isso e muito, muito mais, Mary. 🌹
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingTop: 20, paddingHorizontal: 22, paddingBottom: 30 },

  header: { alignItems: 'center', marginBottom: 28 },
  bigHeart: { fontSize: 64, marginBottom: 10 },
  title: {
    fontSize: 36, fontWeight: '800', color: '#FFFFFF',
    letterSpacing: 1, textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 15, color: 'rgba(255,255,255,0.88)',
    textAlign: 'center', marginTop: 8, lineHeight: 22,
    fontStyle: 'italic',
  },

  counterWrap: {
    borderRadius: 22, overflow: 'hidden', marginBottom: 20,
    shadowColor: '#C0395A', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 10,
  },
  counterGrad: { ...StyleSheet.absoluteFillObject, borderRadius: 22 },
  counterInner: { padding: 24, alignItems: 'center' },
  counterEmoji: { fontSize: 30, marginBottom: 8 },
  counterNum: {
    fontSize: 72, fontWeight: '900', color: '#FFFFFF',
    lineHeight: 80, textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 6,
  },
  counterLabel: { fontSize: 15, color: 'rgba(255,255,255,0.9)', marginTop: 4, fontStyle: 'italic' },
  counterDivider: { width: 50, height: 1.5, backgroundColor: 'rgba(255,255,255,0.4)', marginVertical: 10 },
  counterSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },

  phraseCard: {
    borderRadius: 20, padding: 20, marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#C0395A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 6,
  },
  phraseTitle: { fontSize: 14, fontWeight: '700', color: '#FF8FAF', marginBottom: 10, letterSpacing: 0.5 },
  phraseText: { fontSize: 15, color: 'rgba(255,200,220,0.92)', lineHeight: 24, fontStyle: 'italic' },

  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: '#FFFFFF',
    textAlign: 'center', marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },

  grid: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  card: {
    flex: 1, borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25, shadowRadius: 10, elevation: 8,
  },
  cardGrad: { padding: 20, alignItems: 'center', minHeight: 140, justifyContent: 'center' },
  cardEmoji: { fontSize: 34, marginBottom: 8 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', lineHeight: 19 },
  cardSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 5, textAlign: 'center' },

  gameBanner: {
    borderRadius: 22, overflow: 'hidden', marginBottom: 16,
    shadowColor: '#1A0A20', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45, shadowRadius: 16, elevation: 12,
  },
  gameBannerGrad: { ...StyleSheet.absoluteFillObject, borderRadius: 22 },
  gameBannerContent: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 12 },
  gameBannerEmoji: { fontSize: 40, marginRight: 14 },
  gameBannerText: { flex: 1 },
  gameBannerTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
  gameBannerSub: { fontSize: 12, color: 'rgba(255,182,193,0.9)', marginTop: 3, fontStyle: 'italic' },
  gameBannerArrow: { fontSize: 22, color: '#FFD700', fontWeight: '900' },
  gameBannerStars: { textAlign: 'center', fontSize: 14, paddingBottom: 14, color: 'rgba(255,215,0,0.8)' },

  aboutCard: {
    borderRadius: 20, padding: 22, overflow: 'hidden', alignItems: 'center',
    shadowColor: '#C0395A', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  aboutEmoji: { fontSize: 32, marginBottom: 12 },
  aboutText: {
    fontSize: 14, color: 'rgba(255,195,215,0.88)', lineHeight: 23,
    textAlign: 'center', fontStyle: 'italic',
  },
});
