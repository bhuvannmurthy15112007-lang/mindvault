const fs = require('fs');
const path = require('path');

const escPage = `'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { getSocket } from '@/lib/socket/client';
import { KeyRound, Lock, Unlock, HelpCircle } from 'lucide-react';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';
import { Timer } from '@/components/ui/Timer';

export default function EscapeRoomGamePage() {
  const searchParams = useSearchParams();
  const sessionId = parseInt(searchParams.get('session') || '0', 10);
  const { token, dbUser } = useAuth();

  const [data, setData] = useState<any>(null);
  const [selectedPuzzle, setSelectedPuzzle] = useState<any>(null);
  const [codeAnswer, setCodeAnswer] = useState('');
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEscape = async () => {
    if (!sessionId || !token) return;
    try {
      const res = await fetch('/api/games/escape/' + sessionId, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const json = await res.json();
      if (res.ok) setData(json);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEscape();
    const interval = setInterval(fetchEscape, 3000);

    const socket = getSocket(token || undefined);
    socket.connect();
    socket.emit('session:join', { sessionId, user: dbUser });

    socket.on('escape:shared_progress', () => fetchEscape());
    socket.on('escape:broadcast_hint', (h: any) => {
      setActiveHint(h.hintText);
      fetchEscape();
    });

    return () => {
      clearInterval(interval);
      socket.off('escape:shared_progress');
      socket.off('escape:broadcast_hint');
    };
  }, [sessionId, token]);

  const handleSolvePuzzle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedPuzzle) return;
    try {
      const res = await fetch('/api/games/escape/' + sessionId + '/puzzle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          puzzleId: selectedPuzzle.puzzle_id,
          answer: codeAnswer
        })
      });
      const resData = await res.json();
      if (res.ok && resData.success) {
        alert('Security Lock Bypassed!');
        const socket = getSocket();
        socket.emit('escape:puzzle_solved', {
          sessionId,
          puzzleId: selectedPuzzle.puzzle_id,
          doorUnlocked: resData.doorUnlocked,
          nextRoomId: resData.nextRoomId,
          isGameComplete: resData.isGameComplete
        });
        setSelectedPuzzle(null);
        setCodeAnswer('');
        fetchEscape();
      } else {
        alert(resData.message || 'Incorrect combination');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleRequestHint = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/games/escape/' + sessionId + '/hint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        }
      });
      const resData = await res.json();
      if (res.ok) {
        setActiveHint(resData.hintText);
        const socket = getSocket();
        socket.emit('escape:hint_used', {
          sessionId,
          hintsRemaining: resData.hintsRemaining,
          hintText: resData.hintText
        });
        fetchEscape();
      } else {
        alert(resData.error || 'No hints remaining');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return <div className="text-center py-20 font-mono text-cyan-400">Booting Chamber Systems...</div>;

  const isEscaped = data?.escapeSession?.status === 'ESCAPED';

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-950/40 via-vault-card to-vault-surface border border-amber-500/30 p-6 rounded-xl">
        <div>
          <span className="text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded">
            COOPERATIVE ESCAPE • {data?.escapeSession?.difficulty}
          </span>
          <h1 className="text-3xl font-display font-black text-white uppercase tracking-wider mt-1">
            {data?.escapeSession?.room_name || 'Decontamination Airlock'}
          </h1>
          <p className="text-xs text-gray-300 max-w-xl mt-1 leading-relaxed">
            {data?.escapeSession?.room_description}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Timer secondsRemaining={data?.escapeSession?.time_remaining_seconds || 1800} totalSeconds={1800} label="AIRLOCK PURGE" />
          <div className="text-center font-mono bg-vault-surface border border-vault-border p-3 rounded">
            <div className="text-[10px] text-gray-400 uppercase">HINTS REMAINING</div>
            <div className="text-xl font-bold text-amber-400">
              {data?.escapeSession?.hints_remaining} / 2
            </div>
            <MindVaultButton
              variant="amber"
              size="sm"
              disabled={data?.escapeSession?.hints_remaining <= 0}
              onClick={handleRequestHint}
              className="mt-1"
            >
              Request Hint
            </MindVaultButton>
          </div>
        </div>
      </div>

      {isEscaped && (
        <MindVaultCard className="p-8 border-emerald-500 bg-emerald-950/20 text-center space-y-4">
          <h2 className="text-3xl font-display font-black text-emerald-400 uppercase tracking-wider">
            MISSION ACCOMPLISHED: TEAM ESCAPED THE VAULT!
          </h2>
          <p className="text-sm text-gray-300 font-mono">
            Sequential locks overridden. Results verified in MySQL database.
          </p>
        </MindVaultCard>
      )}

      {activeHint && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/40 rounded-lg text-amber-300 font-mono text-xs flex items-center gap-3">
          <HelpCircle className="w-5 h-5 flex-shrink-0" />
          <div><span className="font-bold">TACTICAL HINT:</span> {activeHint}</div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-base font-display font-bold uppercase text-white tracking-wider">
          Interactive Chamber Objects
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.objects?.map((obj: any) => {
            const puz = data?.puzzles?.find((p: any) => p.object_id === obj.object_id);
            const isSolved = data?.completedPuzzles?.some((cp: any) => cp.puzzle_id === puz?.puzzle_id);

            return (
              <MindVaultCard key={obj.object_id} className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isSolved ? <Unlock className="w-5 h-5 text-emerald-400" /> : <Lock className="w-5 h-5 text-amber-400" />}
                    <h3 className="font-display font-bold text-white text-base">{obj.name}</h3>
                  </div>
                  {isSolved && <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">SOLVED</span>}
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{obj.description}</p>
                {puz && !isSolved && (
                  <MindVaultButton variant="amber" size="sm" className="w-full justify-center" onClick={() => setSelectedPuzzle(puz)}>
                    Inspect Mechanism & Input Code
                  </MindVaultButton>
                )}
              </MindVaultCard>
            );
          })}
        </div>
      </div>

      {selectedPuzzle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <MindVaultCard className="max-w-lg w-full p-6 space-y-4 border-amber-500">
            <h3 className="text-xl font-display font-bold text-white uppercase">Chamber Security Lock</h3>
            <p className="text-sm font-mono text-amber-300 bg-black/40 p-3 rounded border border-vault-border">
              {selectedPuzzle.puzzle_prompt}
            </p>
            <form onSubmit={handleSolvePuzzle} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-gray-400 mb-1">ENTER OVERRIDE COMBINATION</label>
                <input
                  type="text"
                  required
                  value={codeAnswer}
                  onChange={(e) => setCodeAnswer(e.target.value)}
                  placeholder="e.g. 3624"
                  className="w-full bg-vault-surface border border-vault-border p-3 text-lg font-bold text-center tracking-widest text-cyan-400 uppercase rounded"
                />
              </div>
              <div className="flex gap-3">
                <MindVaultButton type="submit" variant="amber" size="md" className="flex-1 justify-center">
                  Verify Override
                </MindVaultButton>
                <MindVaultButton type="button" variant="ghost" size="md" onClick={() => setSelectedPuzzle(null)}>
                  Close
                </MindVaultButton>
              </div>
            </form>
          </MindVaultCard>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync(path.join(__dirname, 'app', 'games', 'escape-room', 'page.tsx'), escPage);
console.log('Escape Room game page written successfully.');
