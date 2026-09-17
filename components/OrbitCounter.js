import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAmbientMotion from '../utils/useAmbientMotion';

const PHASES = Array.from({ length: 65 }, (_, i) => i / 64);
export default function OrbitCounter({ days, color = '#8F4548' }) {
  const move = useAmbientMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(300);
  useEffect(() => {
    if (!move) return;
    const orbit = Animated.loop(Animated.timing(progress, {
      toValue: 1, duration: 22000, easing: Easing.linear, useNativeDriver: true, isInteraction: false,
    }));
    orbit.start();
    return () => orbit.stop();
  }, [move, progress]);
  const radiusX = Math.max(70, (width - 38) / 2);
  const radiusY = 43;
  const tilt = -Math.PI / 12;
  const x = PHASES.map(t => radiusX * Math.cos(t * Math.PI * 2) * Math.cos(tilt) - radiusY * Math.sin(t * Math.PI * 2) * Math.sin(tilt));
  const y = PHASES.map(t => radiusX * Math.cos(t * Math.PI * 2) * Math.sin(tilt) + radiusY * Math.sin(t * Math.PI * 2) * Math.cos(tilt));
  return (
    <View testID="orbit-counter" onLayout={event => setWidth(event.nativeEvent.layout.width)} style={styles.counter}>
      <View pointerEvents="none" style={[styles.orbitFrame, { width: radiusX * 2, height: radiusX * 2, left: width / 2 - radiusX, top: 65 - radiusX }]}>
        <View style={[styles.orbit, { width: radiusX * 2, height: radiusX * 2, borderRadius: radiusX, transform: [{ scaleY: radiusY / radiusX }] }]} />
      </View>
      <View pointerEvents="none" aria-hidden={true} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.center}>
        <Animated.View testID="orbit-heart" style={{ transform: [
          { translateX: progress.interpolate({ inputRange: PHASES, outputRange: x }) },
          { translateY: progress.interpolate({ inputRange: PHASES, outputRange: y }) },
        ] }}>
          <Ionicons name="heart" size={25} color={color} />
        </Animated.View>
      </View>
      <View style={styles.copy}>
        <Text style={styles.number} adjustsFontSizeToFit numberOfLines={1}>{days}</Text>
        <Text style={styles.unit}>dias juntos</Text>
        <Text style={styles.sub}>e contando…</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  counter: { height: 130, justifyContent: 'center', marginTop: 0 },
  orbitFrame: { position: 'absolute', transform: [{ rotate: '-15deg' }] },
  orbit: { borderWidth: 1, borderColor: '#708198' },
  center: { position: 'absolute', left: '50%', top: 65, marginLeft: -12.5, marginTop: -12.5 },
  copy: { alignItems: 'center', paddingHorizontal: 50 },
  number: { fontSize: 78, lineHeight: 83, fontWeight: '900', color: '#F5F7FC', letterSpacing: -3 },
  unit: { fontSize: 19, fontWeight: '800', color: '#F5F7FC' },
  sub: { fontSize: 12, color: '#AFBDD1', marginTop: 4 },
});
