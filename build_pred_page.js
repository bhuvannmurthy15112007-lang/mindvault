const fs = require('fs');
const path = require('path');

const predPage = `'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { getSocket } from '@/lib/socket/client';
import { Target, Trophy, Check } from 'lucide-react';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';
import { Timer } from '@/components/ui/Timer';
import { RuleUnlockModal } from '@/components/ui/RuleUnlockModal';

export default function PredictionArenaGamePage() {
  const searchParams = useSearchParams();
  const sessionId = parseInt(searchParams.get('session') || '0', 10);
  const { dbUser, token } = useAuth();

  const [session, setSession] = useState<any>(null);
  const [currentRound, setCurrentRound] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [chosenNumber, setChosenNumber] = useState<number>(50);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(15);
  const [unlockedRule, setUnlockedRule] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        if (data.mySubmission) {
          setHasSubmitted(true);
          setChosenNumber(data.mySubmission.chosen_number);
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
    socket.on('prediction:new_rule', (rule: any) => setUnlockedRule(rule));

    return () => {
      clearInterval(interval);
      socket.off('prediction:round_reveal');
      socket.off('prediction:new_rule');
    };
  }, [sessionId, token]);

  useEffect(() => {
    if (currentRound?.status === 'SUBMITTING') {
      const timer = setInterval(() => {
        setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentRound?.status]);

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

  if (!sessionId) return <div className="text-center py-20 text-gray-400">Invalid session ID</div>;

  const isRevealed = currentRound?.status === 'REVEALED' || currentRound?.status === 'COMPLETED';

  return (
    <div className="space-y-8 py-6">
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
        <Timer secondsRemaining={secondsRemaining} totalSeconds={15} label="SUBMISSION WINDOW" />
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
              <div className="space-y-2">
                <div className="text-xs font-mono text-gray-400 uppercase">Revealed Choices</div>
                {submissions.map((s) => (
                  <div key={s.submission_id} className="p-3 rounded border border-vault-border bg-vault-surface flex items-center justify-between font-mono text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-xs w-6">{s.round_rank ? '#' + s.round_rank : '-'}</span>
                      <span>{s.display_name}</span>
                      {s.is_duplicate && <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/40 px-1.5 py-0.5 rounded">DUPLICATE (-1)</span>}
                      {s.is_exact_target && <span className="text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.5 rounded">EXACT TARGET</span>}
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="font-bold text-base">{s.chosen_number}</span>
                      <span className="font-bold text-emerald-400">{s.points_awarded + s.penalty_points > 0 ? '+' + (s.points_awarded + s.penalty_points) : s.points_awarded + s.penalty_points} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            </MindVaultCard>
          )}
        </div>

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
`;

fs.writeFileSync(path.join(__dirname, 'app', 'games', 'prediction', 'page.tsx'), predPage);
console.log('Prediction Arena game page written successfully.');
