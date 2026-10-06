// Immersive 3D flow-duct chamber inside a spacecraft lab module.
// Everything here is an ILLUSTRATIVE visualization driven by the qualitative
// model in labModel.js. It is not a combustion or CFD simulation.
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {derive, paramsAt, EVENTS, CAM_TRACK, END} from './labModel.js';

const ROOM = {x: 12, y: 4, z: 8.5};                 // half extents of the module
const DUCT_POS = new THREE.Vector3(0, -0.6, 0);         // sample surface (duct-local y = 0)
const DUCT = {x0: -4.2, x1: 4.2, y0: -1.0, y1: 2.0, z: 1.0};
const MM = 6.4 / 290;                                   // scene units per mm of sample
const WINDOW = {x: -4.6, y: 0.9, r: 1.6};

export const CAMS = {
  hero: {p: [2.9, 0.35, 3.3], t: [0, -0.12, 0]},
  wide: {p: [7.8, 1.9, 6.4], t: [-0.4, -0.3, -0.4]},
  flame: {p: [1.2, 0.05, 1.75], t: [0, -0.1, 0]},
  side: {p: [0.0, -0.1, 3.0], t: [0, -0.1, 0]},
  top: {p: [0.5, 2.6, 1.6], t: [0, -0.15, 0]},
  low: {p: [2.0, -1.5, 2.3], t: [0, 0.05, 0]},
  inlet: {p: [-4.4, 0.3, 2.4], t: [0, -0.15, 0]}
};

/* ------------------------------------------------------------------ GLSL */
const NOISE = /* glsl */`
float hash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float n3(vec3 x){vec3 i=floor(x);vec3 f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<3;i++){s+=a*n3(p);p=p*2.07+vec3(1.7,9.2,3.1);a*=.5;}return s/.875;}
`;
const FIELD = /* glsl */`
uniform vec3 uC; uniform float uR; uniform float uE; uniform float uLift; uniform float uInt; uniform float uDirX;
vec3 deflect(vec3 p){
  vec3 q=p-uC; float r=length(q); float R=uR*1.15+.12;
  float k=smoothstep(R*2.4,R*.5,r)*uInt;
  vec3 n=q/max(r,1e-3); n.x*=.3;
  p+=n*k*R*.6;
  float plume=exp(-(q.x*q.x+q.z*q.z)/(R*R*1.6))*smoothstep(-R,R*2.,q.y);
  p.y+=uLift*uInt*plume*.9;
  p.y=min(p.y,1.94);
  return p;
}
float heat(vec3 p){ vec3 q=p-uC; return uInt*exp(-abs(length(q)-uR*1.1)*3.5); }
`;
const SOFT_FRAG = /* glsl */`
varying vec3 vC; varying float vA;
void main(){ float d=length(gl_PointCoord-.5); float f=smoothstep(.5,0.,d); gl_FragColor=vec4(vC,f*f*vA); }`;

/* -------------------------------------------------------------- textures */
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const STENCILS = ['LAB-02 · RACK', 'O₂ PORT', 'DO NOT BLOCK', 'FIRE PORT', 'EXT-03', 'CMS · 28V', 'PWR BUS B', 'VENT', 'SMOKE DET', 'ARS · 4', 'PFE ▸'];

function panelCanvases(seed, {base = '#0c111a', lit = '#131b27', leds = .55, text = .6} = {}) {
  const S = 1024, r = rng(seed);
  const c = document.createElement('canvas'), e = document.createElement('canvas');
  c.width = c.height = e.width = e.height = S;
  const g = c.getContext('2d'), ge = e.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, S, S); ge.fillStyle = '#000'; ge.fillRect(0, 0, S, S);
  const cells = [];
  for (const [x, y] of [[0, 0], [512, 0], [0, 512], [512, 512]]) {
    if (r() < .5) cells.push([x, y, 512, 256], [x, y + 256, 512, 256]);
    else if (r() < .5) cells.push([x, y, 256, 512], [x + 256, y, 256, 512]);
    else cells.push([x, y, 512, 512]);
  }
  for (const [x, y, w, h] of cells) {
    const gr = g.createLinearGradient(x, y, x, y + h);
    gr.addColorStop(0, lit); gr.addColorStop(1, base);
    g.fillStyle = gr; g.fillRect(x + 7, y + 7, w - 14, h - 14);
    g.strokeStyle = '#04070b'; g.lineWidth = 10; g.strokeRect(x + 3, y + 3, w - 6, h - 6);
    g.strokeStyle = 'rgba(190,210,240,.05)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 10, y + h - 10); g.lineTo(x + 10, y + 10); g.lineTo(x + w - 10, y + 10); g.stroke();
    g.fillStyle = '#1b2533';
    for (const [px, py] of [[x + 22, y + 22], [x + w - 22, y + 22], [x + 22, y + h - 22], [x + w - 22, y + h - 22]]) { g.beginPath(); g.arc(px, py, 5, 0, 7); g.fill(); }
    const k = r();
    if (k < .28) { // vent slots
      const n = 6 + Math.floor(r() * 6), vw = w * .55, vx = x + (w - vw) / 2, vy = y + h * .3;
      g.fillStyle = '#05080c';
      for (let i = 0; i < n; i++) g.fillRect(vx, vy + i * 15, vw, 7);
    } else if (k < .4) { // hazard stripe
      g.save(); g.beginPath(); g.rect(x + 30, y + h - 60, w - 60, 26); g.clip();
      for (let i = -40; i < w; i += 28) { g.fillStyle = i / 28 % 2 ? 'rgba(220,160,70,.22)' : 'rgba(10,10,10,.4)'; g.beginPath(); g.moveTo(x + 30 + i, y + h - 34); g.lineTo(x + 44 + i, y + h - 60); g.lineTo(x + 58 + i, y + h - 60); g.lineTo(x + 44 + i, y + h - 34); g.fill(); }
      g.restore();
    } else if (k < .55) { // instrument face
      g.fillStyle = '#070b11'; g.fillRect(x + w * .2, y + h * .25, w * .6, h * .35);
      g.strokeStyle = 'rgba(120,170,220,.12)'; g.lineWidth = 2; g.strokeRect(x + w * .2, y + h * .25, w * .6, h * .35);
      ge.fillStyle = 'rgba(40,140,190,.55)';
      for (let i = 0; i < 4; i++) ge.fillRect(x + w * .24, y + h * .3 + i * 14, w * .5 * (.3 + r() * .7), 4);
    }
    if (r() < text) {
      g.font = '600 20px "JetBrains Mono", ui-monospace, monospace'; g.fillStyle = 'rgba(150,175,210,.2)';
      g.fillText(STENCILS[Math.floor(r() * STENCILS.length)], x + 34, y + 56);
    }
    if (r() < leds) {
      const cols = ['#3fd6ff', '#ffab5a', '#62f0a2', '#3fd6ff'];
      const n = 1 + Math.floor(r() * 4);
      for (let i = 0; i < n; i++) { ge.fillStyle = cols[Math.floor(r() * cols.length)]; ge.fillRect(x + w - 70 - i * 22, y + 44, 12, 6); }
    }
  }
  return [c, e];
}
function tex(canvas, rx = 1, ry = 1, srgb = true) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function floorCanvases() {
  const S = 1024, c = document.createElement('canvas'), e = document.createElement('canvas');
  c.width = c.height = e.width = e.height = S;
  const g = c.getContext('2d'), ge = e.getContext('2d'), r = rng(7);
  g.fillStyle = '#0a0e15'; g.fillRect(0, 0, S, S); ge.fillStyle = '#000'; ge.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y += 256) for (let x = 0; x < S; x += 256) {
    const l = 13 + Math.floor(r() * 5);
    g.fillStyle = `rgb(${l - 3},${l + 1},${l + 7})`; g.fillRect(x + 4, y + 4, 248, 248);
    g.fillStyle = 'rgba(255,255,255,.025)';
    for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) if ((i + j) % 2 === 0) g.fillRect(x + 18 + i * 26, y + 18 + j * 26, 10, 4);
  }
  g.strokeStyle = '#04070b'; g.lineWidth = 6;
  for (let i = 0; i <= S; i += 256) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, S); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(S, i); g.stroke(); }
  ge.strokeStyle = 'rgba(40,150,200,.35)'; ge.lineWidth = 2;
  ge.beginPath(); ge.moveTo(0, 1); ge.lineTo(S, 1); ge.moveTo(1, 0); ge.lineTo(1, S); ge.stroke();
  return [c, e];
}

