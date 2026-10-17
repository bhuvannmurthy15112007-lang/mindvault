'use client';

import React from 'react';
import Link from 'next/link';
import { Palette, PenTool, Clock, Shield, Zap, Users, ArrowRight, Sparkles, Award, RotateCcw } from 'lucide-react';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';
import DynamicAtmosphericParticles from '@/components/3d/AtmosphericParticlesWrapper';

export const DrawiceBriefing: React.FC = () => {
  return (
    <div className="relative min-h-screen space-y-12 py-8 px-4 max-w-5xl mx-auto">
      <DynamicAtmosphericParticles count={110} />

      {/* Header Banner */}
      <div className="relative border-b border-vault-border pb-6 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-purple-950/40 border border-purple-500/30 text-purple-400 text-xs font-mono tracking-widest uppercase">
          <Palette className="w-3.5 h-3.5 text-purple-400" />
          SECTOR 04 • MULTIPLAYER DRAWING STUDIO
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl sm:text-5xl font-display font-black text-white uppercase tracking-wider">
              Drawice
            </h1>
            <p className="text-sm font-mono text-purple-400/80 mt-1">
              REAL-TIME SOCKET STROKE & SPEED-GUESS ARENA
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/rooms/create?game=DRAWICE">
              <MindVaultButton variant="secondary" size="md" className="border-purple-500 text-purple-300 hover:bg-purple-600 hover:text-white shadow-glow-purple">
                <Zap className="w-4 h-4 mr-2" /> Host Drawice Studio
              </MindVaultButton>
            </Link>
            <Link href="/rooms/join">
              <MindVaultButton variant="secondary" size="md">
                <Users className="w-4 h-4 mr-2" /> Join Studio Code
              </MindVaultButton>
            </Link>
          </div>
        </div>
      </div>

      {/* Sector Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Directives & Rules (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <MindVaultCard className="p-6 space-y-5 bg-gradient-to-br from-purple-950/30 via-vault-card to-vault-surface border-purple-500/30">
            <h2 className="text-lg font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              Creative Studio Directives & Scoring Algorithm
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed font-sans">
              Drawice is a high-speed artistic battle of perception and quick reflexes. 
              Players alternate taking the digital easel. The selected architect chooses from 3 secret generated words. 
              Opponents race to decode the drawing in real time through low-latency Socket.IO broadcast channels.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded bg-vault-surface border border-vault-border space-y-1">
                <div className="font-mono text-xs text-purple-400 font-bold uppercase flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5" /> Fair Artist Rotation
                </div>
                <p className="text-xs text-gray-400">Every player receives equal drawing opportunities across rounds (min 5 rounds).</p>
              </div>

              <div className="p-3.5 rounded bg-vault-surface border border-vault-border space-y-1">
                <div className="font-mono text-xs text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5" /> Real-Time Vector Sync
                </div>
                <p className="text-xs text-gray-400">Brush strokes, widths, eraser, and color changes synchronize in sub-50ms.</p>
              </div>

              <div className="p-3.5 rounded bg-vault-surface border border-vault-border space-y-1">
                <div className="font-mono text-xs text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> Speed Guessing Decay
                </div>
                <p className="text-xs text-gray-400">1st correct = 10 pts, 2nd = 9 pts, 3rd = 8 pts, rewarding rapid decryption.</p>
              </div>

              <div className="p-3.5 rounded bg-vault-surface border border-vault-border space-y-1">
                <div className="font-mono text-xs text-amber-400 font-bold uppercase flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Artist Reward Matrix
                </div>
                <p className="text-xs text-gray-400">Artist scores 10 + (correct - 1) x 5 points if at least one challenger guesses correctly.</p>
              </div>
            </div>
          </MindVaultCard>

          {/* Color & Canvas Palette Preview */}
          <MindVaultCard className="p-6 space-y-5 bg-vault-card border-vault-border">
            <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2 border-b border-vault-border pb-3">
              <Palette className="w-4 h-4 text-purple-400" />
              Integrated Cyberpunk Palette Preview
            </h3>

            <div className="space-y-4">
              <p className="text-xs text-gray-300 font-sans">
                Artists utilize a 10-swatch neon palette with customizable stroke widths, undo history, and instant canvas wipe:
              </p>

              <div className="flex flex-wrap items-center gap-3">
                {['#00F0FF', '#10B981', '#EF4444', '#F59E0B', '#A855F7', '#3B82F6', '#EC4899', '#FFFFFF', '#94A3B8', '#0B0F17'].map((c, i) => (
                  <div
                    key={i}
                    style={{ backgroundColor: c }}
                    className="w-8 h-8 rounded-full border-2 border-vault-border shadow-md"
                    title={c}
                  />
                ))}
              </div>
            </div>
          </MindVaultCard>
        </div>

        {/* Right Column: Studio Specifications & Host Button (1 col) */}
        <div className="space-y-6">
          <MindVaultCard className="p-6 space-y-4 bg-vault-card border-vault-border">
            <h3 className="font-display font-bold text-white uppercase text-sm tracking-wider border-b border-vault-border pb-3">
              Studio Specs
            </h3>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded bg-vault-surface">
                <span className="text-gray-400">Player Capacity</span>
                <span className="text-purple-400 font-bold">2–10 Players</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-vault-surface">
                <span className="text-gray-400">Rounds</span>
                <span className="text-gray-200">5+ Rounds Equitably</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-vault-surface">
                <span className="text-gray-400">Word Choices</span>
                <span className="text-gray-200">3 Random Secret Words</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-vault-surface">
                <span className="text-gray-400">Transport Layer</span>
                <span className="text-emerald-400 font-bold">Socket.IO WebSockets</span>
              </div>
            </div>

            <div className="pt-4 border-t border-vault-border space-y-2">
              <Link href="/rooms/create?game=DRAWICE" className="block">
                <MindVaultButton variant="secondary" size="md" className="w-full justify-center border-purple-500 text-purple-300 hover:bg-purple-600 hover:text-white shadow-glow-purple">
                  <Zap className="w-4 h-4 mr-1.5" /> Initialize Drawice Room
                </MindVaultButton>
              </Link>
              <Link href="/rooms/join" className="block">
                <MindVaultButton variant="secondary" size="md" className="w-full justify-center">
                  Enter Studio Code
                </MindVaultButton>
              </Link>
            </div>
          </MindVaultCard>

          <div className="text-center">
            <Link href="/games" className="text-xs font-mono text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1">
              ← Return to All Arenas Registry
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawiceBriefing;
