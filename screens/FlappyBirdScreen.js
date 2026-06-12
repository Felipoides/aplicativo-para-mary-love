import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableWithoutFeedback, TouchableOpacity,
  StyleSheet, Animated, Dimensions, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getFlappyBest, setFlappyBest, incrementFlappyGames } from '../utils/storage';

const { width: SW, height: SH } = Dimensions.get('window');

// ── Layout ──────────────────────────────────────────────────────────────────
const FLOOR_Y   = SH - 100;
const CEILING_Y = 50;

// ── Bird ────────────────────────────────────────────────────────────────────
const BIRD_X    = SW * 0.26;
const BIRD_R    = 20;
const BIRD_FONT = BIRD_R * 2 + 6;

// ── Physics ─────────────────────────────────────────────────────────────────
const GRAVITY     = 0.52;
const JUMP_VEL    = -12.8;
const MAX_FALL    = 13;
const ROT_UP      = -30;
const ROT_DOWN    = 65;

// ── Pipes ───────────────────────────────────────────────────────────────────
const PIPE_W          = 58;
const PIPE_GAP        = 215;
const PIPE_MARGIN_TOP = 85;
const PIPE_MARGIN_BOT = 85;
const PIPE_SPEED_BASE = 2.6;
const PIPE_SPEED_MAX  = 5.8;
const PIPE_SPEED_INC  = 0.13;
const PIPE_INTERVAL_BASE = 1950;
const PIPE_INTERVAL_MIN  = 920;
const PIPE_INTERVAL_DEC  = 22;

// ── Hitbox ───────────────────────────────────────────────────────────────────
const HIT_R = BIRD_R * 0.52;

// ── Input buffer ─────────────────────────────────────────────────────────────
const JUMP_BUFFER_MS = 150;

// ── Decorations ──────────────────────────────────────────────────────────────
const BG_STARS = [
  { e: '✨', x: SW * 0.08, y: 70  },
  { e: '⭐', x: SW * 0.22, y: 95  },
  { e: '💫', x: SW * 0.42, y: 62  },
  { e: '✨', x: SW * 0.60, y: 88  },
  { e: '⭐', x: SW * 0.75, y: 72  },
  { e: '💫', x: SW * 0.90, y: 100 },
  { e: '✨', x: SW * 0.15, y: 130 },
  { e: '⭐', x: SW * 0.50, y: 118 },
  { e: '💫', x: SW * 0.82, y: 128 },
];

const CLOUD_EMOJIS = ['☁️', '☁️', '🌤️'];
const CLOUD_Y      = [100, 145, 118];
const CLOUD_X_BASE = [SW * 0.05, SW * 0.45, SW * 0.78];

// ── PipeItem ─────────────────────────────────────────────────────────────────
const PipeItem = React.memo(function PipeItem({ topH, botY, botH, xAnim }) {
  return (
    <>
      {topH > 0 && (
        <Animated.View style={[S.pipeWrap, { top: CEILING_Y, height: topH, transform: [{ translateX: xAnim }] }]}>
          <View style={S.pipeBody} />
          <View style={S.pipeShine} />
          <View style={S.pipeCapBot}>
            <Text style={S.pipeCapEmoji}>🌹</Text>
          </View>
        </Animated.View>
      )}
      {botH > 0 && (
        <Animated.View style={[S.pipeWrap, { top: botY, height: botH, transform: [{ translateX: xAnim }] }]}>
          <View style={S.pipeCapTop}>
            <Text style={S.pipeCapEmoji}>🌸</Text>
          </View>
          <View style={S.pipeBody} />
          <View style={S.pipeShine} />
        </Animated.View>
      )}
    </>
  );
});

