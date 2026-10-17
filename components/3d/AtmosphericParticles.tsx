'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface AtmosphericParticlesProps {
  className?: string;
  count?: number;
}

export const AtmosphericParticles: React.FC<AtmosphericParticlesProps> = ({
  className,
  count = 140,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const testCanvas = document.createElement('canvas');
    const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
    if (!gl) {
      setHasWebGL(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const initialWidth = container.clientWidth || 800;
    const initialHeight = container.clientHeight || 600;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      initialWidth / initialHeight,
      0.1,
      1000
    );
    camera.position.z = 25;

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'low-power',
    });
    renderer.setSize(initialWidth, initialHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities: { x: number; y: number; z: number }[] = [];

    const cyanColor = new THREE.Color(0x00f0ff);
    const purpleColor = new THREE.Color(0x8b5cf6);
    const indigoColor = new THREE.Color(0x6366f1);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 50;
      positions[i3 + 1] = (Math.random() - 0.5) * 40;
      positions[i3 + 2] = (Math.random() - 0.5) * 30;

      // Color variation between cyan and violet
      const mix = Math.random();
      const col = mix < 0.5 ? cyanColor : mix < 0.8 ? purpleColor : indigoColor;
      colors[i3] = col.r;
      colors[i3 + 1] = col.g;
      colors[i3 + 2] = col.b;

      velocities.push({
        x: (Math.random() - 0.5) * 0.004,
        y: 0.005 + Math.random() * 0.008,
        z: (Math.random() - 0.5) * 0.004,
      });
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.09,
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });

    const pointCloud = new THREE.Points(geometry, material);
    scene.add(pointCloud);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!prefersReducedMotion) {
        const pos = geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < count; i++) {
          const i3 = i * 3;
          pos[i3] += velocities[i].x;
          pos[i3 + 1] += velocities[i].y;
          pos[i3 + 2] += velocities[i].z;

          // Wrap boundaries
          if (pos[i3 + 1] > 20) pos[i3 + 1] = -20;
          if (pos[i3] > 25) pos[i3] = -25;
          if (pos[i3] < -25) pos[i3] = 25;
        }
        geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [count]);

  if (!hasWebGL) return null;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden select-none ${className || ''}`}
      aria-hidden="true"
    />
  );
};

export default AtmosphericParticles;
