import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Dimensions, Modal, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import HomeScreen from './screens/HomeScreen';
import FlappyBirdScreen from './screens/FlappyBirdScreen';
import LoveLettersScreen from './screens/LoveLettersScreen';
import SurpriseScreen from './screens/SurpriseScreen';
import DeveloperScreen from './screens/DeveloperScreen';
import { scheduleHourlyNotifications } from './utils/notifications';
import { syncFromFirebase, dismissSpecialMessage } from './utils/firebase';

const { width } = Dimensions.get('window');

const TABS = [
  { id: 'home',      emoji: '🏠', label: 'Início' },
  { id: 'letters',   emoji: '💌', label: 'Cartas' },
  { id: 'surprises', emoji: '💝', label: 'Surpresas' },
  { id: 'mary',      emoji: '🌹', label: 'Mary' },
];

function TabItem({ tab, active, onPress, slotWidth }) {
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
        <Text style={[
          styles.tabEmoji,
          active && styles.tabEmojiActive,
          tab.id === 'mary' && styles.tabEmojiMuted,
        ]}>
          {tab.emoji}
        </Text>
        <Text style={[
          styles.tabLabel,
          active && styles.tabLabelActive,
          tab.id === 'mary' && styles.tabLabelMuted,
        ]}>
          {tab.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function TabBar({ activeTab, onTabPress, onGamePress }) {
  const insets = useSafeAreaInsets();
  const indicatorX = useRef(new Animated.Value(0)).current;
  const TAB_SLOT_W = (width - 40) / 5;

  const getTabIndex = (id) => {
    if (id === 'home')      return 0;
    if (id === 'letters')   return 1;
    if (id === 'surprises') return 3;
    if (id === 'mary')      return 4;
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
        {/* Active indicator pill */}
        <Animated.View
          style={[
            styles.tabIndicator,
            { width: TAB_SLOT_W, transform: [{ translateX: indicatorX }] },
          ]}
        />

        <TabItem tab={TABS[0]} active={activeTab === 'home'} slotWidth={TAB_SLOT_W} onPress={() => onTabPress('home')} />
        <TabItem tab={TABS[1]} active={activeTab === 'letters'} slotWidth={TAB_SLOT_W} onPress={() => onTabPress('letters')} />

        {/* Center FAB */}
        <View style={[styles.fabSlot, { width: TAB_SLOT_W }]}>
          <Pressable style={styles.fab} onPress={onGamePress}>
            <LinearGradient colors={['#C0395A', '#8B1E3F']} style={styles.fabGrad} borderRadius={30}>
              <Text style={styles.fabEmoji}>🎮</Text>
              <Text style={styles.fabLabel}>Jogar</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <TabItem tab={TABS[2]} active={activeTab === 'surprises'} slotWidth={TAB_SLOT_W} onPress={() => onTabPress('surprises')} />
        <TabItem tab={TABS[3]} active={false} slotWidth={TAB_SLOT_W} onPress={() => {}} />
      </View>
    </View>
  );
}

function AppInner() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('home');
  const [showGame, setShowGame] = useState(false);
  const [showDev, setShowDev] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [specialMsg, setSpecialMsg] = useState(null);
  const screenFade = useRef(new Animated.Value(1)).current;
  const msgScale = useRef(new Animated.Value(0.85)).current;
  const msgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const { intervalHours, specialMsg: msg } = await syncFromFirebase();
      scheduleHourlyNotifications(intervalHours ?? undefined);
      if (msg && msg.text) {
        setSpecialMsg(msg);
        Animated.parallel([
          Animated.spring(msgScale, { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }),
          Animated.timing(msgOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]).start();
      }
    })();
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
        <FlappyBirdScreen onBack={() => setShowGame(false)} />
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
      default:          return (
        <HomeScreen
          navigate={(screen) => {
            if (screen === 'game') setShowGame(true);
            else if (screen === 'letters') navigateTo('letters');
            else if (screen === 'surprises') navigateTo('surprises');
          }}
          onUnlockDev={() => { setDevMode(true); setShowDev(true); }}
        />
      );
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFF0F5' },
  screen: { flex: 1 },

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
    backgroundColor: '#FFF0F5',
    top: 4,
  },

  tab: { alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  tabEmoji: { fontSize: 22, opacity: 0.45, marginBottom: 2 },
  tabEmojiActive: { opacity: 1 },
  tabEmojiMuted: { opacity: 0.35 },
  tabLabel: { fontSize: 10, color: '#C48EA0', fontWeight: '600' },
  tabLabelActive: { color: '#C0395A', fontWeight: '800' },
  tabLabelMuted: { color: '#D4AABB' },

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
      <AppInner />
    </SafeAreaProvider>
  );
}
