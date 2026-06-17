import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, Modal, Pressable, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from './screens/HomeScreen';
import GamesHubScreen from './screens/GamesHubScreen';
import LoveLettersScreen from './screens/LoveLettersScreen';
import SurpriseScreen from './screens/SurpriseScreen';
import DeveloperScreen from './screens/DeveloperScreen';
import CreditsScreen from './screens/CreditsScreen';
import ThemePickerModal from './components/ThemePickerModal';
import InAppNotification from './components/InAppNotification';
import { scheduleHourlyNotifications, setupNotifications, presentTestNotification, registerForPushNotifications } from './utils/notifications';
import { syncFromFirebase, dismissSpecialMessage, listenForTestNotification, savePushToken } from './utils/firebase';
import { ThemeProvider, useTheme } from './utils/theme';

const MARY_MESSAGES = [
  { emoji: '🌹', text: 'Eu podia ter mandado um "bom dia" no zap. Mas você merecia mais que isso, então passei noites aprendendo a fazer esse app. Sou eu, o Matheus, sendo exagerado por você.' },
  { emoji: '💖', text: 'Tem dia que eu nem acho as palavras certas. Aí eu faço. Esse app é a minha forma desajeitada e sincera de dizer o quanto eu te amo.' },
  { emoji: '✨', text: 'Você é daquelas pessoas que a gente lembra do nada, no meio do dia, e sorri sozinho. Eu sorrio muito por sua causa, Mary.' },
  { emoji: '🌸', text: 'Já fiquei até tarde mexendo na cor de um botão só pra ficar do jeitinho que combina com você. Bobo? Talvez. Mas é por você, então vale.' },
  { emoji: '💫', text: 'Cada tela aqui tem uma decisão que eu tomei pensando "será que ela vai gostar disso?". Spoiler: eu só queria te ver feliz.' },
  { emoji: '🦋', text: 'Antes de você eu fazia as coisas só por fazer. Você me deu vontade de caprichar, de fazer bonito, de me esforçar de verdade.' },
  { emoji: '💝', text: 'Não sou bom de poesia, sou melhor de código. Então transformei o que eu sinto em algo que você pode abrir todo dia. Te amo, Mary. — Matheus' },
];

