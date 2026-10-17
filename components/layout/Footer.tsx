'use client';
import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-vault-border/60 bg-vault-dark/95 py-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="font-display font-bold text-white tracking-wider flex items-center gap-2">
            MIND<span className="text-cyan-400">VAULT</span>
            <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30">
              DBMS PLATFORM
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            A Database-Driven Multiplayer Gaming Platform • MySQL 8+ InnoDB Authority
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs text-gray-400 font-mono">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Persistent Socket.IO
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            MySQL 8+ Pooled
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Firebase Auth Verified
          </span>
        </div>
      </div>
    </footer>
  );
};
