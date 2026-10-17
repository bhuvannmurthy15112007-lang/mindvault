'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { getSocket } from '@/lib/socket/client';
import { 
  Lock, 
  Unlock, 
  KeyRound, 
  HelpCircle, 
  FileText, 
  Search, 
  Shield, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  Eye,
  Radio,
  Trophy,
  ZoomIn,
  ZoomOut,
  Users,
  Compass,
  MapPin,
  Layers,
  Sparkles
} from 'lucide-react';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';
import { Timer } from '@/components/ui/Timer';
import { EscapeRoomBriefing } from '@/components/games/EscapeRoomBriefing';

function EscapeRoomGameContent() {
  const searchParams = useSearchParams();
  const sessionId = parseInt(searchParams.get('session') || '0', 10);
  const { token, dbUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'room' | 'objects' | 'clues' | 'puzzles' | 'progress' | 'team'>('room');
  const [data, setData] = useState<any>(null);
  const [selectedPuzzle, setSelectedPuzzle] = useState<any>(null);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [codeAnswer, setCodeAnswer] = useState('');
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(600);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  const fetchEscape = async () => {
    if (!sessionId || !token) return;
    try {
      const res = await fetch('/api/games/escape/' + sessionId, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
        if (typeof json.escapeSession?.time_remaining_seconds === 'number') {
          setSecondsLeft(json.escapeSession.time_remaining_seconds);
        }
      }
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

  // Synchronize initial seconds when data is loaded
  useEffect(() => {
    if (data?.escapeSession?.time_remaining_seconds !== undefined) {
      setSecondsLeft(data.escapeSession.time_remaining_seconds);
    }
  }, [data?.escapeSession?.time_remaining_seconds, data?.escapeSession?.status]);

  // Live Authoritative 1-second Countdown
  useEffect(() => {
    if (!data?.escapeSession || data.escapeSession.status !== 'ACTIVE') return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Trigger fetch to sync timeout with server
          fetchEscape();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [data?.escapeSession?.status]);

  const handleSolvePuzzle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedPuzzle || submitting) return;

    setSubmitting(true);
    setFeedback(null);

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
        setFeedback({ message: 'SECURITY LOCK OVERRIDDEN! CHAMBER UNLOCKED.', type: 'success' });
        const socket = getSocket();
        socket.emit('escape:puzzle_solved', {
          sessionId,
          puzzleId: selectedPuzzle.puzzle_id,
          doorUnlocked: resData.doorUnlocked,
          nextRoomId: resData.nextRoomId,
          isGameComplete: resData.isGameComplete
        });

        setTimeout(() => {
          setSelectedPuzzle(null);
          setCodeAnswer('');
          setFeedback(null);
          fetchEscape();
        }, 1200);
      } else {
        setFeedback({ message: resData.message || 'Incorrect combination or override code.', type: 'error' });
        fetchEscape();
      }
    } catch (e: any) {
      setFeedback({ message: e.message || 'Failed to communicate with chamber lock', type: 'error' });
    } finally {
      setSubmitting(false);
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

  if (!sessionId) {
    return <EscapeRoomBriefing />;
  }

  if (loading) {
    return (
      <div className="text-center py-24 font-mono text-cyan-400 animate-pulse">
        Booting Chamber Environmental Systems...
      </div>
    );
  }

  const isEscaped = data?.escapeSession?.status === 'ESCAPED';
  const isTimeout = data?.escapeSession?.status === 'TIMEOUT' || (secondsLeft <= 0 && !isEscaped);
  const isGameOver = isEscaped || isTimeout;
  const currentRoomId = data?.escapeSession?.current_room_id;

  return (
    <div className="space-y-8 py-6 w-full max-w-7xl mx-auto overflow-x-hidden px-2 sm:px-4">
      {/* Chamber Header & Telemetry */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-amber-950/40 via-vault-card to-vault-surface border border-amber-500/30 p-5 sm:p-6 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded uppercase font-bold">
              COOPERATIVE ESCAPE • {data?.escapeSession?.difficulty || 'MEDIUM'}
            </span>
            <span className="text-xs font-mono text-gray-400">
              CHAMBER SECTOR #{currentRoomId || 1}
            </span>
            <span className="text-xs font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2.5 py-0.5 rounded font-bold">
              SCORE: {data?.currentScore ?? Math.max(0, ((currentRoomId || 1) - 1) * 10)} / 30 PTS
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-wider mt-1">
            {data?.escapeSession?.room_name || 'Decontamination Airlock'}
          </h1>
          <p className="text-xs text-gray-300 max-w-xl mt-1 leading-relaxed">
            {data?.escapeSession?.room_description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full md:w-auto justify-between md:justify-end">
          <Timer 
            secondsRemaining={secondsLeft} 
            totalSeconds={data?.escapeSession?.time_limit_seconds || 600} 
            label={isTimeout ? "PURGE COMPLETE" : "ATMOSPHERIC PURGE"} 
          />
          <div className="text-center font-mono bg-vault-surface border border-vault-border p-3 rounded min-w-[120px]">
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">TACTICAL HINTS</div>
            <div className="text-xl font-bold text-amber-400">
              {data?.escapeSession?.hints_remaining ?? 2} / 2
            </div>
            <MindVaultButton
              variant="amber"
              size="sm"
              disabled={(data?.escapeSession?.hints_remaining ?? 2) <= 0 || isGameOver}
              onClick={handleRequestHint}
              className="mt-1 w-full text-xs"
            >
              Request Hint
            </MindVaultButton>
          </div>
        </div>
      </div>

      {/* Mission Accomplished Banner & Exit Actions */}
      {isEscaped && (
        <MindVaultCard className="p-6 sm:p-8 border-emerald-500 bg-emerald-950/30 text-center space-y-6 shadow-glow-emerald/20">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-300">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-display font-black text-emerald-400 uppercase tracking-wider">
              MISSION ACCOMPLISHED: TEAM ESCAPED THE VAULT!
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 font-mono max-w-xl mx-auto">
              All bulkhead security interlocks successfully overridden. Infiltration team safely extracted.
              Your victory score has been permanently recorded in the MindVault system.
            </p>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto font-mono text-xs">
            <div className="p-3 bg-black/60 rounded border border-emerald-500/30">
              <div className="text-gray-400 text-[10px] uppercase">STATUS</div>
              <div className="text-emerald-400 font-bold text-sm">ESCAPED</div>
            </div>
            <div className="p-3 bg-black/60 rounded border border-emerald-500/30">
              <div className="text-gray-400 text-[10px] uppercase">SCORE EARNED</div>
              <div className="text-amber-400 font-bold text-sm">
                +{data?.result?.final_team_score || 30} PTS
              </div>
            </div>
            <div className="p-3 bg-black/60 rounded border border-emerald-500/30">
              <div className="text-gray-400 text-[10px] uppercase">TIME ELAPSED</div>
              <div className="text-cyan-400 font-bold text-sm">
                {data?.result?.time_taken_seconds 
                  ? `${Math.floor(data.result.time_taken_seconds / 60)}m ${data.result.time_taken_seconds % 60}s` 
                  : `${Math.floor(((data?.escapeSession?.time_limit_seconds || 600) - secondsLeft) / 60)}m ${((data?.escapeSession?.time_limit_seconds || 600) - secondsLeft) % 60}s`}
              </div>
            </div>
            <div className="p-3 bg-black/60 rounded border border-emerald-500/30">
              <div className="text-gray-400 text-[10px] uppercase">HINTS USED</div>
              <div className="text-gray-200 font-bold text-sm">
                {2 - (data?.escapeSession?.hints_remaining ?? 2)} / 2
              </div>
            </div>
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-4 border-t border-emerald-500/20">
            <Link href="/games">
              <MindVaultButton variant="primary" size="md" className="font-bold">
                <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                Back to Games
              </MindVaultButton>
            </Link>
            <Link href="/leaderboard?game=ESCAPE_ROOM">
              <MindVaultButton variant="secondary" size="md" className="font-bold border-cyan-500/50 text-cyan-300">
                <Trophy className="w-4 h-4 mr-2 text-amber-400" />
                View Leaderboard
              </MindVaultButton>
            </Link>
            <Link href="/profile">
              <MindVaultButton variant="ghost" size="md" className="text-gray-300">
                View Profile & History
              </MindVaultButton>
            </Link>
          </div>
        </MindVaultCard>
      )}

      {/* Time Out Banner & Exit Actions */}
      {isTimeout && !isEscaped && (
        <MindVaultCard className="p-6 sm:p-8 border-red-500 bg-red-950/30 text-center space-y-6 shadow-glow-red/20">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-red-400">
            <AlertCircle className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-display font-black text-red-400 uppercase tracking-wider">
              TIME OUT: ATMOSPHERIC PURGE TRIGGERED
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 font-mono max-w-xl mx-auto">
              Chamber pressure breached. The 10-minute operational window has expired.
              All bulkheads sealed. Additional puzzle overrides are permanently locked for this session.
            </p>
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-4 border-t border-red-500/20">
            <Link href="/games">
              <MindVaultButton variant="primary" size="md" className="font-bold">
                <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                Back to Games
              </MindVaultButton>
            </Link>
            <Link href="/leaderboard?game=ESCAPE_ROOM">
              <MindVaultButton variant="secondary" size="md" className="font-bold border-cyan-500/50 text-cyan-300">
                <Trophy className="w-4 h-4 mr-2 text-amber-400" />
                View Leaderboard
              </MindVaultButton>
            </Link>
          </div>
        </MindVaultCard>
      )}

      {/* Active Hint Banner */}
      {activeHint && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/40 rounded-lg text-amber-300 font-mono text-xs flex items-center gap-3">
          <HelpCircle className="w-5 h-5 flex-shrink-0 text-amber-400" />
          <div><span className="font-bold uppercase tracking-wider">TACTICAL ADVISORY:</span> {activeHint}</div>
        </div>
      )}

      {/* Tactical Sub-Tabs Matching Detective Layout */}
      <div className="flex flex-wrap gap-2 border-b border-vault-border pb-2">
        {[
          { key: 'room', label: 'Current Room', icon: Compass },
          { key: 'objects', label: `Objects (${data?.objects?.length || 0})`, icon: Search },
          { key: 'clues', label: `Clues / Evidence (${data?.clues?.length || 0})`, icon: FileText },
          { key: 'puzzles', label: `Puzzles & Locks (${data?.puzzles?.length || 0})`, icon: KeyRound },
          { key: 'progress', label: `Progress (${data?.currentScore ?? 0}/30 PTS)`, icon: Layers },
          { key: 'team', label: `Team (${data?.sessionPlayers?.length || 1})`, icon: Users }
        ].map((t) => {
          const Icon = t.icon;
          const isSelected = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={
                'px-4 py-2 text-xs font-display font-bold uppercase tracking-wider rounded flex items-center gap-2 transition-all ' +
                (isSelected
                  ? 'bg-amber-600 text-white shadow-glow-amber/20'
                  : 'bg-vault-card border border-vault-border text-gray-300 hover:text-white')
              }
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Current Room */}
      {activeTab === 'room' && (
        <div className="space-y-6">
          {/* Chamber Navigation & Lock Status */}
          {data?.locks && data.locks.length > 0 && (
            <div className="bg-vault-card/60 border border-vault-border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span className="text-gray-400">ACTIVE BULKHEAD INTERLOCK:</span>
                <span className="text-white font-bold">{data.locks[0].lock_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">STATUS:</span>
                {data.completedPuzzles && data.completedPuzzles.length > 0 ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-bold">
                    <Unlock className="w-3.5 h-3.5" /> DISENGAGED
                  </span>
                ) : isTimeout ? (
                  <span className="text-red-400 flex items-center gap-1 font-bold">
                    <Lock className="w-3.5 h-3.5" /> PURGE LOCKOUT
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1 font-bold">
                    <Lock className="w-3.5 h-3.5" /> MAGNETICALLY SEALED
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Environmental Briefing Card */}
          <MindVaultCard className="p-6 space-y-4 border-amber-500/30 bg-gradient-to-br from-vault-card via-vault-surface to-black/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-display font-bold text-white uppercase tracking-wider">
                  Chamber Sector #{currentRoomId || 1}: {data?.escapeSession?.room_name}
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {data?.escapeSession?.ambient_theme || 'SECURE_VAULT'}
              </span>
            </div>

            <p className="text-sm text-gray-200 leading-relaxed font-mono">
              {data?.escapeSession?.room_description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-vault-border/60 font-mono text-xs">
              <div className="p-3 bg-vault-surface/80 rounded border border-vault-border">
                <div className="text-[10px] text-gray-400 uppercase">Interactive Elements</div>
                <div className="text-lg font-bold text-cyan-400 mt-0.5">
                  {data?.objects?.length || 0} Objects Detected
                </div>
                <div className="text-[10px] text-gray-500 mt-1">Examine clues & deduce passwords</div>
              </div>

              <div className="p-3 bg-vault-surface/80 rounded border border-vault-border">
                <div className="text-[10px] text-gray-400 uppercase">Sector Bulkhead</div>
                <div className="text-lg font-bold text-amber-400 mt-0.5">
                  {data?.locks?.[0]?.lock_name || 'Heavy Hatch'}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">
                  {data?.completedPuzzles?.length > 0 ? 'Unlocked' : 'Requires Code Override'}
                </div>
              </div>

              <div className="p-3 bg-vault-surface/80 rounded border border-vault-border">
                <div className="text-[10px] text-gray-400 uppercase">Sector Points</div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">+10 PTS Per Chamber</div>
                <div className="text-[10px] text-gray-500 mt-1">Exit Chamber 3 for 30 PTS total</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <MindVaultButton
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('objects')}
              >
                <Search className="w-4 h-4 mr-1.5" /> Inspect Chamber Objects
              </MindVaultButton>
              <MindVaultButton
                variant="secondary"
                size="sm"
                onClick={() => setActiveTab('clues')}
              >
                <FileText className="w-4 h-4 mr-1.5 text-cyan-400" /> View Discovered Clues
              </MindVaultButton>
              <MindVaultButton
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('puzzles')}
              >
                <KeyRound className="w-4 h-4 mr-1.5 text-amber-400" /> Security Override Keypad
              </MindVaultButton>
            </div>
          </MindVaultCard>
        </div>
      )}

      {/* TAB 2: Objects */}
      {activeTab === 'objects' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h2 className="text-base font-display font-bold uppercase text-white tracking-wider flex items-center gap-2">
              <Search className="w-4 h-4 text-amber-400" />
              Interactive Chamber Objects ({data?.objects?.length || 0})
            </h2>
            <span className="text-xs font-mono text-gray-400">
              Examine objects and discover clues to deduce override codes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...(data?.objects || [])]
              .sort((a: any, b: any) => {
                // Unlocked investigative clue/evidence objects ALWAYS appear before locked mechanisms
                if (!a.is_locked && b.is_locked) return -1;
                if (a.is_locked && !b.is_locked) return 1;
                return a.object_id - b.object_id;
              })
              .map((obj: any) => {
                const puz = data?.puzzles?.find((p: any) => p.object_id === obj.object_id);
                const clue = data?.clues?.find((c: any) => c.object_id === obj.object_id);
                const isSolved = data?.completedPuzzles?.some((cp: any) => cp.puzzle_id === puz?.puzzle_id);

                return (
                  <MindVaultCard
                    key={obj.object_id}
                    className="p-5 space-y-4 border-vault-border hover:border-amber-500/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {obj.is_locked ? (
                          isSolved ? (
                            <Unlock className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Lock className="w-5 h-5 text-amber-400" />
                          )
                        ) : (
                          <FileText className="w-5 h-5 text-cyan-400" />
                        )}
                        <div>
                          <h3 className="font-display font-bold text-white text-base">{obj.name}</h3>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                            {obj.is_locked ? 'Lock Mechanism' : 'Investigative Evidence'}
                          </span>
                        </div>
                      </div>

                      {isSolved ? (
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded font-bold">
                          SOLVED
                        </span>
                      ) : isTimeout ? (
                        <span className="text-[10px] font-mono text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded">
                          SEALED
                        </span>
                      ) : obj.is_locked ? (
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                          SEALED
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-400/30 px-2 py-0.5 rounded">
                          CLUE DETECTED
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed font-sans min-h-[40px]">
                      {obj.description}
                    </p>

                    {/* Interaction Action Buttons */}
                    <div className="pt-2 border-t border-vault-border/60 flex flex-wrap gap-2">
                      {/* Inspect & Read Clue Button for investigative evidence */}
                      {!obj.is_locked && (
                        <MindVaultButton
                          variant="secondary"
                          size="sm"
                          className="flex-1 justify-center text-xs"
                          onClick={() => {
                            setSelectedObject({ ...obj, clue });
                            setIsZoomed(false);
                          }}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                          {clue ? 'Inspect & Read Clue' : 'Inspect Object'}
                        </MindVaultButton>
                      )}

                      {/* Input Code Button for lock mechanisms */}
                      {puz && !isSolved && (
                        <MindVaultButton
                          variant={isGameOver ? 'ghost' : 'amber'}
                          size="sm"
                          disabled={isGameOver}
                          className="flex-1 justify-center text-xs"
                          onClick={() => {
                            if (isGameOver) return;
                            setSelectedPuzzle(puz);
                            setFeedback(null);
                            setCodeAnswer('');
                          }}
                        >
                          <KeyRound className="w-3.5 h-3.5 mr-1.5" />
                          {isGameOver ? 'Overrides Sealed' : 'Input Override Code'}
                        </MindVaultButton>
                      )}

                      {isSolved && (
                        <div className="w-full text-center text-xs font-mono text-emerald-400 py-1 bg-emerald-950/20 rounded border border-emerald-500/30">
                          ✓ Mechanism Successfully Disengaged
                        </div>
                      )}
                    </div>
                  </MindVaultCard>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 3: Clues / Evidence */}
      {activeTab === 'clues' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold uppercase text-white tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Tactical Field Log & Discovered Clues ({data?.clues?.length || 0})
            </h3>
            <span className="text-xs font-mono text-gray-400">
              Schematics, blueprints, and technician transcripts
            </span>
          </div>

          {data?.clues && data.clues.length > 0 ? (
            <div className="space-y-3">
              {data.clues.map((clue: any) => {
                const sourceObj = data.objects?.find((o: any) => o.object_id === clue.object_id);
                return (
                  <div
                    key={clue.clue_id}
                    className="p-4 bg-vault-surface/80 border border-vault-border rounded-lg font-mono text-xs space-y-3"
                  >
                    <div className="flex items-center justify-between text-cyan-400 text-[11px] font-bold">
                      <span>SOURCE: {sourceObj?.name || 'Chamber Object'}</span>
                      <div className="flex items-center gap-2">
                        {clue.image_url && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedObject({
                                ...(sourceObj || { name: 'Chamber Object', description: '' }),
                                clue
                              });
                              setIsZoomed(false);
                            }}
                            className="text-[10px] text-amber-400 hover:text-amber-300 underline uppercase"
                          >
                            [VIEW SCHEMATIC]
                          </button>
                        )}
                        <span>LOG ENTRY #{clue.clue_id}</span>
                      </div>
                    </div>
                    {clue.image_url && (
                      <div className="p-1.5 bg-black/60 rounded border border-cyan-500/20 max-w-[220px]">
                        <img
                          src={clue.image_url}
                          alt="Clue schematic"
                          className="w-full h-auto max-h-[120px] object-contain rounded cursor-pointer hover:opacity-90"
                          onClick={() => {
                            setSelectedObject({
                              ...(sourceObj || { name: 'Chamber Object', description: '' }),
                              clue
                            });
                            setIsZoomed(false);
                          }}
                        />
                      </div>
                    )}
                    <p className="text-gray-200 leading-relaxed font-mono">"{clue.clue_text}"</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 font-mono text-xs text-gray-400 bg-vault-card/40 rounded-lg border border-vault-border">
              No clues discovered in this sector yet. Examine interactive objects in the chamber.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Puzzles & Locks */}
      {activeTab === 'puzzles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold uppercase text-white tracking-wider flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-400" />
              Chamber Security Locks & Overrides
            </h3>
            <span className="text-xs font-mono text-gray-400">
              Submit deduced override combinations
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data?.puzzles?.map((puz: any) => {
              const targetObj = data?.objects?.find((o: any) => o.object_id === puz.object_id);
              const isSolved = data?.completedPuzzles?.some((cp: any) => cp.puzzle_id === puz.puzzle_id);

              return (
                <MindVaultCard
                  key={puz.puzzle_id}
                  className="p-5 space-y-3 border-vault-border hover:border-amber-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isSolved ? (
                        <Unlock className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Lock className="w-4 h-4 text-amber-400" />
                      )}
                      <h4 className="font-display font-bold text-white text-sm">
                        {targetObj?.name || 'Security Lock'}
                      </h4>
                    </div>
                    <span
                      className={
                        'text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ' +
                        (isSolved
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30')
                      }
                    >
                      {isSolved ? 'OVERRIDDEN' : 'LOCKED'}
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 font-mono bg-black/40 p-3 rounded border border-vault-border/60 leading-relaxed">
                    {puz.puzzle_prompt}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-vault-border/60 text-xs font-mono">
                    <span className="text-gray-400">
                      RATING: <span className="text-amber-400 font-bold">+{puz.difficulty_points || 10} PTS</span>
                    </span>
                    {!isSolved && (
                      <MindVaultButton
                        variant={isGameOver ? 'ghost' : 'amber'}
                        size="sm"
                        disabled={isGameOver}
                        onClick={() => {
                          if (isGameOver) return;
                          setSelectedPuzzle(puz);
                          setFeedback(null);
                          setCodeAnswer('');
                        }}
                      >
                        <KeyRound className="w-3.5 h-3.5 mr-1" />
                        {isGameOver ? 'Sealed' : 'Input Override Code'}
                      </MindVaultButton>
                    )}
                  </div>
                </MindVaultCard>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: Progress */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          {/* Progression Roadmap */}
          <MindVaultCard className="p-6 space-y-4">
            <h3 className="text-sm font-display font-bold uppercase text-white tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Chamber Infiltration Roadmap
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              {[
                { seq: 1, name: 'Decontamination Airlock', pts: 10 },
                { seq: 2, name: 'Reactor Core Control', pts: 20 },
                { seq: 3, name: 'Central Command Vault', pts: 30 }
              ].map((sector) => {
                const isCurrent = (currentRoomId || 1) === sector.seq;
                const isPassed = (currentRoomId || 1) > sector.seq || isEscaped;
                return (
                  <div
                    key={sector.seq}
                    className={`p-4 rounded-lg border ${
                      isPassed
                        ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300'
                        : isCurrent
                        ? 'border-amber-500/50 bg-amber-950/20 text-amber-300'
                        : 'border-vault-border bg-vault-surface/40 text-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase mb-1">
                      <span>Sector #{sector.seq}</span>
                      <span>
                        {isPassed ? '✓ CLEARED' : isCurrent ? '● IN PROGRESS' : 'SEALED'}
                      </span>
                    </div>
                    <div className="font-display font-bold text-sm text-white">{sector.name}</div>
                    <div className="text-[10px] text-gray-400 mt-2">Target Score: {sector.pts} PTS</div>
                  </div>
                );
              })}
            </div>
          </MindVaultCard>

          {/* Recent Attempts Feed */}
          {data?.attempts && data.attempts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-display font-bold uppercase text-gray-300 tracking-wider flex items-center gap-2">
                <Radio className="w-4 h-4 text-gray-400" />
                Recent Chamber Code Attempts
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 font-mono text-xs">
                {data.attempts.map((att: any) => (
                  <div
                    key={att.attempt_id}
                    className={`p-2 rounded border text-center ${
                      att.is_successful
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                        : 'border-red-500/30 bg-red-500/10 text-red-300'
                    }`}
                  >
                    <div className="text-[10px] text-gray-400">ENTRY: {att.submitted_answer_preview}</div>
                    <div className="font-bold text-[11px]">{att.is_successful ? 'OVERRIDE' : 'REJECTED'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: Team */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold uppercase text-white tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Operative Infiltration Team ({data?.sessionPlayers?.length || 1})
            </h3>
            <span className="text-xs font-mono text-gray-400">
              Shared team progress & live synchronization
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {(data?.sessionPlayers || [
              { user_id: dbUser?.userId, display_name: dbUser?.displayName, final_score: data?.currentScore || 0 }
            ]).map((p: any) => (
              <MindVaultCard key={p.user_id} className="p-4 space-y-3 border-vault-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center font-display font-bold text-purple-300">
                    {p.display_name?.charAt(0)?.toUpperCase() || 'O'}
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-white text-sm">{p.display_name}</h4>
                    <span className="text-[10px] font-mono text-cyan-400 uppercase">
                      Chamber Operative
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-vault-border/60 flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-400">STATUS:</span>
                  <span className="text-emerald-400 font-bold">
                    {isEscaped ? 'EXTRACTED' : isTimeout ? 'PURGED' : 'ACTIVE IN VAULT'}
                  </span>
                </div>
              </MindVaultCard>
            ))}
          </div>

          <div className="p-4 bg-vault-surface/60 border border-vault-border rounded-lg text-xs font-mono text-gray-300 space-y-1">
            <div className="text-purple-400 font-bold uppercase text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Cooperative Telemetry
            </div>
            <p className="text-[11px] leading-relaxed text-gray-400">
              All clue discoveries, hint requests, and bulkhead door overrides are shared in real-time across your infiltration unit via WebSocket broadcast.
            </p>
          </div>
        </div>
      )}

      {/* MODAL 1: Clue / Evidence Inspector Modal */}
      {selectedObject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto">
          <MindVaultCard className="max-w-3xl w-full p-4 sm:p-6 space-y-4 border-cyan-500 shadow-glow-cyan/20 max-h-[92vh] flex flex-col my-auto">
            <div className="flex items-start justify-between border-b border-vault-border pb-3 flex-shrink-0">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                  CHAMBER EVIDENCE TRANSCRIPT
                </span>
                <h3 className="text-lg sm:text-xl font-display font-bold text-white uppercase mt-0.5">
                  {selectedObject.name}
                </h3>
              </div>
              <button 
                onClick={() => {
                  setSelectedObject(null);
                  setIsZoomed(false);
                }}
                className="text-gray-400 hover:text-white p-1.5 rounded transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs overflow-y-auto pr-1">
              <div className="text-gray-400">
                <span className="font-bold uppercase text-gray-300">Description: </span>
                {selectedObject.description}
              </div>

              {selectedObject.clue && (
                <div className="p-3 sm:p-4 bg-cyan-950/30 border border-cyan-500/40 rounded-lg space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                      <FileText className="w-4 h-4" />
                      Visual Schematic & Evidence
                    </div>
                    {selectedObject.clue.image_url && (
                      <button
                        type="button"
                        onClick={() => setIsZoomed(!isZoomed)}
                        className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-300 hover:text-white bg-cyan-950/80 border border-cyan-500/40 px-2.5 py-1 rounded transition-colors"
                      >
                        {isZoomed ? <ZoomOut className="w-3.5 h-3.5 text-amber-400" /> : <ZoomIn className="w-3.5 h-3.5 text-cyan-400" />}
                        <span>{isZoomed ? 'Fit to Screen' : 'Zoom In / Enlarge'}</span>
                      </button>
                    )}
                  </div>

                  {selectedObject.clue.image_url && (
                    <div className="rounded-lg border border-cyan-500/30 bg-black/80 p-2 sm:p-3 overflow-x-auto">
                      <div className={`transition-all duration-300 flex items-center justify-center ${isZoomed ? 'min-w-[680px]' : 'w-full'}`}>
                        <img 
                          src={selectedObject.clue.image_url} 
                          alt={selectedObject.name}
                          onClick={() => setIsZoomed(!isZoomed)}
                          className={`w-full object-contain rounded cursor-pointer transition-all ${
                            isZoomed ? 'max-h-[620px]' : 'max-h-[380px] sm:max-h-[440px]'
                          }`}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-gray-400 mt-2 font-mono px-1">
                        <span>CHAMBER SCHEMATIC • HIGH RESOLUTION VECTOR</span>
                        <span>Click image or button to {isZoomed ? 'fit' : 'zoom'}</span>
                      </div>
                    </div>
                  )}

                  <p className="text-gray-100 leading-relaxed font-mono text-xs sm:text-sm bg-black/40 p-3 rounded border border-cyan-500/20">
                    "{selectedObject.clue.clue_text}"
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end border-t border-vault-border/60 flex-shrink-0">
              <MindVaultButton 
                variant="secondary" 
                size="md" 
                onClick={() => {
                  setSelectedObject(null);
                  setIsZoomed(false);
                }}
              >
                Close Evidence Viewer
              </MindVaultButton>
            </div>
          </MindVaultCard>
        </div>
      )}

      {/* MODAL 2: Puzzle / Keypad Mechanism Modal */}
      {selectedPuzzle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <MindVaultCard className="max-w-lg w-full p-6 space-y-5 border-amber-500 shadow-glow-amber/20">
            <div className="flex items-start justify-between border-b border-vault-border pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400">
                  OVERRIDE MECHANISM INTERFACE
                </span>
                <h3 className="text-xl font-display font-bold text-white uppercase mt-0.5">
                  Chamber Security Lock
                </h3>
              </div>
              <button 
                onClick={() => {
                  setSelectedPuzzle(null);
                  setFeedback(null);
                }}
                className="text-gray-400 hover:text-white p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="text-gray-300">
                <span className="text-gray-400">DIFFICULTY RATING: </span>
                <span className="text-amber-400 font-bold">+{selectedPuzzle.difficulty_points} PTS</span>
              </div>
              
              <div className="p-3 bg-black/50 border border-vault-border rounded font-mono text-amber-300 leading-relaxed text-sm">
                {selectedPuzzle.puzzle_prompt}
              </div>
            </div>

            {feedback && (
              <div 
                className={`p-3 rounded text-xs font-mono flex items-center gap-2 ${
                  feedback.type === 'success' 
                    ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300' 
                    : 'bg-red-500/10 border border-red-500/40 text-red-300'
                }`}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSolvePuzzle} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-gray-400 mb-1.5 uppercase tracking-wider text-[11px]">
                  INPUT COMBINATION OR CODE
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  disabled={isGameOver}
                  value={codeAnswer}
                  onChange={(e) => setCodeAnswer(e.target.value)}
                  placeholder="ENTER CODE / 0000"
                  className="w-full bg-vault-surface border border-vault-border focus:border-amber-400 focus:outline-none p-3 text-xl font-bold text-center tracking-widest text-cyan-400 uppercase rounded"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <MindVaultButton 
                  type="submit" 
                  variant="amber" 
                  size="md" 
                  isLoading={submitting}
                  disabled={isGameOver}
                  className="flex-1 justify-center font-bold"
                >
                  Verify Override
                </MindVaultButton>
                <MindVaultButton 
                  type="button" 
                  variant="ghost" 
                  size="md" 
                  onClick={() => {
                    setSelectedPuzzle(null);
                    setFeedback(null);
                  }}
                >
                  Cancel
                </MindVaultButton>
              </div>
            </form>
          </MindVaultCard>
        </div>
      )}
    </div>
  );
}

export default function EscapeRoomGamePage() {
  return (
    <React.Suspense fallback={<div className="text-center py-24 font-mono text-cyan-400 animate-pulse">Booting Chamber Environmental Systems...</div>}>
      <EscapeRoomGameContent />
    </React.Suspense>
  );
}
