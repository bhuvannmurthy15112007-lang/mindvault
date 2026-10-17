'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Target, Trophy, Zap, Users, ArrowRight, Shield, Sparkles, HelpCircle, Layers, CheckCircle2, RotateCcw } from 'lucide-react';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';
import DynamicAtmosphericParticles from '@/components/3d/AtmosphericParticlesWrapper';

export const PredictionArenaBriefing: React.FC = () => {
  // Interactive sandbox for target preview
  const [simValues, setSimValues] = useState<number[]>([40, 60, 50, 80]);
  const simSum = simValues.reduce((a, b) => a + b, 0);
  const simAvg = simSum / simValues.length;
  const simTarget = +(simAvg * 0.8).toFixed(2);

  // Check closest to target
  let closestVal = simValues[0];
  let minDiff = Infinity;
  simValues.forEach((val) => {
    const diff = Math.abs(val - simTarget);
    if (diff < minDiff) {
      minDiff = diff;
      closestVal = val;
    }
  });

  return (
    <div className="relative min-h-screen space-y-12 py-8 px-4 max-w-5xl mx-auto">
      <DynamicAtmosphericParticles count={110} />

      {/* Header Banner */}
      <div className="relative border-b border-vault-border pb-6 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-xs font-mono tracking-widest uppercase">
          <Target className="w-3.5 h-3.5 text-cyan-400" />
          SECTOR 01 • MATHEMATICAL GAME THEORY PROTOCOL
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl sm:text-5xl font-display font-black text-white uppercase tracking-wider">
              Prediction Arena
            </h1>
            <p className="text-sm font-mono text-cyan-400/80 mt-1">
              80% TARGET CONVERGENCE MATRIX
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/rooms/create?game=PREDICTION_ARENA">
              <MindVaultButton variant="primary" size="md" className="shadow-glow-cyan">
                <Zap className="w-4 h-4 mr-2" /> Host Arena
              </MindVaultButton>
            </Link>
            <Link href="/rooms/join">
              <MindVaultButton variant="secondary" size="md">
                <Users className="w-4 h-4 mr-2" /> Join with Code
              </MindVaultButton>
            </Link>
          </div>
        </div>
      </div>

      {/* Sector Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Sector Directives (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <MindVaultCard className="p-6 space-y-5 bg-gradient-to-br from-cyan-950/30 via-vault-card to-vault-surface border-cyan-500/30">
            <h2 className="text-lg font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              Tactical Mission Directives
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed font-sans">
              Prediction Arena is an intense psychological warfare environment rooted in the classic Beauty Contest game theory paradox. 
              All competitors simultaneously submit an integer from 0 to 100 within a strict 30-second window. The server calculates the lobby 
              average and scales it by 0.8. The competitor closest to the target claims round victory.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded bg-vault-surface border border-vault-border space-y-1">
                <div className="font-mono text-xs text-cyan-400 font-bold uppercase">30s Submission Window</div>
                <p className="text-xs text-gray-400">Strict server-enforced countdown timer locks inputs synchronously.</p>
              </div>
              <div className="p-3.5 rounded bg-vault-surface border border-vault-border space-y-1">
                <div className="font-mono text-xs text-amber-400 font-bold uppercase">Duplicate Lockout</div>
                <p className="text-xs text-gray-400">Picking the same number as an opponent inflicts -1 pt and invalidates victory.</p>
              </div>
              <div className="p-3.5 rounded bg-vault-surface border border-vault-border space-y-1">
                <div className="font-mono text-xs text-emerald-400 font-bold uppercase">Exact Target Strike</div>
                <p className="text-xs text-gray-400">Matching the rounded target directly penalizes all opponents by -2 pts.</p>
              </div>
              <div className="p-3.5 rounded bg-vault-surface border border-vault-border space-y-1">
                <div className="font-mono text-xs text-purple-400 font-bold uppercase">0-to-100 Inversion</div>
                <p className="text-xs text-gray-400">If 0 is picked, a unique 100 inverts the victory to 100.</p>
              </div>
            </div>
          </MindVaultCard>

          {/* Interactive Simulation Sandbox */}
          <MindVaultCard className="p-6 space-y-5 bg-vault-card border-vault-border">
            <div className="flex items-center justify-between border-b border-vault-border pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider">
                  Interactive Target Simulation Sandbox
                </h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded">
                Live Simulator
              </span>
            </div>

            <p className="text-xs text-gray-400 font-mono">
              Adjust player numbers below to simulate how the authoritative server calculates the target value:
            </p>

            <div className="space-y-3">
              {simValues.map((val, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-vault-surface/60 p-2.5 rounded border border-vault-border">
                  <span className="text-xs font-mono text-gray-400 w-16">Player {idx + 1}:</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={val}
                    onChange={(e) => {
                      const newVals = [...simValues];
                      newVals[idx] = parseInt(e.target.value, 10);
                      setSimValues(newVals);
                    }}
                    className="flex-1 accent-cyan-400 h-2 bg-vault-dark rounded"
                  />
                  <span className="font-mono text-sm font-bold text-cyan-300 w-8 text-right">{val}</span>
                  {val === closestVal && (
                    <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded">
                      Closest Winner!
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 text-center pt-2">
              <div className="p-3 bg-vault-surface rounded border border-vault-border font-mono">
                <div className="text-[10px] text-gray-400 uppercase">Sum</div>
                <div className="text-lg font-bold text-white">{simSum}</div>
              </div>
              <div className="p-3 bg-vault-surface rounded border border-vault-border font-mono">
                <div className="text-[10px] text-gray-400 uppercase">Average</div>
                <div className="text-lg font-bold text-white">{simAvg.toFixed(1)}</div>
              </div>
              <div className="p-3 bg-cyan-950/30 rounded border border-cyan-500/40 font-mono">
                <div className="text-[10px] text-cyan-400 uppercase">Target (Avg x 0.8)</div>
                <div className="text-xl font-bold text-cyan-300">{simTarget}</div>
              </div>
            </div>
          </MindVaultCard>
        </div>

        {/* Right Column: Arena Parameters & Launch (1 col) */}
        <div className="space-y-6">
          <MindVaultCard className="p-6 space-y-4 bg-vault-card border-vault-border">
            <h3 className="font-display font-bold text-white uppercase text-sm tracking-wider border-b border-vault-border pb-3">
              Sector Specifications
            </h3>

            <div className="space-y-3 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded bg-vault-surface">
                <span className="text-gray-400">Player Capacity</span>
                <span className="text-cyan-400 font-bold">2–10 Players</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-vault-surface">
                <span className="text-gray-400">Round Limit</span>
                <span className="text-gray-200">5 Rounds (Default)</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-vault-surface">
                <span className="text-gray-400">Per-Round Clock</span>
                <span className="text-gray-200">30 Seconds</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-vault-surface">
                <span className="text-gray-400">Authoritative State</span>
                <span className="text-emerald-400 font-bold">MySQL InnoDB</span>
              </div>
            </div>

            <div className="pt-4 border-t border-vault-border space-y-2">
              <Link href="/rooms/create?game=PREDICTION_ARENA" className="block">
                <MindVaultButton variant="primary" size="md" className="w-full justify-center shadow-glow-cyan">
                  <Zap className="w-4 h-4 mr-1.5" /> Initialize Arena Room
                </MindVaultButton>
              </Link>
              <Link href="/rooms/join" className="block">
                <MindVaultButton variant="secondary" size="md" className="w-full justify-center">
                  Enter Room Code
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

export default PredictionArenaBriefing;
