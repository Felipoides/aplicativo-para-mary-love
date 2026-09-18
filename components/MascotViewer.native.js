import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, PanResponder, View } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer, loadAsync } from 'expo-three';
import { createMascotScene } from './mascotScene';

const MATHEUS = require('../assets/mascots/Matheus.glb');
const MARY = require('../assets/mascots/Maryane.glb');

export default function MascotViewer({ selected, motionEnabled = true, onError }) {
  const [loading, setLoading] = useState(true);
  const live = useRef({ selected, motionEnabled, turn: 0 });
  const session = useRef(null);
  live.current.selected = selected;
  live.current.motionEnabled = motionEnabled;

  useEffect(() => () => {
    if (session.current) {
      session.current.cancelled = true;
      cancelAnimationFrame(session.current.frame);
      session.current.world?.dispose();
      session.current.renderer?.dispose();
      session.current = null;
    }
  }, []);

  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 4,
    onPanResponderMove: (_, gesture) => {
      live.current.turn = Math.max(-0.34, Math.min(0.34, gesture.dx / 300));
    },
    onPanResponderRelease: () => { live.current.turn = 0; },
    onPanResponderTerminate: () => { live.current.turn = 0; },
  })).current;

  const onContextCreate = async (gl) => {
    const run = { cancelled: false, frame: null, world: null, renderer: null };
    session.current = run;
    try {
      const renderer = new Renderer({ gl, antialias: true });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      const world = createMascotScene(gl.drawingBufferWidth, gl.drawingBufferHeight);
      run.renderer = renderer;
      run.world = world;
      const [matheus, mary] = await Promise.all([loadAsync(MATHEUS), loadAsync(MARY)]);
      if (run.cancelled) return;
      world.add('matheus', matheus);
      world.add('mary', mary);
      setLoading(false);
      const started = Date.now();
      const draw = () => {
        if (run.cancelled) return;
        world.update(live.current.selected, live.current.turn,
          (Date.now() - started) / 1000, live.current.motionEnabled);
        renderer.render(world.scene, world.camera);
        gl.endFrameEXP();
        run.frame = requestAnimationFrame(draw);
      };
      draw();
    } catch (error) {
      if (!run.cancelled) {
        setLoading(false);
        onError?.(error);
      }
    }
  };

  return (
    <View style={{ flex: 1 }} {...pan.panHandlers}>
      <GLView style={{ flex: 1 }} onContextCreate={onContextCreate} />
      {loading && <ActivityIndicator color="#f4a2ce" size="large" style={{ position: 'absolute', alignSelf: 'center', top: '48%' }} />}
    </View>
  );
}