// ── Heart Burst ───────────────────────────────────────────────────────────────
function HeartBurst({ x, y, count = 4 }) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      ty:    new Animated.Value(0),
      tx:    new Animated.Value(0),
      op:    new Animated.Value(1),
      scale: new Animated.Value(0.3),
      angle: (i / count) * Math.PI * 2,
    }))
  ).current;

  useEffect(() => {
    particles.forEach((p, i) => {
      const dx = Math.cos(p.angle) * (28 + Math.random() * 18);
      const dy = Math.sin(p.angle) * (28 + Math.random() * 18) - 30;
      const delay = i * 40;
      Animated.parallel([
        Animated.timing(p.tx,    { toValue: dx,  duration: 750, delay, useNativeDriver: true }),
        Animated.timing(p.ty,    { toValue: dy,  duration: 750, delay, useNativeDriver: true }),
        Animated.timing(p.op,    { toValue: 0,   duration: 750, delay, useNativeDriver: true }),
        Animated.spring(p.scale, { toValue: 1.2, tension: 80, friction: 5, delay, useNativeDriver: true }),
      ]).start();
    });
  }, []);

  return (
    <>
      {particles.map((p, i) => (
        <Animated.Text key={i} style={{
          position: 'absolute', left: x, top: y,
          fontSize: 18, zIndex: 25,
          opacity: p.op,
          transform: [{ translateX: p.tx }, { translateY: p.ty }, { scale: p.scale }],
        }}>
          {i % 2 === 0 ? '❤️' : '💕'}
        </Animated.Text>
      ))}
    </>
  );
}

// ── ScoreDigit (animado ao pontuar) ──────────────────────────────────────────
function ScoreDisplay({ score, flash }) {
  const scale = useRef(new Animated.Value(1)).current;
  const prevScore = useRef(score);

  useEffect(() => {
    if (score !== prevScore.current) {
      prevScore.current = score;
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.45, tension: 180, friction: 4, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1,    tension: 120, friction: 6, useNativeDriver: true }),
      ]).start();
    }
  }, [score]);

  return (
    <Animated.View style={[S.scoreWrap, { transform: [{ scale }] }]}>
      <Text style={[S.scoreNum, flash && S.scoreNumFlash]}>{score}</Text>
    </Animated.View>
  );
}

