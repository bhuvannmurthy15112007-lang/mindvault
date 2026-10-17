'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Target, Search, KeyRound, Palette, Plus, Users, Hash } from 'lucide-react';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';

function CreateRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, dbUser } = useAuth();

  const [selectedGame, setSelectedGame] = useState('PREDICTION_ARENA');
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [rounds, setRounds] = useState(5);
  const [escapeDifficulty, setEscapeDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [detectiveCases, setDetectiveCases] = useState<any[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const gamesConfig: Record<string, { min: number; max: number; name: string; icon: any; color: string; defaultRounds: number }> = {
    PREDICTION_ARENA: { min: 2, max: 10, name: 'Prediction Arena', icon: Target, color: 'text-cyan-400', defaultRounds: 5 },
    DETECTIVE: { min: 1, max: 10, name: 'Detective', icon: Search, color: 'text-red-400', defaultRounds: 1 },
    ESCAPE_ROOM: { min: 1, max: 5, name: 'Escape Room', icon: KeyRound, color: 'text-amber-400', defaultRounds: 1 },
    DRAWICE: { min: 2, max: 10, name: 'Drawice', icon: Palette, color: 'text-purple-400', defaultRounds: 5 },
  };

  useEffect(() => {
    fetch('/api/games/detective/cases')
      .then((res) => res.json())
      .then((d) => {
        if (d.cases && d.cases.length > 0) {
          setDetectiveCases(d.cases);
          setSelectedCaseId(d.cases[0].case_id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const qGame = searchParams.get('game');
    if (qGame && gamesConfig[qGame]) {
      setSelectedGame(qGame);
      setMaxPlayers(gamesConfig[qGame].max);
      setRounds(gamesConfig[qGame].defaultRounds);
    }
  }, [searchParams]);

  const handleGameChange = (code: string) => {
    setSelectedGame(code);
    setMaxPlayers(gamesConfig[code].max);
    setRounds(gamesConfig[code].defaultRounds);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      router.push('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          gameCode: selectedGame,
          maxPlayers,
          rounds,
          caseId: selectedGame === 'DETECTIVE' ? selectedCaseId : undefined,
          difficulty: selectedGame === 'ESCAPE_ROOM' ? escapeDifficulty : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create room');
      }

      router.push(`/rooms/${data.roomCode}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentConfig = gamesConfig[selectedGame];

  return (
    <div className="max-w-2xl mx-auto py-8">
      <MindVaultCard className="space-y-6">
        <div className="border-b border-vault-border pb-4">
          <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
            Create Multiplayer Room
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-1">
            Host a new match. Authoritative server manages room lifecycle.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/40 rounded text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-6">
          {/* Game Selection */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-3">
              Select Arena Game
            </label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(gamesConfig).map(([code, g]) => {
                const Icon = g.icon;
                const isSelected = selectedGame === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleGameChange(code)}
                    className={`p-4 rounded-lg border text-left flex items-start gap-3 transition-all ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-500/10 shadow-glow-cyan/20'
                        : 'border-vault-border bg-vault-surface/60 hover:bg-vault-hover'
                    }`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${g.color}`} />
                    <div>
                      <div className="font-display font-bold text-sm text-white">{g.name}</div>
                      <div className="text-[11px] font-mono text-gray-400">{g.min}–{g.max} Players</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detective Case File Selection */}
          {selectedGame === 'DETECTIVE' && detectiveCases.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-300">
                Select Mystery Case File
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {detectiveCases.map((c) => {
                  const isCaseSelected = selectedCaseId === c.case_id;
                  return (
                    <button
                      key={c.case_id}
                      type="button"
                      onClick={() => setSelectedCaseId(c.case_id)}
                      className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                        isCaseSelected
                          ? 'border-red-400 bg-red-950/40 shadow-glow-red/20'
                          : 'border-vault-border bg-vault-surface/60 hover:bg-vault-hover'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                              c.difficulty === 'HARD'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : c.difficulty === 'MEDIUM'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {c.difficulty}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400 font-bold">
                            {c.investigation_budget} pts
                          </span>
                        </div>
                        <div className="font-display font-bold text-sm text-white">{c.title}</div>
                        <p className="text-[11px] text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                          {c.synopsis}
                        </p>
                      </div>
                      <div className="mt-2 text-[10px] font-mono text-cyan-400">
                        {c.incident_location || 'Classified Site'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Escape Room Difficulty Selection */}
          {selectedGame === 'ESCAPE_ROOM' && (
            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-300">
                Select Chamber Security Clearance (Difficulty)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    diff: 'EASY',
                    title: 'Recruit Clearance',
                    desc: 'Direct technician schematics, direct numbers, simplified lock deduction.',
                    color: 'text-emerald-400',
                    border: 'border-emerald-500/40 bg-emerald-950/20 shadow-glow-emerald/20'
                  },
                  {
                    diff: 'MEDIUM',
                    title: 'Operative Clearance',
                    desc: 'Balanced multi-step logic, environmental clues, standard 10-minute purge timer.',
                    color: 'text-amber-400',
                    border: 'border-amber-500/40 bg-amber-950/20 shadow-glow-amber/20'
                  },
                  {
                    diff: 'HARD',
                    title: 'Infiltrator Clearance',
                    desc: 'Advanced cyber cryptograms, indirect patterns, multi-chamber deduction.',
                    color: 'text-rose-400',
                    border: 'border-rose-500/40 bg-rose-950/20 shadow-glow-rose/20'
                  }
                ].map((d) => {
                  const isSelected = escapeDifficulty === d.diff;
                  return (
                    <button
                      key={d.diff}
                      type="button"
                      onClick={() => setEscapeDifficulty(d.diff as any)}
                      className={`p-3 rounded-lg border text-left transition-all flex flex-col justify-between ${
                        isSelected
                          ? d.border
                          : 'border-vault-border bg-vault-surface/60 hover:bg-vault-hover'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                              d.diff === 'HARD'
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : d.diff === 'MEDIUM'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            {d.diff}
                          </span>
                          <span className="text-[10px] font-mono text-cyan-400 font-bold">10:00 Timer</span>
                        </div>
                        <div className="font-display font-bold text-sm text-white">{d.title}</div>
                        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">{d.desc}</p>
                      </div>
                      <div className="mt-2 text-[10px] font-mono text-amber-400 font-bold">Max 30 Points</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Max Players */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-2">
              <span className="uppercase text-gray-300">Player Capacity</span>
              <span className="text-cyan-400 font-bold">{maxPlayers} Players</span>
            </div>
            <input
              type="range"
              min={currentConfig.min}
              max={currentConfig.max}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 bg-vault-surface cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-gray-500 mt-1">
              <span>Min: {currentConfig.min}</span>
              <span>Max: {currentConfig.max}</span>
            </div>
          </div>

          {/* Rounds Configuration */}
          {(selectedGame === 'PREDICTION_ARENA' || selectedGame === 'DRAWICE') && (
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1">
                Number of Rounds {selectedGame === 'DRAWICE' && '(Min 5 rounds)'}
              </label>
              <input
                type="number"
                min={5}
                max={selectedGame === 'PREDICTION_ARENA' ? 10 : 20}
                value={rounds}
                onChange={(e) => setRounds(parseInt(e.target.value, 10) || 5)}
                className="w-full bg-vault-surface border border-vault-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>
          )}

          <MindVaultButton
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            className="w-full justify-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Initialize Room
          </MindVaultButton>
        </form>
      </MindVaultCard>
    </div>
  );
}

export default function CreateRoomPage() {
  return (
    <React.Suspense fallback={<div className="text-center py-20 font-mono text-cyan-400 animate-pulse">Loading Room Configurator...</div>}>
      <CreateRoomContent />
    </React.Suspense>
  );
}
