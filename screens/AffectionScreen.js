import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEFAULT_WISHES, MOODS } from '../constants/affection';
import { getAffectionData, getSavedMood, saveMood, sendMissingYou } from '../utils/firebase';
import { useTheme } from '../utils/theme';

function SectionTitle({ eyebrow, title, icon, color }) {
  return (
    <View style={styles.sectionTitle}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.eyebrow, { color }]}>{eyebrow}</Text>
        <Text style={styles.heading}>{title}</Text>
      </View>
      <Ionicons name={icon} size={21} color={color} />
    </View>
  );
}

export default function AffectionScreen({ onMoodChange, onOpenMary }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [moodId, setMoodId] = useState(null);
  const [wishes, setWishes] = useState(DEFAULT_WISHES);
  const [audios, setAudios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingMissing, setSendingMissing] = useState(false);

  useEffect(() => {
    (async () => {
      const [savedMood, data] = await Promise.all([getSavedMood(), getAffectionData()]);
      if (savedMood?.id) {
        setMoodId(savedMood.id);
        onMoodChange?.(savedMood.id);
      }
      if (data.wishes?.length) setWishes(data.wishes);
      if (data.audios?.length) setAudios(data.audios);
      setLoading(false);
    })();
  }, []);

  const dailyWish = useMemo(() => {
    const start = new Date(new Date().getFullYear(), 0, 0);
    const day = Math.floor((new Date() - start) / 86400000);
    return wishes[day % wishes.length];
  }, [wishes]);

  const chooseMood = async (mood) => {
    setMoodId(mood.id);
    onMoodChange?.(mood.id);
    await saveMood(mood);
  };

  const handleMissing = async () => {
    setSendingMissing(true);
    const sent = await sendMissingYou();
    setSendingMissing(false);
    Alert.alert(
      sent ? 'Saudade enviada 💗' : 'Guardado com carinho',
      sent
        ? 'Pronto. O Matheus vai saber que você queria ele pertinho agora.'
        : 'Não consegui avisar agora, mas seu carinho ficou registrado no aplicativo.'
    );
  };

  const openAudio = async (audio) => {
    if (!audio?.url) return;
    const supported = await Linking.canOpenURL(audio.url);
    if (supported) await Linking.openURL(audio.url);
    else Alert.alert('Áudio indisponível', 'Esse áudio ainda não está pronto para tocar.');
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={theme.home} style={StyleSheet.absoluteFill} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
      >
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroPill, { color: theme.accent }]}>NOSSO CANTINHO</Text>
            <Text style={[styles.heroTitle, { color: theme.textDark }]}>Como tá seu coração?</Text>
            <Text style={[styles.heroSubtitle, { color: theme.textMedium }]}>Me conta. O Mini Matheus vai reagir com você.</Text>
          </View>
          <Text style={styles.heroEmoji}>🧸</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: `${theme.accent}20` }]}>
          <SectionTitle eyebrow="HUMOR DE HOJE" title="Escolhe como você tá" icon="heart-half-outline" color={theme.accent} />
          <View style={styles.moodGrid}>
            {MOODS.map((mood) => {
              const selected = moodId === mood.id;
              return (
                <TouchableOpacity
                  key={mood.id}
                  onPress={() => chooseMood(mood)}
                  activeOpacity={0.78}
                  style={[
                    styles.moodButton,
                    { borderColor: selected ? theme.accent : `${theme.accent}1A`, backgroundColor: selected ? `${theme.accent}16` : 'transparent' },
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                  <Text style={[styles.moodLabel, { color: selected ? theme.accent : theme.textDark }]}>{mood.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.card, styles.wishCard, { backgroundColor: theme.cardBg, borderColor: `${theme.accent}20` }]}>
          <SectionTitle eyebrow="COFRINHO DE DESEJOS" title="Uma ideia diferente por dia" icon="sparkles-outline" color={theme.accent} />
          <Text style={[styles.wishIntro, { color: theme.textMedium }]}>
            Criei isso aqui pra cada dia atualizar mostrando coisas que eu já imaginei que faria com você KAKAKA.
          </Text>
          <LinearGradient colors={[`${theme.accent}16`, `${theme.accent}08`]} style={styles.dailyWish}>
            <Text style={styles.dailyEmoji}>{dailyWish?.emoji || '💭'}</Text>
            <Text style={[styles.dailyTitle, { color: theme.textDark }]}>{dailyWish?.title}</Text>
            <Text style={[styles.dailyNote, { color: theme.textMedium }]}>{dailyWish?.note}</Text>
            <View style={[styles.tomorrowPill, { backgroundColor: `${theme.accent}14` }]}>
              <Ionicons name="time-outline" size={13} color={theme.accent} />
              <Text style={[styles.tomorrowText, { color: theme.accent }]}>Amanhã aparece outro</Text>
            </View>
          </LinearGradient>
        </View>

        <TouchableOpacity onPress={handleMissing} activeOpacity={0.86} disabled={sendingMissing} style={styles.missingButton}>
          <LinearGradient colors={[theme.accentDark, theme.accent, theme.accentLight]} style={styles.missingGradient}>
            <View style={styles.missingIcon}><Text style={{ fontSize: 26 }}>🥺</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.missingEyebrow}>MODO SAUDADE</Text>
              <Text style={styles.missingTitle}>Queria você aqui agora</Text>
              <Text style={styles.missingSub}>Toca aqui que eu aviso o Matheus</Text>
            </View>
            {sendingMissing ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="paper-plane" size={22} color="#FFFFFF" />}
          </LinearGradient>
        </TouchableOpacity>

        <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: `${theme.accent}20` }]}>
          <SectionTitle eyebrow="ÁUDIOS SURPRESA" title="Pra ouvir quando quiser" icon="headset-outline" color={theme.accent} />
          {loading ? (
            <ActivityIndicator color={theme.accent} style={{ marginVertical: 18 }} />
          ) : audios.length ? (
            audios.map((audio, index) => (
              <TouchableOpacity
                key={audio.id || `${audio.title}-${index}`}
                style={[styles.audioRow, { borderColor: `${theme.accent}18` }]}
                onPress={() => openAudio(audio)}
                activeOpacity={0.75}
              >
                <View style={[styles.playButton, { backgroundColor: theme.accent }]}>
                  <Ionicons name="play" size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.audioTitle, { color: theme.textDark }]}>{audio.title || 'Um áudio pra você'}</Text>
                  <Text style={[styles.audioCaption, { color: theme.textMedium }]}>{audio.caption || 'Gravado com carinho pelo Matheus'}</Text>
                </View>
                <Text style={{ fontSize: 21 }}>{audio.emoji || '🎧'}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={[styles.emptyAudio, { backgroundColor: `${theme.accent}0C` }]}>
              <Text style={{ fontSize: 28 }}>🎙️</Text>
              <Text style={[styles.emptyTitle, { color: theme.textDark }]}>O primeiro áudio tá sendo preparado</Text>
              <Text style={[styles.emptyText, { color: theme.textMedium }]}>Quando o Matheus enviar, ele aparece aqui como surpresa.</Text>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={onOpenMary} style={[styles.oldMessages, { borderColor: `${theme.accent}20` }]} activeOpacity={0.8}>
          <Ionicons name="mail-unread-outline" size={20} color={theme.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.oldMessagesTitle, { color: theme.textDark }]}>Recados do Matheus</Text>
            <Text style={[styles.oldMessagesSub, { color: theme.textMedium }]}>As sete coisas que ele quer que você nunca esqueça</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.accent} />
        </TouchableOpacity>

        <View style={{ height: 125 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { width: '100%', maxWidth: 600, alignSelf: 'center', paddingHorizontal: 18, paddingBottom: 28 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  heroPill: { fontSize: 9, fontWeight: '900', letterSpacing: 1.6, marginBottom: 7 },
  heroTitle: { fontSize: 29, lineHeight: 34, fontWeight: '900', letterSpacing: -0.5 },
  heroSubtitle: { fontSize: 13, lineHeight: 19, marginTop: 6 },
  heroEmoji: { fontSize: 52 },
  card: { borderWidth: 1, borderRadius: 22, padding: 17, marginBottom: 13 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  eyebrow: { fontSize: 8, fontWeight: '900', letterSpacing: 1.35, marginBottom: 3 },
  heading: { color: '#3D1021', fontSize: 17, fontWeight: '850' },
  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  moodButton: { width: '31.5%', minHeight: 76, borderWidth: 1, borderRadius: 15, padding: 8, alignItems: 'center', justifyContent: 'center' },
  moodEmoji: { fontSize: 26, marginBottom: 5 },
  moodLabel: { textAlign: 'center', fontSize: 10, lineHeight: 13, fontWeight: '750' },
  wishCard: { overflow: 'hidden' },
  wishIntro: { fontSize: 12, lineHeight: 18, marginTop: -4, marginBottom: 14 },
  dailyWish: { borderRadius: 18, padding: 17, alignItems: 'flex-start' },
  dailyEmoji: { fontSize: 34, marginBottom: 9 },
  dailyTitle: { fontSize: 18, lineHeight: 23, fontWeight: '900' },
  dailyNote: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  tomorrowPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, marginTop: 13 },
  tomorrowText: { fontSize: 9, fontWeight: '800' },
  missingButton: { borderRadius: 22, overflow: 'hidden', marginBottom: 13 },
  missingGradient: { minHeight: 118, padding: 17, flexDirection: 'row', alignItems: 'center', gap: 13 },
  missingIcon: { width: 52, height: 52, borderRadius: 17, backgroundColor: 'rgba(255,255,255,.15)', alignItems: 'center', justifyContent: 'center' },
  missingEyebrow: { color: 'rgba(255,255,255,.72)', fontSize: 8, fontWeight: '900', letterSpacing: 1.3, marginBottom: 5 },
  missingTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  missingSub: { color: 'rgba(255,255,255,.76)', fontSize: 10, marginTop: 4 },
  audioRow: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, paddingVertical: 11 },
  playButton: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  audioTitle: { fontSize: 13, fontWeight: '850' },
  audioCaption: { fontSize: 10, lineHeight: 14, marginTop: 3 },
  emptyAudio: { borderRadius: 16, padding: 18, alignItems: 'center' },
  emptyTitle: { fontSize: 13, fontWeight: '850', textAlign: 'center', marginTop: 8 },
  emptyText: { fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 5 },
  oldMessages: { minHeight: 70, borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  oldMessagesTitle: { fontSize: 13, fontWeight: '850' },
  oldMessagesSub: { fontSize: 10, lineHeight: 14, marginTop: 3 },
});
