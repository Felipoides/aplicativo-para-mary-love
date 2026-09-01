import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Animated, StatusBar, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FloatingHearts from '../components/FloatingHearts';
import { getDaysTogether, getTodayPhrase, incrementOpenCount } from '../utils/storage';
import { useTheme } from '../utils/theme';

function PressCard({ onPress, style, children, accessibilityLabel }) {
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.975, useNativeDriver: true, speed: 40 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start()}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

function ActionCard({ icon, eyebrow, title, subtitle, colors, onPress }) {
  return (
    <PressCard style={styles.actionCard} onPress={onPress} accessibilityLabel={title}>
      <LinearGradient
        colors={colors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View style={styles.actionGlow} />
      <View style={styles.actionIconWrap}>
        <Text style={styles.actionEmoji}>{icon}</Text>
      </View>
      <Text style={styles.actionEyebrow}>{eyebrow}</Text>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionSub}>{subtitle}</Text>
      <View style={styles.actionArrow}>
        <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
      </View>
    </PressCard>
  );
}

export default function HomeScreen({ navigate, onUnlockDev, onOpenThemes }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [days, setDays] = useState(0);
  const [phrase, setPhrase] = useState('');
  const [tapCount, setTapCount] = useState(0);

  const headerY = useRef(new Animated.Value(-22)).current;
  const headerOp = useRef(new Animated.Value(0)).current;
  const counterY = useRef(new Animated.Value(32)).current;
  const counterOp = useRef(new Animated.Value(0)).current;
  const phraseY = useRef(new Animated.Value(32)).current;
  const phraseOp = useRef(new Animated.Value(0)).current;
  const cardsY = useRef(new Animated.Value(32)).current;
  const cardsOp = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const tapTimer = useRef(null);

  useEffect(() => {
    incrementOpenCount();
    getDaysTogether().then(setDays);
    getTodayPhrase().then(setPhrase);

    Animated.stagger(100, [
      Animated.parallel([
        Animated.timing(headerOp, { toValue: 1, duration: 520, useNativeDriver: true }),
        Animated.spring(headerY, { toValue: 0, tension: 58, friction: 9, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(counterOp, { toValue: 1, duration: 520, useNativeDriver: true }),
        Animated.spring(counterY, { toValue: 0, tension: 55, friction: 9, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(phraseOp, { toValue: 1, duration: 520, useNativeDriver: true }),
        Animated.spring(phraseY, { toValue: 0, tension: 55, friction: 9, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardsOp, { toValue: 1, duration: 520, useNativeDriver: true }),
        Animated.spring(cardsY, { toValue: 0, tension: 55, friction: 9, useNativeDriver: true }),
      ]),
    ]).start();

    const heartbeat = Animated.loop(
      Animated.sequence([
        Animated.timing(heartScale, { toValue: 1.12, duration: 220, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.delay(2200),
      ])
    );
    heartbeat.start();

    return () => {
      heartbeat.stop();
      if (tapTimer.current) clearTimeout(tapTimer.current);
    };
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

  const surfaceBorder = theme.statusBar === 'light'
    ? 'rgba(255,255,255,0.12)'
    : `${theme.accent}18`;

  return (
    <View style={styles.root}>
      <StatusBar barStyle={theme.statusBar === 'light' ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      <LinearGradient
        colors={theme.home}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.12, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      />
      <View style={[styles.ambientGlow, { backgroundColor: theme.accentLight }]} />
      <FloatingHearts count={5} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 14 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.topBar, { opacity: headerOp, transform: [{ translateY: headerY }] }]}>
          <TouchableOpacity onPress={handleSecretTap} activeOpacity={0.85} style={styles.brand}>
            <Animated.View style={[styles.brandMark, { backgroundColor: `${theme.accent}16`, transform: [{ scale: heartScale }] }]}>
              <Ionicons name="heart" size={20} color={theme.accent} />
            </Animated.View>
            <View>
              <Text style={[styles.brandOverline, { color: theme.textMedium }]}>MARY LOVE</Text>
              <Text style={[styles.brandName, { color: theme.textDark }]}>Nosso cantinho</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onOpenThemes}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Escolher tema"
            style={[styles.themeButton, { backgroundColor: theme.cardBg, borderColor: surfaceBorder }]}
          >
            <Ionicons name="color-palette-outline" size={20} color={theme.accent} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.hero, { opacity: headerOp, transform: [{ translateY: headerY }] }]}>
          <View style={[styles.heroPill, { backgroundColor: `${theme.accent}16` }]}>
            <View style={[styles.heroPillDot, { backgroundColor: theme.accent }]} />
            <Text style={[styles.heroPillText, { color: theme.accent }]}>FEITO SÓ PARA VOCÊ</Text>
          </View>
          <Text style={[styles.heroTitle, { color: theme.textDark }]}>Oi, meu amor.</Text>
          <Text style={[styles.heroTitleAccent, { color: theme.accent }]}>Que bom ter você aqui.</Text>
          <Text style={[styles.heroSubtitle, { color: theme.textMedium }]}>
            Um lugar para guardar palavras, memórias e pequenas surpresas nossas.
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: counterOp, transform: [{ translateY: counterY }] }}>
          <View style={styles.counterCard}>
            <LinearGradient
              colors={theme.counter}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.counterOrb} />
            <View style={styles.counterTop}>
              <View style={styles.counterBadge}>
                <Ionicons name="calendar-clear-outline" size={14} color="#FFFFFF" />
                <Text style={styles.counterLabel}>NOSSA HISTÓRIA</Text>
              </View>
              <Ionicons name="heart-circle-outline" size={31} color="rgba(255,255,255,0.8)" />
            </View>
            <View style={styles.counterMain}>
              <Text style={styles.counterNum}>{days}</Text>
              <View style={styles.counterCopy}>
                <Text style={styles.counterUnit}>dias juntos</Text>
                <Text style={styles.counterSub}>e contando…</Text>
              </View>
            </View>
            <View style={styles.counterDivider} />
            <Text style={styles.counterFooter}>Desde o primeiro dia, você continua sendo minha pessoa favorita.</Text>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: phraseOp, transform: [{ translateY: phraseY }] }}>
          <View style={[styles.phraseCard, { backgroundColor: theme.cardBg, borderColor: surfaceBorder }]}>
            <View style={[styles.phraseIcon, { backgroundColor: `${theme.accent}16` }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.accent} />
            </View>
            <View style={styles.phraseBody}>
              <Text style={[styles.phraseLabel, { color: theme.accent }]}>RECADO DE HOJE</Text>
              <Text style={[styles.phraseText, { color: theme.textDark }]}>{phrase}</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: cardsOp, transform: [{ translateY: cardsY }] }}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionEyebrow, { color: theme.accent }]}>EXPLORE</Text>
              <Text style={[styles.sectionTitle, { color: theme.textDark }]}>Um carinho para cada momento</Text>
            </View>
            <Ionicons name="sparkles-outline" size={20} color={theme.accent} />
          </View>

          <View style={styles.grid}>
            <ActionCard
              icon="💌"
              eyebrow="PARA SENTIR"
              title="Cartas de amor"
              subtitle="Palavras que ficam"
              colors={[theme.accentDark, theme.accent]}
              onPress={() => navigate('letters')}
            />
            <ActionCard
              icon="🎁"
              eyebrow="PARA DESCOBRIR"
              title="Surpresa do dia"
              subtitle="Algo novo te espera"
              colors={['#8A5A16', '#D4A72C', '#F0C861']}
              onPress={() => navigate('surprises')}
            />
          </View>

          <PressCard style={styles.gameBanner} onPress={() => navigate('game')} accessibilityLabel="Abrir jogos">
            <LinearGradient
              colors={['#160B24', '#39204D', theme.accentDark]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.gamePattern} />
            <View style={styles.gameIcon}>
              <Ionicons name="game-controller" size={27} color="#FFFFFF" />
            </View>
            <View style={styles.gameCopy}>
              <Text style={styles.gameEyebrow}>HORA DE JOGAR</Text>
              <Text style={styles.gameTitle}>Nosso fliperama</Text>
              <Text style={styles.gameSub}>Três jogos e novos recordes para bater</Text>
            </View>
            <View style={styles.gameArrow}>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </View>
          </PressCard>

          <View style={[styles.signatureCard, { backgroundColor: theme.cardBg, borderColor: surfaceBorder }]}>
            <View style={[styles.signatureIcon, { backgroundColor: `${theme.accent}14` }]}>
              <Text style={styles.signatureEmoji}>🌹</Text>
            </View>
            <View style={styles.signatureBody}>
              <Text style={[styles.signatureText, { color: theme.textDark }]}>
                Fiz este cantinho linha por linha para te lembrar, até nos dias comuns, do quanto você é especial.
              </Text>
              <Text style={[styles.signatureName, { color: theme.accent }]}>Com amor, Matheus</Text>
            </View>
          </View>
        </Animated.View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  content: { width: '100%', maxWidth: 600, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 34 },
  ambientGlow: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    top: -100, right: -100, opacity: 0.18,
  },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  brandMark: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  brandOverline: { fontSize: 9, fontWeight: '800', letterSpacing: 1.8, marginBottom: 1 },
  brandName: { fontSize: 15, fontWeight: '800' },
  themeButton: {
    width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, shadowColor: '#3D1021', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },

  hero: { marginBottom: 24 },
  heroPill: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7,
    borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6, marginBottom: 14,
  },
  heroPillDot: { width: 6, height: 6, borderRadius: 3 },
  heroPillText: { fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  heroTitle: { fontSize: 34, lineHeight: 39, fontWeight: '900', letterSpacing: -0.7 },
  heroTitleAccent: { fontSize: 34, lineHeight: 39, fontWeight: '900', letterSpacing: -0.7 },
  heroSubtitle: { fontSize: 14, lineHeight: 21, marginTop: 12, maxWidth: 390 },

  counterCard: {
    borderRadius: 28, overflow: 'hidden', marginBottom: 14, padding: 22,
    shadowColor: '#6F1735', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28, shadowRadius: 20, elevation: 12,
  },
  counterOrb: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.10)', right: -55, top: -75,
  },
  counterTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counterBadge: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  counterLabel: { color: '#FFFFFF', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  counterMain: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  counterNum: { fontSize: 66, lineHeight: 72, fontWeight: '900', color: '#FFFFFF', letterSpacing: -2 },
  counterCopy: { marginLeft: 12, paddingTop: 9 },
  counterUnit: { fontSize: 17, color: '#FFFFFF', fontWeight: '800' },
  counterSub: { fontSize: 12, color: 'rgba(255,255,255,0.72)', marginTop: 2 },
  counterDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 14 },
  counterFooter: { color: 'rgba(255,255,255,0.86)', fontSize: 12, lineHeight: 18 },

  phraseCard: {
    flexDirection: 'row', padding: 17, borderRadius: 21, borderWidth: 1, marginBottom: 28,
    shadowColor: '#3D1021', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08, shadowRadius: 14, elevation: 4,
  },
  phraseIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  phraseBody: { flex: 1 },
  phraseLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1.3, marginBottom: 6 },
  phraseText: { fontSize: 14, lineHeight: 21, fontWeight: '500' },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14,
  },
  sectionEyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 3 },
  sectionTitle: { fontSize: 19, fontWeight: '900', letterSpacing: -0.3 },
  grid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  actionCard: {
    flex: 1, minHeight: 196, borderRadius: 23, padding: 17, overflow: 'hidden',
    shadowColor: '#3D1021', shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.2, shadowRadius: 15, elevation: 8,
  },
  actionGlow: {
    position: 'absolute', width: 115, height: 115, borderRadius: 58,
    backgroundColor: 'rgba(255,255,255,0.11)', right: -34, top: -36,
  },
  actionIconWrap: {
    width: 46, height: 46, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 17,
  },
  actionEmoji: { fontSize: 23 },
  actionEyebrow: { color: 'rgba(255,255,255,0.68)', fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  actionTitle: { color: '#FFFFFF', fontSize: 17, lineHeight: 21, fontWeight: '900', marginTop: 5 },
  actionSub: { color: 'rgba(255,255,255,0.72)', fontSize: 11, lineHeight: 16, marginTop: 5, paddingRight: 18 },
  actionArrow: {
    position: 'absolute', right: 14, bottom: 14, width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)',
  },

  gameBanner: {
    minHeight: 104, borderRadius: 23, padding: 17, marginBottom: 12, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#160B24', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  gamePattern: {
    position: 'absolute', width: 130, height: 130, borderRadius: 65,
    right: -30, top: -65, borderWidth: 18, borderColor: 'rgba(255,255,255,0.05)',
  },
  gameIcon: {
    width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)', marginRight: 14,
  },
  gameCopy: { flex: 1 },
  gameEyebrow: { color: '#F0C861', fontSize: 8, fontWeight: '900', letterSpacing: 1.4, marginBottom: 3 },
  gameTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  gameSub: { color: 'rgba(255,255,255,0.66)', fontSize: 11, marginTop: 3 },
  gameArrow: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
  },

  signatureCard: {
    flexDirection: 'row', borderRadius: 21, padding: 17, borderWidth: 1,
    alignItems: 'center',
  },
  signatureIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  signatureEmoji: { fontSize: 23 },
  signatureBody: { flex: 1 },
  signatureText: { fontSize: 12, lineHeight: 18 },
  signatureName: { fontSize: 11, fontWeight: '800', marginTop: 6 },
});
