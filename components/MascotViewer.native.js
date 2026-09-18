import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, PanResponder, View } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer, loadAsync } from 'expo-three';
import { createMascotScene } from './mascotScene';

const MATHEUS = require('../assets/mascots/Matheus.glb');
const MARY = require('../assets/mascots/Maryane.glb');

function release(run) {
  if (!run || run.cancelled) return;
  run.cancelled = true;
  cancelAnimationFrame(run.frame);
  run.world?.dispose();
  run.renderer?.dispose();
}

// A rendered middle row must contain something besides the uniform background.
// Only read during startup: no GPU readback cost during normal interaction.
function hasVisiblePixels(gl) {
  const width = gl.drawingBufferWidth;
  const pixels = new Uint8Array(width * 4);
  gl.readPixels(0, Math.floor(gl.drawingBufferHeight / 2), width, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  for (let x = 1; x < width; x += 4) {
    const i = x * 4;
    if (Math.abs(pixels[i] - pixels[0]) + Math.abs(pixels[i + 1] - pixels[1]) + Math.abs(pixels[i + 2] - pixels[2]) > 40) return true;
  }
  return false;
}

export default function MascotViewer({ selected, motionEnabled = true, onError }) {
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState(null);
  const live = useRef({ selected, motionEnabled, turn: 0, dragStart: 0, onError });
  const session = useRef(null);
  const watchdog = useRef(null);
  const mounted = useRef(true);
  Object.assign(live.current, { selected, motionEnabled, onError });

  const fail = (error) => {
    if (!mounted.current) return;
    clearTimeout(watchdog.current);
    release(session.current);
    console.warn('Mascot3D:', error.message);
    setLoading(false);
    live.current.onError?.(error);
  };

  useEffect(() => {
    mounted.current = true;
    watchdog.current = setTimeout(() => fail(new Error('3D-START: tempo de abertura excedido')), 25000);
    return () => {
      mounted.current = false;
      clearTimeout(watchdog.current);
      release(session.current);
    };
  }, []);

  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 4,
    onPanResponderGrant: () => { live.current.dragStart = live.current.turn; },
    onPanResponderMove: (_, gesture) => {
      live.current.turn = live.current.dragStart + gesture.dx / 130;
    },
  })).current;

  const onContextCreate = async (gl) => {
    release(session.current);
    const run = { cancelled: false, frame: null, world: null, renderer: null };
    session.current = run;
    try {
      if (!gl.drawingBufferWidth || !gl.drawingBufferHeight) throw new Error('3D-SIZE: tela sem dimensões');
      const renderer = new Renderer({ gl, antialias: false, precision: 'mediump' });
      run.renderer = renderer;
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.debug.onShaderError = () => { throw new Error('3D-SHADER: material incompatível'); };
      const world = createMascotScene(gl.drawingBufferWidth, gl.drawingBufferHeight, { compatible: true });
      run.world = world;
      const [matheus, mary] = await Promise.all([loadAsync(MATHEUS), loadAsync(MARY)]);
      if (run.cancelled) {
        // A slow load may finish after the user leaves the screen.
        const abandoned = createMascotScene(1, 1);
        abandoned.add('matheus', matheus);
        abandoned.add('mary', mary);
        abandoned.dispose();
        return;
      }
      world.add('matheus', matheus);
      world.add('mary', mary);
      let simple = false;
      let verified = false;
      let frames = 0;
      const started = Date.now();
      const draw = () => {
        if (run.cancelled) return;
        try {
          const width = gl.drawingBufferWidth;
          const height = gl.drawingBufferHeight;
          if (width > 0 && height > 0) {
            renderer.setViewport(0, 0, width, height);
            world.camera.aspect = width / height;
            world.camera.updateProjectionMatrix();
          }
          world.update(live.current.selected, live.current.turn,
            (Date.now() - started) / 1000, live.current.motionEnabled);
          renderer.render(world.scene, world.camera);
          frames += 1;
          if (!verified && frames >= 3) {
            if (!hasVisiblePixels(gl)) throw new Error('3D-EMPTY: nenhum bonequinho foi desenhado');
            verified = true;
            clearTimeout(watchdog.current);
            setLoading(false);
            console.info('Mascot3D: first visible frame', simple ? 'simple' : 'lambert');
          }
          gl.endFrameEXP();
        } catch (error) {
          if (!simple) {
            console.warn('Mascot3D: retry with simple materials', error.message);
            world.useSimpleMaterials();
            simple = true;
            frames = 0;
          } else {
            fail(error);
            return;
          }
        }
        run.frame = requestAnimationFrame(draw);
      };
      draw();
    } catch (error) {
      if (!run.cancelled) fail(error);
    }
  };

  return (
    <View style={{ flex: 1 }} onLayout={({ nativeEvent: { layout } }) => {
      if (layout.width > 0 && layout.height > 0) setSize({ width: layout.width, height: layout.height });
    }} {...pan.panHandlers}>
      {size && <GLView style={size} onContextCreate={onContextCreate} />}
      {loading && <ActivityIndicator accessibilityLabel="Carregando bonequinhos 3D" color="#f4a2ce" size="large" style={{ position: 'absolute', alignSelf: 'center', top: '48%' }} />}
    </View>
  );
}
