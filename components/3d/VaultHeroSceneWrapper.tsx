'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Client-only dynamic import with SSR disabled to guarantee zero hydration mismatch
export const DynamicVaultHeroScene = dynamic(
  () => import('./VaultHeroScene').then((mod) => mod.VaultHeroScene),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full h-full flex items-center justify-center select-none pointer-events-none">
        <div className="relative w-72 h-72 rounded-full border border-cyan-500/20 flex items-center justify-center animate-pulse">
          <div className="w-56 h-56 rounded-full border border-purple-500/20 border-dashed animate-spin" />
          <div className="absolute w-36 h-36 rounded-full bg-cyan-500/5 blur-2xl" />
          <div className="absolute font-mono text-cyan-400/60 text-xs tracking-widest uppercase">
            INITIALIZING VAULT CORE...
          </div>
        </div>
      </div>
    ),
  }
);

export default DynamicVaultHeroScene;
