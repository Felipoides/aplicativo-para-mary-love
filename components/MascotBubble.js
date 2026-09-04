import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { MASCOT_SCREEN_LINES, MOODS } from '../constants/affection';
import { useTheme } from '../utils/theme';

export default function MascotBubble({ activeScreen, moodId, bottom = 82 }) {
  const { theme } = useTheme();
  const bounce = useRef(new Animated.Value(0)).current;
  const [lineIndex, setLineIndex] = useState(0);
  const [showBubble, setShowBubble] = useState(true);

  const lines = useMemo(() => {
    const mood = MOODS.find((item) => item.id === moodId);
    if (mood) return [mood.reply, ...(MASCOT_SCREEN_LINES[activeScreen] || MASCOT_SCREEN_LINES.home)];
    return MASCOT_SCREEN_LINES[activeScreen] || MASCOT_SCREEN_LINES.home;
  }, [activeScreen, moodId]);

  useEffect(() => {
    setLineIndex(0);
    setShowBubble(true);
  }, [activeScreen, moodId]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: -5, duration: 1100, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 1100, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [bounce]);

  const interact = () => {
    setShowBubble(true);
    setLineIndex((current) => (current + 1) % lines.length);
    Animated.sequence([
      Animated.spring(bounce, { toValue: -12, speed: 30, useNativeDriver: true }),
      Animated.spring(bounce, { toValue: 0, speed: 22, useNativeDriver: true }),
    ]).start();
  };

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom }]}>
      {showBubble && (
        <Pressable
          onPress={() => setShowBubble(false)}
          style={[styles.bubble, { backgroundColor: theme.cardBg, borderColor: `${theme.accent}2A` }]}
          accessibilityRole="button"
          accessibilityLabel="Fechar fala do mascote"
        >
          <Text style={[styles.bubbleText, { color: theme.textDark }]}>{lines[lineIndex]}</Text>
          <View style={[styles.tail, { backgroundColor: theme.cardBg }]} />
        </Pressable>
      )}

      <Pressable onPress={interact} accessibilityRole="button" accessibilityLabel="Conversar com o mascote Mini Matheus">
        <Animated.View
          style={[
            styles.mascot,
            { backgroundColor: theme.cardBg, borderColor: `${theme.accent}36`, transform: [{ translateY: bounce }] },
          ]}
        >
          <Text style={styles.mascotEmoji}>🧸</Text>
          <View style={[styles.heartBadge, { backgroundColor: theme.accent }]}>
            <Text style={styles.heart}>♥</Text>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', right: 12, zIndex: 30, alignItems: 'flex-end', maxWidth: 230 },
  bubble: {
    maxWidth: 218, borderRadius: 16, borderBottomRightRadius: 5, borderWidth: 1,
    paddingHorizontal: 13, paddingVertical: 10, marginBottom: 9,
    shadowColor: '#3D1021', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.16, shadowRadius: 10, elevation: 8,
  },
  bubbleText: { fontSize: 12, lineHeight: 17, fontWeight: '650' },
  tail: { position: 'absolute', right: 15, bottom: -5, width: 10, height: 10, transform: [{ rotate: '45deg' }] },
  mascot: {
    width: 64, height: 64, borderRadius: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#3D1021', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 9,
  },
  mascotEmoji: { fontSize: 40 },
  heartBadge: { position: 'absolute', right: -2, top: -3, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  heart: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
});
