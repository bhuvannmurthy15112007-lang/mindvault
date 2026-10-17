'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Award, Flame, Users, Sparkles } from 'lucide-react';
import { MindVaultCard } from '@/components/ui/MindVaultCard';
import DynamicAtmosphericParticles from '@/components/3d/AtmosphericParticlesWrapper';

export default function LeaderboardPage() {
  const [tab, setTab] = useState<'OVERALL' | 'PREDICTION_ARENA' | 'DETECTIVE' | 'ESCAPE_ROOM' | 'DRAWICE'>('OVERALL');
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async (game?: string) => {
    setLoading(true);
    try {
      const url = game && game !== 'OVERALL' ? '/api/leaderboard?game=' + game : '/api/leaderboard';
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setLeaderboard(data.leaderboard || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard(tab);
  }, [tab]);

  const topThree = leaderboard.slice(0, 3);

  return (
    <div className="relative space-y-8 py-6">
      <DynamicAtmosphericParticles count={90} />

      {/* Header */}
      <div className="border-b border-vault-border pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h1 className="text-3xl font-display font-black text-white uppercase tracking-wider">
              MindVault Leaderboards
            </h1>
          </div>
          <p className="text-xs text-gray-400 font-mono mt-1">
            Dynamic MySQL views (v_overall_leaderboard & v_game_leaderboards) with competition ranking.
          </p>
        </div>
      </div>

      {/* Arena Sector Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-vault-border pb-2 relative z-10">
        {[
          { key: 'OVERALL', label: 'Overall Arena' },
          { key: 'PREDICTION_ARENA', label: 'Prediction Arena' },
          { key: 'DETECTIVE', label: 'Detective' },
          { key: 'ESCAPE_ROOM', label: 'Escape Room' },
          { key: 'DRAWICE', label: 'Drawice' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={'px-4 py-2 text-xs font-display font-bold uppercase tracking-wider rounded transition-all ' + (tab === t.key ? 'bg-cyan-500 text-black shadow-glow-cyan/20' : 'bg-vault-card border border-vault-border text-gray-300 hover:text-white')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 font-mono text-cyan-400 animate-pulse relative z-10">
          Calculating Global Standings from MySQL Engine...
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-16 bg-vault-card/40 border border-vault-border rounded-lg text-sm text-gray-400 font-mono relative z-10">
          No matches recorded for this arena yet. Compete in matches to claim the top rank!
        </div>
      ) : (
        <div className="space-y-6 relative z-10">
          {/* Top 3 Podium Cards */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topThree.map((player, idx) => {
                const ranks = ['S-RANK #1', 'A-RANK #2', 'B-RANK #3'];
                const borders = ['border-amber-500/60 bg-gradient-to-b from-amber-950/30 to-vault-card', 'border-gray-400/40 bg-vault-card', 'border-amber-700/40 bg-vault-card'];
                const textCols = ['text-amber-400', 'text-gray-300', 'text-amber-600'];
                return (
                  <MindVaultCard key={player.user_id || idx} className={`p-6 text-center space-y-4 border ${borders[idx]}`}>
                    <div className="relative inline-block">
                      <div className="w-16 h-16 rounded-full bg-vault-dark border-2 border-amber-400/60 mx-auto flex items-center justify-center font-display font-black text-2xl text-amber-300 overflow-hidden shadow-glow-amber/20">
                        {player.avatar_url ? (
                          <img src={player.avatar_url} alt={player.display_name} className="w-full h-full object-cover" />
                        ) : (
                          player.display_name?.charAt(0).toUpperCase() || 'P'
                        )}
                      </div>
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold bg-amber-400 text-black px-2 py-0.5 rounded-full uppercase">
                        {ranks[idx]}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display font-bold text-lg text-white">{player.display_name}</h3>
                      <div className={`font-mono text-xl font-black ${textCols[idx]}`}>
                        {Math.round(player.aggregate_score ?? player.total_score ?? 0)} PTS
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-gray-400 pt-2 border-t border-vault-border/50">
                      <div>Wins: <span className="text-white font-bold">{player.total_games_won ?? player.games_won ?? 0}</span></div>
                      <div>Played: <span className="text-white font-bold">{player.total_games_played ?? player.games_played ?? 0}</span></div>
                    </div>
                  </MindVaultCard>
                );
              })}
            </div>
          )}

          {/* Full Table */}
          <MindVaultCard className="p-0 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-vault-surface/80 border-b border-vault-border text-gray-400 uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Strategist</th>
                    <th className="py-3 px-4">Games Played</th>
                    <th className="py-3 px-4">Victories</th>
                    <th className="py-3 px-4">Win Rate</th>
                    <th className="py-3 px-4 text-right">Aggregate Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-vault-border/50">
                  {leaderboard.map((row, idx) => (
                    <tr key={row.user_id} className="hover:bg-vault-hover/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-cyan-400">
                        #{row.global_rank || row.game_rank || idx + 1}
                      </td>
                      <td className="py-3 px-4 flex items-center gap-2 text-white font-sans font-medium">
                        <div className="w-7 h-7 rounded-full bg-vault-surface border border-vault-border overflow-hidden flex items-center justify-center text-xs font-bold">
                          {row.avatar_url ? (
                            <img src={row.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            row.display_name?.charAt(0).toUpperCase() || 'P'
                          )}
                        </div>
                        <span>{row.display_name}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{row.total_games_played ?? row.games_played}</td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">{row.total_games_won ?? row.games_won}</td>
                      <td className="py-3 px-4 text-gray-300">{row.win_rate_percentage}%</td>
                      <td className="py-3 px-4 text-right font-bold text-white text-sm">
                        {Math.round(row.aggregate_score ?? row.total_score)} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </MindVaultCard>
        </div>
      )}
    </div>
  );
}
