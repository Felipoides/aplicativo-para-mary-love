/** Rebuild the two 360-degree clay-style mascots from editable Three.js parts. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// GLTFExporter uses FileReader for its final binary Blob; Node has Blob only.
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((data) => { this.result = data; this.onloadend?.(); },
      (error) => this.onerror?.(error));
  }
};

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/mascots');
const C = {
  ink: '#171417', hair: '#242326', hairLight: '#343135',
  matheusSkin: '#b87952', marySkin: '#f6cbb6',
  matheusShirt: '#29292b', maryShirt: '#5a262c',
  matheusJeans: '#7899ca', maryJeans: '#315b89',
  boot: '#bd8650', sole: '#51382b', gold: '#e5ae43',
  silver: '#d1d5db', wine: '#5a262d', white: '#f3f1ee',
};
const materials = new Map();
function mat(color, metalness = 0) {
  const key = `${color}:${metalness}`;
  if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({
    color, roughness: metalness ? 0.36 : 0.92, metalness, flatShading: false,
  }));
  return materials.get(key);
}
function addMesh(parent, name, geometry, color, metalness = 0) {
  const mesh = new THREE.Mesh(geometry, mat(color, metalness));
  mesh.name = name;
  parent.add(mesh);
  return mesh;
}
function ball(parent, name, at, radii, color, segments = 14) {
  const mesh = addMesh(parent, name, new THREE.SphereGeometry(1, segments, 8), color);
  mesh.position.set(...at);
  mesh.scale.set(...radii);
  return mesh;
}
function limb(parent, name, from, to, radii, color) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
  const mesh = ball(parent, name, a.clone().add(b).multiplyScalar(0.5).toArray(),
    [radii[0], a.distanceTo(b) * 0.60, radii[1]], color);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.sub(a).normalize());
  return mesh;
}
function stroke(parent, name, points, radius, color, metalness = 0) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  return addMesh(parent, name, new THREE.TubeGeometry(curve, Math.max(8, points.length * 2),
    radius, 5, false), color, metalness);
}
function bead(parent, name, at, radius, color, metalness = 0) {
  const mesh = addMesh(parent, name, new THREE.SphereGeometry(radius, 10, 6), color, metalness);
  mesh.position.set(...at);
  return mesh;
}
function group(parent, name, at = [0, 0, 0]) {
  const node = new THREE.Group(); node.name = name; node.position.set(...at); parent.add(node);
  return node;
}
function circle(seed) {
  const n = Math.sin(seed * 127.1 + 78.2) * 43758.5453;
  return n - Math.floor(n);
}
function glasses(parent, y, z, type) {
  const metal = type === 'matheus' ? '#bfc3c6' : '#c8d1d8';
  for (const side of [-1, 1]) {
    const x = side * 0.31, hw = type === 'matheus' ? 0.245 : 0.255;
    const h = type === 'matheus' ? 0.23 : 0.245;
    const r = 0.038;
    const corners = [
      [x-hw+r,y+h,z], [x+hw-r,y+h,z], [x+hw,y+h-r,z],
      [x+hw,y-h+r,z], [x+hw-r,y-h,z], [x-hw+r,y-h,z],
      [x-hw,y-h+r,z], [x-hw,y+h-r,z], [x-hw+r,y+h,z],
    ];
    stroke(parent, `Armação ${side}`, corners, 0.016, metal, 0.3);
    stroke(parent, `Haste ${side}`, [[x+side*hw,y+0.10,z-0.01],
      [side*0.65,y+0.09,0.50], [side*0.74,y+0.08,0.33]], 0.015, metal, 0.3);
  }
  stroke(parent, 'Ponte dos óculos', [[-0.065,y+0.11,z],[0,y+0.15,z-0.03],
    [0.065,y+0.11,z]], 0.015, metal, 0.3);
}
function boot(parent, side, x, tan) {
  const z = 0.18;
  ball(parent, `Sola ${side}`, [x,0.08,z], [0.27,0.09,0.37], tan ? C.sole : '#dadbdd');
  ball(parent, `Bota ${side}`, [x,0.18,z], [0.25,0.16,0.35], tan ? C.boot : C.white);
  ball(parent, `Cano ${side}`, [x,0.26,0], [0.215,0.21,0.24], tan ? C.boot : C.white);
  if (tan) {
    for (let i=0;i<3;i++) stroke(parent, `Cadarço ${side}-${i}`,
      [[x-0.12,0.24+i*0.045,0.29],[x,0.27+i*0.045,0.31],
        [x+0.12,0.24+i*0.045,0.29]],0.008,'#352720');
  }
}
function hairMatheus(head) {
  ball(head,'Cabelo curto por trás',[0,0.39,-0.12],[0.78,0.35,0.56],C.hair,18);
  for (let i=0;i<80;i++) {
    const phi = Math.PI*2*circle(i+2), t = Math.sqrt(circle(i*7+6));
    const x = Math.cos(phi)*0.74*t;
    const z = Math.sin(phi)*0.51*t - 0.01;
    const y = 0.45 + 0.15*(1-t) + 0.055*circle(i*19+2);
    ball(head,`Cacho curto ${i}`,[x,y,z],[0.085,0.10,0.09],
      i%6 ? C.hair : C.hairLight,9);
  }
  for (let i=0;i<11;i++) {
    const x=-0.62+i*0.124;
    ball(head,`Franja cacheada ${i}`,[x,0.32+0.035*(i%3),0.51],
      [0.10,0.115,0.10],i%5?C.hair:C.hairLight,9);
  }
}
function hairMary(root, head) {
  ball(head,'Topo do cabelo',[0,0.42,-0.09],[0.76,0.33,0.56],C.hair,18);
  for (let i=0;i<36;i++) {
    const x = -0.68 + 1.36*(i/35), z=-0.33-0.21*circle(i+30);
    stroke(root,`Cacho nas costas ${i}`,Array.from({length:9},(_,j)=>[
      x+0.055*Math.sin(j*1.55+i),2.39-j*0.185,
      z+0.07*Math.cos(j*1.55+i)]),0.075,i%5?C.hair:C.hairLight);
  }
  for (const s of [-1,1]) for (let i=0;i<13;i++) {
    const x=s*(0.64+0.07*(i%4));
    const z=0.39-(i%4)*0.19;
    stroke(root,`Cacho lateral ${s} ${i}`,Array.from({length:9},(_,j)=>[
      x+0.065*Math.sin(j*1.65+i*1.3),2.37-j*0.185,
      z+0.055*Math.cos(j*1.65+i)]),0.076,i%5?C.hair:C.hairLight);
  }
  for(let i=0;i<9;i++) {
    const x=-0.61+i*0.15;
    ball(head,`Franja Mary ${i}`,[x,0.35-(i%3)*0.03,0.48],
      [0.11,0.13,0.1],i%4?C.hair:C.hairLight,9);
  }
}
function headAndFace(root, isMary) {
  const skin=isMary?C.marySkin:C.matheusSkin;
  const head=group(root,'Cabeça — pivô de animação',[0,1.82,0]);
  ball(head,'Rosto inteiro',[0,0,0],[0.72,0.60,0.53],skin,24);
  for(const side of [-1,1]) {
    ball(head,`Orelha ${side}`,[side*0.714,-0.07,-0.04],[0.105,0.15,0.09],skin);
    if(!isMary) bead(head,`Brinco ${side}`,[side*0.794,-0.16,0.02],0.029,C.gold,0.5);
  }
  if (isMary) hairMary(root,head); else hairMatheus(head);
  for (const side of [-1,1]) {
    ball(head,`Olho ${side}`,[side*0.305,-0.06,0.502],
      [0.19,0.205,0.038],C.ink,16);
    stroke(head,`Sobrancelha reta ${side}`,[[side*0.48,0.24,0.476],
      [side*0.32,0.255,0.536],[side*0.17,0.24,0.55]],
      isMary?0.016:0.025,C.ink);
  }
  if(!isMary) {
    // Three shaved slits on the eyebrow at the viewer's left.
    for(let i=0;i<3;i++) stroke(head,`Risco sobrancelha ${i}`,
      [[-0.50+i*0.056,0.27,0.542],[-0.46+i*0.056,0.20,0.558]],
      0.014,skin);
    bead(head,'Piercing sobrancelha superior',[0.47,0.32,0.521],0.026,C.gold,0.65);
    bead(head,'Piercing sobrancelha inferior',[0.47,0.20,0.548],0.026,C.gold,0.65);
    stroke(head,'Piercing sobrancelha haste',[[0.47,0.32,0.521],
      [0.48,0.26,0.54],[0.47,0.20,0.548]],0.009,C.gold,0.65);
    bead(head,'Piercing do nariz',[0.11,-0.27,0.48],0.018,C.gold,0.6);
    // A single industrial bar passes through two actual opposite points of the rim.
    stroke(head,'Transversal por dentro da orelha',[[0.72,0.035,0.04],
      [0.75,-0.04,0.095],[0.79,-0.17,0.08]],0.012,C.gold,0.7);
    bead(head,'Transversal ponta alta',[0.715,0.045,0.04],0.026,C.gold,0.7);
    bead(head,'Transversal ponta baixa',[0.79,-0.18,0.08],0.026,C.gold,0.7);
  }
  glasses(head,-0.07,0.556,isMary?'mary':'matheus');
  return head;
}
function arm(root, side, isMary) {
  const skin=isMary?C.marySkin:C.matheusSkin;
  const x=side*(isMary?0.49:0.53);
  const y=1.22;
  const node=group(root,`Braço ${side} — pivô de animação`,[x,y,0]);
  const raised=!isMary && side===-1;
  if (!isMary) ball(node,'Manga larga',[side*0.11,-0.10,0],
    [0.25,0.25,0.28],C.matheusShirt);
  const wrist=raised?[side*0.21,0.24,0.48]:[side*0.14,-0.48,0.10];
  limb(node,'Braço', [side*0.11,-0.17,0.02],wrist,
    isMary?[0.17,0.16]:[0.16,0.16],skin);
  ball(node,'Mão',wrist,[0.165,0.16,0.15],skin);
  if(!isMary) {
    stroke(node,'Tatuagem no pulso',[
      [wrist[0]-0.10,wrist[1]+0.13,wrist[2]+0.11],
      [wrist[0],wrist[1]+0.16,wrist[2]+0.14],
      [wrist[0]+0.10,wrist[1]+0.13,wrist[2]+0.11]],0.012,C.ink);
  }
}
function build(name,isMary) {
  const root=group(new THREE.Scene(),name);
  root.userData = { mascotVersion: 'full-3d-v1', character: name };
  root.position.y=0;
  const skin=isMary?C.marySkin:C.matheusSkin;
  const shirt=isMary?C.maryShirt:C.matheusShirt;
  const denim=isMary?C.maryJeans:C.matheusJeans;
  // Torso and hips are volumetric from every angle, including the back.
  ball(root,'Corpo / blusa',[0,1.05,-0.04],
    isMary?[0.49,0.45,0.32]:[0.58,0.46,0.38],shirt,18);
  ball(root,'Quadril / jeans',[0,0.75,-0.06],
    isMary?[0.44,0.28,0.29]:[0.47,0.28,0.31],denim);
  for (const side of [-1,1]) {
    const x=side*(isMary?0.215:0.23);
    ball(root,`Perna ${side} — peça animável`,[x,0.47,0],
      isMary?[0.22,0.45,0.24]:[0.29,0.43,0.29],denim);
    boot(root,side,x,!isMary);
    arm(root,side,isMary);
  }
  headAndFace(root,isMary);
  if(isMary) {
    // Burgundy cross-body strap and small side bag.
    stroke(root,'Alça da bolsa',[[0.20,1.43,0.30],[0.35,1.20,0.37],
      [0.53,0.96,0.28],[0.65,0.82,0.17]],0.038,C.wine);
    ball(root,'Bolsa bordô',[0.61,0.74,0.21],[0.20,0.28,0.12],C.wine);
    stroke(root,'Colar prata',[[0.18,1.40,0.27],[0,1.32,0.34],
      [-0.18,1.40,0.27]],0.011,C.silver,0.3);
    bead(root,'Pingente coração',[0,1.33,0.37],0.035,'#d9a9c5');
  } else {
    // Headphones, chain and cross are separate movable accessories.
    for(const side of [-1,1])
      ball(root,`Fone ${side}`,[side*0.37,1.37,0.34],[0.18,0.18,0.12],C.ink);
    stroke(root,'Arco dos fones',[[0.37,1.40,0.36],[0,1.24,0.42],
      [-0.37,1.40,0.36]],0.038,C.hairLight);
    stroke(root,'Corrente prata',[[-0.20,1.39,0.38],[0,1.04,0.43],
      [0.20,1.39,0.38]],0.011,C.silver,0.3);
    stroke(root,'Cruz vertical',[[0,1.14,0.45],[0,0.96,0.46]],0.022,C.silver,0.35);
    stroke(root,'Cruz horizontal',[[-0.065,1.08,0.47],[0.065,1.08,0.47]],
      0.022,C.silver,0.35);
  }
  return root.parent;
}

const exporter = new GLTFExporter();
for(const [name,isMary] of [['Matheus',false],['Maryane',true]]) {
  const scene=build(name,isMary);
  const data=await exporter.parseAsync(scene,{binary:true,onlyVisible:true});
  const out=path.join(DIR,`${name}.glb`);
  await fs.writeFile(out,new Uint8Array(data));
  console.log(`${name}: ${Math.round(data.byteLength/1024)} KiB — ${out}`);
}
