import React, { useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function CreditsScreen() {
  const insets = useSafeAreaInsets();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideIn = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideIn, { toValue: 0, tension: 55, friction: 9, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0A0515', '#1A0A20', '#2C1654', '#3D1021']}
        style={StyleSheet.absoluteFill}
      />

      {['✨', '⭐', '💫', '✨', '⭐'].map((s, i) => (
        <Text key={i} style={[styles.particle, { top: 60 + i * 40, left: 20 + i * 60, opacity: 0.4 }]}>{s}</Text>
      ))}

      <Animated.View style={[styles.container, { opacity: fadeIn, transform: [{ translateY: slideIn }] }]}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.creditsCard}>
            <LinearGradient
              colors={['rgba(212,175,55,0.18)', 'rgba(192,57,90,0.12)', 'transparent']}
              style={styles.creditsHeaderBg}
            />
            <Text style={styles.creditsBigEmoji}>💖</Text>
            <Text style={styles.creditsTitle}>Criado pelo Matheus</Text>
            <Text style={styles.creditsSubtitle}>feito do zero, à mão, só pra Mary</Text>

            <View style={styles.creditsDivider} />

            <Text style={styles.creditsSectionLabel}>⏱️ O que foi necessário</Text>
            {[
              { emoji: '🌙', label: 'Madrugadas viradas', value: 'acho que umas 4 kkkk' },
              { emoji: '🧠', label: 'Horas de planejamento', value: 'uns 4 dias' },
              { emoji: '💻', label: 'Linhas de código escritas', value: '+16 mil linhas pra vc meu amor kakakka' },
              { emoji: '🐛', label: 'Bugs corrigidos no grito', value: 'tem nem como contar' },
              { emoji: '☕', label: 'Cafés e paciência', value: 'MUITO' },
              { emoji: '💕', label: 'Amor por trás de tudo', value: 'infinito' },
            ].map((item, i) => (
              <View key={i} style={styles.creditsRow}>
                <Text style={styles.creditsRowEmoji}>{item.emoji}</Text>
                <Text style={styles.creditsRowLabel}>{item.label}</Text>
                <Text style={styles.creditsRowValue}>{item.value}</Text>
              </View>
            ))}

            <View style={styles.creditsDivider} />

            <Text style={styles.creditsSectionLabel}>🛠️ Tecnologias utilizadas</Text>
            {[
              { emoji: '⚛️', name: 'React Native', desc: 'base do aplicativo' },
              { emoji: '📱', name: 'Expo SDK 54', desc: 'plataforma de desenvolvimento' },
              { emoji: '🔥', name: 'Firebase / Firestore', desc: 'mensagens especiais em tempo real' },
              { emoji: '🔔', name: 'Expo Notifications', desc: 'frases do dia agendadas' },
              { emoji: '🎨', name: 'Expo Linear Gradient', desc: 'todos os degradês bonitos' },
              { emoji: '💾', name: 'AsyncStorage', desc: 'dados salvos no celular' },
              { emoji: '🎮', name: 'React Native Animated', desc: 'todas as animações do app e do Flappy Love' },
            ].map((item, i) => (
              <View key={i} style={styles.techRow}>
                <Text style={styles.techEmoji}>{item.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.techName}>{item.name}</Text>
                  <Text style={styles.techDesc}>{item.desc}</Text>
                </View>
              </View>
            ))}

            <View style={styles.creditsDivider} />

            <Text style={styles.creditsSectionLabel}>✨ O que foi construído</Text>
            {[
              '💌 Sistema de cartas de amor personalizáveis',
              '💝 Surpresa do dia com conteúdo rotativo',
              '📅 Contador de dias juntos em tempo real',
              '🔔 Notificações de frases agendadas automaticamente',
              '🎮 Três joguinhos feitos do zero (Flappy, Memória e Pega-Corações)',
              '🎨 Seis temas pra você deixar o app com a sua cara',
              '🌹 Tela especial "Para Mary"',
              '🔥 Integração com Firebase para mensagens remotas',
              '📱 Funciona no iPhone, Android e na web',
              '⚙️ Painel de administração completo',
            ].map((feat, i) => (
              <Text key={i} style={styles.featItem}>{feat}</Text>
            ))}

            <View style={styles.creditsDivider} />

            <View style={styles.creditsNote}>
              <Text style={styles.creditsNoteText}>
                Mary, eu podia ter te dado algo comum.{'\n'}
                Mas você não é comum pra mim.{'\n\n'}
                Então eu virei a noite, aprendi do zero,{'\n'}
                errei mil vezes e refiz tudo de novo —{'\n'}
                porque eu faço questão de fazer coisas de{'\n'}
                níveis absurdos por você.{'\n\n'}
                Não porque eu precisava.{'\n'}
                Mas porque é assim que eu te amo. 🌹{'\n\n'}
                — Matheus
              </Text>
            </View>

            <Text style={styles.creditsFooter}>
              v1.1 · MaryLove App · feito com amor pelo Matheus
            </Text>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  particle: { position: 'absolute', fontSize: 16 },
  scrollContent: { padding: 16 },

  creditsCard: {
    borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 22,
  },
  creditsHeaderBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  creditsBigEmoji: { fontSize: 44, textAlign: 'center', marginBottom: 8 },
  creditsTitle: {
    fontSize: 20, fontWeight: '900', color: '#FFD700',
    textAlign: 'center', letterSpacing: 0.5,
  },
  creditsSubtitle: {
    fontSize: 12, color: 'rgba(255,182,193,0.7)',
    textAlign: 'center', fontStyle: 'italic', marginTop: 4,
  },
  creditsDivider: {
    height: 1, backgroundColor: 'rgba(255,182,193,0.15)',
    marginVertical: 16,
  },
  creditsSectionLabel: {
    fontSize: 11, color: '#FFD700', fontWeight: '800',
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12,
  },
  creditsRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 10, gap: 10,
  },
  creditsRowEmoji: { fontSize: 18, width: 26 },
  creditsRowLabel: { flex: 1, fontSize: 13, color: 'rgba(255,214,228,0.8)' },
  creditsRowValue: {
    fontSize: 13, fontWeight: '800', color: '#FFD700',
  },
  techRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12, padding: 12, marginBottom: 8, gap: 12,
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.1)',
  },
  techEmoji: { fontSize: 22 },
  techName: { fontSize: 13, fontWeight: '800', color: '#FFD6E4' },
  techDesc: { fontSize: 11, color: 'rgba(255,182,193,0.6)', marginTop: 2 },
  featItem: {
    fontSize: 13, color: 'rgba(255,214,228,0.85)',
    marginBottom: 7, lineHeight: 20,
  },
  creditsNote: {
    backgroundColor: 'rgba(192,57,90,0.12)',
    borderRadius: 14, padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(192,57,90,0.25)',
  },
  creditsNoteText: {
    fontSize: 14, color: 'rgba(255,200,220,0.95)',
    textAlign: 'center', lineHeight: 24, fontStyle: 'italic',
  },
  creditsFooter: {
    fontSize: 10, color: 'rgba(255,182,193,0.4)',
    textAlign: 'center', letterSpacing: 1,
  },
});
