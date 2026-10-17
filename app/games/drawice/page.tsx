'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { getSocket } from '@/lib/socket/client';
import {
  Palette,
  Send,
  Trash2,
  Undo2,
  Eraser,
  PenTool,
  Trophy,
  CheckCircle2,
  Clock,
  Sparkles,
  Crown,
  ChevronRight,
  ArrowRight,
  Shield,
  Award
} from 'lucide-react';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';
import { Timer } from '@/components/ui/Timer';
import { DrawiceBriefing } from '@/components/games/DrawiceBriefing';

const PALETTE_COLORS = [
  '#00F0FF', // Cyan
  '#10B981', // Emerald
  '#EF4444', // Neon Red
  '#F59E0B', // Amber
  '#A855F7', // Purple
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#FFFFFF', // White
  '#94A3B8', // Slate
  '#0B0F17'  // Vault Dark
];

const BRUSH_SIZES = [2, 4, 8, 14, 24];

function DrawiceGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = parseInt(searchParams.get('session') || '0', 10);
  const { token, dbUser } = useAuth();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [data, setData] = useState<any>(null);
  const [wordChoices, setWordChoices] = useState<any[]>([]);
  const [guessInput, setGuessInput] = useState('');
  const [selectedColor, setSelectedColor] = useState('#00F0FF');
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStrokeId, setCurrentStrokeId] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingGuess, setSubmittingGuess] = useState(false);
  const [guessFeedback, setGuessFeedback] = useState<{ message: string; isCorrect: boolean } | null>(null);
  const [advancingRound, setAdvancingRound] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(60);

  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Synchronize canvas dimensions & clear
  const clearCanvasLocally = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0B0F17';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const drawStrokeSegment = useCallback((stroke: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(stroke.x0, stroke.y0);
    ctx.lineTo(stroke.x1, stroke.y1);
    ctx.stroke();
  }, []);

  const replayAllStrokes = useCallback((strokes: any[]) => {
    clearCanvasLocally();
    if (!strokes || !Array.isArray(strokes)) return;
    strokes.forEach((s) => drawStrokeSegment(s));
  }, [clearCanvasLocally, drawStrokeSegment]);

  // Fetch session authoritative state
  const fetchDrawice = useCallback(async () => {
    if (!sessionId || !token) return;
    try {
      const res = await fetch('/api/games/drawice/' + sessionId, {
        headers: { Authorization: 'Bearer ' + token }
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
        setGuesses(json.guesses || []);
        if (json.secondsRemaining !== undefined) {
          setTimerSeconds(json.secondsRemaining);
        }
        if (json.round?.wordChoices && json.round?.wordChoices.length > 0) {
          setWordChoices(json.round.wordChoices);
        } else if (json.round?.isArtist && json.round?.status === 'CHOOSING') {
          // Fallback fetch
          fetch('/api/games/drawice/' + sessionId + '/word-choices', {
            headers: { Authorization: 'Bearer ' + token }
          })
            .then((r) => r.json())
            .then((w) => {
              if (w.choices) setWordChoices(w.choices);
            })
            .catch(() => {});
        }
      }
    } catch (e) {
      console.error('[Drawice] fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [sessionId, token]);

  // Local second-by-second countdown
  useEffect(() => {
    if (!data?.round || data.round.status !== 'DRAWING') return;
    const timerInterval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          fetchDrawice();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [data?.round?.status, fetchDrawice]);

  // Setup Socket & Initial Data
  useEffect(() => {
    fetchDrawice();
    const pollInterval = setInterval(fetchDrawice, 4000);

    const socket = getSocket(token || undefined);
    socket.connect();
    socket.emit('session:join', { sessionId, user: dbUser });

    // Request active canvas strokes upon connection
    socket.emit('drawice:request_sync', { sessionId });

    socket.on('drawice:stroke', (stroke: any) => {
      drawStrokeSegment(stroke);
    });

    socket.on('drawice:clear', () => {
      clearCanvasLocally();
    });

    socket.on('drawice:sync_canvas', (strokes: any[]) => {
      replayAllStrokes(strokes);
    });

    socket.on('drawice:word_chosen', () => {
      clearCanvasLocally();
      fetchDrawice();
    });

    socket.on('drawice:guess_alert', (evt: any) => {
      fetchDrawice();
    });

    socket.on('drawice:round_reveal', () => {
      fetchDrawice();
    });

    socket.on('drawice:next_round', () => {
      clearCanvasLocally();
      setGuessFeedback(null);
      fetchDrawice();
    });

    socket.on('drawice:game_completed', () => {
      fetchDrawice();
    });

    return () => {
      clearInterval(pollInterval);
      socket.off('drawice:stroke');
      socket.off('drawice:clear');
      socket.off('drawice:sync_canvas');
      socket.off('drawice:word_chosen');
      socket.off('drawice:guess_alert');
      socket.off('drawice:round_reveal');
      socket.off('drawice:next_round');
      socket.off('drawice:game_completed');
    };
  }, [sessionId, token, dbUser, fetchDrawice, drawStrokeSegment, clearCanvasLocally, replayAllStrokes]);

  // Initialize canvas background once mounted
  useEffect(() => {
    clearCanvasLocally();
  }, [clearCanvasLocally]);

  // Select Word (Artist only)
  const handleSelectWord = async (wordId: number) => {
    if (!token) return;
    try {
      const res = await fetch('/api/games/drawice/' + sessionId + '/select-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({ wordId })
      });
      if (res.ok) {
        clearCanvasLocally();
        fetchDrawice();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Private Guess (Guesser only)
  const handleSendGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = guessInput.trim();
    if (!clean || !token || submittingGuess) return;

    setSubmittingGuess(true);
    setGuessFeedback(null);

    try {
      const res = await fetch('/api/games/drawice/' + sessionId + '/guess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({ guessText: clean })
      });
      const resData = await res.json();
      if (res.ok) {
        setGuessInput('');
        if (resData.isCorrect) {
          setGuessFeedback({
            message: `CORRECT! You solved it in position #${resData.sequence} (+${resData.pointsAwarded} pts)`,
            isCorrect: true
          });
        } else {
          setGuessFeedback({
            message: `"${clean}" is incorrect. Try again!`,
            isCorrect: false
          });
        }
        fetchDrawice();
      } else {
        setGuessFeedback({
          message: resData.error || 'Submission error',
          isCorrect: false
        });
      }
    } catch (e: any) {
      setGuessFeedback({
        message: e.message || 'Failed to submit guess',
        isCorrect: false
      });
    } finally {
      setSubmittingGuess(false);
    }
  };

  // Advance to Next Round / Complete Game
  const handleNextRound = async () => {
    if (!token || advancingRound) return;
    setAdvancingRound(true);
    try {
      // Save canvas snapshot to round before advancing
      if (canvasRef.current && data?.round?.isArtist) {
        const snapshotUrl = canvasRef.current.toDataURL('image/png', 0.8);
        await fetch('/api/games/drawice/' + sessionId + '/save-canvas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token
          },
          body: JSON.stringify({ drawingData: snapshotUrl })
        }).catch(() => {});
      }

      const res = await fetch('/api/games/drawice/' + sessionId + '/next-round', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token }
      });
      if (res.ok) {
        clearCanvasLocally();
        setGuessFeedback(null);
        fetchDrawice();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAdvancingRound(false);
    }
  };

  // Mouse & Touch Normalized Coordinate Helpers
  const getCanvasCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: any) => {
    if (!data?.round?.isArtist || data?.round?.status !== 'DRAWING') return;
    setIsDrawing(true);
    const strokeId = 'stroke_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    setCurrentStrokeId(strokeId);
    lastPos.current = getCanvasCoordinates(e);
  };

  const draw = (e: any) => {
    if (!isDrawing || !lastPos.current || !data?.round?.isArtist) return;
    const currentCoords = getCanvasCoordinates(e);

    const strokeColor = isEraser ? '#0B0F17' : selectedColor;
    const strokeSize = isEraser ? brushSize * 3 : brushSize;

    const stroke = {
      x0: lastPos.current.x,
      y0: lastPos.current.y,
      x1: currentCoords.x,
      y1: currentCoords.y,
      color: strokeColor,
      size: strokeSize,
      strokeId: currentStrokeId
    };

    drawStrokeSegment(stroke);

    const socket = getSocket();
    socket.emit('drawice:stroke', { sessionId, strokeData: stroke });
    lastPos.current = currentCoords;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
    setCurrentStrokeId(null);
  };

  const handleClearCanvas = () => {
    clearCanvasLocally();
    const socket = getSocket();
    socket.emit('drawice:clear', { sessionId });
  };

  const handleUndo = () => {
    const socket = getSocket();
    socket.emit('drawice:undo', { sessionId });
  };

  if (!sessionId) {
    return <DrawiceBriefing />;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-4">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
        <div className="font-mono text-cyan-400 text-sm tracking-wider animate-pulse">
          SYNCHRONIZING DRAWICE STUDIO...
        </div>
      </div>
    );
  }

  const round = data?.round;
  const session = data?.session;
  const isArtist = round?.isArtist;
  const status = round?.status;
  const myGuessStatus = data?.myGuessStatus;
  const players = data?.players || [];
  const isGameCompleted = session?.status === 'COMPLETED' || status === 'FINISHED';

  // ==========================================
  // VIEW: END OF TOURNAMENT (CHAMPION SPOTLIGHT)
  // ==========================================
  if (isGameCompleted) {
    const sortedPlayers = [...players].sort((a, b) => (a.final_rank || 99) - (b.final_rank || 99));
    const champion = sortedPlayers[0];

    return (
      <div className="max-w-4xl mx-auto py-8 space-y-8 animate-fadeIn">
        {/* Champion Trophy Header */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-500/10 via-vault-card to-vault-surface p-8 text-center shadow-2xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/20 text-amber-300 font-mono text-xs uppercase tracking-wider mb-4">
            <Trophy className="w-4 h-4 text-amber-400" />
            Tournament Complete • Drawice Studio
          </div>

          <h1 className="text-4xl sm:text-5xl font-display font-black text-white uppercase tracking-wider">
            Drawice Champion
          </h1>

          {/* Champion Spotlight Badge */}
          {champion && (
            <div className="mt-6 flex flex-col items-center">
              <div className="relative">
                <Crown className="w-10 h-10 text-amber-400 absolute -top-7 left-1/2 -translate-x-1/2 animate-bounce" />
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 via-purple-500 to-cyan-400 p-1 shadow-glow-cyan">
                  <div className="w-full h-full bg-vault-dark rounded-full overflow-hidden flex items-center justify-center font-display font-black text-3xl text-white">
                    {champion.avatar_url ? (
                      <img src={champion.avatar_url} alt={champion.display_name} className="w-full h-full object-cover" />
                    ) : (
                      champion.display_name?.charAt(0).toUpperCase()
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-2xl font-display font-bold text-amber-300">{champion.display_name}</div>
              <div className="font-mono text-sm text-gray-300">
                Tournament Winner • <span className="text-cyan-400 font-bold">{champion.final_score} Points</span>
              </div>
            </div>
          )}
        </div>

        {/* Final Tournament Leaderboard */}
        <MindVaultCard className="p-6 space-y-4 border-vault-border">
          <h2 className="text-lg font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            Final Tournament Rankings
          </h2>

          <div className="divide-y divide-vault-border overflow-hidden rounded-lg border border-vault-border bg-vault-surface/40">
            {sortedPlayers.map((p, idx) => {
              const rank = p.final_rank || idx + 1;
              const isWinner = rank === 1;
              return (
                <div key={p.user_id} className={`flex items-center justify-between p-4 ${isWinner ? 'bg-amber-500/10' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-sm ${
                        rank === 1
                          ? 'bg-amber-400 text-black'
                          : rank === 2
                          ? 'bg-slate-300 text-black'
                          : rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-vault-card text-gray-400'
                      }`}
                    >
                      {rank}
                    </div>
                    <div>
                      <div className="font-display font-bold text-white flex items-center gap-2">
                        {p.display_name}
                        {isWinner && <Crown className="w-4 h-4 text-amber-400" />}
                        {p.user_id === dbUser?.userId && (
                          <span className="text-[10px] font-mono text-cyan-400 border border-cyan-400/30 bg-cyan-400/10 px-1.5 py-0.5 rounded">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono text-gray-400">
                        {isWinner ? 'Grand Champion' : 'Competitor'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold text-cyan-400">{p.final_score} pts</div>
                    <div className="text-[10px] font-mono text-gray-400">Total Score</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link href="/games" className="w-full sm:w-auto">
              <MindVaultButton variant="ghost" size="md" className="w-full justify-center">
                Return to Vault Games
              </MindVaultButton>
            </Link>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link href="/leaderboard" className="flex-1 sm:flex-initial">
                <MindVaultButton variant="secondary" size="md" className="w-full justify-center">
                  <Trophy className="w-4 h-4 mr-1.5" />
                  View Leaderboards
                </MindVaultButton>
              </Link>
              <Link href="/rooms/create?game=DRAWICE" className="flex-1 sm:flex-initial">
                <MindVaultButton variant="primary" size="md" className="w-full justify-center">
                  Play Again
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </MindVaultButton>
              </Link>
            </div>
          </div>
        </MindVaultCard>
      </div>
    );
  }

  // ==========================================
  // VIEW: ROUND REVEAL SCREEN
  // ==========================================
  if (status === 'ROUND_REVEAL') {
    const revealedWord = round.secretWord || round.chosen_word || 'SECRET WORD';
    const artistScore = round.artist_score || 0;
    const correctGuessers = guesses.filter((g) => g.is_correct);

    return (
      <div className="max-w-4xl mx-auto py-8 space-y-6 animate-fadeIn">
        {/* Word Reveal Banner */}
        <div className="rounded-2xl border border-purple-500/40 bg-gradient-to-r from-purple-950/60 via-vault-card to-cyan-950/60 p-8 text-center shadow-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-400/40 bg-purple-500/20 text-purple-300 font-mono text-xs uppercase tracking-wider">
            Round {round.round_number} of {session?.total_rounds || 5} • Word Revealed
          </div>
          <div className="text-xs font-mono uppercase text-gray-400 tracking-wider">The Secret Word Was</div>
          <h1 className="text-4xl sm:text-6xl font-display font-black text-cyan-300 uppercase tracking-widest drop-shadow-md">
            {revealedWord}
          </h1>
          <div className="pt-2 text-sm font-mono text-gray-300">
            Artist <span className="font-bold text-white">{round.artist_name}</span> earned{' '}
            <span className="text-emerald-400 font-bold">+{artistScore} points</span> for {correctGuessers.length} correct{' '}
            {correctGuessers.length === 1 ? 'guesser' : 'guessers'}.
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Round Guesses & Order */}
          <MindVaultCard className="p-6 space-y-4">
            <h2 className="text-base font-display font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Round Results</span>
              <span className="text-xs font-mono text-gray-400">1st=10pts, 2nd=9pts...</span>
            </h2>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {guesses.length === 0 ? (
                <div className="text-center py-12 text-xs font-mono text-gray-500">
                  No guesses were submitted this round.
                </div>
              ) : (
                guesses.map((g, idx) => (
                  <div
                    key={g.guess_id || idx}
                    className={`flex items-center justify-between p-3 rounded-lg border font-mono text-xs transition-all ${
                      g.is_correct
                        ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300'
                        : 'border-vault-border bg-vault-surface/40 text-gray-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {g.is_correct ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center text-[10px] text-gray-500">
                          ✕
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-gray-200">{g.display_name}: </span>
                        <span className={g.is_correct ? 'text-emerald-200 font-semibold' : 'text-gray-400'}>
                          {g.guess_text}
                        </span>
                      </div>
                    </div>
                    {g.is_correct && (
                      <div className="text-right flex-shrink-0 pl-2">
                        <span className="font-bold text-emerald-400">+{g.points_awarded} pts</span>
                        <div className="text-[10px] text-gray-400">Order #{g.submission_sequence}</div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </MindVaultCard>

          {/* Tournament Cumulative Standings */}
          <MindVaultCard className="p-6 space-y-4">
            <h2 className="text-base font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Tournament Standings
            </h2>

            <div className="divide-y divide-vault-border rounded-lg border border-vault-border bg-vault-surface/40 overflow-hidden">
              {players.map((p: any, idx: number) => (
                <div key={p.user_id} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 font-mono text-xs text-gray-400 font-bold">#{idx + 1}</span>
                    <div className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                      {p.display_name}
                      {idx === 0 && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                  </div>
                  <div className="font-mono text-sm font-bold text-cyan-400">{p.final_score} pts</div>
                </div>
              ))}
            </div>

            {/* Next Round Action */}
            <div className="pt-2">
              <MindVaultButton
                variant="primary"
                size="lg"
                className="w-full justify-center"
                isLoading={advancingRound}
                onClick={handleNextRound}
              >
                {round.round_number >= (session?.total_rounds || 5) ? (
                  <>
                    View Final Tournament Rankings
                    <Trophy className="w-4 h-4 ml-2 text-amber-300" />
                  </>
                ) : (
                  <>
                    Advance to Round {round.round_number + 1}
                    <ChevronRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </MindVaultButton>
            </div>
          </MindVaultCard>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: ACTIVE PLAY (CHOOSING & DRAWING)
  // ==========================================
  return (
    <div className="space-y-6 py-4 animate-fadeIn">
      {/* Top Match Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-950/40 via-vault-card to-vault-surface border border-purple-500/30 p-5 rounded-xl shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 rounded font-bold">
              ROUND {round?.round_number || 1} OF {session?.total_rounds || 5}
            </span>
            <span
              className={`text-xs font-mono px-2.5 py-0.5 rounded border ${
                isArtist
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                  : 'bg-vault-surface text-gray-300 border-vault-border'
              }`}
            >
              {isArtist ? '🎨 YOU ARE THE ARTIST' : `ARTIST: ${round?.artist_name}`}
            </span>
          </div>

          <h1 className="text-2xl font-display font-black text-white uppercase tracking-wider">Drawice Studio</h1>

          {/* Word status for Artist vs Guesser */}
          {isArtist ? (
            status === 'DRAWING' && round?.secretWord ? (
              <div className="font-mono text-xs text-gray-300">
                SECRET WORD:{' '}
                <span className="text-cyan-300 font-bold text-sm bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-400">
                  {round.secretWord}
                </span>
              </div>
            ) : (
              <div className="font-mono text-xs text-purple-300 animate-pulse">Select your word to start the 60-second round!</div>
            )
          ) : (
            status === 'DRAWING' && (
              <div className="font-mono text-sm tracking-widest font-bold text-cyan-300 flex items-center gap-2">
                <span>WORD:</span>
                <span className="bg-vault-surface px-3 py-1 rounded border border-cyan-500/40 text-white font-mono tracking-widest text-base">
                  {round?.maskedWord || '— — — — —'}
                </span>
                <span className="text-xs font-normal text-gray-400 font-mono">({round?.wordLength || 0} letters)</span>
              </div>
            )
          )}
        </div>

        {/* 60s Authoritative Timer */}
        <Timer secondsRemaining={timerSeconds} totalSeconds={60} label="ROUND TIMER" />
      </div>

      {/* Word Selection Overlay for Artist */}
      {isArtist && status === 'CHOOSING' && (
        <MindVaultCard className="p-8 text-center space-y-6 border-purple-500 max-w-2xl mx-auto shadow-2xl">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-purple-400 font-bold">
              ARTIST SELECTION PHASE
            </span>
            <h2 className="text-3xl font-display font-black text-white uppercase">Choose Your Secret Word</h2>
            <p className="text-xs text-gray-300 font-mono">
              The other players will try to guess this word from your drawing. Only you can see these choices!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {wordChoices.map((w) => (
              <button
                key={w.id}
                onClick={() => handleSelectWord(w.id)}
                className="p-5 rounded-xl border border-purple-500/40 bg-vault-surface/80 hover:bg-purple-950/50 hover:border-cyan-400 text-left transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="text-lg font-display font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {w.word}
                  </div>
                  <div className="text-[11px] font-mono text-gray-400 mt-1">{w.category || 'General'}</div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                      w.difficulty === 'HARD'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : w.difficulty === 'MEDIUM'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {w.difficulty || 'EASY'}
                  </span>
                  <span className="text-xs font-mono text-cyan-400 group-hover:translate-x-1 transition-transform">
                    Draw →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </MindVaultCard>
      )}

      {/* Main Game Layout: Canvas & Interaction Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Canvas & Tools */}
        <div className="lg:col-span-2 space-y-3">
          {/* Artist Controls Toolbar */}
          {isArtist && status === 'DRAWING' && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-vault-card border border-vault-border rounded-xl shadow-md">
              {/* Color Palette */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {PALETTE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setSelectedColor(c);
                      setIsEraser(false);
                    }}
                    style={{ backgroundColor: c }}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      selectedColor === c && !isEraser
                        ? 'scale-125 border-white shadow-glow-cyan'
                        : 'border-transparent hover:scale-110'
                    }`}
                    title={c}
                  />
                ))}
              </div>

              {/* Tools: Brush vs Eraser */}
              <div className="flex items-center gap-2 border-l border-vault-border pl-3">
                <button
                  type="button"
                  onClick={() => setIsEraser(false)}
                  className={`p-1.5 rounded transition-colors ${
                    !isEraser ? 'bg-cyan-500 text-black font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                  title="Brush"
                >
                  <PenTool className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEraser(true)}
                  className={`p-1.5 rounded transition-colors ${
                    isEraser ? 'bg-cyan-500 text-black font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                  title="Eraser"
                >
                  <Eraser className="w-4 h-4" />
                </button>
              </div>

              {/* Brush Sizes */}
              <div className="flex items-center gap-1.5 border-l border-vault-border pl-3">
                <span className="text-xs font-mono text-gray-400">Size:</span>
                {BRUSH_SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setBrushSize(s)}
                    className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
                      brushSize === s
                        ? 'bg-purple-500 text-white font-bold'
                        : 'bg-vault-surface text-gray-300 hover:bg-vault-hover'
                    }`}
                  >
                    {s}px
                  </button>
                ))}
              </div>

              {/* Undo & Clear */}
              <div className="flex items-center gap-1 border-l border-vault-border pl-3">
                <button
                  type="button"
                  onClick={handleUndo}
                  className="p-1.5 text-gray-400 hover:text-cyan-400 rounded transition-colors"
                  title="Undo Last Stroke"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleClearCanvas}
                  className="p-1.5 text-gray-400 hover:text-red-400 rounded transition-colors"
                  title="Clear Canvas"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Interactive HTML5 Canvas */}
          <div className="relative w-full aspect-[4/3] bg-vault-dark border-2 border-vault-border rounded-xl overflow-hidden shadow-2xl">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className={`w-full h-full touch-none select-none ${
                isArtist && status === 'DRAWING' ? 'cursor-crosshair' : 'cursor-default pointer-events-none'
              }`}
            />

            {/* Guesser Overlay when artist is still choosing word */}
            {!isArtist && status === 'CHOOSING' && (
              <div className="absolute inset-0 bg-vault-dark/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
                <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider">
                  {round?.artist_name || 'The Artist'} is choosing a word...
                </h3>
                <p className="text-xs font-mono text-gray-400 max-w-sm">
                  Get ready! You will have 60 seconds to guess the drawing and earn speed points.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Guess Channel & Connected Players */}
        <div className="space-y-4">
          {/* Guess Feed & Submission Form */}
          <MindVaultCard className="p-4 flex flex-col h-[520px]">
            <div className="border-b border-vault-border pb-3 mb-2 flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider">Private Guess Feed</h3>
                <p className="text-[10px] font-mono text-gray-400">Your guesses are private until round reveal.</p>
              </div>
              <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded">
                1st=10pts
              </span>
            </div>

            {/* Feedback Alert */}
            {guessFeedback && (
              <div
                className={`p-2.5 mb-2 rounded-lg text-xs font-mono font-bold flex items-center gap-2 ${
                  guessFeedback.isCorrect
                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 animate-bounce'
                    : 'bg-red-500/20 border border-red-500/50 text-red-300'
                }`}
              >
                {guessFeedback.isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : '✕'}
                {guessFeedback.message}
              </div>
            )}

            {/* Scrollable Guess Log */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
              {guesses.length === 0 ? (
                <div className="text-gray-500 text-center py-16 text-xs">
                  Private guess channel active. Enter your guess below!
                </div>
              ) : (
                guesses.map((g, idx) => (
                  <div
                    key={g.guess_id || idx}
                    className={`p-2 rounded-lg border flex items-center justify-between ${
                      g.is_correct
                        ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300'
                        : 'border-vault-border bg-vault-surface text-gray-300'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-gray-200">{g.display_name}: </span>
                      <span>{g.guess_text}</span>
                    </div>
                    {g.is_correct && (
                      <span className="font-bold text-emerald-400 text-[11px]">
                        +{g.points_awarded || 10} pts
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Guess Submission Input */}
            {!isArtist && status === 'DRAWING' && (
              <div className="pt-3 border-t border-vault-border mt-2">
                {myGuessStatus?.hasGuessedCorrect ? (
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono text-center flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Solved! Ranked #{myGuessStatus.sequence} (+{myGuessStatus.pointsAwarded} pts)
                  </div>
                ) : (
                  <form onSubmit={handleSendGuess} className="flex gap-2">
                    <input
                      type="text"
                      value={guessInput}
                      onChange={(e) => setGuessInput(e.target.value)}
                      placeholder="Type your guess here..."
                      disabled={submittingGuess}
                      className="flex-1 bg-vault-surface border border-vault-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-sans"
                    />
                    <MindVaultButton type="submit" variant="primary" size="sm" isLoading={submittingGuess}>
                      <Send className="w-3.5 h-3.5" />
                    </MindVaultButton>
                  </form>
                )}
              </div>
            )}

            {isArtist && (
              <div className="pt-3 border-t border-vault-border mt-2 text-center text-xs font-mono text-purple-300">
                You are drawing! Keep sketching to help players guess.
              </div>
            )}
          </MindVaultCard>

          {/* Connected Players Status */}
          <MindVaultCard className="p-4 space-y-3">
            <h4 className="text-xs font-display font-bold uppercase tracking-wider text-gray-300 flex items-center justify-between">
              <span>Competitors</span>
              <span className="text-[10px] font-mono text-gray-500">{players.length} connected</span>
            </h4>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {players.map((p: any) => (
                <div
                  key={p.user_id}
                  className={`flex items-center justify-between p-2 rounded border text-xs font-mono ${
                    p.user_id === round?.artist_user_id
                      ? 'border-purple-500/40 bg-purple-950/20'
                      : p.hasGuessedCorrect
                      ? 'border-emerald-500/40 bg-emerald-950/20'
                      : 'border-vault-border/50 bg-vault-surface/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-vault-card border border-vault-border flex items-center justify-center font-bold text-[10px] text-white">
                      {p.display_name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-200 flex items-center gap-1 font-sans text-xs">
                      {p.display_name}
                      {p.user_id === round?.artist_user_id && <Crown className="w-3 h-3 text-amber-400" />}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {p.user_id === round?.artist_user_id ? (
                      <span className="text-[10px] text-purple-300 font-bold">ARTIST</span>
                    ) : p.hasGuessedCorrect ? (
                      <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> SOLVED
                      </span>
                    ) : (
                      <span className="text-[10px] text-gray-500">THINKING</span>
                    )}
                    <span className="font-bold text-cyan-400 pl-1">{p.final_score} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </MindVaultCard>
        </div>
      </div>
    </div>
  );
}

export default function DrawiceGamePage() {
  return (
    <React.Suspense
      fallback={
        <div className="text-center py-24 font-mono text-cyan-400 animate-pulse">
          ENTERING DRAWICE STUDIO...
        </div>
      }
    >
      <DrawiceGameContent />
    </React.Suspense>
  );
}
