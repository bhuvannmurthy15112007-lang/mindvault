'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Award, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import { MindVaultCard } from '@/components/ui/MindVaultCard';
import DynamicAtmosphericParticles from '@/components/3d/AtmosphericParticlesWrapper';

export default function AchievementsPage() {
  const { token } = useAuth();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/achievements', {
      headers: token ? { 'Authorization': 'Bearer ' + token } : {}
    })
      .then(res => res.json())
      .then(data => setAchievements(data.achievements || []))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="relative space-y-8 py-6">
      <DynamicAtmosphericParticles count={90} />
      <div className="border-b border-vault-border pb-4 relative z-10">
        <div className="flex items-center gap-2">
          <Award className="w-6 h-6 text-cyan-400" />
          <h1 className="text-3xl font-display font-black text-white uppercase tracking-wider">
            Vault Achievements
          </h1>
        </div>
        <p className="text-xs text-gray-400 font-mono mt-1">
          Server-evaluated milestones earned across Prediction Arena, Detective, Escape Room, and Drawice.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 font-mono text-cyan-400 animate-pulse">Scanning Vault Records...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((ach) => (
            <MindVaultCard
              key={ach.achievement_id}
              className={'p-5 space-y-3 ' + (ach.isUnlocked ? 'border-cyan-500/50 bg-cyan-950/20 shadow-glow-cyan/10' : 'opacity-70')}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={'w-10 h-10 rounded-lg border flex items-center justify-center ' + (ach.isUnlocked ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300' : 'border-vault-border bg-vault-surface text-gray-500')}>
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white text-base">{ach.name}</h3>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase">{ach.game_name || 'Global Arena'}</span>
                  </div>
                </div>

                {ach.isUnlocked ? (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3.5 h-3.5" /> UNLOCKED
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] font-mono text-gray-500 bg-vault-surface border border-vault-border px-2 py-0.5 rounded">
                    <Lock className="w-3.5 h-3.5" /> LOCKED
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-300 leading-relaxed">{ach.description}</p>

              <div className="pt-2 border-t border-vault-border/50 text-[10px] font-mono text-gray-400">
                Trigger: <span className="text-gray-200">{ach.requirement_type}</span> ({ach.requirement_value})
              </div>
            </MindVaultCard>
          ))}
        </div>
      )}
    </div>
  );
}
