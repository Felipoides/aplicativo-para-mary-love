import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, Animated, Alert, StatusBar, Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getStartDate, setStartDate, getLetters, saveLetters,
  getPhrases, savePhrases, getOpenCount, getFlappyBest,
  getFlappyGamesPlayed, getDaysTogether, resetAll,
} from '../utils/storage';
import {
  NOTIFICATION_INTERVALS, getNotificationInterval,
  setNotificationInterval, scheduleHourlyNotifications,
  cancelAllNotifications, getScheduledCount,
} from '../utils/notifications';
import { LOVE_LETTERS, LOVE_PHRASES } from '../constants/phrases';

const THEMES = [
  { id: 'rose', label: '🌹 Rosa', desc: 'Romântico clássico' },
  { id: 'sakura', label: '🌸 Sakura', desc: 'Flor de cerejeira' },
  { id: 'midnight', label: '🌙 Meia-noite', desc: 'Escuro e apaixonante' },
  { id: 'sunset', label: '🌅 Pôr do Sol', desc: 'Dourado e caloroso' },
];

function DevSection({ title, emoji, children }) {
  const [open, setOpen] = useState(false);
  const heightAnim = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toOpen = !open;
    setOpen(toOpen);
    Animated.parallel([
      Animated.spring(heightAnim, {
        toValue: toOpen ? 1 : 0,
        tension: 60, friction: 10, useNativeDriver: false,
      }),
      Animated.timing(rotate, {
        toValue: toOpen ? 1 : 0, duration: 250, useNativeDriver: true,
      }),
    ]).start();
  };

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] });

  return (
    <View style={devStyles.section}>
      <TouchableOpacity style={devStyles.sectionHeader} onPress={toggle} activeOpacity={0.8}>
        <Text style={devStyles.sectionEmoji}>{emoji}</Text>
        <Text style={devStyles.sectionTitle}>{title}</Text>
        <Animated.Text style={[devStyles.sectionArrow, { transform: [{ rotate: spin }] }]}>▶</Animated.Text>
      </TouchableOpacity>
      {open && <View style={devStyles.sectionBody}>{children}</View>}
    </View>
  );
}

function StatCard({ label, value, emoji }) {
  return (
    <View style={devStyles.statCard}>
      <Text style={devStyles.statEmoji}>{emoji}</Text>
      <Text style={devStyles.statValue}>{value}</Text>
      <Text style={devStyles.statLabel}>{label}</Text>
    </View>
  );
}

