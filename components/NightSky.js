import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../utils/theme';
import useAmbientMotion from '../utils/useAmbientMotion';

const STARS = Array.from({ length: 18 }, (_, i) => ({
  left: `${4 + ((i * 37) % 92)}%`, top: `${2 + ((i * 23) % 78)}%`,
  size: i % 4 === 0 ? 9 : 4, phase: i % 3,
}));

export default function NightSky({ enabled = true }) {
  const canMove = useAmbientMotion();
  const drift = useRef(new Animated.Value(0)).current;
  const twinkles = useRef([0, 1, 2].map(() => new Animated.Value(0.45))).current;
  useEffect(() => {
    if (!enabled || !canMove) return;
    const loops = [
      Animated.loop(Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 26000, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
        Animated.timing(drift, { toValue: 0, duration: 26000, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
      ])),
      ...twinkles.map((opacity, i) => Animated.loop(Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 2400 + i * 800, useNativeDriver: true, isInteraction: false }),
        Animated.timing(opacity, { toValue: 0.2, duration: 3100 + i * 600, useNativeDriver: true, isInteraction: false }),
      ]))),
    ];
    loops.forEach(loop => loop.start());
    return () => loops.forEach(loop => loop.stop());
  }, [canMove, enabled, drift, twinkles]);
  return (
    <View pointerEvents="none" aria-hidden={true} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.background}>
      <Image source={require('../assets/night-sky-background.png')} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} resizeMode="cover" />
      {STARS.map((star, i) => (
        <Animated.View key={i} style={{ position: 'absolute', left: star.left, top: star.top, opacity: twinkles[star.phase] }}>
          <Ionicons name="star" size={star.size} color="#D1DFEE" />
        </Animated.View>
      ))}
      <Animated.Image source={require('../assets/night-clouds.png')} resizeMode="contain" style={[styles.clouds, {
        transform: [{ translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [-35, 30] }) }],
      }]} />
      <Animated.Image source={require('../assets/night-clouds.png')} resizeMode="contain" style={[styles.clouds, styles.upperClouds, {
        transform: [{ translateX: drift.interpolate({ inputRange: [0, 1], outputRange: [28, -24] }) }],
      }]} />
    </View>
  );
}

export function ThemedBackground() {
  const { theme } = useTheme();
  return theme.nightSky ? <NightSky /> : <LinearGradient colors={theme.home} style={StyleSheet.absoluteFill} />;
}

const styles = StyleSheet.create({
  background: { ...StyleSheet.absoluteFillObject, backgroundColor: '#020D1E', overflow: 'hidden' },
  clouds: { position: 'absolute', width: '140%', height: 300, left: '-20%', bottom: '5%', opacity: 0.5 },
  upperClouds: { top: '9%', bottom: undefined, opacity: 0.25 },
});
