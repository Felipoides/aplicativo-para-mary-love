import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, StatusBar, Pressable, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FloatingHearts from '../components/FloatingHearts';
import { getTodaySurprise, getDaysTogether } from '../utils/storage';

const TYPE_COLORS = {
  frase:     ['#C0395A', '#E8527A'],
  motivacao: ['#7B52AB', '#C0395A'],
  desafio:   ['#D4AF37', '#A07010'],
  memoria:   ['#1A6B4A', '#2E9E72'],
  segredo:   ['#2C1654', '#7B1540'],
};

const TYPE_LABELS = {
  frase:     'Pensamento do Dia',
  motivacao: 'Motivação',
  desafio:   'Desafio Amoroso',
  memoria:   'Memória do Coração',
  segredo:   'Um Segredinho',
};

function PressCard({ onPress, style, children }) {
  const scale = useRef(new Animated.Value(1)).current;
  const handleIn = () =>
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const handleOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  return (
    <Pressable onPress={onPress} onPressIn={handleIn} onPressOut={handleOut}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default function SurpriseScreen() {
  const insets = useSafeAreaInsets();
  const [surprise, setSurprise] = useState(null);
  const [days, setDays] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const titleOp = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(-20)).current;
  const boxScale = useRef(new Animated.Value(0.88)).current;
  const boxOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const btnPulse = useRef(new Animated.Value(1)).current;
  const glowScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    getTodaySurprise().then(setSurprise);
    getDaysTogether().then(setDays);

    Animated.stagger(100, [
      Animated.parallel([
        Animated.timing(titleOp, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(titleY, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(boxScale, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.timing(boxOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();

    const glow = () => {
      Animated.sequence([
        Animated.timing(glowScale, { toValue: 1.05, duration: 1400, useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 1, duration: 1400, useNativeDriver: true }),
      ]).start(glow);
    };
    glow();

    const pulse = () => {
      Animated.sequence([
        Animated.timing(btnPulse, { toValue: 1.04, duration: 700, useNativeDriver: true }),
        Animated.timing(btnPulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]).start(pulse);
    };
    pulse();
  }, []);

  const handleReveal = () => {
    setRevealed(true);
    Animated.spring(contentOpacity, { toValue: 1, tension: 50, friction: 9, useNativeDriver: true }).start();
  };

  const colors = surprise ? (TYPE_COLORS[surprise.type] || TYPE_COLORS.frase) : ['#C0395A', '#E8527A'];
  const label = surprise ? (TYPE_LABELS[surprise.type] || 'Surpresa') : '';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#3D1021', '#7B1540', '#C0395A', '#FF85A1', '#FFD6E4']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <FloatingHearts count={10} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: titleOp, transform: [{ translateY: titleY }] }]}>
          <Text style={styles.headerTitle}>Surpresa do Dia 💝</Text>
          <Text style={styles.headerSub}>
            Uma nova surpresa especial{'\n'}a cada dia, só pra você, Mary
          </Text>
        </Animated.View>

        {/* Box */}
        <Animated.View style={[styles.boxWrap, { opacity: boxOpacity, transform: [{ scale: boxScale }] }]}>
          <Animated.View style={[styles.glowRing, { transform: [{ scale: glowScale }] }]} />

          <LinearGradient colors={[...colors, colors[1] + 'AA']} style={styles.boxGrad} borderRadius={28}>
            <View style={styles.boxInner}>
              {!revealed ? (
                <>
                  <Text style={styles.boxMainEmoji}>🎁</Text>
                  <Text style={styles.boxQuestion}>O que será que{'\n'}eu preparei hoje?</Text>
                  <Text style={styles.boxHint}>Toque para descobrir 💕</Text>
                  <Animated.View style={{ transform: [{ scale: btnPulse }] }}>
                    <PressCard style={styles.revealBtn} onPress={handleReveal}>
                      <View style={styles.revealBtnInner}>
                        <Text style={styles.revealBtnText}>✨ Abrir Surpresa</Text>
                      </View>
                    </PressCard>
                  </Animated.View>
                </>
              ) : (
                <Animated.View style={[styles.revealed, { opacity: contentOpacity }]}>
                  <Text style={styles.revealedEmoji}>{surprise?.emoji}</Text>
                  <View style={styles.revealedBadge}>
                    <Text style={styles.revealedBadgeText}>{label.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.revealedTitle}>{surprise?.title}</Text>
                  <View style={styles.revealedDivider} />
                  <Text style={styles.revealedContent}>{surprise?.content}</Text>
                </Animated.View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Days badge */}
        <View style={styles.daysBadge}>
          <Text style={styles.daysBadgeText}>
            ❤️  {days} dias juntos — cada um com uma surpresa guardada
          </Text>
        </View>

        {/* Quote */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>
            "O amor está nos pequenos gestos,{'\n'}
            nas surpresas do cotidiano,{'\n'}
            em cada momento compartilhado."
          </Text>
          <Text style={styles.quoteSig}>— feito com amor para você 🌹</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 22, paddingBottom: 30, alignItems: 'center' },

  header: { alignItems: 'center', marginBottom: 28 },
  headerTitle: {
    fontSize: 28, fontWeight: '900', color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },
  headerSub: {
    fontSize: 14, color: 'rgba(255,255,255,0.85)',
    textAlign: 'center', fontStyle: 'italic', marginTop: 8, lineHeight: 22,
  },

  boxWrap: {
    width: '100%', borderRadius: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35, shadowRadius: 22, elevation: 18,
    marginBottom: 20, position: 'relative',
  },
  glowRing: {
    position: 'absolute', top: -10, left: -10, right: -10, bottom: -10, borderRadius: 36,
    borderWidth: 1.5, borderColor: 'rgba(255,182,193,0.3)',
  },
  boxGrad: { borderRadius: 28 },
  boxInner: { padding: 34, alignItems: 'center', minHeight: 290, justifyContent: 'center' },

  boxMainEmoji: { fontSize: 80, marginBottom: 18 },
  boxQuestion: {
    fontSize: 20, fontWeight: '800', color: '#FFFFFF',
    textAlign: 'center', lineHeight: 28, marginBottom: 8,
  },
  boxHint: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontStyle: 'italic', marginBottom: 28 },

  revealBtn: { borderRadius: 50, overflow: 'hidden' },
  revealBtnInner: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingVertical: 14, paddingHorizontal: 34, borderRadius: 50,
  },
  revealBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },

  revealed: { alignItems: 'center', width: '100%' },
  revealedEmoji: { fontSize: 70, marginBottom: 12 },
  revealedBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 50,
    paddingVertical: 4, paddingHorizontal: 14, marginBottom: 10,
  },
  revealedBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', letterSpacing: 1.5 },
  revealedTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', marginBottom: 14, textAlign: 'center' },
  revealedDivider: { width: 50, height: 1.5, backgroundColor: 'rgba(255,255,255,0.4)', marginBottom: 14 },
  revealedContent: {
    fontSize: 15, color: 'rgba(255,255,255,0.92)',
    textAlign: 'center', lineHeight: 24, fontStyle: 'italic',
  },

  daysBadge: {
    width: '100%', borderRadius: 50, paddingVertical: 13, paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', marginBottom: 16,
  },
  daysBadgeText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, textAlign: 'center' },

  quoteCard: {
    width: '100%', padding: 20, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 18,
  },
  quoteText: {
    fontSize: 13, color: 'rgba(255,255,255,0.85)',
    textAlign: 'center', fontStyle: 'italic', lineHeight: 22,
  },
  quoteSig: { fontSize: 12, color: 'rgba(255,182,193,0.9)', marginTop: 10 },
});
