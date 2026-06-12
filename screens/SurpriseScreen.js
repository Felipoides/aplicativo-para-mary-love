import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FloatingHearts from '../components/FloatingHearts';
import { getTodaySurprise, getDaysTogether } from '../utils/storage';

const TYPE_COLORS = {
  frase: ['#C0395A', '#E8527A', '#FF85A1'],
  desafio: ['#D4AF37', '#FFD700', '#FFB347'],
  segredo: ['#2C1654', '#5C1A35', '#C0395A'],
  memoria: ['#1A6B4A', '#2E9E72', '#5EC89A'],
};

const TYPE_LABELS = {
  frase: 'Pensamento do Dia',
  desafio: 'Desafio Amoroso',
  segredo: 'Um Segredinho',
  memoria: 'Memória do Coração',
};

export default function SurpriseScreen() {
  const insets = useSafeAreaInsets();
  const [surprise, setSurprise] = useState(null);
  const [days, setDays] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const boxScale = useRef(new Animated.Value(0.85)).current;
  const boxOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const sparkleRot = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    getTodaySurprise().then(setSurprise);
    getDaysTogether().then(setDays);

    Animated.parallel([
      Animated.spring(boxScale, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.timing(boxOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]).start();

    const glow = () => {
      Animated.sequence([
        Animated.timing(glowScale, { toValue: 1.06, duration: 1200, useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]).start(glow);
    };
    glow();

    const spin = () => {
      Animated.sequence([
        Animated.timing(sparkleRot, { toValue: 1, duration: 3000, useNativeDriver: true }),
        Animated.timing(sparkleRot, { toValue: 0, duration: 3000, useNativeDriver: true }),
      ]).start(spin);
    };
    spin();
  }, []);

  const handleReveal = () => {
    setRevealed(true);
    Animated.timing(contentOpacity, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  };

  const colors = surprise ? (TYPE_COLORS[surprise.type] || TYPE_COLORS.frase) : ['#C0395A', '#FF85A1', '#FFB6C1'];
  const label = surprise ? (TYPE_LABELS[surprise.type] || 'Surpresa') : '';

  const spin = sparkleRot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#1A0A20', '#3D1021', '#7B1540', '#C0395A', '#FF85A1', '#FFD6E4']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.4, y: 1 }}
      />
      <FloatingHearts count={12} />

      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Surpresa do Dia 💝</Text>
          <Text style={styles.headerSub}>
            Uma nova surpresa especial{'\n'}a cada dia, só pra você, Mary
          </Text>
        </View>

        <Animated.View
          style={[styles.box, { opacity: boxOpacity, transform: [{ scale: boxScale }] }]}
        >
          <Animated.View style={[styles.glowRing, { transform: [{ scale: glowScale }] }]} />
          <LinearGradient colors={colors} style={styles.boxGrad} borderRadius={24}>
            <View style={styles.boxInner}>
              {!revealed ? (
                <>
                  <Animated.Text style={[styles.boxMainEmoji, { transform: [{ rotate: spin }] }]}>
                    ✨
                  </Animated.Text>
                  <Text style={styles.boxQuestion}>O que será que{'\n'}eu preparei hoje?</Text>
                  <Text style={styles.boxHint}>Toque para descobrir 💕</Text>
                  <TouchableOpacity
                    style={styles.revealBtn}
                    onPress={handleReveal}
                    activeOpacity={0.82}
                  >
                    <LinearGradient
                      colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.15)']}
                      style={styles.revealBtnGrad}
                      borderRadius={50}
                    >
                      <Text style={styles.revealBtnText}>🎁 Abrir Surpresa</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <Animated.View style={[styles.revealed, { opacity: contentOpacity }]}>
                  <Text style={styles.revealedEmoji}>{surprise?.emoji}</Text>
                  <Text style={styles.revealedLabel}>{label}</Text>
                  <Text style={styles.revealedTitle}>{surprise?.title}</Text>
                  <View style={styles.revealedDivider} />
                  <Text style={styles.revealedContent}>{surprise?.content}</Text>
                </Animated.View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Days together mini badge */}
        <View style={styles.daysBadge}>
          <LinearGradient
            colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
            style={StyleSheet.absoluteFill}
            borderRadius={50}
          />
          <Text style={styles.daysBadgeText}>
            ❤️ {days} dias juntos e cada um com uma surpresa no coração
          </Text>
        </View>

        {/* Motivational footer */}
        <View style={styles.footerBox}>
          <Text style={styles.footerQuote}>
            "O amor está nos pequenos gestos,{'\n'}nas surpresas do cotidiano,{'\n'}em cada momento compartilhado."
          </Text>
          <Text style={styles.footerSig}>— feito com amor para você 🌹</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, paddingTop: 20, paddingHorizontal: 22, alignItems: 'center' },

  header: { alignItems: 'center', marginBottom: 32 },
  headerTitle: {
    fontSize: 28, fontWeight: '900', color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },
  headerSub: {
    fontSize: 14, color: 'rgba(255,255,255,0.85)',
    textAlign: 'center', fontStyle: 'italic', marginTop: 8, lineHeight: 22,
  },

  glowRing: {
    position: 'absolute', width: 280, height: 280, borderRadius: 140,
    borderWidth: 2, borderColor: 'rgba(255,182,193,0.35)',
    top: '50%', left: '50%',
    transform: [{ translateX: -140 }, { translateY: -140 }],
  },
  box: {
    width: '100%', borderRadius: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 16,
    marginBottom: 20,
  },
  boxGrad: { borderRadius: 24 },
  boxInner: { padding: 32, alignItems: 'center', minHeight: 280, justifyContent: 'center' },

  boxMainEmoji: { fontSize: 72, marginBottom: 16 },
  boxQuestion: {
    fontSize: 20, fontWeight: '800', color: '#FFFFFF',
    textAlign: 'center', lineHeight: 28, marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  boxHint: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontStyle: 'italic', marginBottom: 24 },

  revealBtn: { borderRadius: 50, overflow: 'hidden' },
  revealBtnGrad: { paddingVertical: 14, paddingHorizontal: 32 },
  revealBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },

  revealed: { alignItems: 'center', width: '100%' },
  revealedEmoji: { fontSize: 64, marginBottom: 10 },
  revealedLabel: {
    fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4,
  },
  revealedTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', marginBottom: 14, textAlign: 'center' },
  revealedDivider: { width: 50, height: 1.5, backgroundColor: 'rgba(255,255,255,0.4)', marginBottom: 14 },
  revealedContent: {
    fontSize: 15, color: 'rgba(60, 2, 69, 0.92)',
    textAlign: 'center', lineHeight: 24, fontStyle: 'italic',
  },

  daysBadge: {
    borderRadius: 50, paddingVertical: 12, paddingHorizontal: 20,
    overflow: 'hidden', marginBottom: 16, width: '100%', alignItems: 'center',
  },
  daysBadgeText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, textAlign: 'center' },

  footerBox: {
    padding: 18, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, width: '100%',
  },
  footerQuote: {
    fontSize: 13, color: 'rgba(255,255,255,0.82)',
    textAlign: 'center', fontStyle: 'italic', lineHeight: 22,
  },
  footerSig: { fontSize: 12, color: 'rgba(255,182,193,0.9)', marginTop: 8 },
});
