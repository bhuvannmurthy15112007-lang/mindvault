'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { getSocket } from '@/lib/socket/client';
import { Users, Crown, Play, CheckCircle2, Circle, MessageSquare, Send, LogOut, Radio, Sparkles, Shield, Zap } from 'lucide-react';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';
import { RoomCode } from '@/components/ui/RoomCode';
import DynamicAtmosphericParticles from '@/components/3d/AtmosphericParticlesWrapper';

export default function RoomLobbyPage({ params }: { params: { roomCode: string } }) {
  const router = useRouter();
  const roomCode = params.roomCode.toUpperCase();
  const { dbUser, token } = useAuth();

  const [room, setRoom] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [launchCountdown, setLaunchCountdown] = useState<number | null>(null);
  const [error, setError] = useState('');

  const fetchRoom = async () => {
    try {
      const res = await fetch(`/api/rooms/${roomCode}`);
      const data = await res.json();
      if (res.ok) {
        setRoom(data.room);
        setPlayers(data.room.players || []);
        if (data.room.status === 'STARTED' && data.room.session) {
          redirectToGame(data.room.game_code, data.room.session.session_id);
        }
      } else {
        setError(data.error || 'Room not found');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const redirectToGame = (gameCode: string, sessionId: number) => {
    const routes: Record<string, string> = {
      PREDICTION_ARENA: `/games/prediction?session=${sessionId}`,
      DETECTIVE: `/games/detective?session=${sessionId}`,
      ESCAPE_ROOM: `/games/escape-room?session=${sessionId}`,
      DRAWICE: `/games/drawice?session=${sessionId}`,
    };
    if (routes[gameCode]) {
      router.push(routes[gameCode]);
    }
  };

  useEffect(() => {
    fetchRoom();
    const interval = setInterval(fetchRoom, 3000);

    const socket = getSocket(token || undefined);
    socket.connect();
    socket.emit('room:join', { roomCode, user: dbUser });

    socket.on('room:player_joined', () => fetchRoom());
    socket.on('room:player_left', () => fetchRoom());
    socket.on('room:game_started', ({ sessionId, gameCode }) => {
      setLaunchCountdown(3);
      let count = 3;
      const countTimer = setInterval(() => {
        count -= 1;
        setLaunchCountdown(count);
        if (count <= 0) {
          clearInterval(countTimer);
          redirectToGame(gameCode, sessionId);
        }
      }, 1000);
    });

    socket.on('room:chat_message', (msg: any) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    return () => {
      clearInterval(interval);
      socket.off('room:player_joined');
      socket.off('room:player_left');
      socket.off('room:game_started');
      socket.off('room:chat_message');
    };
  }, [roomCode, token, dbUser]);

  const handleStartGame = async () => {
    if (!token) return;
    setStarting(true);
    setError('');

    try {
      const res = await fetch(`/api/rooms/${roomCode}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ rounds: 5, caseId: room?.case_id, difficulty: room?.difficulty })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start game');

      const socket = getSocket();
      socket.emit('room:start', { roomCode, sessionId: data.sessionId, gameCode: data.gameCode });

      setLaunchCountdown(3);
      let count = 3;
      const countTimer = setInterval(() => {
        count -= 1;
        setLaunchCountdown(count);
        if (count <= 0) {
          clearInterval(countTimer);
          redirectToGame(data.gameCode, data.sessionId);
        }
      }, 1000);
    } catch (err: any) {
      setError(err.message);
      setStarting(false);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const socket = getSocket();
    socket.emit('room:chat', {
      roomCode,
      message: inputMsg.trim(),
      user: dbUser
    });
    setInputMsg('');
  };

  const isHost = dbUser && room && room.host_user_id === dbUser.userId;
  const minRequired = room?.game_code === 'PREDICTION_ARENA' ? 2 : (room?.min_players || 1);
  const canStart = isHost && players.length >= minRequired;
  const emptySlotsCount = Math.max(0, (room?.max_players || 0) - players.length);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-4">
        <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin" />
        <div className="font-mono text-cyan-400 text-sm tracking-wider animate-pulse">
          INITIALIZING ARENA LOBBY HANDSHAKE...
        </div>
      </div>
    );
  }

  if (error && !room) {
    return (
      <div className="max-w-md mx-auto py-16 text-center">
        <MindVaultCard className="space-y-4">
          <h2 className="text-xl font-display font-bold text-red-400">Room Error</h2>
          <p className="text-sm text-gray-300">{error}</p>
          <MindVaultButton variant="secondary" size="md" onClick={() => router.push('/rooms/join')}>
            Back to Matchmaking
          </MindVaultButton>
        </MindVaultCard>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 py-6">
      <DynamicAtmosphericParticles count={90} />

      {/* Launch Countdown Overlay */}
      {launchCountdown !== null && (
        <div className="fixed inset-0 z-50 bg-vault-dark/90 backdrop-blur-md flex flex-col items-center justify-center space-y-4 animate-fadeIn">
          <div className="w-24 h-24 rounded-full border-4 border-cyan-400 flex items-center justify-center font-mono font-black text-6xl text-cyan-300 shadow-glow-cyan animate-pulse">
            {launchCountdown}
          </div>
          <div className="font-display font-black text-2xl text-white uppercase tracking-widest">
            SYNCHRONIZING COMBAT SQUAD...
          </div>
          <p className="font-mono text-xs text-cyan-400/80 uppercase">
            Deploying into {room?.game_name}
          </p>
        </div>
      )}

      {/* Top Lobby Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-vault-card via-vault-surface to-vault-card border border-vault-border p-6 rounded-xl shadow-xl relative z-10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-display font-black text-white tracking-wider uppercase">
              {room?.game_name} Lobby
            </h1>
            <RoomCode code={roomCode} />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 uppercase">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              WEBSOCKET MESH ONLINE
            </span>
            {room?.difficulty && (
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                  room.difficulty === 'HARD'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : room.difficulty === 'MEDIUM'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {room.difficulty}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 font-mono">
            {room?.game_description}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isHost ? (
            <MindVaultButton
              variant="emerald"
              size="md"
              disabled={!canStart || starting}
              isLoading={starting}
              onClick={handleStartGame}
              className="shadow-glow-emerald"
            >
              <Play className="w-4 h-4 mr-1.5" />
              {canStart ? 'Launch Game' : `Need ${minRequired - players.length} More`}
            </MindVaultButton>
          ) : (
            <div className="text-xs font-mono text-cyan-400 border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 rounded animate-pulse">
              Waiting for host to launch...
            </div>
          )}

          <MindVaultButton
            variant="ghost"
            size="md"
            onClick={async () => {
              if (token) {
                await fetch(`/api/rooms/${roomCode}/leave`, {
                  method: 'POST',
                  headers: { 'Authorization': 'Bearer ' + token }
                });
              }
              router.push('/dashboard');
            }}
          >
            <LogOut className="w-4 h-4 mr-1" /> Leave
          </MindVaultButton>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/40 rounded-lg text-red-400 text-xs font-mono relative z-10">
          {error}
        </div>
      )}

      {/* Main Lobby Content: Players & Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Players List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-vault-border pb-3">
            <h2 className="text-base font-display font-bold uppercase text-white tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              Squad Challengers ({players.length} / {room?.max_players})
            </h2>
            <span className="text-xs font-mono text-gray-400">
              Minimum Required: <span className="text-cyan-400 font-bold">{minRequired}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {players.map((p) => {
              const isPlayerHost = p.is_host || p.user_id === room.host_user_id;
              return (
                <MindVaultCard key={p.user_id} className="p-4 flex items-center justify-between border-cyan-500/30 hover:border-cyan-400 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 p-0.5">
                      <div className="w-full h-full bg-vault-dark rounded-full overflow-hidden flex items-center justify-center font-bold text-sm text-white">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          p.display_name?.charAt(0).toUpperCase() || 'P'
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                        {p.display_name}
                        {isPlayerHost && <span title="Host Commander"><Crown className="w-3.5 h-3.5 text-amber-400" /></span>}
                      </div>
                      <span className="text-[10px] font-mono text-gray-400">
                        {isPlayerHost ? 'Squad Commander (Host)' : 'Player Synchronized'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-mono">
                    <CheckCircle2 className="w-4 h-4" /> Ready
                  </div>
                </MindVaultCard>
              );
            })}

            {/* Empty Slots */}
            {Array.from({ length: emptySlotsCount }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="p-4 rounded-lg border border-dashed border-vault-border/80 bg-vault-dark/40 flex items-center justify-between text-gray-500 font-mono text-xs"
              >
                <span className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full border border-dashed border-gray-700 flex items-center justify-center text-[10px] text-gray-500">
                    #{players.length + i + 1}
                  </span>
                  <span>Awaiting Challenger...</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider text-gray-600">Open Slot</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Lobby Chat */}
        <div className="space-y-4">
          <div className="border-b border-vault-border pb-3 flex items-center justify-between">
            <h2 className="text-base font-display font-bold uppercase text-white tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              Lobby Comms
            </h2>
            <span className="text-[10px] font-mono text-gray-500">REAL-TIME</span>
          </div>

          <MindVaultCard className="p-4 flex flex-col h-[380px]">
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-mono text-xs">
              {chatMessages.length === 0 ? (
                <div className="text-gray-500 text-center py-16 text-xs">
                  Room communications channel open. Send a transmission to your squad!
                </div>
              ) : (
                chatMessages.map((m) => (
                  <div key={m.id} className="bg-vault-surface/60 border border-vault-border/60 rounded p-2.5">
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                      <span className="font-bold text-cyan-400">{m.user?.displayName || 'Challenger'}</span>
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="text-gray-200 font-sans">{m.message}</div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendChat} className="pt-3 border-t border-vault-border/60 flex gap-2">
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Transmit message..."
                maxLength={200}
                className="flex-1 bg-vault-surface border border-vault-border rounded px-3 py-2 text-xs font-sans text-white focus:outline-none focus:border-cyan-400"
              />
              <MindVaultButton type="submit" variant="primary" size="sm">
                <Send className="w-3.5 h-3.5" />
              </MindVaultButton>
            </form>
          </MindVaultCard>
        </div>
      </div>
    </div>
  );
}
