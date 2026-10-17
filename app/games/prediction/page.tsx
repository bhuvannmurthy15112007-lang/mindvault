'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { getSocket } from '@/lib/socket/client';
import { Target, Trophy, Check, ArrowRight, Award, Home, BarChart2 } from 'lucide-react';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';
import { Timer } from '@/components/ui/Timer';
import { RuleUnlockModal } from '@/components/ui/RuleUnlockModal';
import { PredictionArenaBriefing } from '@/components/games/PredictionArenaBriefing';

function PredictionArenaGameContent() {
  const searchParams = useSearchParams();
  const sessionId = parseInt(searchParams.get('session') || '0', 10);
  const router = useRouter();
  const { dbUser, token } = useAuth();

  const [session, setSession] = useState<any>(null);
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [chosenNumber, setChosenNumber] = useState<number>(50);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30);
  const [unlockedRule, setUnlockedRule] = useState<any>(null);
  const [isAdvancing, setIsAdvancing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchSession = async () => {
    if (!sessionId || !token) return;
    try {
      const res = await fetch('/api/games/prediction/' + sessionId, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const data = await res.json();
      if (res.ok) {
        setSession(data.session);
        setCurrentRound(data.currentRound);
        setSubmissions(data.roundSubmissions || []);
        setPlayers(data.players || []);
        if (data.secondsRemaining !== undefined && data.currentRound?.status === 'SUBMITTING') {
          setSecondsRemaining(data.secondsRemaining);
        }
        if (data.mySubmission) {
          setHasSubmitted(true);
          setChosenNumber(data.mySubmission.chosen_number);
        } else {
          setHasSubmitted(false);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 3000);

    const socket = getSocket(token || undefined);
    socket.connect();
    socket.emit('session:join', { sessionId, user: dbUser });

    socket.on('prediction:round_reveal', () => fetchSession());
    socket.on('prediction:new_round_started', () => {
      setHasSubmitted(false);
      setChosenNumber(50);
      fetchSession();
    });
    socket.on('prediction:new_rule', (rule: any) => setUnlockedRule(rule));
    socket.on('prediction:game_completed', () => fetchSession());

    return () => {
      clearInterval(interval);
      socket.off('prediction:round_reveal');
      socket.off('prediction:new_round_started');
      socket.off('prediction:new_rule');
      socket.off('prediction:game_completed');
    };
  }, [sessionId, token]);

  useEffect(() => {
    if (currentRound?.status === 'SUBMITTING') {
      const timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            fetchSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentRound?.status, currentRound?.round_number]);

  const handleSubmitNumber = async () => {
    if (!token || hasSubmitted) return;
    try {
      const res = await fetch('/api/games/prediction/' + sessionId + '/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ chosenNumber })
      });
      if (res.ok) {
        setHasSubmitted(true);
        const socket = getSocket();
        socket.emit('prediction:submitted', { sessionId, userId: dbUser?.userId, displayName: dbUser?.displayName });
        fetchSession();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNextRound = async () => {
    if (!token || isAdvancing) return;
    setIsAdvancing(true);
    try {
      const res = await fetch(`/api/games/prediction/${sessionId}/next-round`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        if (data.unlockedRule) {
          setUnlockedRule(data.unlockedRule);
        }
        setHasSubmitted(false);
        setChosenNumber(50);
        await fetchSession();
      } else {
        alert(data.error || 'Failed to advance round');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdvancing(false);
    }
  };

  if (!sessionId) {
    return <PredictionArenaBriefing />;
  }
  if (loading && !session) {
    return <div className="text-center py-20 font-mono text-cyan-400 animate-pulse">Initializing Prediction Arena...</div>;
  }

  // ==========================================
  // FINAL RESULTS SCREEN
  // ==========================================
  if (session?.status === 'COMPLETED') {
    const winner = players[0] || null;
    return (
      <div className="max-w-4xl mx-auto space-y-8 py-8 px-4">
        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-950/40 via-vault-card to-cyan-950/40 border border-amber-500/40 p-8 rounded-2xl text-center shadow-glow-amber/10 space-y-3">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-widest">
            <Trophy className="w-4 h-4 text-amber-400" /> Tournament Completed
          </div>
          <h1 className="text-4xl font-display font-black text-white uppercase tracking-wider">
            Prediction Arena Champion
          </h1>
          <p className="text-sm text-gray-300 font-mono max-w-lg mx-auto">
            All {session.total_rounds} strategic mathematical rounds have concluded. Standing scores are finalized.
          </p>
        </div>

        {/* Champion Spotlight */}
        {winner && (
          <MindVaultCard className="p-8 text-center bg-gradient-to-b from-amber-500/10 via-vault-surface to-vault-surface border-amber-500/40">
            <div className="relative inline-block mb-4">
              {winner.avatar_url ? (
                <img
                  src={winner.avatar_url}
                  alt={winner.display_name}
                  className="w-24 h-24 rounded-full object-cover mx-auto border-4 border-amber-400 shadow-glow-amber"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-amber-500/20 border-4 border-amber-400 mx-auto flex items-center justify-center font-bold text-3xl text-amber-300 shadow-glow-amber">
                  {winner.display_name?.charAt(0).toUpperCase() || 'W'}
                </div>
              )}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-400 text-black font-black text-xs px-2.5 py-0.5 rounded-full font-mono uppercase">
                1st Place
              </div>
            </div>
            <h2 className="text-2xl font-display font-black text-white uppercase mt-2">{winner.display_name}</h2>
            <div className="mt-2 text-cyan-400 font-mono text-3xl font-black">{Math.round(winner.final_score)} PTS</div>
          </MindVaultCard>
        )}

        {/* Final Standings Table */}
        <MindVaultCard className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-vault-border pb-3">
            <Award className="w-5 h-5 text-cyan-400" />
            <h3 className="font-display font-bold text-white uppercase tracking-wider text-base">Final Tournament Standings</h3>
          </div>
          <div className="space-y-2">
            {players.map((p, idx) => {
              const isFirst = idx === 0;
              return (
                <div
                  key={p.user_id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border ${
                    isFirst ? 'bg-amber-500/10 border-amber-500/50' : 'bg-vault-surface border-vault-border'
                  } font-mono`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 text-center font-black text-sm ${isFirst ? 'text-amber-400' : 'text-gray-400'}`}>
                      #{idx + 1}
                    </span>
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt={p.display_name} className="w-9 h-9 rounded-full object-cover border border-cyan-500/30" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center font-bold text-xs text-cyan-300">
                        {p.display_name?.charAt(0).toUpperCase() || 'P'}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        {p.display_name}
                        {isFirst && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded font-bold">
                            CHAMPION
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500">Player ID #{p.user_id}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-cyan-400">{Math.round(p.final_score)} pts</div>
                  </div>
                </div>
              );
            })}
          </div>
        </MindVaultCard>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <MindVaultButton variant="secondary" size="lg" onClick={() => router.push('/dashboard')} className="w-full sm:w-auto">
            <Home className="w-4 h-4 mr-2" /> Vault Dashboard
          </MindVaultButton>
          <MindVaultButton variant="primary" size="lg" onClick={() => router.push('/games')} className="w-full sm:w-auto">
            <Target className="w-4 h-4 mr-2" /> Browse Arena Games
          </MindVaultButton>
          <MindVaultButton variant="secondary" size="lg" onClick={() => router.push('/leaderboard')} className="w-full sm:w-auto">
            <BarChart2 className="w-4 h-4 mr-2" /> Global Leaderboard
          </MindVaultButton>
        </div>
      </div>
    );
  }

  // ==========================================
  // ACTIVE GAME PLAY & ROUND RESOLUTION
  // ==========================================
  const isRevealed = currentRound?.status === 'REVEALED' || currentRound?.status === 'COMPLETED';

  return (
    <div className="space-y-8 py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-cyan-950/40 via-vault-card to-vault-surface border border-cyan-500/30 p-6 rounded-xl shadow-glow-cyan/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2.5 py-0.5 rounded">
              ROUND {currentRound?.round_number || 1} OF {session?.total_rounds || 5}
            </span>
            <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">MATHEMATICAL STRATEGY</span>
          </div>
          <h1 className="text-3xl font-display font-black text-white uppercase tracking-wider mt-1">Prediction Arena</h1>
          <p className="text-xs text-gray-400 font-mono mt-0.5">Target = Average x 0.8 • Duplicate numbers penalized (-1 pt)</p>
        </div>
        <Timer secondsRemaining={secondsRemaining} totalSeconds={30} label="SUBMISSION WINDOW" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {!isRevealed ? (
            <MindVaultCard className="p-8 text-center space-y-6">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block">AUTHORITATIVE INTEGER SELECTION</span>
              <h2 className="text-2xl font-display font-bold text-white uppercase">Select Your Value (0 - 100)</h2>
              <div className="py-4">
                <div className="w-28 h-28 mx-auto rounded-full bg-cyan-500/10 border-2 border-cyan-400 flex items-center justify-center shadow-glow-cyan">
                  <span className="font-mono text-5xl font-black text-white">{chosenNumber}</span>
                </div>
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  disabled={hasSubmitted}
                  value={chosenNumber}
                  onChange={(e) => setChosenNumber(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400 h-2 bg-vault-surface rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-xs font-mono text-gray-500">
                  <span>0 (Min)</span>
                  <span>50</span>
                  <span>100 (Max)</span>
                </div>
              </div>
              <div className="pt-2 max-w-sm mx-auto">
                {hasSubmitted ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 px-4 py-3 rounded text-sm font-mono flex items-center justify-center gap-2">
                    <Check className="w-4 h-4" /> Prediction Locked ({chosenNumber})
                  </div>
                ) : (
                  <MindVaultButton variant="primary" size="lg" onClick={handleSubmitNumber} className="w-full justify-center">
                    Lock Prediction ({chosenNumber})
                  </MindVaultButton>
                )}
              </div>
            </MindVaultCard>
          ) : (
            <MindVaultCard className="p-6 space-y-6">
              <div className="border-b border-vault-border pb-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">ROUND RESOLUTION</span>
                  <h2 className="text-2xl font-display font-bold text-white uppercase">Calculated Target & Reveal</h2>
                </div>
                <div className="text-right font-mono">
                  <div className="text-xs text-gray-400">MATHEMATICAL TARGET</div>
                  <div className="text-2xl font-bold text-cyan-400">{Number(currentRound?.target_value || 0).toFixed(2)}</div>
                </div>
              </div>

              {/* Target Calculation Metrics */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-vault-surface rounded border border-vault-border">
                  <div className="text-[10px] font-mono text-gray-400">SUM</div>
                  <div className="text-lg font-mono font-bold text-white">{currentRound?.total_sum}</div>
                </div>
                <div className="p-3 bg-vault-surface rounded border border-vault-border">
                  <div className="text-[10px] font-mono text-gray-400">AVERAGE</div>
                  <div className="text-lg font-mono font-bold text-white">{Number(currentRound?.average_value || 0).toFixed(2)}</div>
                </div>
                <div className="p-3 bg-cyan-950/20 rounded border border-cyan-500/40">
                  <div className="text-[10px] font-mono text-cyan-400">TARGET (x 0.8)</div>
                  <div className="text-lg font-mono font-bold text-cyan-300">{Number(currentRound?.target_value || 0).toFixed(2)}</div>
                </div>
              </div>

              {/* Revealed Player Submissions */}
              <div className="space-y-3">
                <div className="text-xs font-mono text-gray-400 uppercase">Revealed Choices</div>
                {submissions.map((s) => {
                  const netRoundPoints = (s.points_awarded || 0) + (s.penalty_points || 0);
                  const isRoundWinner = s.round_rank === 1;
                  return (
                    <div
                      key={s.user_id || s.submission_id}
                      className={`p-3.5 rounded-xl border ${
                        isRoundWinner ? 'border-amber-500/50 bg-amber-500/10 shadow-glow-amber/10' : 'border-vault-border bg-vault-surface'
                      } flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-sm`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar / Photo */}
                        {s.avatar_url ? (
                          <img src={s.avatar_url} alt={s.display_name} className="w-10 h-10 rounded-full object-cover border border-cyan-500/40" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center font-bold text-sm text-cyan-300">
                            {s.display_name?.charAt(0).toUpperCase() || 'P'}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-base">{s.display_name}</span>
                            {/* Winner Badge */}
                            {isRoundWinner && (
                              <span className="flex items-center gap-1 text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded shadow-glow-amber/20">
                                <Trophy className="w-3 h-3 text-amber-400" /> WINNER
                              </span>
                            )}
                            {s.is_duplicate && (
                              <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 px-1.5 py-0.5 rounded">
                                DUPLICATE (-1)
                              </span>
                            )}
                            {s.is_exact_target && (
                              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.5 rounded">
                                EXACT TARGET
                              </span>
                            )}
                            {s.is_zero_one_hundred_win && (
                              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.5 rounded">
                                0→100 INVERSION
                              </span>
                            )}
                            {!s.has_submitted && (
                              <span className="text-[10px] bg-gray-500/20 text-gray-400 border border-gray-500/40 px-1.5 py-0.5 rounded">
                                NO SUBMISSION (0)
                              </span>
                            )}
                          </div>
                          {/* Cumulative Score */}
                          <div className="text-xs text-gray-400 mt-0.5">
                            Cumulative: <span className="text-cyan-400 font-bold">{Math.round(s.cumulative_score || 0)} pts</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 self-end sm:self-center">
                        <div className="text-right">
                          <div className="text-[10px] text-gray-400">CHOSEN NUMBER</div>
                          <div className="font-bold text-xl text-white">
                            {s.chosen_number !== null && s.chosen_number !== undefined ? s.chosen_number : '—'}
                          </div>
                        </div>
                        <div className="text-right min-w-[70px]">
                          <div className="text-[10px] text-gray-400">ROUND SCORE</div>
                          <div
                            className={`font-bold text-base ${
                              netRoundPoints > 0 ? 'text-emerald-400' : netRoundPoints < 0 ? 'text-red-400' : 'text-gray-400'
                            }`}
                          >
                            {netRoundPoints > 0 ? `+${netRoundPoints}` : netRoundPoints} pts
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Advance to Next Round / View Final Results */}
              <div className="pt-4 border-t border-vault-border flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs font-mono text-gray-400">
                  {currentRound?.round_number < (session?.total_rounds || 5)
                    ? `Ready for Round ${(currentRound?.round_number || 1) + 1} of ${session?.total_rounds || 5}`
                    : `Final Round ${session?.total_rounds || 5} Complete`}
                </div>
                {currentRound?.round_number < (session?.total_rounds || 5) ? (
                  <MindVaultButton
                    variant="primary"
                    size="md"
                    onClick={handleNextRound}
                    disabled={isAdvancing}
                    className="w-full sm:w-auto"
                  >
                    {isAdvancing ? 'Loading Next Round...' : `Advance to Round ${(currentRound?.round_number || 1) + 1} →`}
                  </MindVaultButton>
                ) : (
                  <MindVaultButton
                    variant="amber"
                    size="md"
                    onClick={handleNextRound}
                    disabled={isAdvancing}
                    className="w-full sm:w-auto"
                  >
                    {isAdvancing ? 'Finalizing Results...' : 'View Final Arena Results 🏆'}
                  </MindVaultButton>
                )}
              </div>
            </MindVaultCard>
          )}
        </div>

        {/* Sidebar Standings */}
        <div>
          <MindVaultCard className="p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-vault-border pb-3">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="font-display font-bold text-white uppercase tracking-wider text-sm">Arena Standings</h3>
            </div>
            <div className="space-y-2">
              {players.map((p, idx) => (
                <div key={p.user_id} className="flex items-center justify-between p-2.5 rounded bg-vault-surface/60 border border-vault-border text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-bold w-4">#{idx + 1}</span>
                    <span className="text-gray-200 font-sans font-medium">{p.display_name}</span>
                  </div>
                  <span className="text-cyan-400 font-bold text-sm">{Math.round(p.final_score)} pts</span>
                </div>
              ))}
            </div>
          </MindVaultCard>
        </div>
      </div>

      {unlockedRule && (
        <RuleUnlockModal
          isOpen={true}
          ruleNumber={unlockedRule.rule_number}
          ruleName={unlockedRule.rule_name}
          explanation={unlockedRule.explanation}
          example={unlockedRule.example}
          onContinue={() => setUnlockedRule(null)}
        />
      )}
    </div>
  );
}

export default function PredictionArenaGamePage() {
  return (
    <React.Suspense fallback={<div className="text-center py-20 font-mono text-cyan-400 animate-pulse">Loading Prediction Arena...</div>}>
      <PredictionArenaGameContent />
    </React.Suspense>
  );
}