export default function DeveloperScreen({ onBack }) {
  const insets = useSafeAreaInsets();
  const [startDate, setStartDateState] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [letters, setLetters] = useState([]);
  const [phrases, setPhrases] = useState([]);
  const [stats, setStats] = useState({ opens: 0, best: 0, games: 0, days: 0 });
  const [newPhraseText, setNewPhraseText] = useState('');
  const [editingLetter, setEditingLetter] = useState(null);
  const [letterTitle, setLetterTitle] = useState('');
  const [letterContent, setLetterContent] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('rose');
  const [notifInterval, setNotifIntervalState] = useState(1);
  const [notifCount, setNotifCount] = useState(0);

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideIn = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadData();
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideIn, { toValue: 0, tension: 55, friction: 9, useNativeDriver: true }),
    ]).start();
  }, []);

  const loadData = async () => {
    const [sd, lts, phs, opens, best, games, days, interval, count] = await Promise.all([
      getStartDate(),
      getLetters(),
      getPhrases(),
      getOpenCount(),
      getFlappyBest(),
      getFlappyGamesPlayed(),
      getDaysTogether(),
      getNotificationInterval(),
      getScheduledCount(),
    ]);
    setStartDateState(sd);
    setDateInput(sd);
    setLetters(lts);
    setPhrases(phs);
    setStats({ opens, best, games, days });
    setNotifIntervalState(interval);
    setNotifCount(count);
  };

  const handleChangeNotifInterval = async (hours) => {
    setNotifIntervalState(hours);
    await setNotificationInterval(hours);
    await scheduleHourlyNotifications(hours);
    const count = await getScheduledCount();
    setNotifCount(count);
    if (hours === 0) {
      Alert.alert('🔕 Notificações Desativadas', 'Mary não receberá mais notificações.');
    } else {
      const option = NOTIFICATION_INTERVALS.find(o => o.value === hours);
      Alert.alert('🔔 Notificações Ativas!', `Mary receberá mensagens a cada ${option?.label}.\n${count} notificações agendadas.`);
    }
  };

  const handleSaveDate = async () => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateInput)) {
      Alert.alert('Formato Inválido', 'Use o formato AAAA-MM-DD (ex: 2024-06-12)');
      return;
    }
    await setStartDate(dateInput);
    setStartDateState(dateInput);
    const days = await getDaysTogether();
    setStats(s => ({ ...s, days }));
    Alert.alert('💕 Salvo!', `Data de início definida para ${dateInput}. Agora são ${days} dias juntos!`);
  };

  const handleAddPhrase = async () => {
    if (!newPhraseText.trim()) return;
    const updated = [...phrases, newPhraseText.trim()];
    await savePhrases(updated);
    setPhrases(updated);
    setNewPhraseText('');
    Alert.alert('🌹 Frase Adicionada!', 'A nova frase foi salva com amor.');
  };

  const handleDeletePhrase = async (index) => {
    Alert.alert('Remover Frase?', phrases[index].substring(0, 50) + '...', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          const updated = phrases.filter((_, i) => i !== index);
          await savePhrases(updated);
          setPhrases(updated);
        },
      },
    ]);
  };

  const handleSaveLetter = async () => {
    if (!letterTitle.trim() || !letterContent.trim()) return;
    let updated;
    if (editingLetter) {
      updated = letters.map(l =>
        l.id === editingLetter.id ? { ...l, title: letterTitle, content: letterContent } : l
      );
    } else {
      const newLetter = {
        id: String(Date.now()),
        title: letterTitle,
        date: new Date().toISOString().split('T')[0],
        emoji: '💌',
        preview: letterContent.substring(0, 60) + '...',
        content: letterContent,
      };
      updated = [...letters, newLetter];
    }
    await saveLetters(updated);
    setLetters(updated);
    setEditingLetter(null);
    setLetterTitle('');
    setLetterContent('');
    Alert.alert('💌 Carta Salva!', 'Sua carta de amor foi salva com carinho.');
  };

  const handleDeleteLetter = (id) => {
    Alert.alert('Apagar Carta?', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          const updated = letters.filter(l => l.id !== id);
          await saveLetters(updated);
          setLetters(updated);
        },
      },
    ]);
  };

  const handleReset = () => {
    Alert.alert(
      '⚠️ Resetar Tudo?',
      'Isso apagará todos os dados personalizados e voltará aos padrões. Confirma?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Resetar',
          style: 'destructive',
          onPress: async () => {
            await resetAll();
            await loadData();
            Alert.alert('🔄 Resetado', 'Dados voltaram ao padrão.');
          },
        },
      ]
    );
  };

  return (
    <View style={devStyles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#0A0515', '#1A0A20', '#2C1654', '#3D1021']}
        style={StyleSheet.absoluteFill}
      />

      {/* Gold particles */}
      {['✨', '⭐', '💫', '✨', '⭐'].map((s, i) => (
        <Text key={i} style={[devStyles.particle, { top: 60 + i * 40, left: 20 + i * 60, opacity: 0.4 }]}>{s}</Text>
      ))}

      <Animated.View style={[devStyles.container, { opacity: fadeIn, transform: [{ translateY: slideIn }] }]}>
        {/* Header */}
        <LinearGradient
          colors={['rgba(212,175,55,0.15)', 'rgba(192,57,90,0.1)']}
          style={devStyles.headerBg}
        />
        <View style={[devStyles.header, { paddingTop: insets.top + 16 }]}>
          <View>
            <Text style={devStyles.headerBadge}>⚙️ MODO DESENVOLVEDOR</Text>
            <Text style={devStyles.headerTitle}>Painel de Amor</Text>
            <Text style={devStyles.headerSub}>Construído com dedicação para Mary 🌹</Text>
          </View>
          <TouchableOpacity onPress={onBack} style={devStyles.backBtn}>
            <LinearGradient colors={['#C0395A', '#E8527A']} style={devStyles.backBtnGrad} borderRadius={50}>
              <Text style={devStyles.backBtnText}>← Sair</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={devStyles.scroll}
          contentContainerStyle={devStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Analytics */}
          <DevSection title="Analytics do Amor" emoji="📊">
            <View style={devStyles.statsGrid}>
              <StatCard label="Dias Juntos" value={stats.days} emoji="📅" />
              <StatCard label="Vezes Abertas" value={stats.opens} emoji="💕" />
              <StatCard label="Recorde Flappy" value={stats.best} emoji="🏆" />
              <StatCard label="Partidas Jogadas" value={stats.games} emoji="🎮" />
            </View>
            <Text style={devStyles.analyticsNote}>
              📈 Cada abertura é um sorriso que vale a pena registrar.
            </Text>
          </DevSection>

          {/* Date Config */}
          <DevSection title="Data de Início" emoji="📅">
            <Text style={devStyles.fieldLabel}>Data atual: {startDate}</Text>
            <Text style={devStyles.fieldHint}>Formato: AAAA-MM-DD</Text>
            <TextInput
              style={devStyles.input}
              value={dateInput}
              onChangeText={setDateInput}
              placeholder="ex: 2024-06-12"
              placeholderTextColor="#6B3FA0"
              keyboardType="numeric"
            />
            <TouchableOpacity style={devStyles.saveBtn} onPress={handleSaveDate}>
              <LinearGradient colors={['#D4AF37', '#FFD700']} style={devStyles.saveBtnGrad} borderRadius={12}>
                <Text style={devStyles.saveBtnText}>💾 Salvar Data</Text>
              </LinearGradient>
            </TouchableOpacity>
          </DevSection>

          {/* Phrases Manager */}
          <DevSection title="Gerenciar Frases" emoji="💬">
            <Text style={devStyles.fieldHint}>{phrases.length} frases cadastradas</Text>
            <TextInput
              style={[devStyles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              value={newPhraseText}
              onChangeText={setNewPhraseText}
              placeholder="Digite uma nova frase romântica..."
              placeholderTextColor="#6B3FA0"
              multiline
            />
            <TouchableOpacity style={devStyles.saveBtn} onPress={handleAddPhrase}>
              <LinearGradient colors={['#C0395A', '#E8527A']} style={devStyles.saveBtnGrad} borderRadius={12}>
                <Text style={devStyles.saveBtnText}>+ Adicionar Frase</Text>
              </LinearGradient>
            </TouchableOpacity>
            {phrases.slice(0, 5).map((p, i) => (
              <View key={i} style={devStyles.listItem}>
                <Text style={devStyles.listItemText} numberOfLines={2}>{p}</Text>
                <TouchableOpacity onPress={() => handleDeletePhrase(i)} style={devStyles.deleteBtn}>
                  <Text style={devStyles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {phrases.length > 5 && (
              <Text style={devStyles.moreText}>+ {phrases.length - 5} mais frases...</Text>
            )}
          </DevSection>

          {/* Letters Manager */}
          <DevSection title="Gerenciar Cartas" emoji="💌">
            <TextInput
              style={devStyles.input}
              value={letterTitle}
              onChangeText={setLetterTitle}
              placeholder="Título da carta"
              placeholderTextColor="#6B3FA0"
            />
            <TextInput
              style={[devStyles.input, { minHeight: 120, textAlignVertical: 'top' }]}
              value={letterContent}
              onChangeText={setLetterContent}
              placeholder="Conteúdo da carta de amor..."
              placeholderTextColor="#6B3FA0"
              multiline
            />
            <TouchableOpacity style={devStyles.saveBtn} onPress={handleSaveLetter}>
              <LinearGradient colors={['#C0395A', '#8B1E3F']} style={devStyles.saveBtnGrad} borderRadius={12}>
                <Text style={devStyles.saveBtnText}>
                  {editingLetter ? '✏️ Atualizar Carta' : '+ Nova Carta de Amor'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            {letters.map(l => (
              <View key={l.id} style={devStyles.listItem}>
                <Text style={devStyles.listItemEmoji}>{l.emoji}</Text>
                <Text style={devStyles.listItemText} numberOfLines={1}>{l.title}</Text>
                <TouchableOpacity
                  onPress={() => { setEditingLetter(l); setLetterTitle(l.title); setLetterContent(l.content); }}
                  style={[devStyles.deleteBtn, { backgroundColor: 'rgba(212,175,55,0.2)', marginRight: 4 }]}
                >
                  <Text style={{ color: '#FFD700', fontSize: 12 }}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteLetter(l.id)} style={devStyles.deleteBtn}>
                  <Text style={devStyles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </DevSection>

          {/* Notifications */}
          <DevSection title="Notificações para Mary" emoji="🔔">
            <Text style={devStyles.fieldLabel}>
              Intervalo atual:{' '}
              <Text style={{ color: '#FFD700', fontWeight: '800' }}>
                {NOTIFICATION_INTERVALS.find(o => o.value === notifInterval)?.label ?? '1 hora'}
              </Text>
            </Text>
            <Text style={devStyles.fieldHint}>
              {notifCount > 0
                ? `${notifCount} notificações agendadas nas próximas horas`
                : 'Nenhuma notificação agendada'}
            </Text>
            <View style={devStyles.notifGrid}>
              {NOTIFICATION_INTERVALS.map(opt => {
                const active = notifInterval === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[devStyles.notifBtn, active && devStyles.notifBtnActive]}
                    onPress={() => handleChangeNotifInterval(opt.value)}
                    activeOpacity={0.75}
                  >
                    <Text style={[devStyles.notifBtnText, active && devStyles.notifBtnTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </DevSection>

          {/* Danger Zone */}
          <DevSection title="Zona de Reset" emoji="⚠️">
            <Text style={devStyles.dangerText}>
              Reseta todos os dados personalizados e volta aos padrões.
              Cartas e frases customizadas serão perdidas.
            </Text>
            <TouchableOpacity style={devStyles.dangerBtn} onPress={handleReset}>
              <Text style={devStyles.dangerBtnText}>🔄 Resetar Todos os Dados</Text>
            </TouchableOpacity>
          </DevSection>

          {/* Credits */}
          <View style={devStyles.credits}>
            <Text style={devStyles.creditsTitle}>💖 Sobre este App</Text>
            <Text style={devStyles.creditsText}>
              Feito com amor, linha por linha.{'\n'}
              Cada funcionalidade pensada especialmente para Mary.{'\n\n'}
              Tecnologia: Expo · React Native{'\n'}
              Feito com: ❤️ infinito
            </Text>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const devStyles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1 },
  particle: { position: 'absolute', fontSize: 16 },

  headerBg: { ...StyleSheet.absoluteFillObject, height: 160 },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingTop: 16, paddingHorizontal: 20, paddingBottom: 16,
  },
  headerBadge: {
    fontSize: 10, color: '#FFD700', letterSpacing: 2,
    fontWeight: '700', marginBottom: 4,
  },
  headerTitle: {
    fontSize: 26, fontWeight: '900', color: '#FFFFFF',
    textShadowColor: 'rgba(212,175,55,0.5)',
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8,
  },
  headerSub: { fontSize: 12, color: 'rgba(255,182,193,0.8)', fontStyle: 'italic', marginTop: 3 },
  backBtn: { borderRadius: 50, overflow: 'hidden', marginTop: 4 },
  backBtnGrad: { paddingVertical: 8, paddingHorizontal: 16 },
  backBtnText: { color: '#FFF', fontWeight: '800', fontSize: 13 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  section: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16,
    marginBottom: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,182,193,0.12)',
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16,
  },
  sectionEmoji: { fontSize: 22, marginRight: 12 },
  sectionTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: '#FFD6E4' },
  sectionArrow: { fontSize: 12, color: '#FFD700' },
  sectionBody: { paddingHorizontal: 16, paddingBottom: 16 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  statCard: {
    flex: 1, minWidth: '40%', backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.2)',
  },
  statEmoji: { fontSize: 24, marginBottom: 6 },
  statValue: { fontSize: 28, fontWeight: '900', color: '#FFD700' },
  statLabel: { fontSize: 11, color: 'rgba(255,182,193,0.8)', textAlign: 'center', marginTop: 3 },
  analyticsNote: { fontSize: 12, color: 'rgba(255,182,193,0.7)', fontStyle: 'italic', marginTop: 6 },

  fieldLabel: { fontSize: 13, color: '#FFD6E4', marginBottom: 4 },
  fieldHint: { fontSize: 11, color: 'rgba(255,182,193,0.6)', marginBottom: 10, fontStyle: 'italic' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12,
    padding: 12, color: '#FFFFFF', fontSize: 14, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)',
  },
  saveBtn: { borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  saveBtnGrad: { padding: 13, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },

  listItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10,
    padding: 10, marginBottom: 8,
  },
  listItemEmoji: { fontSize: 18, marginRight: 8 },
  listItemText: { flex: 1, color: '#FFD6E4', fontSize: 12 },
  deleteBtn: {
    backgroundColor: 'rgba(192,57,90,0.25)', borderRadius: 8,
    width: 28, height: 28, alignItems: 'center', justifyContent: 'center',
  },
  deleteBtnText: { color: '#FF6B8A', fontSize: 12, fontWeight: '700' },
  moreText: { fontSize: 12, color: 'rgba(255,182,193,0.6)', textAlign: 'center', fontStyle: 'italic' },

  notifGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4, marginBottom: 4 },
  notifBtn: {
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.25)',
  },
  notifBtnActive: {
    backgroundColor: 'rgba(192,57,90,0.4)',
    borderColor: '#C0395A',
  },
  notifBtnText: { fontSize: 13, color: 'rgba(255,214,228,0.75)', fontWeight: '600' },
  notifBtnTextActive: { color: '#FFFFFF', fontWeight: '800' },

  dangerText: { fontSize: 13, color: 'rgba(255,100,100,0.8)', marginBottom: 14, lineHeight: 20 },
  dangerBtn: {
    backgroundColor: 'rgba(192,57,90,0.2)', borderRadius: 12,
    padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(192,57,90,0.4)',
  },
  dangerBtnText: { color: '#FF6B6B', fontWeight: '700', fontSize: 14 },

  credits: {
    marginTop: 8, padding: 20,
    backgroundColor: 'rgba(212,175,55,0.06)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.15)', alignItems: 'center',
  },
  creditsTitle: { fontSize: 16, fontWeight: '900', color: '#FFD700', marginBottom: 12 },
  creditsText: { fontSize: 13, color: 'rgba(255,214,228,0.85)', textAlign: 'center', lineHeight: 22 },
});
