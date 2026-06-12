import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Animated, Platform, Dimensions,
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

const { width } = Dimensions.get('window');

const TABS = [
  { id: 'home', emoji: '🏠', label: 'Início' },
  { id: 'letters', emoji: '💌', label: 'Cartas' },
  { id: 'surprises', emoji: '💝', label: 'Surpresas' },
];

function TabBar({ activeTab, onTabPress, onGamePress }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBarWrap, { paddingBottom: insets.bottom }]}>
      <LinearGradient
        colors={['rgba(255,240,245,0.98)', 'rgba(255,214,228,0.98)']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.tabBarInner}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => onTabPress('home')}
          activeOpacity={0.75}
        >
          <Text style={[styles.tabEmoji, activeTab === 'home' && styles.tabEmojiActive]}>🏠</Text>
          <Text style={[styles.tabLabel, activeTab === 'home' && styles.tabLabelActive]}>Início</Text>
          {activeTab === 'home' && <View style={styles.tabDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => onTabPress('letters')}
          activeOpacity={0.75}
        >
          <Text style={[styles.tabEmoji, activeTab === 'letters' && styles.tabEmojiActive]}>💌</Text>
          <Text style={[styles.tabLabel, activeTab === 'letters' && styles.tabLabelActive]}>Cartas</Text>
          {activeTab === 'letters' && <View style={styles.tabDot} />}
        </TouchableOpacity>

        {/* Center game FAB */}
        <TouchableOpacity style={styles.gameFab} onPress={onGamePress} activeOpacity={0.85}>
          <LinearGradient colors={['#C0395A', '#8B1E3F']} style={styles.gameFabGrad}>
            <Text style={styles.gameFabEmoji}>🎮</Text>
            <Text style={styles.gameFabLabel}>Jogar</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => onTabPress('surprises')}
          activeOpacity={0.75}
        >
          <Text style={[styles.tabEmoji, activeTab === 'surprises' && styles.tabEmojiActive]}>💝</Text>
          <Text style={[styles.tabLabel, activeTab === 'surprises' && styles.tabLabelActive]}>Surpresas</Text>
          {activeTab === 'surprises' && <View style={styles.tabDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => onTabPress('home')}
          activeOpacity={0.75}
        >
          <Text style={[styles.tabEmoji, { opacity: 0.55 }]}>🌹</Text>
          <Text style={styles.tabLabel}>Mary</Text>
        </TouchableOpacity>
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
  const screenFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Reagenda com o intervalo salvo toda vez que o app é aberto
    scheduleHourlyNotifications();
  }, []);

  const navigateTo = (tab) => {
    if (tab === activeTab) return;
    Animated.sequence([
      Animated.timing(screenFade, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(screenFade, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
    setActiveTab(tab);
  };

  const handleUnlockDev = () => {
    setDevMode(true);
    setShowDev(true);
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
        <StatusBar style="light" />
        <DeveloperScreen onBack={() => setShowDev(false)} />
      </>
    );
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'letters':
        return <LoveLettersScreen />;
      case 'surprises':
        return <SurpriseScreen />;
      default:
        return (
          <HomeScreen
            navigate={(screen) => {
              if (screen === 'game') setShowGame(true);
              else if (screen === 'letters') navigateTo('letters');
              else if (screen === 'surprises') navigateTo('surprises');
            }}
            onUnlockDev={handleUnlockDev}
          />
        );
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
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
          style={[styles.devFab, { bottom: insets.bottom + 72 }]}
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
    position: 'absolute',
    bottom: 90,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(30,10,40,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  devFabText: { fontSize: 18 },

  tabBarWrap: {
    overflow: 'hidden',
    shadowColor: '#C0395A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 16,
  },
  tabBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 6,
    paddingHorizontal: 4,
    paddingBottom: 8,
  },

  tab: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 4,
  },
  tabEmoji: { fontSize: 22, marginBottom: 2, opacity: 0.5 },
  tabEmojiActive: { opacity: 1 },
  tabLabel: { fontSize: 10, color: '#C48EA0', fontWeight: '600' },
  tabLabelActive: { color: '#C0395A', fontWeight: '800' },
  tabDot: {
    width: 5, height: 5, borderRadius: 3,
    backgroundColor: '#C0395A', marginTop: 2,
  },

  gameFab: {
    width: 64, height: 64, borderRadius: 32,
    marginTop: -22,
    shadowColor: '#C0395A', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 14,
    overflow: 'hidden',
  },
  gameFabGrad: {
    flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 32,
  },
  gameFabEmoji: { fontSize: 24 },
  gameFabLabel: { fontSize: 9, color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <AppInner />
    </SafeAreaProvider>
  );
}
