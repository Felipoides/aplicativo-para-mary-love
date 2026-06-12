import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal,
  StyleSheet, Animated, Dimensions, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FloatingHearts from '../components/FloatingHearts';
import { getLetters } from '../utils/storage';

const { width, height } = Dimensions.get('window');

function LetterCard({ letter, onPress, index }) {
  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, tension: 55, friction: 8, delay: index * 80, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 500, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.cardWrap, { transform: [{ scale }], opacity }]}>
      <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
        <LinearGradient
          colors={['rgba(255,255,255,0.95)', 'rgba(255,230,240,0.9)']}
          style={StyleSheet.absoluteFill}
          borderRadius={18}
        />
        <View style={styles.cardHeader}>
          <Text style={styles.cardEmoji}>{letter.emoji}</Text>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle}>{letter.title}</Text>
            <Text style={styles.cardDate}>{letter.date}</Text>
          </View>
          <Text style={styles.cardArrow}>💌</Text>
        </View>
        <Text style={styles.cardPreview}>{letter.preview}</Text>
        <View style={styles.cardDivider} />
        <Text style={styles.cardCta}>Toque para ler com carinho ❤️</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function LetterModal({ letter, visible, onClose }) {
  const scrollFade = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(60)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scrollFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideY, { toValue: 0, tension: 50, friction: 9, useNativeDriver: true }),
      ]).start();
    } else {
      scrollFade.setValue(0);
      slideY.setValue(60);
    }
  }, [visible]);

  if (!letter) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <LinearGradient
          colors={['rgba(61,16,33,0.96)', 'rgba(139,30,63,0.94)']}
          style={StyleSheet.absoluteFill}
        />
        <FloatingHearts count={6} />

        <Animated.View
          style={[styles.modalCard, { opacity: scrollFade, transform: [{ translateY: slideY }] }]}
        >
          <LinearGradient
            colors={['#FFF8F0', '#FFF0F5', '#FFE4EE']}
            style={StyleSheet.absoluteFill}
            borderRadius={24}
          />
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
          </ScrollView>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <LinearGradient colors={['#C0395A', '#E8527A']} style={styles.closeBtnGrad} borderRadius={14}>
              <Text style={styles.closeBtnText}>Fechar com amor ❤️</Text>
            </LinearGradient>
          </TouchableOpacity>
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
  const titleFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getLetters().then(setLetters);
    Animated.timing(titleFade, { toValue: 1, duration: 800, useNativeDriver: true }).start();
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
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.titleSection, { opacity: titleFade }]}>
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
  scrollContent: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 30 },

  titleSection: { alignItems: 'center', marginBottom: 30 },
  mainEmoji: { fontSize: 56, marginBottom: 10 },
  mainTitle: {
    fontSize: 30, fontWeight: '900', color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },
  mainSub: {
    fontSize: 14, color: 'rgba(255,255,255,0.85)',
    textAlign: 'center', fontStyle: 'italic', marginTop: 8, lineHeight: 22,
  },
  titleDivider: {
    width: 60, height: 2, backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 2, marginTop: 18,
  },

  cardWrap: { marginBottom: 16 },
  card: {
    borderRadius: 18, padding: 18, overflow: 'hidden',
    shadowColor: '#C0395A', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardEmoji: { fontSize: 36, marginRight: 12 },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#3D1021' },
  cardDate: { fontSize: 12, color: '#8B4560', marginTop: 2 },
  cardArrow: { fontSize: 22 },
  cardPreview: { fontSize: 13, color: '#5A2035', lineHeight: 20, fontStyle: 'italic' },
  cardDivider: { height: 1, backgroundColor: 'rgba(192,57,90,0.15)', marginVertical: 12 },
  cardCta: { fontSize: 12, color: '#C0395A', fontWeight: '600', textAlign: 'center' },

  footer: {
    marginTop: 10, padding: 20, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16,
  },
  footerText: {
    fontSize: 13, color: 'rgba(255,255,255,0.9)',
    textAlign: 'center', lineHeight: 22, fontStyle: 'italic',
  },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: {
    width: '100%', maxHeight: height * 0.82,
    borderRadius: 24, padding: 24, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 20,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  modalEmoji: { fontSize: 44, marginRight: 14 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#3D1021' },
  modalDate: { fontSize: 12, color: '#8B4560', marginTop: 3 },
  modalDivider: { height: 1.5, backgroundColor: 'rgba(192,57,90,0.25)', marginVertical: 14 },
  modalScroll: { maxHeight: height * 0.42 },
  modalContent: {
    fontSize: 15, color: '#3D1021', lineHeight: 26,
    fontStyle: 'italic', letterSpacing: 0.2,
  },
  closeBtn: { marginTop: 20, borderRadius: 14, overflow: 'hidden' },
  closeBtnGrad: { padding: 14, alignItems: 'center' },
  closeBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});
