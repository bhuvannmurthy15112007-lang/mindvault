'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, UserCheck, MapPin, FileText, Key, Shield, Zap, Users, ArrowRight, Sparkles, Clock, AlertTriangle } from 'lucide-react';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';
import DynamicAtmosphericParticles from '@/components/3d/AtmosphericParticlesWrapper';

export const DetectiveBriefing: React.FC = () => {
  const [cases, setCases] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/games/detective/cases')
      .then((r) => r.json())
      .then((d) => {
        if (d.cases) setCases(d.cases);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="relative min-h-screen space-y-12 py-8 px-4 max-w-5xl mx-auto">
      <DynamicAtmosphericParticles count={110} />

      {/* Header Banner */}
      <div className="relative border-b border-vault-border pb-6 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-mono tracking-widest uppercase">
          <Search className="w-3.5 h-3.5 text-red-400" />
          SECTOR 02 • FORENSIC HOMICIDE INVESTIGATION
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl sm:text-5xl font-display font-black text-white uppercase tracking-wider">
              Detective
            </h1>
            <p className="text-sm font-mono text-red-400/80 mt-1">
              NOIR FORENSIC ACCUSATION MATRIX
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/rooms/create?game=DETECTIVE">
              <MindVaultButton variant="danger" size="md" className="shadow-glow-crimson">
                <Zap className="w-4 h-4 mr-2" /> Host Case
              </MindVaultButton>
            </Link>
            <Link href="/rooms/join">
              <MindVaultButton variant="secondary" size="md">
                <Users className="w-4 h-4 mr-2" /> Join Case Room
              </MindVaultButton>
            </Link>
          </div>
        </div>
      </div>

      {/* Sector Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Sector Directives & Budget (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <MindVaultCard className="p-6 space-y-5 bg-gradient-to-br from-red-950/30 via-vault-card to-vault-surface border-red-500/30">
            <h2 className="text-lg font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-400" />
              Investigative Protocol & Action Budget
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed font-sans">
              Enter rain-slicked city streets and high-security penthouses. Your investigative squad shares a 
              finite budget of 100 tactical points per homicide case. Every interrogation, forensic swab, and 
              cryptographic timeline unlock consumes precious resources. Once exhausted, you must deliver your formal indictment.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded bg-vault-surface border border-vault-border space-y-1">
                <div className="font-mono text-xs text-red-400 font-bold uppercase flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" /> Suspect Interrogation (-10 Pts)
                </div>
                <p className="text-xs text-gray-400">Interrogate suspects to reveal alibis, hidden motives, and conflicting witness testimonies.</p>
              </div>

              <div className="p-3.5 rounded bg-vault-surface border border-vault-border space-y-1">
                <div className="font-mono text-xs text-amber-400 font-bold uppercase flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Crime Scene Scours (-10 Pts)
                </div>
                <p className="text-xs text-gray-400">Search key crime scene sectors for hidden physical weapons and biological traces.</p>
              </div>

              <div className="p-3.5 rounded bg-vault-surface border border-vault-border space-y-1">
                <div className="font-mono text-xs text-cyan-400 font-bold uppercase flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Evidence Forensics (-15 Pts)
                </div>
                <p className="text-xs text-gray-400">Perform deep laboratory lab analysis on recovered ballistics, fingerprints, and fibers.</p>
              </div>

              <div className="p-3.5 rounded bg-vault-surface border border-vault-border space-y-1">
                <div className="font-mono text-xs text-purple-400 font-bold uppercase flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" /> Cryptographic Ciphers (-20 Pts)
                </div>
                <p className="text-xs text-gray-400">Decode encrypted terminals to discover unredacted timeline events and CCTV logs.</p>
              </div>
            </div>
          </MindVaultCard>

          {/* Active Case Files Roster */}
          <MindVaultCard className="p-6 space-y-5 bg-vault-card border-vault-border">
            <div className="flex items-center justify-between border-b border-vault-border pb-3">
              <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-400" />
                Active Case Files in Database
              </h3>
              <span className="text-[10px] font-mono text-red-400 uppercase bg-red-950/40 border border-red-500/30 px-2 py-0.5 rounded">
                Authoritative Case Registry
              </span>
            </div>

            <div className="space-y-3">
              {cases.length === 0 ? (
                <div className="text-xs font-mono text-gray-400 p-4 bg-vault-surface rounded">
                  Querying authoritative MySQL case files...
                </div>
              ) : (
                cases.map((c) => (
                  <div key={c.case_id} className="p-4 rounded-lg bg-vault-surface border border-vault-border space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display font-bold text-white text-base">{c.title}</h4>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40 font-bold">
                        {c.difficulty || 'MEDIUM'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 font-sans leading-relaxed">{c.description}</p>
                    <div className="text-[11px] font-mono text-gray-500">
                      Victim: <span className="text-gray-300">{c.victim_name}</span> • Crime Scene: <span className="text-gray-300">{c.crime_scene_location}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </MindVaultCard>
        </div>

        {/* Right Column: Specifications & Accusation Rules (1 col) */}
        <div className="space-y-6">
          <MindVaultCard className="p-6 space-y-4 bg-vault-card border-vault-border">
            <h3 className="font-display font-bold text-white uppercase text-sm tracking-wider border-b border-vault-border pb-3">
              Investigation Specs
            </h3>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded bg-vault-surface">
                <span className="text-gray-400">Team Scale</span>
                <span className="text-red-400 font-bold">1–10 Players (Solo/Co-op)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-vault-surface">
                <span className="text-gray-400">Action Budget</span>
                <span className="text-gray-200">100 Points Total</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-vault-surface">
                <span className="text-gray-400">Accusation Reqs</span>
                <span className="text-gray-200">Culprit, Motive, Evidence</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-vault-surface">
                <span className="text-gray-400">Data Source</span>
                <span className="text-emerald-400 font-bold">MySQL InnoDB Foreign Keys</span>
              </div>
            </div>

            <div className="pt-4 border-t border-vault-border space-y-2">
              <Link href="/rooms/create?game=DETECTIVE" className="block">
                <MindVaultButton variant="danger" size="md" className="w-full justify-center shadow-glow-crimson">
                  <Zap className="w-4 h-4 mr-1.5" /> Initialize Case Room
                </MindVaultButton>
              </Link>
              <Link href="/rooms/join" className="block">
                <MindVaultButton variant="secondary" size="md" className="w-full justify-center">
                  Join Investigation Code
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

export default DetectiveBriefing;
