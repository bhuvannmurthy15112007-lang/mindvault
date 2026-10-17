'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface VaultHeroSceneProps {
  className?: string;
  onLoaded?: () => void;
}

export const VaultHeroScene: React.FC<VaultHeroSceneProps> = ({ className, onLoaded }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check WebGL availability
    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!gl) {
      setHasWebGL(false);
      onLoaded?.();
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // Media query for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Scene & Fog for cinematic atmospheric depth
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07090e, 0.024);

    const initialWidth = container.clientWidth || 1000;
    const initialHeight = container.clientHeight || 700;

    // Camera setup - wide cinematic perspective
    const camera = new THREE.PerspectiveCamera(
      50,
      initialWidth / initialHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.2, 18);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(initialWidth, initialHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // Track objects for disposal
    const disposables: { dispose: () => void }[] = [];
    const registerDisposable = <T extends { dispose: () => void }>(item: T): T => {
      disposables.push(item);
      return item;
    };

    // ==========================================
    // 1. CINEMATIC LIGHTING SETUP
    // ==========================================
    const ambientLight = new THREE.AmbientLight(0x080e1e, 2.2);
    scene.add(ambientLight);

    // Key Light: Radiant Cyber Cyan
    const cyanKeyLight = new THREE.DirectionalLight(0x00f0ff, 3.8);
    cyanKeyLight.position.set(-10, 12, 14);
    scene.add(cyanKeyLight);

    // Rim Light: Royal Violet
    const purpleRimLight = new THREE.DirectionalLight(0x8b5cf6, 3.0);
    purpleRimLight.position.set(12, -8, 10);
    scene.add(purpleRimLight);

    // Warm Gold Specular Accent (Anime sci-fi contrast)
    const goldAccentLight = new THREE.DirectionalLight(0xffd700, 1.6);
    goldAccentLight.position.set(0, 14, -8);
    scene.add(goldAccentLight);

    // Pulsing Core Point Light
    const corePointLight = new THREE.PointLight(0x00f0ff, 4.5, 30);
    corePointLight.position.set(0, 1.0, 1.5);
    scene.add(corePointLight);

    const innerPointLight = new THREE.PointLight(0xa855f7, 3.0, 20);
    innerPointLight.position.set(0, 1.0, -1.0);
    scene.add(innerPointLight);

    // ==========================================
    // 2. MATERIALS
    // ==========================================
    const darkTitaniumMat = registerDisposable(
      new THREE.MeshStandardMaterial({
        color: 0x0a0f1d,
        metalness: 0.94,
        roughness: 0.2,
      })
    );

    const brushedAlloyMat = registerDisposable(
      new THREE.MeshStandardMaterial({
        color: 0x141d2e,
        metalness: 0.88,
        roughness: 0.28,
        emissive: 0x002f44,
        emissiveIntensity: 0.4,
      })
    );

    const cyanGlowMat = registerDisposable(
      new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 2.0,
        roughness: 0.1,
      })
    );

    const purpleGlowMat = registerDisposable(
      new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0xa855f7,
        emissiveIntensity: 1.8,
        roughness: 0.1,
      })
    );

    const goldGlowMat = registerDisposable(
      new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffa500,
        emissiveIntensity: 1.5,
        roughness: 0.2,
      })
    );

    // ==========================================
    // 3. INFINITE PERSPECTIVE CYBER GRID FLOOR
    // ==========================================
    const gridHelper = new THREE.GridHelper(70, 50, 0x00f0ff, 0x162238);
    gridHelper.position.set(0, -5.5, 0);
    scene.add(gridHelper);

    // Cyber Horizon Light Bar
    const horizonGeo = registerDisposable(new THREE.BoxGeometry(70, 0.1, 0.1));
    const horizonMesh = new THREE.Mesh(horizonGeo, cyanGlowMat);
    horizonMesh.position.set(0, -5.45, -25);
    scene.add(horizonMesh);

    // ==========================================
    // 4. FLOATING SANCTUARY PILLARS (MONOLITHS)
    // ==========================================
    const pillarsGroup = new THREE.Group();
    scene.add(pillarsGroup);

    const pillarGeo = registerDisposable(new THREE.CylinderGeometry(0.7, 1.1, 16, 6));
    const pillarLightStripGeo = registerDisposable(new THREE.BoxGeometry(0.12, 15, 0.12));

    const pillarConfigs = [
      { x: -13, y: -0.5, z: -8, rotY: 0.3 },
      { x: 13, y: -0.5, z: -8, rotY: -0.3 },
      { x: -16, y: 1.5, z: -16, rotY: 0.6 },
      { x: 16, y: 1.5, z: -16, rotY: -0.6 },
      { x: -9, y: -2.0, z: -22, rotY: 0.1 },
      { x: 9, y: -2.0, z: -22, rotY: -0.1 },
    ];

    const pillarMeshes: THREE.Group[] = [];

    pillarConfigs.forEach((cfg, idx) => {
      const pGroup = new THREE.Group();
      pGroup.position.set(cfg.x, cfg.y, cfg.z);
      pGroup.rotation.y = cfg.rotY;

      const pMesh = new THREE.Mesh(pillarGeo, darkTitaniumMat);
      pGroup.add(pMesh);

      // Vertical neon power conduit
      const stripMat = idx % 2 === 0 ? cyanGlowMat : purpleGlowMat;
      const stripMesh = new THREE.Mesh(pillarLightStripGeo, stripMat);
      stripMesh.position.set(0, 0, 0.85);
      pGroup.add(stripMesh);

      pillarsGroup.add(pGroup);
      pillarMeshes.push(pGroup);
    });

    // ==========================================
    // 5. THE MAIN 3D VAULT GATEWAY & CORE
    // ==========================================
    const vaultGroup = new THREE.Group();
    vaultGroup.position.set(0, 1.0, 0);
    scene.add(vaultGroup);

    // --- Ring 1: Outer Aether Gear Gate ---
    const outerRingGroup = new THREE.Group();
    vaultGroup.add(outerRingGroup);

    const outerTorusGeo = registerDisposable(new THREE.TorusGeometry(6.2, 0.28, 20, 96));
    const outerTorus = new THREE.Mesh(outerTorusGeo, darkTitaniumMat);
    outerRingGroup.add(outerTorus);

    const outerNeonGeo = registerDisposable(new THREE.TorusGeometry(6.55, 0.04, 12, 96));
    const outerNeon = new THREE.Mesh(outerNeonGeo, cyanGlowMat);
    outerRingGroup.add(outerNeon);

    // 32 Perimeter Mechanical Locking Cogs with Gold Nodes
    const toothGeo = registerDisposable(new THREE.BoxGeometry(0.26, 0.65, 0.4));
    const glyphNodeGeo = registerDisposable(new THREE.BoxGeometry(0.12, 0.12, 0.12));
    const numTeeth = 32;

    for (let i = 0; i < numTeeth; i++) {
      const angle = (i / numTeeth) * Math.PI * 2;
      const tooth = new THREE.Mesh(toothGeo, i % 2 === 0 ? brushedAlloyMat : darkTitaniumMat);
      tooth.position.set(Math.cos(angle) * 6.2, Math.sin(angle) * 6.2, 0);
      tooth.rotation.z = angle;
      outerRingGroup.add(tooth);

      if (i % 4 === 0) {
        const glyphNode = new THREE.Mesh(glyphNodeGeo, goldGlowMat);
        glyphNode.position.set(Math.cos(angle) * 6.6, Math.sin(angle) * 6.6, 0.15);
        outerRingGroup.add(glyphNode);
      }
    }

    // --- Ring 2: Chrono Lock Ring (Counter-rotating) ---
    const midRingGroup = new THREE.Group();
    vaultGroup.add(midRingGroup);

    const midTorusGeo = registerDisposable(new THREE.TorusGeometry(4.5, 0.22, 16, 80));
    const midTorus = new THREE.Mesh(midTorusGeo, brushedAlloyMat);
    midRingGroup.add(midTorus);

    const midNeonGeo = registerDisposable(new THREE.TorusGeometry(4.28, 0.035, 12, 80));
    const midNeon = new THREE.Mesh(midNeonGeo, purpleGlowMat);
    midRingGroup.add(midNeon);

    // 16 Hydraulic Locking Bolts
    const boltGeo = registerDisposable(new THREE.BoxGeometry(0.2, 1.1, 0.3));
    const numBolts = 16;
    for (let i = 0; i < numBolts; i++) {
      const angle = (i / numBolts) * Math.PI * 2;
      const bolt = new THREE.Mesh(boltGeo, darkTitaniumMat);
      bolt.position.set(Math.cos(angle) * 4.5, Math.sin(angle) * 4.5, 0.1);
      bolt.rotation.z = angle + Math.PI / 2;
      midRingGroup.add(bolt);
    }

    // --- Ring 3: Inner Aperture Iris ---
    const innerRingGroup = new THREE.Group();
    vaultGroup.add(innerRingGroup);

    const innerTorusGeo = registerDisposable(new THREE.TorusGeometry(3.1, 0.16, 16, 64));
    const innerTorus = new THREE.Mesh(innerTorusGeo, darkTitaniumMat);
    innerRingGroup.add(innerTorus);

    const bladeGeo = registerDisposable(new THREE.BoxGeometry(0.14, 0.85, 0.2));
    const numBlades = 10;
    for (let i = 0; i < numBlades; i++) {
      const angle = (i / numBlades) * Math.PI * 2;
      const blade = new THREE.Mesh(bladeGeo, brushedAlloyMat);
      blade.position.set(Math.cos(angle) * 3.1, Math.sin(angle) * 3.1, 0.12);
      blade.rotation.z = angle + 0.5;
      innerRingGroup.add(blade);
    }

    // --- Core: The Quantum Nexus Reactor ---
    const coreGroup = new THREE.Group();
    vaultGroup.add(coreGroup);

    // Outer Wireframe Polyhedral Cage
    const cageGeo = registerDisposable(new THREE.IcosahedronGeometry(1.65, 1));
    const cageMat = registerDisposable(
      new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        wireframe: true,
        transparent: true,
        opacity: 0.75,
      })
    );
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    coreGroup.add(cageMesh);

    // Inner Glowing Faceted Stellar Crystal
    const crystalGeo = registerDisposable(new THREE.OctahedronGeometry(1.15, 2));
    const crystalMat = registerDisposable(
      new THREE.MeshStandardMaterial({
        color: 0x0b1328,
        emissive: 0x6366f1,
        emissiveIntensity: 1.2,
        roughness: 0.12,
        metalness: 0.9,
      })
    );
    const crystalMesh = new THREE.Mesh(crystalGeo, crystalMat);
    coreGroup.add(crystalMesh);

    // Dual Gyroscopic Tilted Energy Rings
    const gyroGeo = registerDisposable(new THREE.TorusGeometry(2.1, 0.045, 12, 60));
    const gyro1 = new THREE.Mesh(gyroGeo, cyanGlowMat);
    gyro1.rotation.x = Math.PI / 3;
    gyro1.rotation.y = Math.PI / 6;
    coreGroup.add(gyro1);

    const gyro2 = new THREE.Mesh(gyroGeo, purpleGlowMat);
    gyro2.rotation.x = -Math.PI / 3;
    gyro2.rotation.y = -Math.PI / 4;
    coreGroup.add(gyro2);

    // Swarm of Orbiting Prismatic Crystal Shards
    const shardGeo1 = registerDisposable(new THREE.TetrahedronGeometry(0.22));
    const shardGeo2 = registerDisposable(new THREE.ConeGeometry(0.16, 0.42, 5));
    const shardMat = registerDisposable(new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
    const shardMat2 = registerDisposable(new THREE.MeshBasicMaterial({ color: 0xffd700 }));

    const orbitingShards: THREE.Mesh[] = [];
    const numShards = 10;
    for (let i = 0; i < numShards; i++) {
      const isGold = i % 3 === 0;
      const shard = new THREE.Mesh(
        i % 2 === 0 ? shardGeo1 : shardGeo2,
        isGold ? shardMat2 : shardMat
      );
      coreGroup.add(shard);
      orbitingShards.push(shard);
    }

    // ==========================================
    // 6. ATMOSPHERIC QUANTUM VORTEX PARTICLES
    // ==========================================
    const particleCount = 420;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleData: { vx: number; vy: number; vz: number; radius: number; angle: number; speed: number }[] = [];

    const colCyan = new THREE.Color(0x00f0ff);
    const colPurple = new THREE.Color(0x8b5cf6);
    const colGold = new THREE.Color(0xffd700);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const radius = 2.5 + Math.random() * 18;
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 22;

      particlePositions[i3] = Math.cos(angle) * radius;
      particlePositions[i3 + 1] = y;
      particlePositions[i3 + 2] = Math.sin(angle) * radius;

      const pick = Math.random();
      const col = pick < 0.55 ? colCyan : pick < 0.85 ? colPurple : colGold;
      particleColors[i3] = col.r;
      particleColors[i3 + 1] = col.g;
      particleColors[i3 + 2] = col.b;

      particleData.push({
        vx: (Math.random() - 0.5) * 0.003,
        vy: 0.006 + Math.random() * 0.012,
        vz: (Math.random() - 0.5) * 0.003,
        radius,
        angle,
        speed: 0.003 + Math.random() * 0.007,
      });
    }

    const particleGeometry = registerDisposable(new THREE.BufferGeometry());
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = registerDisposable(
      new THREE.PointsMaterial({
        size: 0.09,
        vertexColors: true,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
      })
    );

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // ==========================================
    // 7. INTERACTION, CAMERA & ANIMATION LOOP
    // ==========================================
    let mouseX = 0;
    let mouseY = 0;
    let targetCameraX = 0;
    let targetCameraY = 1.2;
    let targetVaultRotX = 0;
    let targetVaultRotY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const halfWidth = window.innerWidth / 2;
      const halfHeight = window.innerHeight / 2;
      mouseX = (e.clientX - halfWidth) / halfWidth;
      mouseY = (e.clientY - halfHeight) / halfHeight;

      // Sweeping parallax
      targetCameraX = mouseX * 2.5;
      targetCameraY = 1.2 - mouseY * 1.5;
      targetVaultRotY = mouseX * 0.32;
      targetVaultRotX = -mouseY * 0.24;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 1000;
      const h = container.clientHeight || 700;
      camera.aspect = w / h;

      if (w < 640) {
        camera.position.z = 24;
        camera.fov = 58;
      } else if (w < 1024) {
        camera.position.z = 20;
        camera.fov = 52;
      } else {
        camera.position.z = 18;
        camera.fov = 50;
      }

      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);
    handleResize();

    let animationFrameId: number;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = ((currentTime || performance.now()) - startTime) * 0.001;

      if (!prefersReducedMotion) {
        // Continuous Gate Rotations
        outerRingGroup.rotation.z += 0.002;
        midRingGroup.rotation.z -= 0.0032;
        innerRingGroup.rotation.z += 0.0042;

        // Core Rotations
        cageMesh.rotation.x = elapsedTime * 0.4;
        cageMesh.rotation.y = elapsedTime * 0.55;
        crystalMesh.rotation.x = -elapsedTime * 0.3;
        crystalMesh.rotation.y = elapsedTime * 0.45;

        gyro1.rotation.z = elapsedTime * 0.9;
        gyro2.rotation.z = -elapsedTime * 0.8;

        // Orbiting Crystal Shards
        orbitingShards.forEach((shard, idx) => {
          const orbitAngle = elapsedTime * 1.3 + (idx * Math.PI * 2) / numShards;
          const r = 2.25 + Math.sin(elapsedTime * 2 + idx) * 0.25;
          shard.position.set(
            Math.cos(orbitAngle) * r,
            Math.sin(orbitAngle) * r * 0.55 + Math.sin(elapsedTime * 3 + idx) * 0.3,
            Math.sin(orbitAngle) * 0.9
          );
          shard.rotation.x += 0.03;
          shard.rotation.y += 0.04;
        });

        // Pulsing Core Light & Crystal Scale
        const pulse = Math.sin(elapsedTime * 3.0);
        corePointLight.intensity = 4.2 + pulse * 1.5;
        crystalMesh.scale.setScalar(1.0 + pulse * 0.04);

        // Levitating Monolith Pillars
        pillarMeshes.forEach((p, idx) => {
          p.position.y = pillarConfigs[idx].y + Math.sin(elapsedTime * 1.4 + idx) * 0.4;
        });

        // Atmospheric Particle Vortex Movement
        const pos = particleGeometry.attributes.position.array as Float32Array;
        for (let i = 0; i < particleCount; i++) {
          const i3 = i * 3;
          const p = particleData[i];

          p.angle += p.speed;
          pos[i3] = Math.cos(p.angle) * p.radius;
          pos[i3 + 1] += p.vy;
          pos[i3 + 2] = Math.sin(p.angle) * p.radius;

          if (pos[i3 + 1] > 12) {
            pos[i3 + 1] = -10;
          }
        }
        particleGeometry.attributes.position.needsUpdate = true;

        // Smooth Camera & Vault Parallax with Damping/Lerp
        camera.position.x += (targetCameraX - camera.position.x) * 0.045;
        camera.position.y += (targetCameraY - camera.position.y) * 0.045;
        camera.lookAt(0, 1.0, 0);

        vaultGroup.rotation.y += (targetVaultRotY - vaultGroup.rotation.y) * 0.05;
        vaultGroup.rotation.x += (targetVaultRotX - vaultGroup.rotation.x) * 0.05;
      }

      renderer.render(scene, camera);
    };

    animate(performance.now());
    onLoaded?.();

    // Strict Cleanup on Unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      resizeObserver.disconnect();

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
  }, [onLoaded]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none pointer-events-none ${className || ''}`}
      aria-hidden="true"
    >
      {!hasWebGL && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-80 h-80 rounded-full border-2 border-cyan-500/30 flex items-center justify-center animate-pulse">
            <div className="w-64 h-64 rounded-full border border-purple-500/40 border-dashed animate-spin" />
            <div className="absolute w-44 h-44 rounded-full bg-cyan-500/10 blur-xl" />
            <div className="absolute font-mono text-cyan-400 text-xs tracking-widest uppercase">
              MINDVAULT SANCTUM // ONLINE
            </div>
          </div>
        </div>
      )}

      {/* Cybernetic ambient illumination layers */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none -z-10" />
    </div>
  );
};

export default VaultHeroScene;
