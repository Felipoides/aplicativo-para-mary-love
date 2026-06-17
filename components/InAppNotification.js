import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_W = width - CARD_MARGIN * 2;
const AUTO_DISMISS_MS = 6000;

export default function InAppNotification({ notification, onDismiss }) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);

  const dismiss = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    Animated.parallel([
      Animated.timing(translateY, { toValue: -200, duration: 350, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => onDismiss?.());
  }, [onDismiss]);

  useEffect(() => {
    if (!notification) return;

    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 65, friction: 8, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    timer.current = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [notification]);

  if (!notification) return null;

  const { title, body } = notification;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          top: insets.top + 8,
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={dismiss} style={styles.touchable}>
        <View style={styles.card}>
          <LinearGradient
            colors={['#1A0010', '#3B0A20', '#5C1A35']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            borderRadius={22}
          />

          <Animated.View
            style={[
              styles.glowOverlay,
              {
                opacity: shimmer.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.08, 0.25],
                }),
              },
            ]}
          />

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>💖</Text>
              <Animated.View
                style={[
                  styles.pulse,
                  {
                    transform: [{
                      scale: shimmer.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.4],
                      }),
                    }],
                    opacity: shimmer.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 0],
                    }),
                  },
                ]}
              />
            </View>

            <View style={styles.textContainer}>
              <Text style={styles.title} numberOfLines={1}>{title}</Text>
              <Text style={styles.body} numberOfLines={2}>{body}</Text>
            </View>
          </View>

          <View style={styles.bottomBar}>
            <View style={styles.sparkleRow}>
              <Text style={styles.sparkle}>✨</Text>
              <Text style={styles.fromText}>do Matheus</Text>
              <Text style={styles.sparkle}>✨</Text>
            </View>
            <Text style={styles.tapHint}>toque para fechar</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: CARD_MARGIN,
    right: CARD_MARGIN,
    zIndex: 9999,
    elevation: 9999,
  },
  touchable: {
    borderRadius: 22,
    ...Platform.select({
      ios: {
        shadowColor: '#C0395A',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
      },
      android: { elevation: 20 },
    }),
  },
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,182,193,0.2)',
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#C0395A',
    borderRadius: 22,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 10,
    gap: 14,
  },
  iconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 30 },
  pulse: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#C0395A',
  },
  textContainer: { flex: 1 },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  body: {
    fontSize: 13,
    color: 'rgba(255,200,220,0.9)',
    lineHeight: 19,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 12,
    paddingTop: 2,
  },
  sparkleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sparkle: { fontSize: 10 },
  fromText: {
    fontSize: 11,
    color: 'rgba(255,182,193,0.5)',
    fontWeight: '600',
  },
  tapHint: {
    fontSize: 10,
    color: 'rgba(255,182,193,0.3)',
    fontStyle: 'italic',
  },
});
