'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// SSR disabled so Three.js renders strictly client-side with zero hydration mismatch
export const DynamicGalaxyBackground = dynamic(
  () => import('./GalaxyBackground').then((mod) => mod.GalaxyBackground),
  {
    ssr: false,
    loading: () => (
      <div
        className="fixed inset-0 pointer-events-none -z-20 bg-gradient-to-b from-[#05070f] via-[#070b18] to-[#05070f] select-none"
        aria-hidden="true"
      />
    ),
  }
);

export default DynamicGalaxyBackground;
