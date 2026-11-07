import React, {useEffect, useRef} from 'react';
import * as THREE from 'three';
import {NOISE} from '../shaders/noise.js';

/* Landing-page candle flame.
   - A blue flame sphere on a very thin black wick.
   - The flame flickers continuously (noise scrolling upward, tongues at the edge).
   - Hovering over it acts like a hand passing over a candle: the flame is pushed
     away from the cursor and dragged in the direction the cursor moves. The
     effect fades out smoothly when the pointer leaves.
   Premultiplied alpha on a transparent canvas, so the page stays white around it. */

const VERT = /* glsl */`
varying vec2 vUv;
void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`;

const FRAG = /* glsl */`
precision highp float;
uniform float uTime; uniform vec2 uRes; varying vec2 vUv;
uniform vec2 uMouse;   // cursor, in vUv*2-1 space (before aspect correction)
uniform float uHover;  // 0..1, how strongly the hand is over the flame
uniform vec2 uVel;     // cursor velocity, same space
${NOISE}

const vec2  C  = vec2(0.0, -0.02);  // sphere centre
const float R0 = 0.56;              // sphere radius

void main(){
  float aspect = uRes.x/uRes.y;
  vec2 p = vUv*2.-1.; p.x *= aspect;

  // ---- hand deflection: push the flame away from the cursor and drag it along
  vec2 mP = vec2(uMouse.x*aspect, uMouse.y);
  vec2 md = p - mP;
  float f = uHover * exp(-dot(md,md)/0.075);
  vec2 s = p + normalize(md + vec2(1e-4)) * f * 0.20 + vec2(uVel.x*aspect, uVel.y) * f * 0.5;
  vec2 q = s - C;

  // ---- microgravity: no buoyancy, so no upward drift. The surface breathes
  // evenly around the sphere (noise over the direction from the centre, evolving
  // in place, not scrolling up), and flame spreads symmetrically in all directions.
  vec2 dir = q/max(length(q),1e-4);
  float n      = fbm(vec3(q*1.8, uTime*.22));
  float tongue = fbm(vec3(q*3.0, uTime*.35 + 4.));
  float breathe = sin(uTime*.8)*.02;                 // gentle, even pulse
  float R = R0*(1. + breathe + (n-.5)*.14 + (tongue-.5)*.08);
  float d = length(q);

  // ---- body: blue flame, slightly brighter where the tongues are
  float body = 1.-smoothstep(R-.012, R+.006, d);
  float t = clamp(d/R, 0., 1.);
  vec3 deep = vec3(.06,.22,.96);
  vec3 rim  = vec3(.22,.52,1.);
  vec3 core = vec3(.55,.78,1.);
  vec3 col = mix(core, deep, smoothstep(.0,.55,t));
  col = mix(col, rim, smoothstep(.6,1.,t));
  col *= .82 + .35*tongue;
  // a touch of real-fire yellow in the hot centre and tongue tips
  float hot = (1.-smoothstep(.0,.45,t))*.5 + smoothstep(.55,.9,tongue)*smoothstep(.2,.7,t)*.35;
  col = mix(col, vec3(1.,.82,.28), clamp(hot,0.,1.)*.6);
  col += vec3(.45,.72,1.)*exp(-pow((d-R)/.03, 2.))*.9;   // bright rim light

  // ---- halo, faded to zero before any canvas edge
  float fadeX = 1.-smoothstep(.48,.70,abs(p.x));
  float fadeY = smoothstep(-.98,-.86,p.y)*(1.-smoothstep(.80,.98,p.y));
  float halo = exp(-max(d-R,0.)/.09)*(1.-body)*(.45+.25*tongue)*fadeX*fadeY;

  // ---- thin black wick: narrow, short, rising from the bottom into the flame
  float bw = mix(.0105, .0070, smoothstep(-.95,-.3,p.y));
  float barX = 1.-smoothstep(bw-.004, bw+.004, abs(p.x));
  float barY = smoothstep(-.66,-.62,p.y)*(1.-smoothstep(-.06,-.02,p.y));
  float bar = barX*barY;
  vec3 barCol = vec3(.015,.02,.04);
  // semi-transparent wick: darkens the flame where it crosses, never fully opaque
  col = mix(col, barCol, bar*.38);

  // ---- composite (premultiplied)
  float a = clamp(body + halo + bar*.38*(1.-body), 0., 1.);
  vec3 rgb = col*body + vec3(.2,.5,1.)*halo + barCol*bar*.38*(1.-body);
  rgb = min(rgb, vec3(a));
  gl_FragColor = vec4(rgb, a);
}`;

export default function FlameOrb({width = 400, height = 540}) {
  const host = useRef(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, premultipliedAlpha: true});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const uniforms = {
      uTime: {value: 0},
      uRes: {value: new THREE.Vector2(1, 1)},
      uMouse: {value: new THREE.Vector2(0, 0)},
      uHover: {value: 0},
      uVel: {value: new THREE.Vector2(0, 0)},
    };
    const mat = new THREE.ShaderMaterial({
      uniforms, vertexShader: VERT, fragmentShader: FRAG,
      depthWrite: false, depthTest: false, transparent: true, premultipliedAlpha: true,
    });
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // pointer state: target position/hover, smoothed values, and cursor velocity
    const ptr = {tx: 0, ty: 0, target: 0, mx: 0, my: 0, hover: 0, vx: 0, vy: 0, lastX: null, lastY: null};

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 2 - 1;
      const y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      if (ptr.lastX !== null) {
        const dx = x - ptr.lastX, dy = y - ptr.lastY;
        ptr.vx = Math.max(-.3, Math.min(.3, ptr.vx * .6 + dx * 6));
        ptr.vy = Math.max(-.3, Math.min(.3, ptr.vy * .6 + dy * 6));
      }
      ptr.lastX = x; ptr.lastY = y;
      ptr.tx = x; ptr.ty = y; ptr.target = 1;
      if (reduced) render();
    };
    const onLeave = () => { ptr.target = 0; ptr.lastX = null; ptr.lastY = null; if (reduced) render(); };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);

    // resize at most once per frame
    let fitQueued = false;
    const fit = () => {
      const w = Math.max(el.clientWidth, 1), h = Math.max(el.clientHeight, 1);
      renderer.setSize(w, h, false);
      uniforms.uRes.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
    };
    const ro = new ResizeObserver(() => {
      if (fitQueued) return;
      fitQueued = true;
      requestAnimationFrame(() => { fitQueued = false; fit(); });
    });
    ro.observe(el);
    fit();

    function render() {
      ptr.mx += (ptr.tx - ptr.mx) * .22;
      ptr.my += (ptr.ty - ptr.my) * .22;
      ptr.hover += (ptr.target - ptr.hover) * .09;
      ptr.vx *= .88; ptr.vy *= .88;
      uniforms.uMouse.value.set(ptr.mx, ptr.my);
      uniforms.uHover.value = ptr.hover;
      uniforms.uVel.value.set(ptr.vx, ptr.vy);
      renderer.render(scene, cam);
    }

    let raf = 0;
    const t0 = performance.now();
    const frame = () => {
      uniforms.uTime.value = (performance.now() - t0) / 1000;
      render();
      raf = requestAnimationFrame(frame);
    };
    if (reduced) {
      uniforms.uTime.value = 0.6;
      render();
    } else {
      frame();
    }

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      ro.disconnect();
      mat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className="l-orb" style={{width, height}} aria-hidden="true"/>;
}
