import * as THREE from 'three';

// Both GLBs have full 3D backs, individual parts and colored materials.
export function createMascotScene(width, height, { compatible = false } = {}) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#120e20');
  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
  camera.position.set(0, 0.05, 6.4);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 1.05));
  const light = new THREE.DirectionalLight(0xffe4ee, 1.35);
  light.position.set(-2, 3, 5);
  scene.add(light);
  const fill = new THREE.DirectionalLight(0xc9d2ff, 0.48);
  fill.position.set(2, 1, -4);
  scene.add(fill);

  const models = {};
  const add = (name, gltf) => {
    const pivot = new THREE.Group();
    const model = gltf.scene;
    model.position.y = -1.3;
    model.traverse((part) => {
      if (part.isMesh && part.material) {
        if (compatible) {
          // Native devices do not need the heavier PBR shader for these clay models.
          const old = part.material;
          part.material = new THREE.MeshLambertMaterial({ color: old.color });
          old.dispose();
        }
        part.material.side = THREE.DoubleSide;
        part.material.depthWrite = true;
      }
    });
    pivot.add(model);
    scene.add(pivot);
    models[name] = pivot;
  };
  const useSimpleMaterials = () => {
    Object.values(models).forEach((pivot) => pivot.traverse((part) => {
      if (!part.isMesh) return;
      const old = part.material;
      part.material = new THREE.MeshBasicMaterial({ color: old.color, side: THREE.DoubleSide });
      old.dispose();
    }));
  };
  const update = (selected, turn, seconds, motion = true) => {
    for (const [name, pivot] of Object.entries(models)) {
      const together = selected === 'both';
      pivot.visible = together || selected === name;
      pivot.position.x = together ? (name === 'matheus' ? -0.77 : 0.77) : 0;
      pivot.position.y = motion ? Math.sin(seconds * 1.6 + (name === 'mary' ? 1 : 0)) * 0.035 : 0;
      pivot.rotation.y = turn;
      pivot.scale.setScalar(together ? 0.93 : 1.13);
    }
  };
  const dispose = () => {
    for (const pivot of Object.values(models)) {
      pivot.traverse((part) => {
        if (!part.isMesh) return;
        part.geometry?.dispose();
        const materials = Array.isArray(part.material) ? part.material : [part.material];
        materials.forEach((material) => {
          material?.map?.dispose();
          material?.dispose();
        });
      });
    }
  };
  return { scene, camera, add, update, dispose, useSimpleMaterials };
}
