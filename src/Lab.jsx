import React, {useEffect, useRef, useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

// A responsive, evidence-adjacent illustration, NOT a combustion model.
// No displayed flame shape or animation is derived from measured NASA footage.
export default function Lab({scenario, mode, reduced}) {
  const mount = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const host = mount.current;
    if (!host) return;
    let renderer, controls, observer, frame;
    const owned = [];
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(4.6, 2.7, 5.3);
    const color = scenario.material === 'Silicone' ? 0x9caab3 : scenario.material === 'PMMA' ? 0xb6d6df : 0xdfbd82;

    try {
      renderer = new THREE.WebGLRenderer({alpha:true, antialias:true, powerPreference:'high-performance'});
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
      host.appendChild(renderer.domElement);
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.minDistance = 3.2;
      controls.maxDistance = 10;
      controls.maxPolarAngle = Math.PI * .76;
      controls.target.set(0, -.15, 0);

      const mesh = (parent, geometry, material) => {
        const object = new THREE.Mesh(geometry, material);
        parent.add(object);
        owned.push(geometry, material);
        return object;
      };
      scene.add(new THREE.HemisphereLight(0xb4d9ff, 0x141b26, 1.55));
      const rim = new THREE.DirectionalLight(0x7cc4f2, 1.9);
      rim.position.set(-3, 4, -4);
      scene.add(rim);
      const key = new THREE.DirectionalLight(0xffffff, 1.2);
      key.position.set(3, 4, 5);
      scene.add(key);
      const fireLight = new THREE.PointLight(0xffa23f, 0, 4);
      fireLight.position.set(-.4, .1, 0);
      scene.add(fireLight);

      const assembly = new THREE.Group();
      scene.add(assembly);
      const platform = mesh(assembly, new THREE.BoxGeometry(4.4, .15, 2.65), new THREE.MeshStandardMaterial({color:0x182638, metalness:.68, roughness:.4}));
      platform.position.y = -.92;
      const rail = mesh(assembly, new THREE.BoxGeometry(3.6, .09, .94), new THREE.MeshStandardMaterial({color:0x617488, metalness:.72, roughness:.37}));
      rail.position.y = -.76;
      const sample = mesh(assembly, new THREE.BoxGeometry(3.32, .065, .7), new THREE.MeshStandardMaterial({color, roughness:.8}));
      sample.position.y = -.68;
      for (let i = 0; i < 12; i++) {
        const stripe = mesh(assembly, new THREE.BoxGeometry(.012, .004, .69), new THREE.MeshBasicMaterial({color:0x5a4538, transparent:true, opacity:.45}));
        stripe.position.set(-1.52 + i * .28, -.645, 0);
      }

      const chamberGeo = new THREE.BoxGeometry(4.7, 2.35, 2.95);
      const frameLines = new THREE.LineSegments(new THREE.EdgesGeometry(chamberGeo), new THREE.LineBasicMaterial({color:0x71adcf, transparent:true, opacity:.38}));
      frameLines.position.y = .15;
      assembly.add(frameLines);
      owned.push(chamberGeo, frameLines.geometry, frameLines.material);
      const backGlass = mesh(assembly, new THREE.PlaneGeometry(4.7, 2.35), new THREE.MeshBasicMaterial({color:0x32678b, transparent:true, opacity:.045, depthWrite:false, side:THREE.DoubleSide}));
      backGlass.position.set(0, .15, -1.48);
      const grid = new THREE.GridHelper(8, 16, 0x355673, 0x20364d);
      grid.position.y = -1.02;
      scene.add(grid);
      owned.push(grid.geometry, grid.material);

      const arrows = [];
      for (const z of [-.64, 0, .64]) {
        const arrow = new THREE.ArrowHelper(new THREE.Vector3(1,0,0), new THREE.Vector3(-1.85,.53,z), 1.05, 0x65d1e6, .19, .095);
        assembly.add(arrow);
        arrows.push(arrow);
      }

      const plume = new THREE.Group();
      plume.position.set(-.7, -.46, 0);
      assembly.add(plume);
      const sheets = [];
      if (mode === 'Illustrative visualization') {
        const volumeMaterial = new THREE.ShaderMaterial({
          transparent:true, depthWrite:false, side:THREE.DoubleSide, blending:THREE.AdditiveBlending,
          uniforms:{uTime:{value:0}},
          vertexShader:`varying vec3 vNormal; varying vec3 vPos; void main(){vNormal=normalize(normalMatrix*normal); vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
          fragmentShader:`varying vec3 vNormal; varying vec3 vPos; uniform float uTime; void main(){float edge=pow(1.0-abs(dot(normalize(vNormal),vec3(0.0,0.0,1.0))),1.25); float ripple=0.78+0.22*sin(vPos.x*12.0+vPos.y*9.0-uTime*3.4); float core=smoothstep(-.9,.65,vPos.x); vec3 blue=vec3(.12,.46,1.0); vec3 orange=vec3(1.0,.38,.07); vec3 yellow=vec3(1.0,.78,.31); vec3 col=mix(blue,orange,smoothstep(-.75,-.15,vPos.x)); col=mix(col,yellow,core*.42); float alpha=(.17+.46*edge)*ripple*smoothstep(-1.0,-.5,vPos.x)*(1.0-smoothstep(.62,1.0,vPos.x)); gl_FragColor=vec4(col,alpha);}`
        });
        const volume = mesh(plume,new THREE.SphereGeometry(1,48,32),volumeMaterial);
        volume.scale.set(1.27,.46,.38);
        volume.position.set(.15,.28,0);
        sheets.push({material:volumeMaterial,volume});
        const layers = [
          {z:-.25, height:.54, opacity:.28, tint:new THREE.Color('#ff762e')},
          {z:.25, height:.54, opacity:.28, tint:new THREE.Color('#ff762e')},
          {z:-.12, height:.43, opacity:.5, tint:new THREE.Color('#ffb14e')},
          {z:.12, height:.43, opacity:.5, tint:new THREE.Color('#ffb14e')},
          {z:0, height:.30, opacity:.62, tint:new THREE.Color('#ffe0a1')}
        ];
        layers.forEach((layer, index) => {
          const width = 2.35;
          const geometry = new THREE.PlaneGeometry(width, 1, 30, 8);
          geometry.rotateX(-Math.PI/2);
          geometry.translate(.1, 0, layer.z);
          const base = Float32Array.from(geometry.attributes.position.array);
          const material = new THREE.ShaderMaterial({
            transparent:true, depthWrite:false, side:THREE.DoubleSide, blending:THREE.AdditiveBlending,
            uniforms:{uTime:{value:0},uOpacity:{value:layer.opacity},uTint:{value:layer.tint}},
            vertexShader:`varying vec2 vUv; uniform float uTime; void main(){vUv=uv; vec3 p=position; float envelope=sin(3.14159*uv.x); p.y += envelope*(0.08+0.60*uv.y) + 0.045*sin(uTime*4.0+uv.x*15.0+uv.y*7.0)*envelope; p.z += 0.06*sin(uTime*2.8+uv.x*11.0+uv.y*4.0)*envelope; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
            fragmentShader:`varying vec2 vUv; uniform float uTime; uniform float uOpacity; uniform vec3 uTint; void main(){float x=sin(3.14159*vUv.x); float feather=pow(x,0.7)*pow(1.0-vUv.y,0.55); float waves=0.76+0.24*sin(vUv.x*24.0-uTime*4.5+vUv.y*9.0); float a=feather*waves*uOpacity; vec3 c=mix(vec3(0.18,0.53,1.0),uTint,smoothstep(0.05,0.42,vUv.x)); gl_FragColor=vec4(c,a);}`
          });
          const ribbon = mesh(plume, geometry, material);
          ribbon.position.y = .04 + index * .008;
          sheets.push({material, ribbon, base, height:layer.height});
        });
        // A small luminous ignition region anchors the ribbon to the sample.
        const glowMaterial = new THREE.MeshBasicMaterial({color:0xffa44d, transparent:true, opacity:.23, depthWrite:false, blending:THREE.AdditiveBlending});
        const glow = mesh(plume, new THREE.SphereGeometry(.33, 20, 14), glowMaterial);
        glow.scale.set(1.5,.65,.9);
        glow.position.set(-.78,.04,0);
        sheets.push({glow});
      }

      const fit = () => {
        const w = Math.max(host.clientWidth,1), h = Math.max(host.clientHeight,1);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w,h,false);
      };
      observer = new ResizeObserver(fit);
      observer.observe(host);
      fit();
      const clock = new THREE.Clock();
      const draw = () => {
        frame = requestAnimationFrame(draw);
        const t = clock.getElapsedTime();
        const oxygen = Number(scenario.oxygen) || 21;
        const flow = Number(scenario.airflow) || 0;
        plume.scale.x = .77 + Math.min(flow,30) / 42;
        plume.scale.y = .72 + Math.min(oxygen,30) / 90;
        plume.rotation.z = scenario.gravity === 'Earth (1 g)' ? .32 : 0;
        arrows.forEach(a => a.visible = Boolean(flow));
        if (mode === 'Illustrative visualization') {
          sheets.forEach((s,i) => {
            if (s.material) s.material.uniforms.uTime.value = reduced ? 0 : t;
            if (s.volume) s.volume.scale.y = reduced ? .46 : .46 + .035*Math.sin(t*3.2);
            if (s.glow) s.glow.material.opacity = reduced ? .2 : .18 + .07 * Math.sin(t*4);
          });
          fireLight.intensity = reduced ? 8 : 8 + 2 * Math.sin(t*3.5);
        }
        controls.update();
        renderer.render(scene,camera);
      };
      draw();
      setError(false);
    } catch (e) {
      setError(true);
    }
    return () => {
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect(); controls?.dispose();
      owned.forEach(x => x?.dispose?.());
      renderer?.dispose(); renderer?.domElement?.remove();
    };
  }, [scenario, mode, reduced]);

  return <div className="scene" ref={mount} role="img" aria-label="Rotatable 3D schematic of a sample in an experimental chamber. The animated flame is illustrative, not measured data.">
    {error && <div className="media-empty">3D view unavailable. The sourced experiment data below remains accessible.</div>}
  </div>;
}