// ── Cloud parallax ────────────────────────────────────────────────────────────
function Clouds({ speedRef }) {
  const cloudX = useRef(CLOUD_X_BASE.map(x => new Animated.Value(x))).current;
  const raf    = useRef(null);
  const lastT  = useRef(null);

  useEffect(() => {
    const loop = (ts) => {
      if (!lastT.current) lastT.current = ts;
      const dt = Math.min((ts - lastT.current) / (1000 / 60), 2);
      lastT.current = ts;
      cloudX.forEach((cx, i) => {
        const cur = cx._value;
        const next = cur - (speedRef.current * 0.32) * dt;
        cx.setValue(next < -80 ? SW + 60 : next);
      });
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, []);

  return (
    <>
      {CLOUD_EMOJIS.map((e, i) => (
        <Animated.Text key={i} style={[S.cloud, { top: CLOUD_Y[i], transform: [{ translateX: cloudX[i] }] }]}>
          {e}
        </Animated.Text>
      ))}
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function FlappyBirdScreen({ onBack }) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase]           = useState('idle');
  const [score, setScore]           = useState(0);
  const [best, setBest]             = useState(0);
  const [pipes, setPipes]           = useState([]);
  const [bursts, setBursts]         = useState([]);
  const [scoreFlash, setScoreFlash] = useState(false);

  const G = useRef({
    phase: 'idle',
    by:    FLOOR_Y * 0.40,
    vel:   0,
    pipes: [],
    score: 0,
    lastPipe:   0,
    nextId:     0,
    speed:      PIPE_SPEED_BASE,
    interval:   PIPE_INTERVAL_BASE,
    jumpBuffer: 0,
  });

  const speedRef = useRef(PIPE_SPEED_BASE); // para Clouds sem re-render

  const birdY      = useRef(new Animated.Value(FLOOR_Y * 0.40)).current;
  const birdRot    = useRef(new Animated.Value(0)).current;
  const birdScaleX = useRef(new Animated.Value(1)).current;
  const birdScaleY = useRef(new Animated.Value(1)).current;
  const xAnims     = useRef({});
  const flashA     = useRef(new Animated.Value(0)).current;
  const titleP     = useRef(new Animated.Value(1)).current;
  const goFade     = useRef(new Animated.Value(0)).current;
  const bgShift    = useRef(new Animated.Value(0)).current;

  const pAdd  = useRef([]);
  const pRem  = useRef(new Set());
  const raf   = useRef(null);
  const lastT = useRef(null);
  const bestRef  = useRef(0);
  const burstId  = useRef(0);

  const birdRotDeg = birdRot.interpolate({
    inputRange: [ROT_UP, ROT_DOWN],
    outputRange: [`${ROT_UP}deg`, `${ROT_DOWN}deg`],
    extrapolate: 'clamp',
  });

  // bg gradient Y shift (slow drift)
  useEffect(() => {
    getFlappyBest().then(v => { bestRef.current = v; setBest(v); });

    const pulse = () => Animated.sequence([
      Animated.timing(titleP, { toValue: 1.08, duration: 600, useNativeDriver: true }),
      Animated.timing(titleP, { toValue: 1,    duration: 600, useNativeDriver: true }),
    ]).start(pulse);
    pulse();

    Animated.loop(Animated.sequence([
      Animated.timing(bgShift, { toValue: 1, duration: 6000, useNativeDriver: true }),
      Animated.timing(bgShift, { toValue: 0, duration: 6000, useNativeDriver: true }),
    ])).start();

    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, []);

  // ── Burst ────────────────────────────────────────────────────────────────
  const spawnBurst = useCallback((bx, by) => {
    const id = burstId.current++;
    setBursts(p => [...p, { id, x: bx - 16, y: by }]);
    setTimeout(() => setBursts(p => p.filter(b => b.id !== id)), 900);
  }, []);

  // ── Squash & Stretch on jump ──────────────────────────────────────────────
  const doJumpJuice = useCallback(() => {
    birdScaleX.setValue(0.7);
    birdScaleY.setValue(1.4);
    Animated.parallel([
      Animated.spring(birdScaleX, { toValue: 1, tension: 200, friction: 5, useNativeDriver: true }),
      Animated.spring(birdScaleY, { toValue: 1, tension: 200, friction: 5, useNativeDriver: true }),
    ]).start();
  }, [birdScaleX, birdScaleY]);

  // ── Squash on land/hit ────────────────────────────────────────────────────
  const doHitJuice = useCallback(() => {
    birdScaleX.setValue(1.5);
    birdScaleY.setValue(0.6);
    Animated.parallel([
      Animated.spring(birdScaleX, { toValue: 1, tension: 120, friction: 6, useNativeDriver: true }),
      Animated.spring(birdScaleY, { toValue: 1, tension: 120, friction: 6, useNativeDriver: true }),
    ]).start();
  }, [birdScaleX, birdScaleY]);

  // ── Boost ─────────────────────────────────────────────────────────────────
  const doBoost = useCallback(() => {
    const g = G.current;
    g.speed    = Math.min(g.speed    + PIPE_SPEED_INC, PIPE_SPEED_MAX);
    g.interval = Math.max(g.interval - PIPE_INTERVAL_DEC, PIPE_INTERVAL_MIN);
    speedRef.current = g.speed;
    flashA.setValue(1);
    Animated.timing(flashA, { toValue: 0, duration: 400, useNativeDriver: true }).start();
    setScoreFlash(true);
    setTimeout(() => setScoreFlash(false), 300);
  }, [flashA]);

  // ── End game ──────────────────────────────────────────────────────────────
  const endGame = useCallback(async () => {
    const g = G.current;
    if (g.phase === 'dead') return;
    g.phase = 'dead';
    if (raf.current) { cancelAnimationFrame(raf.current); raf.current = null; }
    lastT.current = null;
    doHitJuice();
    setPhase('dead');
    goFade.setValue(0);
    Animated.timing(goFade, { toValue: 1, duration: 480, useNativeDriver: true }).start();
    if (g.score > 0) await incrementFlappyGames();
    if (g.score > bestRef.current) {
      bestRef.current = g.score;
      setBest(g.score);
      await setFlappyBest(g.score);
    }
  }, [goFade, doHitJuice]);

  // ── Tick ──────────────────────────────────────────────────────────────────
  const tick = useCallback((dt) => {
    const g = G.current;
    if (g.phase !== 'playing') return;
    const now = Date.now();

    // Consume jump buffer
    if (g.jumpBuffer && now - g.jumpBuffer < JUMP_BUFFER_MS) {
      g.vel = JUMP_VEL;
      g.jumpBuffer = 0;
      doJumpJuice();
    }

    // Physics
    g.vel = Math.min(g.vel + GRAVITY * dt, MAX_FALL);
    g.by += g.vel * dt;

    // Spawn pipe
    if (now - g.lastPipe > g.interval) {
      g.lastPipe = now;
      const minGap = CEILING_Y + PIPE_MARGIN_TOP;
      const maxGap = FLOOR_Y   - PIPE_MARGIN_BOT;
      const gapY   = minGap + Math.random() * (maxGap - minGap);
      const id     = g.nextId++;
      xAnims.current[id] = new Animated.Value(SW + PIPE_W);
      g.pipes.push({ id, x: SW + PIPE_W, gapY, scored: false });
      const topH = Math.max(0, gapY - PIPE_GAP / 2 - CEILING_Y);
      const botY = gapY + PIPE_GAP / 2;
      const botH = Math.max(0, FLOOR_Y - botY);
      pAdd.current.push({ id, topH, botY, botH });
    }

    // Move pipes + scoring
    let scoreUp = false;
    const live = [];
    for (const p of g.pipes) {
      p.x -= g.speed * dt;
      if (p.x <= -PIPE_W - 10) {
        delete xAnims.current[p.id];
        pRem.current.add(p.id);
      } else {
        live.push(p);
        xAnims.current[p.id]?.setValue(p.x);
        if (!p.scored && BIRD_X > p.x + PIPE_W) {
          p.scored = true;
          g.score++;
          scoreUp = true;
          doBoost();
        }
      }
    }
    g.pipes = live;

    // Collisions
    const bcx = BIRD_X;
    const bcy = g.by + BIRD_R;

    if (bcy + HIT_R > FLOOR_Y || bcy - HIT_R < CEILING_Y) {
      endGame(); return;
    }

    for (const p of g.pipes) {
      if (bcx + HIT_R < p.x || bcx - HIT_R > p.x + PIPE_W) continue;
      const gapTop = p.gapY - PIPE_GAP / 2;
      const gapBot = p.gapY + PIPE_GAP / 2;
      if (bcy - HIT_R < gapTop || bcy + HIT_R > gapBot) {
        const nearX = Math.max(p.x, Math.min(bcx, p.x + PIPE_W));
        const nearY = bcy < gapTop
          ? Math.max(CEILING_Y, Math.min(bcy, gapTop))
          : Math.min(FLOOR_Y,   Math.max(bcy, gapBot));
        const dx = bcx - nearX;
        const dy = bcy - nearY;
        if (dx * dx + dy * dy < HIT_R * HIT_R) { endGame(); return; }
      }
    }

    // Update animated values
    birdY.setValue(g.by);
    birdRot.setValue(Math.max(ROT_UP, Math.min(ROT_DOWN, g.vel * 3.4)));

    // Flush display batches
    const adds = pAdd.current.splice(0);
    const rems = new Set(pRem.current);
    pRem.current.clear();
    if (adds.length || rems.size) {
      setPipes(prev => {
        const n = rems.size ? prev.filter(p => !rems.has(p.id)) : prev;
        return adds.length ? [...n, ...adds] : n;
      });
    }

    if (scoreUp) {
      setScore(g.score);
      spawnBurst(BIRD_X, g.by);
    }
  }, [endGame, doBoost, doJumpJuice, spawnBurst, birdY, birdRot]);

  // ── Loop ──────────────────────────────────────────────────────────────────
  const loop = useCallback((ts) => {
    if (!lastT.current) lastT.current = ts;
    const dt = Math.min((ts - lastT.current) / (1000 / 60), 2.5);
    lastT.current = ts;
    tick(dt);
    if (G.current.phase === 'playing') raf.current = requestAnimationFrame(loop);
  }, [tick]);

  // ── Start ─────────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    const g = G.current;
    Object.keys(xAnims.current).forEach(k => delete xAnims.current[+k]);
    pAdd.current = [];
    pRem.current.clear();

    g.phase      = 'playing';
    g.by         = FLOOR_Y * 0.40;
    g.vel        = 0;
    g.pipes      = [];
    g.score      = 0;
    g.lastPipe   = Date.now() + 1500;
    g.nextId     = 0;
    g.speed      = PIPE_SPEED_BASE;
    g.interval   = PIPE_INTERVAL_BASE;
    g.jumpBuffer = 0;
    speedRef.current = PIPE_SPEED_BASE;

    birdY.setValue(g.by);
    birdRot.setValue(0);
    birdScaleX.setValue(1);
    birdScaleY.setValue(1);
    setScore(0);
    setPipes([]);
    setBursts([]);
    setPhase('playing');
    goFade.setValue(0);

    if (raf.current) cancelAnimationFrame(raf.current);
    lastT.current = null;
    raf.current = requestAnimationFrame(loop);
  }, [loop, birdY, birdRot, birdScaleX, birdScaleY, goFade]);

  // ── Input ─────────────────────────────────────────────────────────────────
  const handleTap = useCallback(() => {
    const g = G.current;
    if (g.phase === 'idle' || g.phase === 'dead') {
      startGame();
    } else if (g.phase === 'playing') {
      g.jumpBuffer = Date.now();
    }
  }, [startGame]);

  // ── Render ────────────────────────────────────────────────────────────────
  const isNewRecord = phase === 'dead' && score > 0 && score >= best;

  return (
    <View style={S.root}>
      <StatusBar hidden />

      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={S.game}>

          {/* Background gradient */}
          <LinearGradient
            colors={['#080318', '#130830', '#2A1250', '#5A1A50', '#9E2E58', '#C84B6A']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.85, y: 1 }}
          />

          {/* Subtle overlay glow at top */}
          <View style={S.bgTopGlow} />

          {/* Clouds parallax */}
          <Clouds speedRef={speedRef} />

          {/* Static stars */}
          {BG_STARS.map((s, i) => (
            <Text key={i} style={[S.star, { left: s.x, top: s.y }]}>{s.e}</Text>
          ))}
          <Text style={S.moon}>🌙</Text>

          {/* Ceiling line */}
          <View style={S.ceiling} />

          {/* Pipes */}
          {pipes.map(p => {
            const xa = xAnims.current[p.id];
            if (!xa) return null;
            return <PipeItem key={p.id} topH={p.topH} botY={p.botY} botH={p.botH} xAnim={xa} />;
          })}

          {/* Ground */}
          <View style={S.ground}>
            <LinearGradient
              colors={['#1C4A0F', '#0E2A07']}
              style={StyleSheet.absoluteFill}
            />
            <View style={S.groundStripe} />
            <Text style={S.groundTxt}>🌷🌿🌺🌿🌸🌿🌹🌿🌷🌿🌸</Text>
          </View>

          {/* Bird */}
          <Animated.View style={[S.bird, {
            transform: [
              { translateY: birdY },
              { rotate: birdRotDeg },
              { scaleX: birdScaleX },
              { scaleY: birdScaleY },
            ],
          }]}>
            <Text style={{ fontSize: BIRD_FONT }}>❤️</Text>
          </Animated.View>

          {/* Score */}
          {phase === 'playing' && (
            <ScoreDisplay score={score} flash={scoreFlash} />
          )}

          {/* Heart bursts */}
          {bursts.map(b => <HeartBurst key={b.id} x={b.x} y={b.y} />)}

          {/* Boost flash border */}
          <Animated.View pointerEvents="none" style={[S.boostBorder, { opacity: flashA }]} />

          {/* ── Idle overlay ── */}
          {phase === 'idle' && (
            <View style={S.overlay}>
              <View style={S.overlayCard}>
                <Animated.Text style={[S.bigEmoji, { transform: [{ scale: titleP }] }]}>💕</Animated.Text>
                <Text style={S.oTitle}>Flappy Love</Text>
                <Text style={S.oSub}>Voe com o coração,{'\n'}meu amor ❤️</Text>
                <View style={S.divider} />
                <View style={S.bestRow}>
                  <Text style={S.bestLabel}>🏆 Recorde</Text>
                  <Text style={S.bestVal}>{best}</Text>
                </View>
                <View style={S.tapBtn}>
                  <Text style={S.tapTxt}>✨ Toque para começar ✨</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── Dead overlay ── */}
          {phase === 'dead' && (
            <Animated.View style={[S.overlay, { opacity: goFade }]}>
              <View style={S.overlayCard}>
                <Text style={S.bigEmoji}>{isNewRecord ? '🏆' : '💔'}</Text>
                <Text style={S.goTitle}>{isNewRecord ? 'Novo Recorde!' : 'Pousou!'}</Text>
                <Text style={S.goSub}>
                  {isNewRecord
                    ? 'Que orgulho de você! 🎉'
                    : 'Mas te amo do mesmo jeito 💕'}
                </Text>

                <View style={S.scoreBox}>
                  <Text style={S.scoreBoxLabel}>PONTUAÇÃO</Text>
                  <Text style={[S.scoreBoxNum, isNewRecord && S.scoreBoxNumGold]}>{score}</Text>
                  {isNewRecord && (
                    <View style={S.recordBadge}>
                      <Text style={S.recordTxt}>⭐ Melhor de todos os tempos ⭐</Text>
                    </View>
                  )}
                  <View style={S.divider} />
                  <View style={S.bestRow}>
                    <Text style={S.bestLabel}>🏆 Recorde</Text>
                    <Text style={S.bestVal}>{best}</Text>
                  </View>
                </View>

                <View style={S.tapBtn}>
                  <Text style={S.tapTxt}>💕 Toque para tentar de novo 💕</Text>
                </View>
              </View>
            </Animated.View>
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* Back button */}
      <TouchableOpacity style={[S.back, { top: insets.top + 10 }]} onPress={onBack} activeOpacity={0.8}>
        <View style={S.backInner}>
          <Text style={S.backTxt}>← Voltar</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1 },
  game: { flex: 1 },

  bgTopGlow: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 180,
    backgroundColor: 'rgba(160,60,180,0.08)',
  },

  star:  { position: 'absolute', fontSize: 12, opacity: 0.75 },
  moon:  { position: 'absolute', top: 52, right: 24, fontSize: 28 },
  cloud: { position: 'absolute', fontSize: 28, opacity: 0.55 },

  ceiling: {
    position: 'absolute', top: CEILING_Y - 2, left: 0, right: 0,
    height: 2, backgroundColor: 'rgba(255,182,193,0.18)',
  },

  // Pipes
  pipeWrap: {
    position: 'absolute', left: 0, width: PIPE_W, overflow: 'hidden',
  },
  pipeBody: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#267A14',
  },
  pipeShine: {
    position: 'absolute', top: 0, bottom: 0, left: 6, width: 8,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  pipeCapBot: {
    position: 'absolute', bottom: 0, left: -6,
    width: PIPE_W + 12, height: 22,
    backgroundColor: '#38AE20',
    alignItems: 'center', justifyContent: 'center',
    borderBottomLeftRadius: 4, borderBottomRightRadius: 4,
  },
  pipeCapTop: {
    position: 'absolute', top: 0, left: -6,
    width: PIPE_W + 12, height: 22,
    backgroundColor: '#38AE20',
    alignItems: 'center', justifyContent: 'center',
    borderTopLeftRadius: 4, borderTopRightRadius: 4,
  },
  pipeCapEmoji: { fontSize: 13 },

  // Ground
  ground: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 100, overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  groundStripe: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
    backgroundColor: 'rgba(100,200,60,0.4)',
  },
  groundTxt: {
    fontSize: 14, textAlign: 'center',
    paddingBottom: 6, letterSpacing: -1,
  },

  // Bird
  bird: {
    position: 'absolute',
    width: BIRD_R * 2, height: BIRD_R * 2,
    left: BIRD_X - BIRD_R, top: 0,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },

  // Score
  scoreWrap: {
    position: 'absolute', top: 52, left: 0, right: 0,
    alignItems: 'center',
  },
  scoreNum: {
    fontSize: 58, fontWeight: '900', color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
    letterSpacing: 2,
  },
  scoreNumFlash: { color: '#FFD700' },

  // Boost flash
  boostBorder: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderWidth: 5, borderColor: '#FFD700',
    pointerEvents: 'none',
  },

  // Overlays
  overlay: {
    position: 'absolute', inset: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(10,2,20,0.72)',
    paddingHorizontal: 24,
  },
  overlayCard: {
    width: '88%', maxWidth: 340,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 28, padding: 28,
    alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,182,193,0.2)',
  },
  bigEmoji: { fontSize: 72, marginBottom: 10 },

  oTitle: {
    fontSize: 42, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1,
    textShadowColor: '#C0395A',
    textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 14,
  },
  oSub: {
    fontSize: 15, color: 'rgba(255,182,193,0.95)',
    textAlign: 'center', fontStyle: 'italic',
    marginTop: 10, lineHeight: 23,
  },

  divider: {
    width: 44, height: 1.5,
    backgroundColor: 'rgba(255,182,193,0.25)',
    marginVertical: 16,
  },

  bestRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20,
  },
  bestLabel: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  bestVal:   { fontSize: 22, fontWeight: '900', color: '#FFD700' },

  tapBtn: {
    backgroundColor: 'rgba(192,57,90,0.5)',
    paddingVertical: 14, paddingHorizontal: 26,
    borderRadius: 50,
    borderWidth: 1, borderColor: 'rgba(255,182,193,0.35)',
  },
  tapTxt: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },

  goTitle: {
    fontSize: 34, fontWeight: '900', color: '#FFFFFF',
    textShadowColor: '#C0395A',
    textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10,
  },
  goSub: {
    fontSize: 14, color: 'rgba(255,182,193,0.9)',
    fontStyle: 'italic', marginTop: 6, marginBottom: 18,
    textAlign: 'center',
  },

  scoreBox: {
    width: '100%', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 18, padding: 18, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255,182,193,0.15)',
  },
  scoreBoxLabel: {
    fontSize: 10, color: 'rgba(255,255,255,0.45)',
    letterSpacing: 3, fontWeight: '700',
  },
  scoreBoxNum: {
    fontSize: 52, fontWeight: '900', color: '#FFFFFF', marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },
  scoreBoxNumGold: { color: '#FFD700' },
  recordBadge: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    paddingVertical: 6, paddingHorizontal: 14,
    borderRadius: 20, marginTop: 8,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.4)',
  },
  recordTxt: { color: '#FFD700', fontWeight: '800', fontSize: 12 },

  // Back button
  back: {
    position: 'absolute', top: 48, left: 14,
    zIndex: 100, borderRadius: 30,
  },
  backInner: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 30,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  backTxt: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
