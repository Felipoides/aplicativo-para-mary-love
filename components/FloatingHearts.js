import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const HEARTS = [
  { emoji: '❤️', size: 18 },
  { emoji: '💕', size: 14 },
  { emoji: '💗', size: 16 },
  { emoji: '✨', size: 13 },
  { emoji: '🌸', size: 15 },
  { emoji: '💖', size: 19 },
  { emoji: '💝', size: 14 },
  { emoji: '🌹', size: 16 },
  { emoji: '💓', size: 13 },
  { emoji: '⭐', size: 12 },
];

function FloatingHeart({ index, total }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const item = HEARTS[index % HEARTS.length];
  const startX = (width / total) * index + (Math.random() * 30 - 15);
  const duration = 5000 + Math.random() * 5000;
  const delay = index * 600 + Math.random() * 1500;
  const drift = (Math.random() - 0.5) * 80;

  useEffect(() => {
    const loop = () => {
      translateY.setValue(0);
      translateX.setValue(0);
      opacity.setValue(0);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -(height * 0.85),
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: drift,
          duration,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.65, duration: 700, useNativeDriver: true }),
          Animated.delay(duration - 1400),
          Animated.timing(opacity, { toValue: 0, duration: 700, useNativeDriver: true }),
        ]),
      ]).start(loop);
    };

    const t = setTimeout(loop, delay);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.Text
      style={[
        styles.heart,
        {
          left: startX,
          fontSize: item.size,
          opacity,
          transform: [{ translateY }, { translateX }],
        },
      ]}
    >
      {item.emoji}
    </Animated.Text>
  );
}

export default function FloatingHearts({ count = 10, style }) {
  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {Array.from({ length: count }).map((_, i) => (
        <FloatingHeart key={i} index={i} total={count} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
    overflow: 'hidden',
  },
  heart: {
    position: 'absolute',
    bottom: -10,
  },
});
