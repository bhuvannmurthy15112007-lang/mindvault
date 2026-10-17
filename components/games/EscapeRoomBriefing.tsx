'use client';

import React from 'react';
import Link from 'next/link';
import { KeyRound, Lock, Clock, Shield, Zap, Users, ArrowRight, Sparkles, Layers, Compass, HelpCircle } from 'lucide-react';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';
import DynamicAtmosphericParticles from '@/components/3d/AtmosphericParticlesWrapper';

export const EscapeRoomBriefing: React.FC = () => {
  return (
    <div className="relative min-h-screen space-y-12 py-8 px-4 max-w-5xl mx-auto">
      <DynamicAtmosphericParticles count={110} />

      {/* Header Banner */}
      <div className="relative border-b border-vault-border pb-6 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-amber-950/40 border border-amber-500/30 text-amber-400 text-xs font-mono tracking-widest uppercase">
          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
          SECTOR 03 • COOPERATIVE VAULT BREAKOUT
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl sm:text-5xl font-display font-black text-white uppercase tracking-wider">
              Escape Room
            </h1>
            <p className="text-sm font-mono text-amber-400/80 mt-1">
              AUTHORITATIVE 10-MINUTE BREAKOUT PROTOCOL
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/rooms/create?game=ESCAPE_ROOM">
              <MindVaultButton variant="amber" size="md" className="shadow-glow-amber">
                <Zap className="w-4 h-4 mr-2" /> Host Escape Room
              </MindVaultButton>
            </Link>
            <Link href="/rooms/join">
              <MindVaultButton variant="secondary" size="md">
                <Users className="w-4 h-4 mr-2" /> Join Room Code
              </MindVaultButton>
            </Link>
          </div>
        </div>
      </div>

      {/* Sector Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Directives & 6-Tab Interface (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <MindVaultCard className="p-6 space-y-5 bg-gradient-to-br from-amber-950/30 via-vault-card to-vault-surface border-amber-500/30">
            <h2 className="text-lg font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              Chamber Infiltration & Lock Override Directives
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed font-sans">
              You and your infiltration squad are locked inside a multi-chamber security installation. 
              The server initiates an authoritative 10-minute countdown (600 seconds) the moment the mission starts. 
              Inspect interactive room objects, deduce keypad combinations and cryptographic frequencies, and override 
              all sequential chamber mechanisms before security protocol timeout.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded bg-vault-surface border border-vault-border space-y-1">
                <div className="font-mono text-xs text-amber-400 font-bold uppercase flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> 10:00 Authoritative Clock
                </div>
                <p className="text-xs text-gray-400">Synchronized server-authoritative countdown. Refreshing never resets the clock.</p>
              </div>

              <div className="p-3.5 rounded bg-vault-surface border border-vault-border space-y-1">
                <div className="font-mono text-xs text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> 6-Tab Tactical Terminal
                </div>
                <p className="text-xs text-gray-400">Navigate Room, Objects, Clues, Puzzles, Progress, and Team dynamically.</p>
              </div>

              <div className="p-3.5 rounded bg-vault-surface border border-vault-border space-y-1">
                <div className="font-mono text-xs text-purple-400 font-bold uppercase flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" /> Strictly 2 Tactical Hints
                </div>
                <p className="text-xs text-gray-400">Conserve hints carefully. The server enforces a hard limit of two hints per entire run.</p>
              </div>

              <div className="p-3.5 rounded bg-vault-surface border border-vault-border space-y-1">
                <div className="font-mono text-xs text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Multi-Room Progression
                </div>
                <p className="text-xs text-gray-400">Unlock sequential blast doors to evacuate the facility. Verified with salted SHA hashes.</p>
              </div>
            </div>
          </MindVaultCard>

          {/* Difficulty Tiers Card */}
          <MindVaultCard className="p-6 space-y-5 bg-vault-card border-vault-border">
            <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2 border-b border-vault-border pb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Available Mission Difficulty Tiers
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-vault-surface border border-emerald-500/30 space-y-2">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                  EASY
                </span>
                <p className="text-xs text-gray-300 font-sans leading-relaxed">
                  Direct clues and straightforward numeric sequences. Ideal for novice infiltration units.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-vault-surface border border-amber-500/30 space-y-2">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                  MEDIUM
                </span>
                <p className="text-xs text-gray-300 font-sans leading-relaxed">
                  Multi-step deductive reasoning, physical pattern matching, and frequency synchronization.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-vault-surface border border-red-500/30 space-y-2">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 uppercase">
                  HARD
                </span>
                <p className="text-xs text-gray-300 font-sans leading-relaxed">
                  Cryptographic ciphers, hidden coordinate deductions, and complex interlocked keypad logic.
                </p>
              </div>
            </div>
          </MindVaultCard>
        </div>

        {/* Right Column: Specifications & Host Button (1 col) */}
        <div className="space-y-6">
          <MindVaultCard className="p-6 space-y-4 bg-vault-card border-vault-border">
            <h3 className="font-display font-bold text-white uppercase text-sm tracking-wider border-b border-vault-border pb-3">
              Chamber Specs
            </h3>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded bg-vault-surface">
                <span className="text-gray-400">Team Scale</span>
                <span className="text-amber-400 font-bold">1–5 Players (Co-op)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-vault-surface">
                <span className="text-gray-400">Countdown Limit</span>
                <span className="text-gray-200">10:00 (600 Seconds)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-vault-surface">
                <span className="text-gray-400">Tactical Hints</span>
                <span className="text-gray-200">2 Hints Maximum</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-vault-surface">
                <span className="text-gray-400">Answer Verification</span>
                <span className="text-emerald-400 font-bold">Server SHA-256 Hashes</span>
              </div>
            </div>

            <div className="pt-4 border-t border-vault-border space-y-2">
              <Link href="/rooms/create?game=ESCAPE_ROOM" className="block">
                <MindVaultButton variant="amber" size="md" className="w-full justify-center shadow-glow-amber">
                  <Zap className="w-4 h-4 mr-1.5" /> Initialize Escape Chamber
                </MindVaultButton>
              </Link>
              <Link href="/rooms/join" className="block">
                <MindVaultButton variant="secondary" size="md" className="w-full justify-center">
                  Enter Infiltration Code
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

export default EscapeRoomBriefing;
