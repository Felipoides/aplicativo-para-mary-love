import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Animated, Dimensions, StatusBar, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FloatingHearts from '../components/FloatingHearts';
import { getDaysTogether, getTodayPhrase, incrementOpenCount } from '../utils/storage';

const { width } = Dimensions.get('window');

function PressCard({ onPress, style, children }) {
  const scale = useRef(new Animated.Value(1)).current;
  const handleIn = () =>
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  const handleOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handleIn}
      onPressOut={handleOut}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default function HomeScreen({ navigate, onUnlockDev }) {
  const insets = useSafeAreaInsets();
  const [days, setDays] = useState(0);
  const [phrase, setPhrase] = useState('');
  const [tapCount, setTapCount] = useState(0);

  const headerY = useRef(new Animated.Value(-30)).current;
  const headerOp = useRef(new Animated.Value(0)).current;
  const counterY = useRef(new Animated.Value(40)).current;
  const counterOp = useRef(new Animated.Value(0)).current;
  const phraseY = useRef(new Animated.Value(40)).current;
  const phraseOp = useRef(new Animated.Value(0)).current;
  const cardsY = useRef(new Animated.Value(40)).current;
  const cardsOp = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const tapTimer = useRef(null);

  useEffect(() => {
    incrementOpenCount();
    getDaysTogether().then(setDays);
    getTodayPhrase().then(setPhrase);

    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(headerOp, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(headerY, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(counterOp, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(counterY, { toValue: 0, tension: 55, friction: 8, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(phraseOp, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(phraseY, { toValue: 0, tension: 55, friction: 8, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardsOp, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(cardsY, { toValue: 0, tension: 55, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();

    const heartbeat = () => {
      Animated.sequence([
        Animated.timing(heartScale, { toValue: 1.28, duration: 260, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 1.14, duration: 170, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 1, duration: 170, useNativeDriver: true }),
        Animated.delay(1800),
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
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#FFF0F5', '#FFD6E8', '#FFAEC9', '#FF85A1']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      <FloatingHearts count={8} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerOp, transform: [{ translateY: headerY }] }]}>
          <TouchableOpacity onPress={handleSecretTap} activeOpacity={0.85}>
            <Animated.Text style={[styles.bigHeart, { transform: [{ scale: heartScale }] }]}>
              💖
            </Animated.Text>
          </TouchableOpacity>
          <Text style={styles.greeting}>Oi, meu amor 🌸</Text>
          <Text style={styles.title}>Para Mary</Text>
          <Text style={styles.subtitle}>
            Um universo criado com carinho,{'\n'}só para você.
          </Text>
        </Animated.View>

        {/* Days Counter */}
        <Animated.View style={{ opacity: counterOp, transform: [{ translateY: counterY }] }}>
          <View style={styles.counterCard}>
            <LinearGradient
              colors={['#C0395A', '#E8527A', '#FF85A1']}
              style={StyleSheet.absoluteFill}
              borderRadius={24}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.counterRow}>
              <View style={styles.counterLeft}>
                <Text style={styles.counterLabel}>Dias juntos</Text>
                <Text style={styles.counterNum}>{days}</Text>
                <Text style={styles.counterSub}>e cada um inesquecível ❤️</Text>
              </View>
              <Text style={styles.counterEmoji}>🗓️</Text>
            </View>
            <View style={styles.counterDivider} />
            <Text style={styles.counterFooter}>
              Desde o primeiro dia, você é minha favorita.
            </Text>
          </View>
        </Animated.View>

        {/* Daily Phrase */}
        <Animated.View style={{ opacity: phraseOp, transform: [{ translateY: phraseY }] }}>
          <View style={styles.phraseCard}>
            <View style={styles.phraseTag}>
              <Text style={styles.phraseTagText}>💌  Frase do Dia</Text>
            </View>
            <Text style={styles.phraseText}>{phrase}</Text>
          </View>
        </Animated.View>

        {/* Section label */}
        <Animated.View style={{ opacity: cardsOp, transform: [{ translateY: cardsY }] }}>
          <Text style={styles.sectionTitle}>Feito com amor, só pra você 🌹</Text>

          {/* Action Cards */}
          <View style={styles.grid}>
            <PressCard style={styles.card} onPress={() => navigate('letters')}>
              <LinearGradient
                colors={['#C0395A', '#8B1E3F']}
                style={styles.cardGrad}
                borderRadius={20}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.cardEmoji}>💌</Text>
                <Text style={styles.cardTitle}>Cartas{'\n'}de Amor</Text>
                <Text style={styles.cardSub}>Palavras do coração</Text>
              </LinearGradient>
            </PressCard>

            <PressCard style={styles.card} onPress={() => navigate('surprises')}>
              <LinearGradient
                colors={['#D4AF37', '#A07010']}
                style={styles.cardGrad}
                borderRadius={20}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.cardEmoji}>💝</Text>
                <Text style={styles.cardTitle}>Surpresa{'\n'}do Dia</Text>
                <Text style={styles.cardSub}>Uma nova todo dia</Text>
              </LinearGradient>
            </PressCard>
          </View>

          {/* Game Banner */}
          <PressCard style={styles.gameBanner} onPress={() => navigate('game')}>
            <LinearGradient
              colors={['#1A0A20', '#4B1A54', '#C0395A', '#FF85A1']}
              style={styles.gameBannerGrad}
              borderRadius={22}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.gameBannerContent}>
              <Text style={styles.gameBannerEmoji}>🎮</Text>
              <View style={styles.gameBannerText}>
                <Text style={styles.gameBannerTitle}>Flappy Love</Text>
                <Text style={styles.gameBannerSub}>Um joguinho criado só pra você 💕</Text>
              </View>
              <View style={styles.gameBannerChip}>
                <Text style={styles.gameBannerChipText}>Jogar</Text>
              </View>
            </View>
          </PressCard>

          {/* About Card */}
          <View style={styles.aboutCard}>
            <Text style={styles.aboutEmoji}>🌸</Text>
            <Text style={styles.aboutText}>
              Este aplicativo foi feito linha por linha pensando em cada detalhe que pudesse te fazer sorrir.
              Em cada animação, em cada palavra, há amor de verdade.{'\n\n'}
              Você merece isso e muito mais, Mary. 🌹
            </Text>
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 30 },

  header: { alignItems: 'center', marginBottom: 24, paddingTop: 8 },
  bigHeart: { fontSize: 68, marginBottom: 8 },
  greeting: { fontSize: 14, color: '#8B4560', fontWeight: '600', letterSpacing: 0.5, marginBottom: 2 },
  title: {
    fontSize: 34, fontWeight: '900', color: '#3D1021',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14, color: '#8B4560', textAlign: 'center',
    marginTop: 6, lineHeight: 21, fontStyle: 'italic',
  },

  counterCard: {
    borderRadius: 24, overflow: 'hidden', marginBottom: 16,
    padding: 22,
    shadowColor: '#C0395A', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counterLeft: { flex: 1 },
  counterLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  counterNum: {
    fontSize: 64, fontWeight: '900', color: '#FFFFFF', lineHeight: 70,
  },
  counterSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontStyle: 'italic', marginTop: 2 },
  counterEmoji: { fontSize: 44 },
  counterDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 14 },
  counterFooter: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontStyle: 'italic', textAlign: 'center' },

  phraseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20, padding: 18, marginBottom: 24,
    shadowColor: '#C0395A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 5,
  },
  phraseTag: {
    backgroundColor: '#FFF0F5', borderRadius: 50,
    alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 12, marginBottom: 12,
  },
  phraseTagText: { fontSize: 12, fontWeight: '700', color: '#C0395A' },
  phraseText: { fontSize: 15, color: '#5A2035', lineHeight: 24, fontStyle: 'italic' },

  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: '#3D1021',
    textAlign: 'center', marginBottom: 14,
  },

  grid: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  card: {
    flex: 1, borderRadius: 20, overflow: 'hidden',
    shadowColor: '#C0395A', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
  },
  cardGrad: { padding: 22, alignItems: 'center', minHeight: 148, justifyContent: 'center' },
  cardEmoji: { fontSize: 36, marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', lineHeight: 19 },
  cardSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 6, textAlign: 'center' },

  gameBanner: {
    borderRadius: 22, overflow: 'hidden', marginBottom: 14,
    shadowColor: '#1A0A20', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 12,
  },
  gameBannerGrad: { ...StyleSheet.absoluteFillObject },
  gameBannerContent: { flexDirection: 'row', alignItems: 'center', padding: 20 },
  gameBannerEmoji: { fontSize: 42, marginRight: 14 },
  gameBannerText: { flex: 1 },
  gameBannerTitle: { fontSize: 19, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.4 },
  gameBannerSub: { fontSize: 12, color: 'rgba(255,182,193,0.9)', marginTop: 3, fontStyle: 'italic' },
  gameBannerChip: {
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 50,
    paddingVertical: 7, paddingHorizontal: 16,
  },
  gameBannerChipText: { color: '#FFF', fontWeight: '800', fontSize: 13 },

  aboutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20, padding: 22, alignItems: 'center',
    shadowColor: '#C0395A', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    marginBottom: 4,
  },
  aboutEmoji: { fontSize: 32, marginBottom: 12 },
  aboutText: {
    fontSize: 14, color: '#5A2035', lineHeight: 23,
    textAlign: 'center', fontStyle: 'italic',
  },
});
