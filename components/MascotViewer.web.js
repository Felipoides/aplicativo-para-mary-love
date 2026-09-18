import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Asset } from 'expo-asset';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { createMascotScene } from './mascotScene';

const MATHEUS = require('../assets/mascots/Matheus.glb');
const MARY = require('../assets/mascots/Maryane.glb');

export default function MascotViewer({ selected, motionEnabled = true, onError }) {
  const container = useRef(null);
  const current = useRef({ selected, motionEnabled, turn: 0 });
  const [loading, setLoading] = useState(true);
  current.current.selected = selected;
  current.current.motionEnabled = motionEnabled;

  useEffect(() => {
    const host = container.current;
    if (!host) return;
    let cancelled = false;
    let frame;
    let world;
    let renderer;
    const size = () => ({ width: host.clientWidth || 350, height: host.clientHeight || 400 });
    const start = async () => {
      try {
        const { width, height } = size();
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height);
        host.appendChild(renderer.domElement);
        world = createMascotScene(width, height);
        const loader = new GLTFLoader();
        const assets = await Promise.all([Asset.fromModule(MATHEUS).downloadAsync(), Asset.fromModule(MARY).downloadAsync()]);
        const load = (uri) => new Promise((resolve, reject) => loader.load(uri, resolve, undefined, reject));
        const [matheus, mary] = await Promise.all(assets.map((asset) => load(asset.uri)));
        if (cancelled) return;
        world.add('matheus', matheus);
        world.add('mary', mary);
        setLoading(false);
        const started = performance.now();
        const draw = () => {
          if (cancelled) return;
          world.update(current.current.selected, current.current.turn,
            (performance.now() - started) / 1000, current.current.motionEnabled);
          renderer.render(world.scene, world.camera);
          frame = requestAnimationFrame(draw);
        };
        draw();
      } catch (error) {
        if (!cancelled) { setLoading(false); onError?.(error); }
      }
    };
    const pointerDown = (event) => {
      host.dataset.dragX = String(event.clientX);
      host.dataset.dragTurn = String(current.current.turn);
    };
    const pointerMove = (event) => {
      if (host.dataset.dragX) current.current.turn = Number(host.dataset.dragTurn)
        + (event.clientX - Number(host.dataset.dragX)) / 130;
    };
    const pointerUp = () => { delete host.dataset.dragX; delete host.dataset.dragTurn; };
    host.addEventListener('pointerdown', pointerDown);
    host.addEventListener('pointermove', pointerMove);
    host.addEventListener('pointerup', pointerUp);
    host.addEventListener('pointerleave', pointerUp);
    start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      host.removeEventListener('pointerdown', pointerDown);
      host.removeEventListener('pointermove', pointerMove);
      host.removeEventListener('pointerup', pointerUp);
      host.removeEventListener('pointerleave', pointerUp);
      world?.dispose();
      renderer?.dispose();
      if (renderer?.domElement?.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <View ref={container} style={{ flex: 1, overflow: 'hidden', touchAction: 'none' }}>
      {loading && <ActivityIndicator color="#f4a2ce" size="large" style={{ position: 'absolute', alignSelf: 'center', top: '48%' }} />}
    </View>
  );
}