/* ------------------------------------------------------------- builder */
export function createLab(host, initial) {
  const state = {params: {...initial.params}, mode: initial.mode, reduced: initial.reduced, onFrame: null};
  const owned = [];
  const own = (...xs) => { owned.push(...xs); return xs[0]; };

  const renderer = new THREE.WebGLRenderer({antialias: false, powerPreference: 'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x05070b, 1);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020306, 0.075);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.1;

  const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 500);
  camera.position.set(...CAMS.hero.p);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(...CAMS.hero.t);
  controls.enableDamping = true; controls.dampingFactor = .06;
  controls.minDistance = 1.4; controls.maxDistance = 12;
  controls.rotateSpeed = .55; controls.zoomSpeed = .7; controls.panSpeed = .6;
  controls.autoRotateSpeed = .32;

  const pix = {value: renderer.getPixelRatio()};
  const time = {value: 0};

  /* ----- lights ----- */
  scene.add(new THREE.HemisphereLight(0x8fb4ff, 0x080a0e, .1));
  const sun = new THREE.DirectionalLight(0xbcd2ff, .08); sun.position.set(2, 6, 3); scene.add(sun);
  const spot = new THREE.SpotLight(0xd6e6ff, 6, 16, .5, .9, 1.3);
  spot.position.set(0.3, 3.45, 0.4); spot.target.position.copy(DUCT_POS); scene.add(spot, spot.target);
  for (const [x, y, z, c, i] of [[-10, 2.4, -6.5, 0x2f7dff, 12], [10, 1.8, 6.5, 0x3aa6ff, 9], [-10, -2.6, 6.5, 0x1f5bd6, 7], [10, -2.8, -6.5, 0x2a60c8, 7], [0, 3.2, -6, 0x4f86ff, 6]]) {
    const l = new THREE.PointLight(c, i * .18, 0, 1.6); l.position.set(x, y, z); scene.add(l);
  }
  const fireLight = new THREE.PointLight(0xff8a3d, 0, 0, 1.55); scene.add(fireLight);
  const igniteLight = new THREE.PointLight(0xffc27a, 0, 0, 2); scene.add(igniteLight);

  /* ----- materials ----- */
  const [wc, we] = panelCanvases(11);
  const wallMat = own(new THREE.MeshStandardMaterial({map: tex(wc, 6, 2), emissiveMap: tex(we, 6, 2), emissive: 0xffffff, emissiveIntensity: .25, roughness: .62, metalness: .5}));
  const [rc, re] = panelCanvases(29, {base: '#0e141e', lit: '#18212e', leds: .85, text: .9});
  const rackMat = own(new THREE.MeshStandardMaterial({map: tex(rc), emissiveMap: tex(re), emissive: 0xffffff, emissiveIntensity: .35, roughness: .5, metalness: .55}));
  const [cc, ce] = panelCanvases(53, {base: '#0a0e15', lit: '#10161f', leds: .2, text: .25});
  const ceilMat = own(new THREE.MeshStandardMaterial({map: tex(cc, 6, 4.25), emissiveMap: tex(ce, 6, 4.25), emissive: 0xffffff, emissiveIntensity: .2, roughness: .7, metalness: .4}));
  const [fc, fe] = floorCanvases();
  const floorMat = own(new THREE.MeshStandardMaterial({map: tex(fc, 6, 4.25), emissiveMap: tex(fe, 6, 4.25), emissive: 0xffffff, emissiveIntensity: .15, roughness: .32, metalness: .78}));
  const metal = own(new THREE.MeshStandardMaterial({color: 0x2a3340, roughness: .32, metalness: .92}));
  const metalLight = own(new THREE.MeshStandardMaterial({color: 0x8792a2, roughness: .28, metalness: .95}));
  const darkMetal = own(new THREE.MeshStandardMaterial({color: 0x10151c, roughness: .45, metalness: .85}));
  const cyanGlow = own(new THREE.MeshBasicMaterial({color: new THREE.Color(.03, .12, .18), toneMapped: true}));
  const stripGlow = own(new THREE.MeshBasicMaterial({color: new THREE.Color(.05, .06, .08)}));
  const amberGlow = own(new THREE.MeshBasicMaterial({color: new THREE.Color(.5, .25, .08)}));

  const roomG = new THREE.Group(), spaceG = new THREE.Group(); scene.add(roomG, spaceG);
  const add = (geo, mat, x = 0, y = 0, z = 0, parent = roomG) => { const m = new THREE.Mesh(own(geo), mat); m.position.set(x, y, z); parent.add(m); return m; };

  /* ----- room shell ----- */
  const floor = add(new THREE.PlaneGeometry(ROOM.x * 2, ROOM.z * 2), floorMat, 0, -ROOM.y, 0); floor.rotation.x = -Math.PI / 2;
  const ceil = add(new THREE.PlaneGeometry(ROOM.x * 2, ROOM.z * 2), ceilMat, 0, ROOM.y, 0); ceil.rotation.x = Math.PI / 2;
  { // back wall with a window cut-out
    const s = new THREE.Shape(); s.moveTo(-ROOM.x, -ROOM.y); s.lineTo(ROOM.x, -ROOM.y); s.lineTo(ROOM.x, ROOM.y); s.lineTo(-ROOM.x, ROOM.y); s.lineTo(-ROOM.x, -ROOM.y);
    const h = new THREE.Path(); h.absarc(WINDOW.x, WINDOW.y, WINDOW.r, 0, Math.PI * 2, true); s.holes.push(h);
    const backMat = own(wallMat.clone()); backMat.map = tex(wc, .25, .25); backMat.emissiveMap = tex(we, .25, .25); backMat.map.offset.set(.5, .5); backMat.emissiveMap.offset.set(.5, .5);
    add(new THREE.ShapeGeometry(s, 96), backMat, 0, 0, -ROOM.z);
  }
  const frontWall = add(new THREE.PlaneGeometry(ROOM.x * 2, ROOM.y * 2), wallMat, 0, 0, ROOM.z); frontWall.rotation.y = Math.PI;
  const endMat = own(wallMat.clone()); endMat.map = tex(wc, 4.25, 2); endMat.emissiveMap = tex(we, 4.25, 2);
  const left = add(new THREE.PlaneGeometry(ROOM.z * 2, ROOM.y * 2), endMat, -ROOM.x, 0, 0); left.rotation.y = Math.PI / 2;
  const right = add(new THREE.PlaneGeometry(ROOM.z * 2, ROOM.y * 2), endMat, ROOM.x, 0, 0); right.rotation.y = -Math.PI / 2;

  // ceiling light strips + corner coves
  for (const z of [-4.8, -1.6, 1.6, 4.8]) add(new THREE.BoxGeometry(ROOM.x * 2 - 4, .05, .22), stripGlow, 0, ROOM.y - .03, z);
  for (const s of [-1, 1]) {
    add(new THREE.BoxGeometry(ROOM.x * 2 - .6, .035, .035), cyanGlow, 0, -ROOM.y + 2.62, s * (ROOM.z - .56));
    add(new THREE.BoxGeometry(ROOM.x * 2 - .4, .025, .025), cyanGlow, 0, -ROOM.y + .02, s * (ROOM.z - .02));
    add(new THREE.BoxGeometry(ROOM.x * 2 - .4, .3, .3), metal, 0, ROOM.y - .15, s * (ROOM.z - .15));
    // handrail
    const rail = add(new THREE.CylinderGeometry(.032, .032, ROOM.x * 2 - 1.5, 12), metalLight, 0, .32, s * (ROOM.z - .62)); rail.rotation.z = Math.PI / 2;
    for (let x = -10.5; x <= 10.5; x += 3) { const st = add(new THREE.CylinderGeometry(.018, .018, .22, 8), metal, x, .32, s * (ROOM.z - .51)); st.rotation.x = Math.PI / 2; }
  }
  for (const s of [-1, 1]) add(new THREE.BoxGeometry(.025, .025, ROOM.z * 2 - .1), cyanGlow, s * (ROOM.x - .02), -ROOM.y + .02, 0);

  // racks along the long walls
  const rackGeoLow = own(new THREE.BoxGeometry(2.05, 2.5, .5)), rackGeoHigh = own(new THREE.BoxGeometry(2.05, 2.2, .34));
  for (const s of [-1, 1]) for (let i = 0; i < 11; i++) {
    const x = -11 + i * 2.2;
    const lo = new THREE.Mesh(rackGeoLow, rackMat); lo.position.set(x, -ROOM.y + 1.27, s * (ROOM.z - .25)); if (s > 0) lo.rotation.y = Math.PI; roomG.add(lo);
    const inWindow = s < 0 && Math.abs(x - WINDOW.x) < 2.4;
    if (!inWindow) { const hi = new THREE.Mesh(rackGeoHigh, rackMat); hi.position.set(x, ROOM.y - 1.55, s * (ROOM.z - .17)); if (s > 0) hi.rotation.y = Math.PI; roomG.add(hi); }
  }
  // end-wall racks (left) and hatch (right)
  for (let i = 0; i < 6; i++) { const r = new THREE.Mesh(rackGeoLow, rackMat); r.position.set(-ROOM.x + .25, -ROOM.y + 1.27, -6.6 + i * 2.65); r.rotation.y = Math.PI / 2; roomG.add(r); }
  {
    const hatch = new THREE.Group(); hatch.position.set(ROOM.x - .06, -.9, 0); hatch.rotation.y = -Math.PI / 2; roomG.add(hatch);
    add(new THREE.TorusGeometry(1.45, .14, 24, 96), metalLight, 0, 0, 0, hatch);
    add(new THREE.CircleGeometry(1.36, 64), darkMetal, 0, 0, -.02, hatch);
    add(new THREE.TorusGeometry(1.2, .02, 8, 96), cyanGlow, 0, 0, .02, hatch);
    const bar = add(new THREE.BoxGeometry(1.2, .1, .1), metalLight, 0, 0, .08, hatch); bar.rotation.z = .4;
    add(new THREE.CylinderGeometry(.18, .18, .12, 32), metalLight, 0, 0, .08, hatch).rotation.x = Math.PI / 2;
  }
  // window frame
  {
    const w = new THREE.Group(); w.position.set(WINDOW.x, WINDOW.y, -ROOM.z); roomG.add(w);
    add(new THREE.TorusGeometry(WINDOW.r + .02, .11, 24, 128), metalLight, 0, 0, .04, w);
    add(new THREE.TorusGeometry(WINDOW.r + .26, .03, 12, 128), metal, 0, 0, .02, w);
    const tube = add(new THREE.CylinderGeometry(WINDOW.r, WINDOW.r, .7, 96, 1, true), own(new THREE.MeshStandardMaterial({color: 0x1a222e, roughness: .4, metalness: .85, side: THREE.BackSide})), 0, 0, -.35, w); tube.rotation.x = Math.PI / 2;
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; add(new THREE.SphereGeometry(.035, 10, 8), metalLight, Math.cos(a) * (WINDOW.r + .14), Math.sin(a) * (WINDOW.r + .14), .12, w); }
    const glass = add(new THREE.CircleGeometry(WINDOW.r, 64), own(new THREE.MeshPhysicalMaterial({color: 0x9fc4ff, roughness: .04, metalness: 0, transparent: true, opacity: .08, depthWrite: false})), 0, 0, -.5, w);
    glass.renderOrder = 2;
  }

  /* ----- space beyond the window ----- */
  {
    const n = 3500, g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), r = new Float32Array(n);
    for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u), R = 180; p[i * 3] = R * s * Math.cos(th); p[i * 3 + 1] = R * u; p[i * 3 + 2] = R * s * Math.sin(th); r[i] = Math.random(); }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aR', new THREE.BufferAttribute(r, 1));
    const m = new THREE.ShaderMaterial({uniforms: {uTime: time, uPix: pix}, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute float aR; uniform float uTime; uniform float uPix; varying vec3 vC; varying float vA;
        void main(){ gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); float b=pow(fract(aR*7.31),3.);
          vA=.45*(.35+.65*b)*(.7+.3*sin(uTime*(.5+aR)+aR*50.)); vC=mix(vec3(.75,.84,1.),vec3(1.,.92,.82),fract(aR*13.7)); gl_PointSize=uPix*(1.+2.6*b); }`,
      fragmentShader: SOFT_FRAG});
    own(g, m); spaceG.add(new THREE.Points(g, m));
    const earthMat = own(new THREE.ShaderMaterial({uniforms: {uTime: time, uSun: {value: new THREE.Vector3(-.55, .55, .62).normalize()}},
      vertexShader: `varying vec3 vN; varying vec3 vW; varying vec3 vO; void main(){ vN=normalize(mat3(modelMatrix)*normal); vO=normal; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
      fragmentShader: `${NOISE} uniform vec3 uSun; uniform float uTime; varying vec3 vN; varying vec3 vW; varying vec3 vO;
        void main(){ vec3 N=normalize(vN); vec3 V=normalize(cameraPosition-vW);
          float land=smoothstep(.53,.57,fbm(vO*2.6+3.));
          vec3 ocean=mix(vec3(.01,.05,.16),vec3(.03,.17,.38),fbm(vO*6.));
          vec3 ground=mix(vec3(.10,.15,.07),vec3(.36,.30,.18),fbm(vO*9.));
          vec3 col=mix(ocean,ground,land);
          float cl=smoothstep(.5,.78,fbm(vO*5.+vec3(uTime*.004,0.,0.)));
          col=mix(col,vec3(.92,.95,1.),cl*.85);
          float day=smoothstep(-.15,.45,dot(N,uSun));
          float fres=pow(1.-max(dot(N,V),0.),3.2);
          vec3 c=col*day*1.15+vec3(.25,.5,1.)*fres*(.25+1.4*day)+vec3(1.,.55,.25)*fres*smoothstep(.3,-.05,dot(N,uSun))*smoothstep(-.4,0.,dot(N,uSun))*.6;
          gl_FragColor=vec4(c*.3,1.); }`}));
    const earth = add(new THREE.SphereGeometry(30, 96, 64), earthMat, -40, -33, -62, spaceG);
    earth.rotation.set(.3, .8, 0);
  }

  /* ----- duct + test section ----- */
  const duct = new THREE.Group(); duct.position.copy(DUCT_POS); scene.add(duct);
  const L = DUCT.x1 - DUCT.x0, H = DUCT.y1 - DUCT.y0, Z = DUCT.z * 2, cy = (DUCT.y0 + DUCT.y1) / 2;
  // base cabinet
  add(new THREE.BoxGeometry(10, ROOM.y + DUCT_POS.y + DUCT.y0 - .1, 2.9), rackMat, 0, -ROOM.y + (ROOM.y + DUCT_POS.y + DUCT.y0 - .1) / 2, 0);
  add(new THREE.BoxGeometry(10.3, .1, 3.1), metal, 0, DUCT_POS.y + DUCT.y0 - .1, 0);
  add(new THREE.BoxGeometry(9.6, .03, .03), cyanGlow, 0, DUCT_POS.y + DUCT.y0 - .4, 1.46);
  // glass walls
  const glassMat = own(new THREE.MeshPhysicalMaterial({color: 0xa8ccff, roughness: .05, metalness: .1, transparent: true, opacity: .02, depthWrite: false, side: THREE.DoubleSide, envMapIntensity: .25}));
  for (const s of [-1, 1]) add(new THREE.PlaneGeometry(L, H), glassMat, 0, cy, s * DUCT.z, duct).renderOrder = 3;
  const glassTop = add(new THREE.PlaneGeometry(L, Z), glassMat, 0, DUCT.y1, 0, duct); glassTop.rotation.x = Math.PI / 2; glassTop.renderOrder = 3;
  add(new THREE.BoxGeometry(L, .05, Z), darkMetal, 0, DUCT.y0, 0, duct);
  // frame bars
  const bar = (w, h, d, x, y, z) => add(new THREE.BoxGeometry(w, h, d), metal, x, y, z, duct);
  for (const sy of [DUCT.y0, DUCT.y1]) for (const sz of [-DUCT.z, DUCT.z]) bar(L + .12, .07, .07, 0, sy, sz);
  for (const x of [DUCT.x0, -2.6, 2.6, DUCT.x1]) for (const sz of [-DUCT.z, DUCT.z]) bar(.07, H, .07, x, cy, sz);
  for (const x of [DUCT.x0, -2.6, 2.6, DUCT.x1]) bar(.07, .07, Z, x, DUCT.y1, 0);
  { const edges = own(new THREE.EdgesGeometry(new THREE.BoxGeometry(L + .02, H + .02, Z + .02))); const lm = own(new THREE.LineBasicMaterial({color: 0x5fd6f0, transparent: true, opacity: .12})); const ls = new THREE.LineSegments(edges, lm); ls.position.set(0, cy, 0); duct.add(ls); }
  // ruler ticks on the front bottom bar
  for (let i = 0; i <= 64; i++) { const big = i % 8 === 0; add(new THREE.BoxGeometry(.008, big ? .09 : .045, .01), own(new THREE.MeshBasicMaterial({color: new THREE.Color(.6, .8, 1).multiplyScalar(big ? 1.2 : .7)})), -3.2 + i * .1, DUCT.y0 + .08, DUCT.z + .045, duct); }
  // inlet fan
  const fan = new THREE.Group(); fan.position.set(DUCT.x0 - .25, cy, 0); duct.add(fan);
  { const shroud = add(new THREE.CylinderGeometry(1.05, 1.05, .5, 64, 1, true), own(new THREE.MeshStandardMaterial({color: 0x222b37, roughness: .35, metalness: .9, side: THREE.DoubleSide})), 0, 0, 0, fan); shroud.rotation.z = Math.PI / 2;
    add(new THREE.BoxGeometry(.5, H + .3, Z + .3), own(new THREE.MeshStandardMaterial({color: 0x161c25, roughness: .5, metalness: .8, transparent: true, opacity: 0})), 0, 0, 0, fan);
    const ring = add(new THREE.TorusGeometry(1.06, .05, 12, 96), metalLight, .25, 0, 0, fan); ring.rotation.y = Math.PI / 2;
    const ring2 = add(new THREE.TorusGeometry(1.06, .015, 8, 96), cyanGlow, .3, 0, 0, fan); ring2.rotation.y = Math.PI / 2; }
  const rotor = new THREE.Group(); fan.add(rotor);
  add(new THREE.CylinderGeometry(.2, .2, .3, 32), metalLight, 0, 0, 0, rotor).rotation.z = Math.PI / 2;
  for (let i = 0; i < 7; i++) { const b = add(new THREE.BoxGeometry(.04, .8, .26), metalLight, 0, 0, 0, rotor); b.geometry.translate(0, .45, 0); b.rotation.x = i / 7 * Math.PI * 2; b.rotation.y = .5; }
  // honeycomb flow straighteners
  const hexMat = own(new THREE.ShaderMaterial({transparent: true, side: THREE.DoubleSide, depthWrite: false, uniforms: {uGlow: {value: 0}},
    vertexShader: `varying vec2 vU; void main(){ vU=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform float uGlow; varying vec2 vU;
      float hx(vec2 p){ p.x*=1.1547; p.y+=mod(floor(p.x),2.)*.5; p=abs(fract(p)-.5); return abs(max(p.x*1.5+p.y,p.y*2.)-1.); }
      void main(){ float h=hx(vU*vec2(18.,12.)); float line=1.-smoothstep(.0,.12,h); vec3 c=mix(vec3(.04,.05,.07),vec3(.2,.4,.55)*(.3+.5*uGlow),line);
        gl_FragColor=vec4(c,.03+line*.14); }`}));
  for (const x of [DUCT.x0 + .05, DUCT.x1 - .05]) { const h = add(new THREE.PlaneGeometry(Z, H), hexMat, x, cy, 0, duct); h.rotation.y = Math.PI / 2; h.renderOrder = 2; }
  // exhaust
  { const ex = add(new THREE.CylinderGeometry(.9, .9, .45, 64, 1, true), own(new THREE.MeshStandardMaterial({color: 0x46515f, roughness: .3, metalness: .9, side: THREE.DoubleSide})), DUCT.x1 + .25, cy, 0, duct); ex.rotation.z = Math.PI / 2;
    const er = add(new THREE.TorusGeometry(.9, .045, 12, 96), metalLight, DUCT.x1 + .48, cy, 0, duct); er.rotation.y = Math.PI / 2;
    const eg = add(new THREE.TorusGeometry(.9, .012, 8, 96), cyanGlow, DUCT.x1 + .52, cy, 0, duct); eg.rotation.y = Math.PI / 2; }
  // sensor pod on top
  add(new THREE.BoxGeometry(.6, .22, .4), metal, 2.4, DUCT.y1 + .12, -.3, duct);
  const sensorLed = add(new THREE.BoxGeometry(.08, .03, .02), cyanGlow, 2.4, DUCT.y1 + .14, -.09, duct);
  add(new THREE.BoxGeometry(.5, .2, .35), metal, -2.2, DUCT.y1 + .11, .35, duct);
  add(new THREE.BoxGeometry(.06, .03, .02), amberGlow, -2.1, DUCT.y1 + .13, .53, duct);

  // fuel source on a support needle (size follows length × width × thickness)
  const FLAME_C = new THREE.Vector3(0, .45, 0);
  const sampleG = new THREE.Group(); sampleG.position.copy(FLAME_C); duct.add(sampleG);
  const fuelMat = own(new THREE.MeshStandardMaterial({color: 0x15110e, roughness: .95, metalness: .05, emissive: 0x000000}));
  const fuel = add(new THREE.SphereGeometry(1, 48, 32), fuelMat, 0, 0, 0, sampleG);
  const needle = add(new THREE.CylinderGeometry(.018, .018, 1.6, 12), metalLight, 0, -.8, 0, sampleG);
  add(new THREE.CylinderGeometry(.08, .1, .12, 24), metal, 0, -1.43, 0, sampleG);
  const coilMat = own(new THREE.MeshBasicMaterial({color: new THREE.Color(.25, .15, .1)}));
  const coil = new THREE.Group(); sampleG.add(coil);
  { const pts = []; for (let i = 0; i <= 90; i++) { const a = i / 90 * Math.PI * 10; pts.push(new THREE.Vector3(Math.cos(a) * .025, Math.sin(a) * .025, -.18 + i / 90 * .36)); }
    add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 300, .006, 6), coilMat, 0, 0, 0, coil);
    const arm = add(new THREE.CylinderGeometry(.012, .012, 1.4, 8), metal, 0, -.7, -.18, coil); arm.rotation.x = .0; }
  const geo = {fuelR: -1, dir: 0};
  const layoutSample = p => {
    const fr = .1 + .1 * Math.cbrt(p.length * p.width / (290 * 50)) * (.7 + .3 * Math.min(2, p.thickness / .3) ** .3), dir = p.direction === 'Opposed' ? -1 : 1;
    if (fr === geo.fuelR && dir === geo.dir) return;
    Object.assign(geo, {fuelR: fr, dir});
    fuel.scale.setScalar(fr); needle.position.y = -fr - .8;
    coil.position.set(-dir * (fr + .12), -.02, 0);
  };
  // suppression nozzle
  const nozzleG = new THREE.Group(); nozzleG.position.set(DUCT.x0 + .45, DUCT.y1 - .02, 0); duct.add(nozzleG);
  add(new THREE.CylinderGeometry(.09, .06, .22, 24), metalLight, 0, -.08, 0, nozzleG);
  add(new THREE.CylinderGeometry(.04, .04, .5, 12), metal, 0, .25, 0, nozzleG);
  const nozzleLed = add(new THREE.BoxGeometry(.06, .03, .02), own(new THREE.MeshBasicMaterial({color: new THREE.Color(.2, .25, .3)})), .12, .05, .1, nozzleG);

  /* ----- shared flame-field uniforms ----- */
  const F = {uC: {value: FLAME_C.clone()}, uR: {value: .2}, uE: {value: 0}, uLift: {value: 0}, uInt: {value: 0}, uDirX: {value: 1}};

  const flameG = new THREE.Group(), airflowG = new THREE.Group(), sootG = new THREE.Group(), sprayG = new THREE.Group();
  duct.add(flameG, airflowG, sootG, sprayG);
  /* ----- raymarched spherical flame (thin blue reaction shell + inner soot cap) ----- */
  const flameUniforms = {...F, uTime: time, uSoot: {value: .8}, uFlick: {value: 0}, uOpen: {value: 0}, uGain: {value: 1}, uCam: {value: new THREE.Vector3()}};
  const flameMat = own(new THREE.ShaderMaterial({
    uniforms: flameUniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    vertexShader: `varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `${NOISE}
      uniform vec3 uC,uCam; uniform float uR,uE,uLift,uInt,uDirX,uTime,uSoot,uFlick,uOpen,uGain; varying vec3 vP;
      float pow2(float x){ return x*x; }
      vec3 bb(float t){ return mix(mix(vec3(.55,.05,.0),vec3(1.,.32,.04),smoothstep(0.,.5,t)),vec3(1.,.62,.22),smoothstep(.5,1.,t)); }
      // radius of the flame surface in direction d (unit), from the centre
      float shapeR(vec3 d,float n){
        float fwd=dot(d,vec3(uDirX,0.,0.));
        float R=uR*(1.+uE*.9*smoothstep(-.3,1.,fwd)*(.4+.6*max(fwd,0.)))*(1.-.22*uE*max(-fwd,0.));
        R*=1.+uLift*1.15*smoothstep(-.2,1.,d.y)*(.3+.7*max(d.y,0.));
        R*=1.+(n-.5)*(.05+.35*uFlick*max(d.y,0.)+.12*uE*max(fwd,0.));
        return R;
      }
      void main(){
        if(uInt<.002) discard;
        vec3 ro=uCam; vec3 rd=normalize(vP-uCam);
        float Rb=uR*(2.4+1.6*uLift+uE)+.05;
        vec3 oc=ro-uC; float b=dot(oc,rd); float c=dot(oc,oc)-Rb*Rb; float h=b*b-c;
        if(h<=0.) discard;
        h=sqrt(h); float t0=max(-b-h,0.), t1=-b+h;
        if(t1<=t0) discard;
        const int N=90; float dt=(t1-t0)/float(N);
        float t=t0+dt*hash(vec3(gl_FragCoord.xy,fract(uTime*7.)*91.));
        vec3 acc=vec3(0.);
        for(int i=0;i<N;i++){
          vec3 q=ro+rd*t-uC;
          float r=length(q);
          if(r>1e-4){
            vec3 d=q/r;
            float n=fbm(d*2.2+vec3(0.,-uTime*(.15+1.6*uFlick),uTime*.07));
            float R=shapeR(d,n);
            float th=R*(.028+.05*uFlick)+.004;
            float s=(r-R)/th;
            float shell=exp(-s*s);
            float inner=exp(-pow2((r-R*.94)/(th*.6)));
            // extinction opens the shell from the top, leaving a blue crescent below
            float open=1.-smoothstep(1.-2.3*uOpen,1.25-2.3*uOpen,d.y+(n-.5)*.25);
            // soot cap: inside the shell, toward the downstream / buoyant side
            vec3 capDir=normalize(vec3(uDirX*uE*.6,.8+uLift*1.4,0.));
            float cap=smoothstep(.05,.9,dot(d,capDir));
            float ns=fbm(q*2.6/uR+vec3(0.,-uTime*(.3+1.8*uFlick),uTime*.05));
            float sz=exp(-pow2((r-R*.8)/(R*.12)))*cap*(.45+1.1*smoothstep(.4,.75,ns));
            float soot=sz*uSoot;
            float temp=clamp(.62+.5*(r/R)+(ns-.5)*.5,0.,1.);
            vec3 e=vec3(.18,.28,1.)*shell*1.6+vec3(.5,.48,1.)*inner*.5;
            e*=open*(1.-.22*min(uSoot,1.)*cap);
            e+=bb(temp)*soot*2.3*mix(1.,open,.7);
            acc+=e;
          }
          t+=dt;
        }
        acc*=uInt*dt*uGain*1.7/uR;
        acc=max(acc,vec3(0.));
        float mx=max(max(acc.r,acc.g),acc.b); gl_FragColor=vec4(acc*(1.15/(1.+mx)),1.);
      }`
  }));
  {
    const g = own(new THREE.BoxGeometry(4.2, 3.0, 2.0)); g.translate(0, .48, 0);
    const m = new THREE.Mesh(g, flameMat); m.renderOrder = 5; m.frustumCulled = false; flameG.add(m);
  }
  // soft glow sprites around the flame
  const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.2, 'rgba(255,255,255,.45)'); gr.addColorStop(.5, 'rgba(255,255,255,.1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return own(new THREE.CanvasTexture(c)); })();
  const glowA = new THREE.Sprite(own(new THREE.SpriteMaterial({map: glowTex, color: 0xff8a3a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false})));
  const glowB = new THREE.Sprite(own(new THREE.SpriteMaterial({map: glowTex, color: 0x4f7dff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false})));
  const igniteGlow = new THREE.Sprite(own(new THREE.SpriteMaterial({map: glowTex, color: 0xffc27a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false})));
  flameG.add(glowA, glowB); duct.add(igniteGlow);

  /* ----- airflow: tracer particles ----- */
  const phase = {value: 0};
  const flowCommon = {...F, uTime: time, uPix: pix, uPhase: phase, uVis: {value: 1}};
  {
    const n = 3400, g = new THREE.BufferGeometry(), s = new Float32Array(n * 4), p = new Float32Array(n * 3);
    for (let i = 0; i < n * 4; i++) s[i] = Math.random();
    g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aS', new THREE.BufferAttribute(s, 4));
    const m = own(new THREE.ShaderMaterial({uniforms: flowCommon, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `${FIELD} attribute vec4 aS; uniform float uTime,uPix,uPhase,uVis; varying vec3 vC; varying float vA;
        void main(){ float Lx=8.3;
          vec3 p=vec3(mod(aS.x*Lx+uPhase*(.75+.5*aS.w),Lx)-Lx*.5, mix(-.94,1.92,aS.y), mix(-.94,.94,aS.z));
          p.y+=.03*sin(uTime*.7+aS.w*40.); p.z+=.03*cos(uTime*.6+aS.x*30.);
          p=deflect(p);
          float h=clamp(heat(p)*1.4,0.,1.);
          vC=mix(vec3(.5,.78,1.),vec3(1.,.62,.28),h);
          float edge=smoothstep(4.15,3.7,abs(p.x));
          vA=edge*(.04+.16*aS.w)*(.25+.75*uVis)*(1.-.4*h);
          vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv;
          gl_PointSize=min(uPix*(1.+aS.w*1.4)*(4.5/max(-mv.z,.4)),uPix*5.); }`,
      fragmentShader: SOFT_FRAG}));
    const pts = new THREE.Points(g, m); pts.frustumCulled = false; own(g); airflowG.add(pts);
  }
  /* ----- airflow: streamline mesh ----- */
  {
    const ny = 7, nz = 5, seg = 140, pos = [], al = [];
    for (let iy = 0; iy < ny; iy++) for (let iz = 0; iz < nz; iz++) {
      const y = -.8 + iy / (ny - 1) * 2.6, z = -.8 + iz / (nz - 1) * 1.6, r = Math.random();
      for (let i = 0; i < seg; i++) {
        const xa = DUCT.x0 + .1 + i / seg * (L - .2), xb = DUCT.x0 + .1 + (i + 1) / seg * (L - .2);
        pos.push(xa, y, z, xb, y, z); al.push(r, r);
      }
    }
    const g = own(new THREE.BufferGeometry());
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aL', new THREE.Float32BufferAttribute(al, 1));
    const m = own(new THREE.ShaderMaterial({uniforms: flowCommon, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `${FIELD} attribute float aL; uniform float uPhase; varying float vX; varying float vL; varying float vH;
        void main(){ vec3 p=deflect(position); vX=position.x; vL=aL; vH=clamp(heat(p)*1.3,0.,1.); gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.); }`,
      fragmentShader: `uniform float uPhase,uVis; varying float vX; varying float vL; varying float vH;
        void main(){ float f=fract(vX*.32-uPhase*.32+vL*7.);
          float dash=smoothstep(0.,.05,f)*(1.-smoothstep(.05,.42,f));
          float edge=smoothstep(4.1,3.4,abs(vX));
          vec3 c=mix(vec3(.3,.75,1.),vec3(1.,.55,.22),vH);
          gl_FragColor=vec4(c,(.01+.16*dash*uVis)*edge); }`}));
    const lines = new THREE.LineSegments(g, m); lines.frustumCulled = false; airflowG.add(lines);
  }
  /* ----- soot, embers and smoke ----- */
  const sootCommon = {...F, uTime: time, uPix: pix, uSoot: flameUniforms.uSoot, uFlowU: {value: 0}};
  {
    const n = 700, g = new THREE.BufferGeometry(), s = new Float32Array(n * 4);
    for (let i = 0; i < n * 4; i++) s[i] = Math.random();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('aS', new THREE.BufferAttribute(s, 4));
    const m = own(new THREE.ShaderMaterial({uniforms: sootCommon, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `${FIELD} attribute vec4 aS; uniform float uTime,uPix,uSoot,uFlowU; varying vec3 vC; varying float vA;
        void main(){ float life=fract(uTime*(.08+.12*aS.x)+aS.y);
          float u=aS.z*6.2831; float v=acos(mix(1.,-.2,aS.w));
          vec3 d=vec3(sin(v)*cos(u),cos(v),sin(v)*sin(u));
          float smoke=step(.6,fract(aS.x*7.3));
          vec3 p=uC+d*uR*mix(.75,1.05,fract(aS.y*3.7));
          vec3 vel=d*.12+vec3(uFlowU*.7*uDirX,uLift*1.1+.02,0.);
          p+=vel*life*3.+.05*vec3(sin(uTime+aS.y*20.),sin(uTime*1.3+aS.z*30.),cos(uTime*.9+aS.x*20.))*life;
          p.y=min(p.y,1.9);
          vC=mix(mix(vec3(1.,.82,.45),vec3(1.,.38,.1),life),vec3(.3,.31,.34),smoke);
          vA=(1.-life)*smoothstep(0.,.08,life)*uInt*min(uSoot,1.2)*mix(.7*step(life,.45),.012,smoke);
          vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv;
          gl_PointSize=uPix*mix(1.2+aS.x*1.4,20.+life*36.,smoke)*(5./max(-mv.z,.4)); }`,
      fragmentShader: SOFT_FRAG}));
    const pts = new THREE.Points(g, m); pts.frustumCulled = false; own(g); sootG.add(pts);
  }
  /* ----- suppression spray ----- */
  const sprayU = {uTime: time, uPix: pix, uSpray: {value: 0}, uAgent: {value: 1}, uFlowU: sootCommon.uFlowU};
  {
    const n = 1600, g = new THREE.BufferGeometry(), s = new Float32Array(n * 4);
    for (let i = 0; i < n * 4; i++) s[i] = Math.random();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('aS', new THREE.BufferAttribute(s, 4));
    const m = own(new THREE.ShaderMaterial({uniforms: sprayU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute vec4 aS; uniform float uTime,uPix,uSpray,uAgent,uFlowU; varying vec3 vC; varying float vA;
        void main(){ float life=fract(uTime*(.35+.3*aS.x)+aS.y);
          float a=aS.z*6.2831; float r=sqrt(aS.w);
          vec3 p=vec3(${(DUCT.x0 + .45).toFixed(2)}, ${(DUCT.y1 - .2).toFixed(2)}, 0.);
          p.x+=life*(uFlowU*1.6+3.2+aS.x*2.);
          p.y-=life*life*(1.5+r*1.4)+life*.3;
          p.z+=cos(a)*r*life*1.3; p.y+=sin(a)*r*life*.35;
          p.y=max(p.y,-.95); p.x=min(p.x,4.1);
          bool mist=uAgent<1.5||uAgent>2.5;
          vC=uAgent>2.5?vec3(.62,.86,1.):(uAgent>1.5?vec3(.45,.6,1.):vec3(.82,.86,.92));
          float big=uAgent>2.5?0.:1.;
          vA=uSpray*(1.-life)*smoothstep(0.,.05,life)*mix(.55,.07,big)*(uAgent>1.5&&uAgent<2.5?.5:1.);
          vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv;
          gl_PointSize=uPix*mix(1.4+aS.x*1.4,18.+life*36.,big)*(5./max(-mv.z,.4)); }`,
      fragmentShader: SOFT_FRAG}));
    const pts = new THREE.Points(g, m); pts.frustumCulled = false; own(g); sprayG.add(pts);
  }
  /* ----- cabin dust motes ----- */
  {
    const n = 1400, g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), r = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { p[i * 3] = (Math.random() - .5) * ROOM.x * 2; p[i * 3 + 1] = (Math.random() - .5) * ROOM.y * 2; p[i * 3 + 2] = (Math.random() - .5) * ROOM.z * 2; for (let k = 0; k < 4; k++) r[i * 4 + k] = Math.random(); }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aR', new THREE.BufferAttribute(r, 4));
    const m = own(new THREE.ShaderMaterial({uniforms: {uTime: time, uPix: pix}, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute vec4 aR; uniform float uTime,uPix; varying vec3 vC; varying float vA;
        void main(){ vec3 p=position+vec3(sin(uTime*.05*(.5+aR.x)+aR.y*30.),sin(uTime*.04*(.5+aR.z)+aR.w*20.),cos(uTime*.05+aR.x*40.))*.6;
          vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv; float d=-mv.z;
          vA=(.04+.1*aR.w)*smoothstep(.3,2.,d)*smoothstep(14.,4.,d); vC=mix(vec3(.6,.72,.9),vec3(1.,.8,.6),step(.9,aR.y));
          gl_PointSize=uPix*(1.+aR.x*1.6)*(8./max(d,.5)); }`,
      fragmentShader: SOFT_FRAG}));
    own(g); roomG.add(new THREE.Points(g, m));
  }

  /* ----- post ----- */
  // 8-bit targets: float targets + bloom rendered black on some GPUs.
  const lite = /[?&#]lite\b/.test(location.search + location.hash); // ?lite = no post-processing fallback
  const rt = new THREE.WebGLRenderTarget(1, 1, {type: THREE.UnsignedByteType, samples: 4});
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .9, .45, .3);
  // Safety net: drop NaN/Inf pixels before bloom, otherwise one bad pixel can black out the whole frame.
  composer.addPass(new ShaderPass({uniforms: {tDiffuse: {value: null}},
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c=texture2D(tDiffuse,vUv);
      if(any(isnan(c))||any(isinf(c))) c=vec4(0.,0.,0.,1.); gl_FragColor=vec4(clamp(c.rgb,0.,32.),c.a); }`}));
  composer.addPass(bloom);
  composer.addPass(new ShaderPass({uniforms: {tDiffuse: {value: null}},
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ vec4 c=texture2D(tDiffuse,vUv);
      vec2 q=vUv-.5; float v=smoothstep(.85,.2,length(q*vec2(1.1,1.25))); gl_FragColor=vec4(c.rgb*mix(.18,1.,v),c.a); }`}));
  composer.addPass(new OutputPass());

  /* ----- size ----- */
  const fit = () => {
    const w = Math.max(host.clientWidth, 1), h = Math.max(host.clientHeight, 1);
    camera.aspect = w / h; camera.fov = w / h < 1 ? 52 : 38; camera.updateProjectionMatrix();
    renderer.setSize(w, h, false); composer.setSize(w, h); bloom.resolution.set(w / 2, h / 2);
  };
  const ro = new ResizeObserver(fit); ro.observe(host); fit();

  /* ----- camera choreography ----- */
  let tween = null, lastInput = -10;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const fly = (name, dur = 2.8) => {
    const c = CAMS[name]; if (!c) return;
    tween = {p0: camera.position.clone(), t0: controls.target.clone(), p1: new THREE.Vector3(...c.p), t1: new THREE.Vector3(...c.t), s: clock.elapsedTime, d: state.reduced ? .01 : dur};
  };
  controls.addEventListener('start', () => { tween = null; lastInput = clock.elapsedTime; });
  controls.addEventListener('end', () => { lastInput = clock.elapsedTime; });

  /* ----- smoothed state ----- */
  const sm = {R: .2, elong: 0, lift: 0, int: 0, soot: .5, flick: 0, open: 1, flowU: 0, vis: 1, spray: 0};
  let ignite = 1, igDecay = .7, igOK = null, out = false, outT = 0, igPower = 1;
  const reignite = () => { layoutSample(state.live || state.params); ignite = 1; igOK = null; out = false; outT = 0; sm.int = 0; sm.R = .05; sm.open = 0;
    const p = state.live || state.params; igDecay = 1 / Math.min(4, Math.max(.8, p.duration * .3)); igPower = Math.min(1.6, .35 + p.power / 120); };

  const tmp = new THREE.Vector3();
  const clock = new THREE.Clock();
  let simT = 0, frame = 0, fanA = 0; const perf = {acc: 0, n: 0};
  const bounds = {min: new THREE.Vector3(-ROOM.x + .4, -ROOM.y + .3, -ROOM.z + .4), max: new THREE.Vector3(ROOM.x - .4, ROOM.y - .3, ROOM.z - .4)};
  state.anim = {t: 0, playing: false, camera: true};
  layoutSample(state.params);

  const draw = () => {
    frame = requestAnimationFrame(draw);
    const raw = clock.getDelta(), dt = Math.min(raw, .05);
    const now = clock.elapsedTime;
    perf.acc += raw; perf.n++;
    if (perf.acc > 2.5) { // keep playback smooth for screen recording: drop resolution if the GPU struggles
      const fps = perf.n / perf.acc; perf.acc = 0; perf.n = 0;
      const pr = renderer.getPixelRatio();
      if (fps < 42 && pr > 1) { renderer.setPixelRatio(Math.max(1, pr - .3)); pix.value = renderer.getPixelRatio(); composer.setPixelRatio(pix.value); fit(); }
    }
    const motion = state.reduced ? 0 : 1;
    simT += dt * motion; time.value = simT;

    // scripted simulation (keyframed parameters, igniter events, camera cuts)
    const A = state.anim;
    if (A.playing) {
      const t0 = A.t; A.t = Math.min(END, A.t + dt);
      for (const e of EVENTS) if (e > t0 && e <= A.t) A.fire = true;
      if (A.camera) for (const [ct, name] of CAM_TRACK) if (ct > t0 && ct <= A.t) fly(name, 2.8);
      if (A.t >= END) A.playing = false;
    }
    const p = A.playing ? paramsAt(A.t, state.params) : state.params;
    state.live = p;
    if (A.fire) { A.fire = false; reignite(); }
    if ((p.direction === 'Opposed' ? -1 : 1) !== geo.dir) reignite();
    layoutSample(p);

    const d = derive(p);
    if (igOK === null) igOK = d.ign;
    const flameOn = state.mode !== 'Experiment setup';
    const aliveRaw = d.alive * igOK;
    if (ignite <= 0 && aliveRaw < .22) { outT += dt; if (outT > 1.4) out = true; } else outT = 0;
    const lit = flameOn && !out ? 1 : 0;
    const k = 1 - Math.exp(-dt * 2.2), kSlow = 1 - Math.exp(-dt * 1.1);
    const grow = 1 - ignite * .75;
    const target = {R: d.radius * (.35 + .65 * Math.max(aliveRaw, .2)) * grow, elong: d.elong, lift: d.lift, int: d.intensity * igOK * lit, soot: d.soot, flick: d.flicker,
      flowU: p.flow * .13, vis: Math.min(1, .15 + p.flow / 18 + d.induced / 30), spray: d.spray};
    for (const key in target) sm[key] += (target[key] - sm[key]) * k;
    const openT = out || !igOK ? 1 : 1 - Math.min(1, aliveRaw * 1.6) * (.15 + .85 * Math.min(1, d.supply * 1.4));
    sm.open += (Math.max(0, openT) - sm.open) * kSlow;
    ignite = Math.max(0, ignite - dt * igDecay);

    const flick = 1 + .06 * Math.sin(simT * 13.1) * (.2 + sm.flick) + .04 * Math.sin(simT * 7.3);
    F.uR.value = Math.max(.04, sm.R + geo.fuelR * .6); F.uE.value = sm.elong; F.uLift.value = sm.lift; F.uDirX.value = geo.dir;
    F.uInt.value = sm.int * (1 - ignite * .45) * flick;
    flameUniforms.uSoot.value = sm.soot; flameUniforms.uFlick.value = sm.flick; flameUniforms.uOpen.value = sm.open;
    phase.value += dt * motion * (sm.flowU + sm.lift * .25); flowCommon.uVis.value = sm.vis * .7;
    sootCommon.uFlowU.value = sm.flowU;
    sprayU.uSpray.value = sm.spray; sprayU.uAgent.value = Math.max(1, d.agentIndex);
    nozzleLed.material.color.setRGB(sm.spray > .05 ? 2 : .2, sm.spray > .05 ? 1 : .25, sm.spray > .05 ? .3 : .3);
    fanA += dt * motion * p.flow * .45; rotor.rotation.x = fanA;
    hexMat.uniforms.uGlow.value = Math.min(1, p.flow / 30) * .4;

    // the flame is the only real light source: blue shells emit little, soot glows warm
    const sootL = Math.min(sm.soot, 1) * (1 - sm.open);
    tmp.copy(FLAME_C); tmp.y += F.uR.value * (.3 + sm.lift); duct.localToWorld(tmp); fireLight.position.copy(tmp);
    fireLight.intensity = F.uInt.value * (2 + 9 * sootL);
    fireLight.color.setRGB(.45 + .55 * sootL, .4 + .2 * sootL, 1 - .75 * sootL);
    glowA.position.copy(FLAME_C).y += F.uR.value * (.25 + sm.lift * .6); glowA.scale.setScalar(F.uR.value * (3.2 + sm.lift * 2));
    glowA.material.opacity = .07 * F.uInt.value * sootL;
    glowB.position.copy(FLAME_C); glowB.scale.setScalar(F.uR.value * 4.2); glowB.material.opacity = .05 * F.uInt.value * (1 - .4 * sm.open);
    fuelMat.emissive.setRGB(.1 * sootL * F.uInt.value, .025 * sootL * F.uInt.value, .005);
    const ig = ignite * igPower;
    igniteGlow.position.copy(FLAME_C).add(coil.position); igniteGlow.scale.setScalar(.35 + ig * .9); igniteGlow.material.opacity = Math.min(1, ig * .9);
    coilMat.color.setRGB(.25 + ig * 3, .15 + ig * 1.2, .1 + ig * .3);
    tmp.copy(FLAME_C).add(coil.position); duct.localToWorld(tmp); igniteLight.position.copy(tmp); igniteLight.intensity = ig * 4;
    sensorLed.material.color.setRGB(.08, .35 * (.6 + .4 * Math.sin(now * 3) ** 2), .5);

    // camera
    if (tween) {
      const u = Math.min(1, (now - tween.s) / tween.d), e = ease(u);
      camera.position.lerpVectors(tween.p0, tween.p1, e); controls.target.lerpVectors(tween.t0, tween.t1, e);
      if (u >= 1) { tween = null; lastInput = now; }
    }
    controls.autoRotate = !tween && !state.reduced && state.autoOrbit !== false && now - lastInput > (A.playing ? 1 : 6);
    controls.update(dt);
    camera.position.clamp(bounds.min, bounds.max);

    flameUniforms.uCam.value.copy(camera.position); duct.worldToLocal(flameUniforms.uCam.value);
    if (lite) renderer.render(scene, camera); else composer.render();

    if (state.onFrame) state.onFrame({t: simT, anim: A, params: p, sm, d, igOK, out, ignite, anchors: {}, quat: camera.quaternion, lum: F.uInt.value * (.4 + .6 * sootL)});
  };
  draw();

  const objects = {Module: roomG, Space: spaceG, FlowDuct: duct, Sample: sampleG, Flame: flameG, Airflow: airflowG, Soot: sootG, Suppression: sprayG};
  const api = {
    state, fly, reignite, objects,
    dispose() {
      cancelAnimationFrame(frame); ro.disconnect(); controls.dispose();
      scene.traverse(o => { if (o.geometry) o.geometry.dispose?.(); });
      owned.forEach(x => x?.dispose?.());
      wallMat.map?.dispose(); envRT.dispose(); pmrem.dispose(); rt.dispose(); composer.dispose?.(); bloom.dispose?.();
      renderer.dispose(); renderer.domElement.remove();
    }
  };
  window.__lab = api;
  return api;
}
