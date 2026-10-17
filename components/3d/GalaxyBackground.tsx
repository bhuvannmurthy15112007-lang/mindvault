'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface GalaxyBackgroundProps {
  className?: string;
  density?: 'low' | 'normal' | 'high';
}

export const GalaxyBackground: React.FC<GalaxyBackgroundProps> = ({
  className,
  density = 'normal',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check WebGL availability
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!gl) {
      setHasWebGL(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Scene & Deep Fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05070f, 0.012);

    const initialWidth = window.innerWidth || 1200;
    const initialHeight = window.innerHeight || 800;

    const camera = new THREE.PerspectiveCamera(55, initialWidth / initialHeight, 0.1, 1000);
    camera.position.set(0, 0, 42);

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'low-power',
    });
    renderer.setSize(initialWidth, initialHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    const disposables: { dispose: () => void }[] = [];
    const registerDisposable = <T extends { dispose: () => void }>(item: T): T => {
      disposables.push(item);
      return item;
    };

    // ==========================================
    // 1. CELESTIAL LIGHTING
    // ==========================================
    const ambientLight = new THREE.AmbientLight(0x0b132b, 1.5);
    scene.add(ambientLight);

    const distantSun = new THREE.DirectionalLight(0x80b5ff, 2.2);
    distantSun.position.set(30, 20, 20);
    scene.add(distantSun);

    const violetGlowLight = new THREE.DirectionalLight(0x8b5cf6, 1.6);
    violetGlowLight.position.set(-25, -15, 10);
    scene.add(violetGlowLight);

    // ==========================================
    // 2. MULTI-LAYER STARFIELDS (DEEP GALAXY)
    // ==========================================
    const starCount = density === 'high' ? 1600 : density === 'low' ? 700 : 1100;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    const colWhite = new THREE.Color(0xffffff);
    const colCyan = new THREE.Color(0x80f3ff);
    const colViolet = new THREE.Color(0xb39ddb);
    const colGold = new THREE.Color(0xffe082);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      starPositions[i3] = (Math.random() - 0.5) * 160;
      starPositions[i3 + 1] = (Math.random() - 0.5) * 120;
      starPositions[i3 + 2] = -10 - Math.random() * 110;

      const pick = Math.random();
      const col = pick < 0.6 ? colWhite : pick < 0.8 ? colCyan : pick < 0.93 ? colViolet : colGold;
      starColors[i3] = col.r;
      starColors[i3 + 1] = col.g;
      starColors[i3 + 2] = col.b;
    }

    const starGeo = registerDisposable(new THREE.BufferGeometry());
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = registerDisposable(
      new THREE.PointsMaterial({
        size: 0.16,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      })
    );

    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // ==========================================
    // 3. PROCEDURAL 3D PLANETS
    // ==========================================
    const planetsGroup = new THREE.Group();
    scene.add(planetsGroup);

    // --- Planet 1: Ringed Celestial Giant (Upper-Left) ---
    const p1Group = new THREE.Group();
    p1Group.position.set(-26, 15, -42);
    planetsGroup.add(p1Group);

    const p1SphereGeo = registerDisposable(new THREE.SphereGeometry(4.2, 32, 32));
    const p1SphereMat = registerDisposable(
      new THREE.MeshStandardMaterial({
        color: 0x0f1d3a,
        roughness: 0.35,
        metalness: 0.3,
        emissive: 0x071126,
        emissiveIntensity: 0.5,
      })
    );
    const p1Mesh = new THREE.Mesh(p1SphereGeo, p1SphereMat);
    p1Group.add(p1Mesh);

    // Rings
    const p1RingGeo = registerDisposable(new THREE.RingGeometry(5.4, 8.2, 64));
    const p1RingMat = registerDisposable(
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.45,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55,
      })
    );
    const p1Ring = new THREE.Mesh(p1RingGeo, p1RingMat);
    p1Ring.rotation.x = 1.25;
    p1Ring.rotation.y = 0.35;
    p1Group.add(p1Ring);

    // --- Planet 2: Cyan Atmospheric Exoplanet (Lower-Right) ---
    const p2Group = new THREE.Group();
    p2Group.position.set(30, -18, -55);
    planetsGroup.add(p2Group);

    const p2SphereGeo = registerDisposable(new THREE.SphereGeometry(6.2, 32, 32));
    const p2SphereMat = registerDisposable(
      new THREE.MeshStandardMaterial({
        color: 0x092b3a,
        roughness: 0.4,
        metalness: 0.2,
        emissive: 0x004c66,
        emissiveIntensity: 0.6,
      })
    );
    const p2Mesh = new THREE.Mesh(p2SphereGeo, p2SphereMat);
    p2Group.add(p2Mesh);

    // Atmospheric halo for Planet 2
    const p2HaloGeo = registerDisposable(new THREE.SphereGeometry(6.5, 24, 24));
    const p2HaloMat = registerDisposable(
      new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.12,
        side: THREE.BackSide,
      })
    );
    const p2Halo = new THREE.Mesh(p2HaloGeo, p2HaloMat);
    p2Group.add(p2Halo);

    // --- Planet 3: Distant Golden Celestial Body ---
    const p3Group = new THREE.Group();
    p3Group.position.set(22, 22, -85);
    planetsGroup.add(p3Group);

    const p3SphereGeo = registerDisposable(new THREE.SphereGeometry(2.8, 24, 24));
    const p3SphereMat = registerDisposable(
      new THREE.MeshStandardMaterial({
        color: 0x3d2706,
        roughness: 0.6,
        emissive: 0xffa500,
        emissiveIntensity: 0.35,
      })
    );
    const p3Mesh = new THREE.Mesh(p3SphereGeo, p3SphereMat);
    p3Group.add(p3Mesh);

    // ==========================================
    // 4. THE PROCEDURAL 3D SPACECRAFT / ROCKET
    // ==========================================
    const rocketGroup = new THREE.Group();
    rocketGroup.position.set(-60, 20, -18);
    rocketGroup.scale.set(0.65, 0.65, 0.65);
    scene.add(rocketGroup);

    // Fuselage Body
    const fuselageGeo = registerDisposable(new THREE.ConeGeometry(0.55, 3.2, 16));
    const hullMat = registerDisposable(
      new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.85,
        roughness: 0.25,
      })
    );
    const fuselage = new THREE.Mesh(fuselageGeo, hullMat);
    fuselage.rotation.z = -Math.PI / 2; // point along positive X
    rocketGroup.add(fuselage);

    // Cockpit Visor
    const visorGeo = registerDisposable(new THREE.SphereGeometry(0.35, 12, 12));
    const visorMat = registerDisposable(
      new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 1.5,
      })
    );
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0.6, 0.12, 0);
    rocketGroup.add(visor);

    // Delta Wings
    const wingGeo = registerDisposable(new THREE.BoxGeometry(1.6, 0.06, 2.2));
    const wingMesh = new THREE.Mesh(wingGeo, hullMat);
    wingMesh.position.set(-0.6, 0, 0);
    rocketGroup.add(wingMesh);

    // Thruster Nozzle & Glowing Ion Engine
    const thrusterGeo = registerDisposable(new THREE.CylinderGeometry(0.32, 0.42, 0.6, 12));
    const thrusterMat = registerDisposable(
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.9,
      })
    );
    const thruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    thruster.rotation.z = Math.PI / 2;
    thruster.position.set(-1.8, 0, 0);
    rocketGroup.add(thruster);

    // Thruster Light
    const thrusterLight = new THREE.PointLight(0x00f0ff, 2.5, 10);
    thrusterLight.position.set(-2.2, 0, 0);
    rocketGroup.add(thrusterLight);

    // Ion Trail Particles
    const trailCount = 28;
    const trailPositions = new Float32Array(trailCount * 3);
    for (let i = 0; i < trailCount; i++) {
      trailPositions[i * 3] = -2.2 - (i * 0.25);
      trailPositions[i * 3 + 1] = (Math.random() - 0.5) * 0.12;
      trailPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
    }
    const trailGeo = registerDisposable(new THREE.BufferGeometry());
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    const trailMat = registerDisposable(
      new THREE.PointsMaterial({
        color: 0x00f0ff,
        size: 0.18,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
      })
    );
    const trailParticles = new THREE.Points(trailGeo, trailMat);
    rocketGroup.add(trailParticles);

    // ==========================================
    // 5. THE PROCEDURAL 3D ASTRONAUT
    // ==========================================
    const astronautGroup = new THREE.Group();
    astronautGroup.position.set(18, -10, -28);
    astronautGroup.scale.set(0.55, 0.55, 0.55);
    scene.add(astronautGroup);

    const suitMat = registerDisposable(
      new THREE.MeshStandardMaterial({
        color: 0xd1d5db,
        roughness: 0.35,
        metalness: 0.2,
      })
    );
    const visorGoldMat = registerDisposable(
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffa500,
        emissiveIntensity: 0.9,
        roughness: 0.1,
        metalness: 0.95,
      })
    );

    // Helmet & Visor
    const helmetGeo = registerDisposable(new THREE.SphereGeometry(0.55, 16, 16));
    const helmet = new THREE.Mesh(helmetGeo, suitMat);
    helmet.position.set(0, 1.2, 0);
    astronautGroup.add(helmet);

    const astroVisorGeo = registerDisposable(new THREE.SphereGeometry(0.42, 16, 16));
    const astroVisor = new THREE.Mesh(astroVisorGeo, visorGoldMat);
    astroVisor.position.set(0.18, 1.22, 0);
    astronautGroup.add(astroVisor);

    // Torso Suit
    const torsoGeo = registerDisposable(new THREE.CylinderGeometry(0.52, 0.45, 1.4, 12));
    const torso = new THREE.Mesh(torsoGeo, suitMat);
    torso.position.set(0, 0.3, 0);
    astronautGroup.add(torso);

    // Life-Support Backpack
    const packGeo = registerDisposable(new THREE.BoxGeometry(0.5, 1.1, 0.7));
    const packMat = registerDisposable(
      new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.5 })
    );
    const pack = new THREE.Mesh(packGeo, packMat);
    pack.position.set(-0.45, 0.4, 0);
    astronautGroup.add(pack);

    // Limbs (floating relaxed posture)
    const armGeo = registerDisposable(new THREE.CylinderGeometry(0.16, 0.14, 0.9, 8));
    const leftArm = new THREE.Mesh(armGeo, suitMat);
    leftArm.position.set(0.2, 0.5, 0.65);
    leftArm.rotation.x = 0.5;
    leftArm.rotation.z = -0.3;
    astronautGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, suitMat);
    rightArm.position.set(0.2, 0.5, -0.65);
    rightArm.rotation.x = -0.5;
    rightArm.rotation.z = -0.3;
    astronautGroup.add(rightArm);

    const legGeo = registerDisposable(new THREE.CylinderGeometry(0.18, 0.15, 1.1, 8));
    const leftLeg = new THREE.Mesh(legGeo, suitMat);
    leftLeg.position.set(0.1, -0.85, 0.3);
    leftLeg.rotation.z = 0.2;
    leftLeg.rotation.x = 0.2;
    astronautGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, suitMat);
    rightLeg.position.set(-0.1, -0.85, -0.3);
    rightLeg.rotation.z = -0.2;
    astronautGroup.add(rightLeg);

    // ==========================================
    // 6. SHOOTING STAR (METEOR STREAK)
    // ==========================================
    const meteorGeo = registerDisposable(new THREE.CylinderGeometry(0.04, 0.01, 4.0, 6));
    const meteorMat = registerDisposable(
      new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.0,
      })
    );
    const meteor = new THREE.Mesh(meteorGeo, meteorMat);
    meteor.position.set(20, 25, -30);
    meteor.rotation.z = Math.PI / 4;
    scene.add(meteor);

    // ==========================================
    // 7. ANIMATION, INTERACTION & TIMING
    // ==========================================
    let mouseX = 0;
    let mouseY = 0;
    let targetCamX = 0;
    let targetCamY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      mouseX = (e.clientX - halfW) / halfW;
      mouseY = (e.clientY - halfH) / halfH;

      targetCamX = mouseX * 2.5;
      targetCamY = -mouseY * 1.8;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const handleResize = () => {
      if (!container) return;
      const w = window.innerWidth || 1200;
      const h = window.innerHeight || 800;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    let animationFrameId: number;
    const startTime = performance.now();

    // Rocket Flight State
    let rocketActive = true;
    let rocketProgress = 0;

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsed = ((currentTime || performance.now()) - startTime) * 0.001;

      if (!prefersReducedMotion) {
        // Slow Axial Planet Rotations
        p1Mesh.rotation.y += 0.002;
        p1Ring.rotation.z += 0.0008;
        p2Mesh.rotation.y += 0.0015;
        p3Mesh.rotation.y += 0.001;

        // Gentle Astronaut Zero-G Float
        astronautGroup.rotation.y += 0.003;
        astronautGroup.rotation.z = Math.sin(elapsed * 0.8) * 0.15;
        astronautGroup.position.y = -10 + Math.sin(elapsed * 0.5) * 1.2;
        astronautGroup.position.x = 18 + Math.cos(elapsed * 0.3) * 0.8;

        // Rocket Cruise Trajectory (Appears every ~30 seconds, glides diagonally across deep background)
        const rocketCycle = elapsed % 32;
        if (rocketCycle < 14) {
          // In flight
          rocketGroup.visible = true;
          const t = rocketCycle / 14;
          // Smooth glide from top-left to bottom-right across the deep background
          const rx = -55 + t * 115;
          const ry = 22 - t * 40 + Math.sin(t * Math.PI) * 4;
          const rz = -22 - Math.sin(t * Math.PI) * 8;
          rocketGroup.position.set(rx, ry, rz);

          // Bank angle along trajectory
          rocketGroup.rotation.z = -0.35 + Math.sin(t * Math.PI) * 0.1;
          rocketGroup.rotation.y = 0.2;

          // Thruster pulse
          thrusterLight.intensity = 2.0 + Math.sin(elapsed * 18) * 0.8;
        } else {
          // Off-screen recharging
          rocketGroup.visible = false;
        }

        // Shooting Star Meteor (Shoots occasionally every 16 seconds)
        const meteorCycle = elapsed % 16;
        if (meteorCycle < 1.2) {
          meteorMat.opacity = Math.sin((meteorCycle / 1.2) * Math.PI) * 0.8;
          const mt = meteorCycle / 1.2;
          meteor.position.set(30 - mt * 60, 28 - mt * 45, -35);
        } else {
          meteorMat.opacity = 0;
        }

        // Gentle Star Twinkle
        starMat.opacity = 0.65 + Math.sin(elapsed * 1.5) * 0.15;

        // Camera Smooth Parallax
        camera.position.x += (targetCamX - camera.position.x) * 0.035;
        camera.position.y += (targetCamY - camera.position.y) * 0.035;
        camera.lookAt(0, 0, -20);
      }

      renderer.render(scene, camera);
    };

    animate(performance.now());

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      disposables.forEach((item) => {
        try {
          item.dispose();
        } catch {
          // ignore cleanup errors
        }
      });

      renderer.dispose();
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [density]);

  if (!hasWebGL) {
    return (
      <div
        className="fixed inset-0 pointer-events-none -z-20 bg-gradient-to-b from-[#05070f] via-[#070b18] to-[#05070f] select-none"
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none -z-20 overflow-hidden select-none ${className || ''}`}
      aria-hidden="true"
    />
  );
};

export default GalaxyBackground;
