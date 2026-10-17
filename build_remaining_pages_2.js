const fs = require('fs');
const path = require('path');

// 1. app/achievements/page.tsx
const achievementsPage = `'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Award, CheckCircle2, Lock, ShieldCheck } from 'lucide-react';
import { MindVaultCard } from '@/components/ui/MindVaultCard';

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
    <div className="space-y-8 py-6">
      <div className="border-b border-vault-border pb-4">
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
`;
fs.writeFileSync(path.join(__dirname, 'app', 'achievements', 'page.tsx'), achievementsPage);

// 2. app/history/page.tsx
const historyPage = `'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { History, Trophy, Calendar } from 'lucide-react';
import { MindVaultCard } from '@/components/ui/MindVaultCard';

export default function HistoryPage() {
  const { dbUser, token } = useAuth();
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    fetch('/api/statistics', {
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(res => res.json())
      .then(data => setHistory(data.history || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <div className="space-y-8 py-6">
      <div className="border-b border-vault-border pb-4">
        <div className="flex items-center gap-2">
          <History className="w-6 h-6 text-cyan-400" />
          <h1 className="text-3xl font-display font-black text-white uppercase tracking-wider">
            Match History
          </h1>
        </div>
        <p className="text-xs text-gray-400 font-mono mt-1">
          Historical records of your completed MindVault multiplayer sessions.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20 font-mono text-cyan-400 animate-pulse">Querying MySQL Match Records...</div>
      ) : history.length === 0 ? (
        <div className="text-center py-16 bg-vault-card/40 border border-vault-border rounded-lg text-sm text-gray-400 font-mono">
          No matches found in your career log. Join or host an arena room to create match history!
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((m: any, idx: number) => (
            <MindVaultCard key={idx} className="p-4 flex items-center justify-between font-mono text-xs">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-vault-surface border border-vault-border flex items-center justify-center font-bold text-cyan-400">
                  #{idx + 1}
                </div>
                <div>
                  <div className="font-display font-bold text-white text-sm">{m.game_name}</div>
                  <div className="text-gray-400 text-[11px] flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" /> {m.completed_at || m.created_at}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6 text-right">
                <div>
                  <div className="text-gray-400 text-[10px]">FINAL PLACEMENT</div>
                  <div className="font-bold text-white text-sm">
                    {m.final_rank ? 'Rank #' + m.final_rank : (m.is_winner ? 'VICTOR' : 'FINISHED')}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-[10px]">FINAL SCORE</div>
                  <div className="font-bold text-cyan-400 text-sm">{Math.round(m.final_score)} pts</div>
                </div>
              </div>
            </MindVaultCard>
          ))}
        </div>
      )}
    </div>
  );
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'history', 'page.tsx'), historyPage);

console.log('Achievements and History pages written successfully.');
