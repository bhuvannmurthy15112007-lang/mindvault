'use client';

import React from 'react';
import Link from 'next/link';
import {
  Target,
  Search,
  KeyRound,
  Palette,
  Users,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Layers,
  Award,
  Sparkles,
  Compass
} from 'lucide-react';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';
import DynamicAtmosphericParticles from '@/components/3d/AtmosphericParticlesWrapper';

export default function GamesHubPage() {
  const games = [
    {
      code: 'PREDICTION_ARENA',
      name: 'Prediction Arena',
      href: '/games/prediction',
      players: '2–10 Players',
      sector: 'SECTOR 01',
      tagline: 'Pure Mathematical Strategy',
      description:
        'A battle of psychological game theory and probability. Submit an integer from 0 to 100 to target 80% of the lobby average. Duplicate submissions are penalized with -1, while exact target matches immediately penalize opponents with -2.',
      rules: [
        'Each round gives all players 30 seconds to lock in an integer from 0 to 100.',
        'Target calculation: Target = Average of all submitted numbers × 0.8.',
        'Duplicate number selections trigger a -1 point penalty and are ineligible to win.',
        'Exact target matches win immediately and inflict a -2 point strike on all rivals.',
        '0-vs-100 Rule: If 0 is chosen, a unique 100 inverts victory to 100.'
      ],
      icon: Target,
      color: 'text-cyan-400',
      borderAccent: 'border-cyan-500/50',
      badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      bgGradient: 'from-cyan-950/30 via-vault-card to-vault-dark',
      glow: 'cyan' as const
    },
    {
      code: 'DETECTIVE',
      name: 'Detective',
      href: '/games/detective',
      players: '1–10 Players',
      sector: 'SECTOR 02',
      tagline: 'Noir Forensic Mystery',
      description:
        'Cooperative noir murder investigation. Interrogate high-society suspects, scour 4 detailed crime scenes for physical evidence, decrypt cryptographic evidence timestamps, and deliver the definitive accusation.',
      rules: [
        'Shared investigation budget: 100 tactical points per homicide case.',
        'Action costs: Interrogate (-10), Crime Scene search (-10), Evidence analysis (-15).',
        'Cryptographic cipher terminals (-20) unlock classified timeline evidence.',
        'Final Accusation: Must pinpoint the Culprit, Motive, Weapon, and Key Evidence.',
        'Correct accusation grants high-tier detective points and unlocks case dossier.'
      ],
      icon: Search,
      color: 'text-red-400',
      borderAccent: 'border-red-500/50',
      badgeClass: 'bg-red-500/10 text-red-400 border-red-500/30',
      bgGradient: 'from-red-950/30 via-vault-card to-vault-dark',
      glow: 'crimson' as const
    },
    {
      code: 'ESCAPE_ROOM',
      name: 'Escape Room',
      href: '/games/escape-room',
      players: '1–5 Players',
      sector: 'SECTOR 03',
      tagline: 'Cooperative Vault Breakout',
      description:
        'Real-time cooperative multi-chamber escape puzzle. Inspect interactive objects, deduce hidden mathematical & cipher combinations, bypass biometric overrides, and evacuate before the authoritative 10-minute timer expires.',
      rules: [
        'Authoritative 10-minute (600s) server countdown begins when the match launches.',
        '6-Tab Modern Command Terminal: Rooms, Objects, Evidence, Puzzles, Progress, Team.',
        'Strictly 2 tactical hints per session, tracked and enforced server-side.',
        'Multiple difficulty tiers (EASY, MEDIUM, HARD) with progressive puzzle locks.',
        'All solutions securely verified against salted server hashes.'
      ],
      icon: KeyRound,
      color: 'text-amber-400',
      borderAccent: 'border-amber-500/50',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      bgGradient: 'from-amber-950/30 via-vault-card to-vault-dark',
      glow: 'amber' as const
    },
    {
      code: 'DRAWICE',
      name: 'Drawice',
      href: '/games/drawice',
      players: '2–10 Players',
      sector: 'SECTOR 04',
      tagline: 'Multiplayer Drawing Studio',
      description:
        'Low-latency multiplayer sketching and guessing studio. Dynamic artist rotation, secret three-word selections, real-time WebSocket canvas synchronization, and rapid guess-sequence score bonuses.',
      rules: [
        'Artist rotates equitably across rounds (minimum 5 rounds per game).',
        'Artist picks 1 secret word from 3 generated choices, concealed from guessers.',
        'Real-time vector stroke sync with colors, sizes, undo, and clear tools.',
        'Speed Guessing: 1st correct = 10 pts, 2nd = 9 pts, 3rd = 8 pts, with diminishing tiers.',
        'Artist scores 10 + (correct - 1) × 5 points if at least 1 player guesses.'
      ],
      icon: Palette,
      color: 'text-purple-400',
      borderAccent: 'border-purple-500/50',
      badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      bgGradient: 'from-purple-950/30 via-vault-card to-vault-dark',
      glow: 'purple' as const
    }
  ];

  return (
    <div className="relative space-y-12 py-6">
      {/* 3D Atmospheric Background */}
      <DynamicAtmosphericParticles count={100} />

      {/* Header Banner */}
      <div className="relative border-b border-vault-border pb-6 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-vault-card border border-vault-border text-xs font-mono text-cyan-400 uppercase tracking-widest">
          <Layers className="w-3.5 h-3.5" />
          ARENA REGISTRY // 4 OPERATIONAL SECTORS
        </div>
        <h1 className="text-4xl sm:text-5xl font-display font-black text-white uppercase tracking-wider">
          MindVault Arenas
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 font-mono max-w-2xl">
          Inspect tactical rules, mechanical parameters, and player limits across all four canonical multiplayer sectors.
        </p>
      </div>

      {/* Arenas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {games.map((g) => {
          const Icon = g.icon;
          return (
            <MindVaultCard
              key={g.code}
              glow={g.glow}
              className={`relative bg-gradient-to-br ${g.bgGradient} space-y-6 flex flex-col justify-between border border-vault-border hover:border-gray-500 transition-all duration-300 shadow-xl group`}
            >
              {/* Sector Watermark */}
              <div className="absolute top-3 right-4 font-mono text-[10px] font-bold text-gray-600 uppercase tracking-widest pointer-events-none">
                {g.sector}
              </div>

              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3.5 rounded-xl border ${g.borderAccent} bg-vault-dark/80 group-hover:scale-105 transition-transform duration-200`}>
                      <Icon className={'w-7 h-7 ' + g.color} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-display font-black text-white group-hover:text-cyan-300 transition-colors">
                        {g.name}
                      </h2>
                      <span className="text-xs font-mono text-gray-400 uppercase tracking-wider block mt-0.5">
                        {g.tagline}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Player Limit & Overview */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono px-3 py-1 rounded border ${g.badgeClass}`}>
                    {g.players}
                  </span>
                  <span className="text-xs font-mono bg-vault-surface/90 border border-vault-border px-3 py-1 rounded text-gray-300">
                    Authoritative Sync
                  </span>
                </div>

                <p className="text-sm text-gray-300 leading-relaxed font-sans">{g.description}</p>

                {/* Core Rules List */}
                <div className="space-y-2 pt-3 border-t border-vault-border/60">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-bold block flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Sector Directives & Mechanics:
                  </span>
                  <ul className="text-xs text-gray-400 space-y-1.5 list-none font-sans">
                    {g.rules.map((r, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-gray-500 font-mono mt-0.5">›</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-vault-border/60 flex flex-wrap sm:flex-nowrap gap-3">
                <Link href={'/rooms/create?game=' + g.code} className="flex-1">
                  <MindVaultButton variant="primary" size="md" className="w-full justify-center shadow-none group-hover:shadow-glow-cyan">
                    Host Match
                  </MindVaultButton>
                </Link>
                <Link href={g.href} className="flex-1">
                  <MindVaultButton variant="secondary" size="md" className="w-full justify-center">
                    Sector Intel
                  </MindVaultButton>
                </Link>
              </div>
            </MindVaultCard>
          );
        })}
      </div>
    </div>
  );
}
