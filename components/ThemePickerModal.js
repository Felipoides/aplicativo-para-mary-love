import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, Pressable,
  ScrollView, Animated, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME_LIST } from '../constants/themes';
import { useTheme } from '../utils/theme';

function ThemeCard({ item, active, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30 }).start()}
    >
      <Animated.View style={[styles.card, active && styles.cardActive, { transform: [{ scale }] }]}>
        <View style={styles.swatchRow}>
          <LinearGradient
            colors={item.home}
            style={styles.swatch}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={[styles.dot, { backgroundColor: item.accent }]} />
          <View style={[styles.dot, { backgroundColor: item.accentLight }]} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardEmoji}>{item.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardLabel}>{item.label}</Text>
            <Text style={styles.cardDesc}>{item.desc}</Text>
          </View>
          {active && <Text style={styles.check}>✓</Text>}
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function ThemePickerModal({ visible, onClose }) {
  const insets = useSafeAreaInsets();
  const { themeId, changeTheme, theme } = useTheme();
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 1 : 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [600, 0] });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View style={[styles.sheet, { paddingBottom: insets.bottom + 16, transform: [{ translateY }] }]}>
          <Pressable onPress={() => {}}>
            <LinearGradient
              colors={[theme.accent, theme.accentDark]}
              style={styles.handleArea}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.grabber} />
              <Text style={styles.title}>🎨 Escolha seu tema, Mary</Text>
              <Text style={styles.subtitle}>Deixa o app com a sua cara 💕</Text>
            </LinearGradient>

            <ScrollView
              style={styles.list}
              contentContainerStyle={{ padding: 16 }}
              showsVerticalScrollIndicator={false}
            >
              {THEME_LIST.map((item) => (
                <ThemeCard
                  key={item.id}
                  item={item}
                  active={themeId === item.id}
                  onPress={() => changeTheme(item.id)}
                />
              ))}

              <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.85}>
                <LinearGradient
                  colors={[theme.accent, theme.accentLight]}
                  style={styles.doneGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.doneText}>Pronto 💖</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  handleArea: {
    paddingTop: 12,
    paddingBottom: 18,
    alignItems: 'center',
  },
  grabber: {
    width: 44, height: 5, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)', marginBottom: 14,
  },
  title: { fontSize: 19, fontWeight: '900', color: '#FFFFFF' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 4, fontStyle: 'italic' },

  list: { maxHeight: 460 },

  card: {
    borderRadius: 18,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.06)',
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  cardActive: {
    borderColor: '#C0395A',
  },
  swatchRow: { flexDirection: 'row', alignItems: 'center' },
  swatch: { flex: 1, height: 54 },
  dot: {
    width: 18, height: 54,
  },
  cardInfo: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  cardEmoji: { fontSize: 26 },
  cardLabel: { fontSize: 15, fontWeight: '800', color: '#3D1021' },
  cardDesc: { fontSize: 12, color: '#8B4560', marginTop: 2 },
  check: { fontSize: 20, fontWeight: '900', color: '#C0395A' },

  doneBtn: { borderRadius: 50, overflow: 'hidden', marginTop: 6, marginBottom: 8 },
  doneGrad: { paddingVertical: 15, alignItems: 'center', borderRadius: 50 },
  doneText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});
