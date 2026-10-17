'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { History, Trophy, Calendar } from 'lucide-react';
import { MindVaultCard } from '@/components/ui/MindVaultCard';
import DynamicAtmosphericParticles from '@/components/3d/AtmosphericParticlesWrapper';

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
    <div className="relative space-y-8 py-6">
      <DynamicAtmosphericParticles count={90} />
      <div className="border-b border-vault-border pb-4 relative z-10">
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
