const fs = require('fs');
const path = require('path');

// 1. app/games/page.tsx
const gamesOverview = `'use client';
import React from 'react';
import Link from 'next/link';
import { Target, Search, KeyRound, Palette, Users, ArrowRight, ShieldCheck } from 'lucide-react';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';

export default function GamesHubPage() {
  const games = [
    {
      code: 'PREDICTION_ARENA',
      name: 'Prediction Arena',
      href: '/games/prediction',
      players: '5–10 Players',
      tagline: 'Pure Mathematical Strategy',
      description: 'Predict the hidden target (average x 0.8) from 0 to 100. Dodge duplicate penalties, unlock exact target strikes, and trigger the 0->100 counter rule.',
      rules: ['Each player chooses 1 integer from 0 to 100.', 'Duplicate selections receive a -1 penalty and cannot win.', 'Exact target matches win instantly, inflicting -2 on opponents.', '0->100 rule inverts victory when 0 and a unique 100 are chosen.'],
      icon: Target,
      color: 'text-cyan-400',
      glow: 'cyan' as const
    },
    {
      code: 'DETECTIVE',
      name: 'Detective',
      href: '/games/detective',
      players: '1–10 Players',
      tagline: 'Noir Forensic Mystery',
      description: 'Interrogate suspects, investigate crime scenes, unlock forensic ciphers within strict action budgets, and deliver decisive culprit accusations.',
      rules: ['Shared investigation budget (100 pts) per case.', 'Interrogate suspects (-10), search crime scenes (-10), analyze evidence (-15).', 'Decode encrypted ciphers (-20) to discover timeline anomalies.', 'Submit formal accusation (Suspect, Motive, Evidence, Reasoning).'],
      icon: Search,
      color: 'text-red-400',
      glow: 'crimson' as const
    },
    {
      code: 'ESCAPE_ROOM',
      name: 'Escape Room',
      href: '/games/escape-room',
      players: '1–5 Players',
      tagline: 'Cooperative Vault Breakout',
      description: 'Coordinate in real-time to solve interconnected mechanical locks, sequence keypads, and cipher terminals with strictly two precious hints per mission.',
      rules: ['Shared team progress across sequential locked chambers.', 'Inspect objects and deduce keypad codes & harmonic frequencies.', 'Strictly 2 tactical hints per game, enforced server-side.', 'All answers hashed and verified on the server.'],
      icon: KeyRound,
      color: 'text-amber-400',
      glow: 'amber' as const
    },
    {
      code: 'DRAWICE',
      name: 'Drawice',
      href: '/games/drawice',
      players: '2–10 Players',
      tagline: 'Multiplayer Drawing Studio',
      description: 'Fair artist rotation, secret word selections, real-time socket brush strokes, and submission-sequence speed scoring for sharp guessers.',
      rules: ['Artist rotates fairly each round (min 5 rounds).', 'Artist chooses from 3 secret words; word kept hidden from guessers.', 'Guessers submit private guesses; 1st correct = 10, 2nd = 9, 3rd = 8...', 'Artist scores 10 + (correct - 1) x 5 if at least 1 player guesses.'],
      icon: Palette,
      color: 'text-purple-400',
      glow: 'purple' as const
    }
  ];

  return (
    <div className="space-y-10 py-6">
      <div className="border-b border-vault-border pb-4">
        <h1 className="text-3xl font-display font-black text-white uppercase tracking-wider">
          MindVault Arenas
        </h1>
        <p className="text-xs text-gray-400 font-mono mt-1">
          Explore game rules, player limits, and launch multiplayer rooms.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {games.map((g) => {
          const Icon = g.icon;
          return (
            <MindVaultCard key={g.code} glow={g.glow} className="space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className={'w-7 h-7 ' + g.color} />
                    <div>
                      <h2 className="text-xl font-display font-bold text-white">{g.name}</h2>
                      <span className="text-xs font-mono text-gray-400">{g.tagline}</span>
                    </div>
                  </div>
                  <span className="text-xs font-mono bg-vault-surface border border-vault-border px-2.5 py-1 rounded text-gray-300">
                    {g.players}
                  </span>
                </div>

                <p className="text-sm text-gray-300 leading-relaxed">{g.description}</p>

                <div className="space-y-1.5 pt-2 border-t border-vault-border/50">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-gray-400 block">Core Rules:</span>
                  <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                    {g.rules.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-vault-border flex gap-3">
                <Link href={'/rooms/create?game=' + g.code} className="flex-1">
                  <MindVaultButton variant="primary" size="md" className="w-full justify-center">
                    Host Match
                  </MindVaultButton>
                </Link>
                <Link href="/rooms/join" className="flex-1">
                  <MindVaultButton variant="secondary" size="md" className="w-full justify-center">
                    Join Match
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
`;
fs.writeFileSync(path.join(__dirname, 'app', 'games', 'page.tsx'), gamesOverview);

// 2. app/leaderboard/page.tsx
const leaderboardPage = `'use client';
import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Award, Flame } from 'lucide-react';
import { MindVaultCard } from '@/components/ui/MindVaultCard';

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

  return (
    <div className="space-y-8 py-6">
      <div className="border-b border-vault-border pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

      <div className="flex flex-wrap gap-2 border-b border-vault-border pb-2">
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
        <div className="text-center py-20 font-mono text-cyan-400 animate-pulse">Calculating Global Standings...</div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-16 bg-vault-card/40 border border-vault-border rounded-lg text-sm text-gray-400 font-mono">
          No matches recorded for this arena yet. Compete in matches to claim the top rank!
        </div>
      ) : (
        <MindVaultCard className="p-0 overflow-hidden">
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
      )}
    </div>
  );
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'leaderboard', 'page.tsx'), leaderboardPage);

console.log('Games overview and Leaderboard pages created.');
