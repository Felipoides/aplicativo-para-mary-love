import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal,
  StyleSheet, Animated, Dimensions, StatusBar, Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FloatingHearts from '../components/FloatingHearts';
import { getLetters } from '../utils/storage';

const { height } = Dimensions.get('window');

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

function LetterCard({ letter, onPress, index }) {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 55, friction: 8, delay: index * 90, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 500, delay: index * 90, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleIn = () =>
    Animated.spring(pressScale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const handleOut = () =>
    Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }, { scale: pressScale }], opacity, marginBottom: 14 }}>
      <Pressable onPress={onPress} onPressIn={handleIn} onPressOut={handleOut}>
        <View style={styles.card}>
          <View style={styles.cardAccent} />
          <View style={styles.cardBody}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardEmoji}>{letter.emoji}</Text>
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>{letter.title}</Text>
                <Text style={styles.cardDate}>{letter.date}</Text>
              </View>
              <Text style={styles.cardArrow}>💌</Text>
            </View>
            <Text style={styles.cardPreview} numberOfLines={2}>{letter.preview}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardCta}>Toque para ler ❤️</Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function LetterModal({ letter, visible, onClose }) {
  const scrollFade = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(50)).current;
  const closeBtnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scrollFade, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(slideY, { toValue: 0, tension: 55, friction: 9, useNativeDriver: true }),
      ]).start();
    } else {
      scrollFade.setValue(0);
      slideY.setValue(50);
    }
  }, [visible]);

  if (!letter) return null;

  const handleCloseIn = () =>
    Animated.spring(closeBtnScale, { toValue: 0.95, useNativeDriver: true, speed: 40 }).start();
  const handleCloseOut = () =>
    Animated.spring(closeBtnScale, { toValue: 1, useNativeDriver: true, speed: 30 }).start();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={['rgba(61,16,33,0.97)', 'rgba(139,30,63,0.95)']}
          style={StyleSheet.absoluteFill}
        />
        <FloatingHearts count={6} />
        <Animated.View
          style={[styles.modalCard, { opacity: scrollFade, transform: [{ translateY: slideY }] }]}
        >
          <LinearGradient
            colors={['#FFF8F2', '#FFF0F5', '#FFE4EE']}
            style={StyleSheet.absoluteFill}
            borderRadius={28}
          />
          <View style={styles.modalTopBar} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalEmoji}>{letter.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{letter.title}</Text>
              <Text style={styles.modalDate}>{letter.date}</Text>
            </View>
          </View>
          <View style={styles.modalDivider} />
          <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalContent}>{letter.content}</Text>
            <View style={{ height: 16 }} />
          </ScrollView>
          <Pressable
            onPress={onClose}
            onPressIn={handleCloseIn}
            onPressOut={handleCloseOut}
          >
            <Animated.View style={[styles.closeBtn, { transform: [{ scale: closeBtnScale }] }]}>
              <LinearGradient colors={['#C0395A', '#E8527A']} style={styles.closeBtnGrad} borderRadius={16}>
                <Text style={styles.closeBtnText}>Fechar com amor ❤️</Text>
              </LinearGradient>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function LoveLettersScreen() {
  const insets = useSafeAreaInsets();
  const [letters, setLetters] = useState([]);
  const [selected, setSelected] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const titleOp = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    getLetters().then(setLetters);
    Animated.parallel([
      Animated.timing(titleOp, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(titleY, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
    ]).start();
  }, []);

  const openLetter = (letter) => {
    setSelected(letter);
    setModalVisible(true);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={['#3D1021', '#7B1540', '#C0395A', '#FF85A1', '#FFD6E4']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <FloatingHearts count={8} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.titleSection, { opacity: titleOp, transform: [{ translateY: titleY }] }]}>
          <Text style={styles.mainEmoji}>💌</Text>
          <Text style={styles.mainTitle}>Cartas de Amor</Text>
          <Text style={styles.mainSub}>
            Palavras escritas com o coração,{'\n'}especialmente para você, Mary
          </Text>
          <View style={styles.titleDivider} />
        </Animated.View>

        {letters.map((letter, i) => (
          <LetterCard
            key={letter.id}
            letter={letter}
            index={i}
            onPress={() => openLetter(letter)}
          />
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🌹 Cada carta foi escrita com o maior carinho do mundo.{'\n'}
            Porque você merece palavras bonitas, Mary.
          </Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <LetterModal
        letter={selected}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },

  titleSection: { alignItems: 'center', marginBottom: 28 },
  mainEmoji: { fontSize: 58, marginBottom: 10 },
  mainTitle: {
    fontSize: 30, fontWeight: '900', color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },
  mainSub: {
    fontSize: 14, color: 'rgba(255,255,255,0.85)',
    textAlign: 'center', fontStyle: 'italic', marginTop: 8, lineHeight: 22,
  },
  titleDivider: {
    width: 60, height: 2, backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2, marginTop: 18,
  },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 18, overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#C0395A', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18, shadowRadius: 12, elevation: 7,
  },
  cardAccent: { width: 5, backgroundColor: '#C0395A' },
  cardBody: { flex: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardEmoji: { fontSize: 34, marginRight: 12 },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#3D1021' },
  cardDate: { fontSize: 11, color: '#8B4560', marginTop: 2 },
  cardArrow: { fontSize: 20 },
  cardPreview: { fontSize: 13, color: '#5A2035', lineHeight: 20, fontStyle: 'italic' },
  cardFooter: { marginTop: 10 },
  cardCta: { fontSize: 12, color: '#C0395A', fontWeight: '700' },

  footer: {
    marginTop: 6, padding: 20, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16,
  },
  footerText: {
    fontSize: 13, color: 'rgba(255,255,255,0.9)',
    textAlign: 'center', lineHeight: 22, fontStyle: 'italic',
  },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: {
    width: '100%', maxHeight: height * 0.84,
    borderRadius: 28, padding: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.5, shadowRadius: 24, elevation: 22,
  },
  modalTopBar: {
    width: 40, height: 4, backgroundColor: 'rgba(192,57,90,0.3)',
    borderRadius: 2, alignSelf: 'center', marginBottom: 18,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  modalEmoji: { fontSize: 46, marginRight: 14 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#3D1021' },
  modalDate: { fontSize: 12, color: '#8B4560', marginTop: 3 },
  modalDivider: { height: 1.5, backgroundColor: 'rgba(192,57,90,0.2)', marginVertical: 14 },
  modalScroll: { maxHeight: height * 0.42 },
  modalContent: {
    fontSize: 15, color: '#3D1021', lineHeight: 27,
    fontStyle: 'italic', letterSpacing: 0.2,
  },
  closeBtn: { marginTop: 20, borderRadius: 16, overflow: 'hidden' },
  closeBtnGrad: { padding: 15, alignItems: 'center', borderRadius: 16 },
  closeBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});