function MaryScreen({ onOpenThemes }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const floatAnims = useRef(MARY_MESSAGES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.stagger(110, MARY_MESSAGES.map((_, i) =>
      Animated.spring(floatAnims[i], {
        toValue: 1, tension: 50, friction: 8, useNativeDriver: true,
      })
    )).start();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={theme.home} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center', marginBottom: 22 }}>
          <Text style={{ fontSize: 64, marginBottom: 8 }}>🌹</Text>
          <Text style={{ fontSize: 28, fontWeight: '900', color: theme.textDark, letterSpacing: 0.5 }}>
            Para Mary
          </Text>
          <Text style={{ fontSize: 14, color: theme.textMedium, fontStyle: 'italic', marginTop: 6, textAlign: 'center' }}>
            Coisas que eu quero que você saiba
          </Text>
        </View>

        {/* Botão de tema */}
        <TouchableOpacity onPress={onOpenThemes} activeOpacity={0.85} style={{ marginBottom: 18 }}>
          <View style={[styles.themeBtn, { borderColor: theme.accent + '40' }]}>
            <Text style={{ fontSize: 22 }}>🎨</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: theme.textDark }}>Escolher tema</Text>
              <Text style={{ fontSize: 12, color: theme.textMedium }}>Deixa o app com a sua cara</Text>
            </View>
            <Text style={{ fontSize: 16, color: theme.accent, fontWeight: '900' }}>›</Text>
          </View>
        </TouchableOpacity>

        {MARY_MESSAGES.map((item, i) => (
          <Animated.View
            key={i}
            style={{
              opacity: floatAnims[i],
              transform: [{ translateY: floatAnims[i].interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 20,
              marginBottom: 12,
              shadowColor: '#C0395A',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 4,
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 14,
            }}
          >
            <Text style={{ fontSize: 32 }}>{item.emoji}</Text>
            <Text style={{ flex: 1, fontSize: 15, color: '#5A2035', lineHeight: 24, fontStyle: 'italic' }}>
              {item.text}
            </Text>
          </Animated.View>
        ))}

        <View style={{
          marginTop: 8, padding: 22, backgroundColor: '#FFFFFF',
          borderRadius: 20, alignItems: 'center',
          shadowColor: '#C0395A', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1, shadowRadius: 10, elevation: 4,
        }}>
          <Text style={{ fontSize: 28, marginBottom: 10 }}>💌</Text>
          <Text style={{ fontSize: 14, color: '#5A2035', textAlign: 'center', lineHeight: 23, fontStyle: 'italic' }}>
            Te amo mais do que consigo escrever aqui.{'\n'}
            Obrigado por ser você. — Matheus 🌹
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get('window');

const TABS = [
  { id: 'home',      emoji: '🏠', label: 'Início' },
  { id: 'letters',   emoji: '💌', label: 'Cartas' },
  { id: 'surprises', emoji: '💝', label: 'Surpresas' },
  { id: 'mary',      emoji: '🌹', label: 'Mary' },
  { id: 'credits',   emoji: '👨‍💻', label: 'Créditos' },
];

function TabItem({ tab, active, onPress, slotWidth, accent }) {
  const tabScale = useRef(new Animated.Value(1)).current;
  const handleIn = () =>
    Animated.spring(tabScale, { toValue: 0.85, useNativeDriver: true, speed: 50 }).start();
  const handleOut = () =>
    Animated.spring(tabScale, { toValue: 1, useNativeDriver: true, speed: 35 }).start();

  return (
    <Pressable
      style={[styles.tab, { width: slotWidth }]}
      onPress={onPress}
      onPressIn={handleIn}
      onPressOut={handleOut}
    >
      <Animated.View style={{ alignItems: 'center', transform: [{ scale: tabScale }] }}>
        <Text style={[styles.tabEmoji, active && styles.tabEmojiActive]}>
          {tab.emoji}
        </Text>
        <Text style={[styles.tabLabel, active && { color: accent, fontWeight: '800' }]}>
          {tab.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function TabBar({ activeTab, onTabPress, onGamePress }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const indicatorX = useRef(new Animated.Value(0)).current;
  const TAB_SLOT_W = (width - 40) / 6;

  const getTabIndex = (id) => {
    if (id === 'home')      return 0;
    if (id === 'letters')   return 1;
    if (id === 'surprises') return 3;
    if (id === 'mary')      return 4;
    if (id === 'credits')   return 5;
    return 0;
  };

  useEffect(() => {
    Animated.spring(indicatorX, {
      toValue: getTabIndex(activeTab) * TAB_SLOT_W,
      tension: 60, friction: 9, useNativeDriver: true,
    }).start();
  }, [activeTab]);

  return (
    <View style={[styles.tabBarOuter, { paddingBottom: insets.bottom }]}>
      <View style={styles.tabBarCard}>
        <Animated.View
          style={[
            styles.tabIndicator,
            { width: TAB_SLOT_W, backgroundColor: theme.accent + '1A', transform: [{ translateX: indicatorX }] },
          ]}
        />

        <TabItem tab={TABS[0]} active={activeTab === 'home'} accent={theme.accent} slotWidth={TAB_SLOT_W} onPress={() => onTabPress('home')} />
        <TabItem tab={TABS[1]} active={activeTab === 'letters'} accent={theme.accent} slotWidth={TAB_SLOT_W} onPress={() => onTabPress('letters')} />

        {/* Center FAB */}
        <View style={[styles.fabSlot, { width: TAB_SLOT_W }]}>
          <Pressable style={styles.fab} onPress={onGamePress}>
            <LinearGradient colors={[theme.accent, theme.accentDark]} style={styles.fabGrad} borderRadius={30}>
              <Text style={styles.fabEmoji}>🎮</Text>
              <Text style={styles.fabLabel}>Jogar</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <TabItem tab={TABS[2]} active={activeTab === 'surprises'} accent={theme.accent} slotWidth={TAB_SLOT_W} onPress={() => onTabPress('surprises')} />
        <TabItem tab={TABS[3]} active={activeTab === 'mary'} accent={theme.accent} slotWidth={TAB_SLOT_W} onPress={() => onTabPress('mary')} />
        <TabItem tab={TABS[4]} active={activeTab === 'credits'} accent={theme.accent} slotWidth={TAB_SLOT_W} onPress={() => onTabPress('credits')} />
      </View>
    </View>
  );
}

function AppInner() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('home');
  const [showGame, setShowGame] = useState(false);
  const [showDev, setShowDev] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [specialMsg, setSpecialMsg] = useState(null);
  const [inAppNotif, setInAppNotif] = useState(null);
  const screenFade = useRef(new Animated.Value(1)).current;
  const msgScale = useRef(new Animated.Value(0.85)).current;
  const msgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let unsubscribeTest = () => {};

    (async () => {
      await setupNotifications();
      const pushToken = await registerForPushNotifications();
      if (pushToken) await savePushToken(pushToken);
      const { intervalHours, specialMsg: msg } = await syncFromFirebase();
      scheduleHourlyNotifications(intervalHours ?? undefined);
      if (msg && msg.text) {
        setSpecialMsg(msg);
        Animated.parallel([
          Animated.spring(msgScale, { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }),
          Animated.timing(msgOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]).start();
      }

      // Escuta notificações de teste enviadas pelo painel admin.
      unsubscribeTest = listenForTestNotification(({ title, body }) => {
        presentTestNotification(title, body);
        setInAppNotif({ title, body });
      });
    })();

    return () => unsubscribeTest();
  }, []);

  const navigateTo = (tab) => {
    if (tab === activeTab) return;
    Animated.sequence([
      Animated.timing(screenFade, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(screenFade, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
    setActiveTab(tab);
  };

  const handleDismissMsg = async () => {
    await dismissSpecialMessage();
    Animated.timing(msgOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      setSpecialMsg(null);
    });
  };

  if (showGame) {
    return (
      <>
        <StatusBar style="light" />
        <GamesHubScreen onClose={() => setShowGame(false)} />
      </>
    );
  }

  if (showDev) {
    return (
      <>
        <StatusBar style="dark" />
        <DeveloperScreen onBack={() => setShowDev(false)} />
      </>
    );
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'letters':   return <LoveLettersScreen />;
      case 'surprises': return <SurpriseScreen />;
      case 'mary':      return <MaryScreen onOpenThemes={() => setShowThemes(true)} />;
      case 'credits':   return <CreditsScreen />;
      default:          return (
        <HomeScreen
          navigate={(screen) => {
            if (screen === 'game') setShowGame(true);
            else if (screen === 'letters') navigateTo('letters');
            else if (screen === 'surprises') navigateTo('surprises');
          }}
          onOpenThemes={() => setShowThemes(true)}
          onUnlockDev={() => { setDevMode(true); setShowDev(true); }}
        />
      );
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.home[0] }]}>
      <StatusBar style={theme.statusBar} />

      {/* Mensagem especial */}
      <Modal visible={!!specialMsg} transparent animationType="none">
        <View style={styles.msgOverlay}>
          <Animated.View style={[styles.msgCard, { opacity: msgOpacity, transform: [{ scale: msgScale }] }]}>
            <LinearGradient
              colors={['#1A0010', '#3B0A20', '#7B1540']}
              style={StyleSheet.absoluteFill}
              borderRadius={28}
            />
            <View style={styles.msgTopBar} />
            <Text style={styles.msgEmoji}>{specialMsg?.emoji || '💖'}</Text>
            <Text style={styles.msgTitle}>{specialMsg?.title || 'Oi, Mary'}</Text>
            <View style={styles.msgDivider} />
            <Text style={styles.msgText}>{specialMsg?.text}</Text>
            <TouchableOpacity style={styles.msgBtn} onPress={handleDismissMsg} activeOpacity={0.8}>
              <LinearGradient colors={['#C0395A', '#E8527A']} style={styles.msgBtnGrad} borderRadius={50}>
                <Text style={styles.msgBtnText}>💕 Fechar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <ThemePickerModal visible={showThemes} onClose={() => setShowThemes(false)} />

      <Animated.View style={[styles.screen, { opacity: screenFade }]}>
        {renderScreen()}
      </Animated.View>

      <TabBar
        activeTab={activeTab}
        onTabPress={navigateTo}
        onGamePress={() => setShowGame(true)}
      />

      {devMode && (
        <TouchableOpacity
          style={[styles.devFab, { bottom: insets.bottom + 76 }]}
          onPress={() => setShowDev(true)}
          activeOpacity={0.75}
        >
          <Text style={styles.devFabText}>⚙️</Text>
        </TouchableOpacity>
      )}

      <InAppNotification notification={inAppNotif} onDismiss={() => setInAppNotif(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF0F5' },
  screen: { flex: 1 },

  themeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16,
    borderWidth: 1.5,
    shadowColor: '#C0395A', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },

  devFab: {
    position: 'absolute', right: 14,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(30,10,40,0.55)',
    alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
  },
  devFabText: { fontSize: 18 },

  // Tab bar — floating card style
  tabBarOuter: {
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4,
    backgroundColor: 'transparent',
  },
  tabBarCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 36,
    paddingVertical: 8,
    shadowColor: '#C0395A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18, shadowRadius: 18, elevation: 14,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute', height: 52, borderRadius: 26,
    top: 4,
  },

  tab: { alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  tabEmoji: { fontSize: 22, opacity: 0.45, marginBottom: 2 },
  tabEmojiActive: { opacity: 1 },
  tabLabel: { fontSize: 10, color: '#C48EA0', fontWeight: '600' },

  fabSlot: { alignItems: 'center', justifyContent: 'center' },
  fab: {
    width: 58, height: 58, borderRadius: 29, marginTop: -20,
    shadowColor: '#C0395A', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45, shadowRadius: 12, elevation: 14,
    overflow: 'hidden',
  },
  fabGrad: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 29 },
  fabEmoji: { fontSize: 22 },
  fabLabel: { fontSize: 8, color: 'rgba(255,255,255,0.85)', fontWeight: '700' },

  // Special message modal
  msgOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  msgCard: {
    width: '100%', borderRadius: 28, padding: 30, alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#C0395A', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5, shadowRadius: 24, elevation: 22,
  },
  msgTopBar: {
    width: 40, height: 4, backgroundColor: 'rgba(255,182,193,0.4)',
    borderRadius: 2, marginBottom: 20,
  },
  msgEmoji: { fontSize: 60, marginBottom: 14 },
  msgTitle: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', marginBottom: 16 },
  msgDivider: { width: 50, height: 1.5, backgroundColor: 'rgba(255,182,193,0.4)', marginBottom: 16 },
  msgText: {
    fontSize: 15, color: 'rgba(255,200,220,0.92)',
    textAlign: 'center', lineHeight: 25, fontStyle: 'italic', marginBottom: 26,
  },
  msgBtn: { borderRadius: 50, overflow: 'hidden' },
  msgBtnGrad: { paddingVertical: 14, paddingHorizontal: 38, borderRadius: 50 },
  msgBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
