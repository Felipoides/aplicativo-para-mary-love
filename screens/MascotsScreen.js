import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MascotViewer from '../components/MascotViewer';
import { useTheme } from '../utils/theme';
import useAmbientMotion from '../utils/useAmbientMotion';

const CHOICES = [
  { id: 'both', label: 'Juntinhos', emoji: '💕' },
  { id: 'matheus', label: 'Matheus', emoji: '🎧' },
  { id: 'mary', label: 'Mary', emoji: '💜' },
];

export default function MascotsScreen({ onBack }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const motionEnabled = useAmbientMotion();
  const [selected, setSelected] = useState('both');
  const [error, setError] = useState(null);
  const [hearts, setHearts] = useState(0);

  return (
    <View style={[styles.page, { backgroundColor: theme.home[0] }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 14, paddingBottom: insets.bottom + 32 }]}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Voltar" style={styles.back}>
          <Ionicons name="arrow-back" size={19} color={theme.accent} />
          <Text style={[styles.backText, { color: theme.accent }]}>Voltar</Text>
        </Pressable>
        <Text style={[styles.kicker, { color: theme.accent }]}>NOSSO CANTINHO</Text>
        <Text style={[styles.title, { color: theme.textDark }]}>Nós dois em 3D ✨</Text>
        <Text style={[styles.intro, { color: theme.textMedium }]}>Escolha um bonequinho e arraste para vê-lo de outro ângulo.</Text>

        <View style={styles.viewerFrame}>
          {error ? (
            <View style={styles.fallback}>
              <Image source={require('../assets/mascots/conceito-aprovado.png')} resizeMode="contain" style={styles.fallbackImage} />
              <Text style={styles.fallbackText}>O 3D não carregou neste aparelho. Nosso desenho continua aqui 💕</Text>
            </View>
          ) : <MascotViewer selected={selected} motionEnabled={motionEnabled} onError={setError} />}
        </View>

        <View style={styles.choices}>
          {CHOICES.map((choice) => (
            <Pressable key={choice.id} onPress={() => setSelected(choice.id)} accessibilityRole="button"
              accessibilityState={{ selected: selected === choice.id }}
              style={[styles.choice, { backgroundColor: selected === choice.id ? theme.accent : theme.cardBg, borderColor: theme.accent + '35' }]}>
              <Text style={styles.choiceEmoji}>{choice.emoji}</Text>
              <Text style={[styles.choiceText, { color: selected === choice.id ? '#fff' : theme.textDark }]}>{choice.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable onPress={() => setHearts((value) => value + 1)} accessibilityRole="button" style={[styles.care, { backgroundColor: theme.cardBg, borderColor: theme.accent + '35' }]}>
          <Text style={styles.careEmoji}>💗</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.careTitle, { color: theme.textDark }]}>Dar carinho</Text>
            <Text style={[styles.careSubtitle, { color: theme.textMedium }]}>{hearts ? `${hearts} carinho${hearts === 1 ? '' : 's'} hoje. Eles adoraram!` : 'Toque para mimar os dois'}</Text>
          </View>
          <Ionicons name="heart" color={theme.accent} size={19} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 }, content: { width: '100%', maxWidth: 600, alignSelf: 'center', paddingHorizontal: 18 },
  back: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 42, marginBottom: 13 },
  backText: { fontSize: 14, fontWeight: '700' },
  kicker: { fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 7 },
  title: { fontSize: 28, fontWeight: '900', marginBottom: 6 },
  intro: { fontSize: 13, lineHeight: 19, marginBottom: 16 },
  viewerFrame: { width: '100%', height: 390, borderRadius: 24, overflow: 'hidden', backgroundColor: '#120e20', borderWidth: 1, borderColor: '#544054' },
  choices: { flexDirection: 'row', gap: 7, marginTop: 15 },
  choice: { flex: 1, minHeight: 53, borderRadius: 16, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  choiceEmoji: { fontSize: 16 }, choiceText: { fontSize: 12, fontWeight: '800' },
  care: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 16, borderRadius: 18, borderWidth: 1, marginTop: 15 },
  careEmoji: { fontSize: 30 }, careTitle: { fontSize: 15, fontWeight: '800' },
  careSubtitle: { fontSize: 12, marginTop: 4 },
  fallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fallbackImage: { width: '100%', height: 320 }, fallbackText: { color: '#ffe2ef', fontSize: 12, textAlign: 'center', paddingHorizontal: 15 },
});
