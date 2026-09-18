import * as THREE from 'three';

// The current GLBs are relief prototypes. Keep turns shallow so their painted
// fronts stay legible until the characters have complete sculpted backs.
export function createMascotScene(width, height) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#120e20');
  const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
  camera.position.set(0, 0.05, 6.4);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 2.3));
  const light = new THREE.DirectionalLight(0xffe4ee, 1.1);
  light.position.set(-2, 3, 5);
  scene.add(light);

  const models = {};
  const add = (name, gltf) => {
    const pivot = new THREE.Group();
    const model = gltf.scene;
    model.position.y = -1.3;
    model.traverse((part) => {
      if (part.isMesh && part.material) {
        part.material.side = THREE.DoubleSide;
        // Preserve the source drawing's colors under the scene lighting.
        part.material.depthWrite = true;
      }
    });
    pivot.add(model);
    scene.add(pivot);
    models[name] = pivot;
  };
  const update = (selected, turn, seconds, motion = true) => {
    for (const [name, pivot] of Object.entries(models)) {
      const together = selected === 'both';
      pivot.visible = together || selected === name;
      pivot.position.x = together ? (name === 'matheus' ? -0.77 : 0.77) : 0;
      pivot.position.y = motion ? Math.sin(seconds * 1.6 + (name === 'mary' ? 1 : 0)) * 0.035 : 0;
      pivot.rotation.y = Math.max(-0.34, Math.min(0.34, turn));
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
  return { scene, camera, add, update, dispose };
}
