import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const LOADING_STEPS = [
  '⚡ Initializing PCE Mechatronics Engine...',
  '🎓 Loading 19 Official Registered Students...',
  '📅 Verifying Daily Class Schedule (w.e.f 20/07/2026)...',
  '🔒 Syncing Secure CR & Admin Gateway...',
  '🚀 Welcome to Purnea College of Engineering!',
];

export default function IntroSplashScreen({ onFinish }) {
  const [stepIndex, setStepIndex] = useState(0);

  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Entrance Fade & Scale
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Pulse Animation for Logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.12,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Progress Fill & Step Cycling
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    const interval = setInterval(() => {
      setStepIndex((prev) => {
        if (prev < LOADING_STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 280);

    const timer = setTimeout(() => {
      if (onFinish) {
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }).start(() => {
          onFinish();
        });
      }
    }, 1500);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: opacityAnim }]}>
      {/* Background Decorative Neon Glow Orbs */}
      <View style={styles.glowOrbTop} />
      <View style={styles.glowOrbBottom} />

      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        {/* Animated Mechatronics Core Icon Badge */}
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.iconInner}>
            <Ionicons name="hardware-chip-outline" size={46} color="#818CF8" />
          </View>
        </Animated.View>

        {/* Title & Branch Subtitle */}
        <Text style={styles.collegeName}>PURNEA COLLEGE OF ENGINEERING</Text>
        <Text style={styles.appTitle}>PCE MECHATRONICS</Text>
        <Text style={styles.appSubtitle}>Attendance & Timetable Portal • 3rd Sem</Text>

        {/* Dynamic Status Text */}
        <View style={styles.stepContainer}>
          <Ionicons name="sparkles" size={14} color="#34D399" />
          <Text style={styles.stepText}>{LOADING_STEPS[stepIndex]}</Text>
        </View>

        {/* Animated Progress Bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>

        {/* Footer Credits */}
        <View style={styles.footerBadge}>
          <Text style={styles.footerText}>⚡ Powered by BEU Registration 2025 • M.T.E Dept</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0E1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  glowOrbTop: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
  },
  glowOrbBottom: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderColor: 'rgba(99, 102, 241, 0.35)',
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
    borderColor: '#6366F1',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#818CF8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  iconInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  collegeName: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
    textAlign: 'center',
  },
  appTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#818CF8',
    marginTop: 4,
    marginBottom: 20,
    textAlign: 'center',
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    width: '100%',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
    textAlign: 'center',
    flexShrink: 1,
  },
  progressTrack: {
    width: '100%',
    height: 5,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 18,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    borderWidth: 0.5,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 3,
  },
  footerBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  footerText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
});
