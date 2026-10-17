const fs = require('fs');
const path = require('path');

// 1. app/rooms/create/page.tsx
const createRoom = `'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Target, Search, KeyRound, Palette, Plus, Users, Hash } from 'lucide-react';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';

export default function CreateRoomPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, dbUser } = useAuth();

  const [selectedGame, setSelectedGame] = useState('PREDICTION_ARENA');
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [rounds, setRounds] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const gamesConfig: Record<string, { min: number; max: number; name: string; icon: any; color: string; defaultRounds: number }> = {
    PREDICTION_ARENA: { min: 5, max: 10, name: 'Prediction Arena', icon: Target, color: 'text-cyan-400', defaultRounds: 5 },
    DETECTIVE: { min: 1, max: 10, name: 'Detective', icon: Search, color: 'text-red-400', defaultRounds: 1 },
    ESCAPE_ROOM: { min: 1, max: 5, name: 'Escape Room', icon: KeyRound, color: 'text-amber-400', defaultRounds: 1 },
    DRAWICE: { min: 2, max: 10, name: 'Drawice', icon: Palette, color: 'text-purple-400', defaultRounds: 5 },
  };

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
          rounds
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create room');
      }

      router.push(\`/rooms/\${data.roomCode}\`);
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
                    className={\`p-4 rounded-lg border text-left flex items-start gap-3 transition-all \${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-500/10 shadow-glow-cyan/20'
                        : 'border-vault-border bg-vault-surface/60 hover:bg-vault-hover'
                    }\`}
                  >
                    <Icon className={\`w-5 h-5 flex-shrink-0 mt-0.5 \${g.color}\`} />
                    <div>
                      <div className="font-display font-bold text-sm text-white">{g.name}</div>
                      <div className="text-[11px] font-mono text-gray-400">{g.min}–{g.max} Players</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

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
`;
fs.writeFileSync(path.join(__dirname, 'app', 'rooms', 'create', 'page.tsx'), createRoom);

// 2. app/rooms/join/page.tsx
const joinRoom = `'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Users, ArrowRight } from 'lucide-react';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';

export default function JoinRoomPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) return;

    if (!token) {
      router.push('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const code = roomCode.trim().toUpperCase();
      const res = await fetch(\`/api/rooms/\${code}/join\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        }
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to join room');
      }

      router.push(\`/rooms/\${code}\`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-16">
      <MindVaultCard className="space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-400 mx-auto flex items-center justify-center">
            <Users className="w-6 h-6 text-cyan-400" />
          </div>
          <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
            Join Match Room
          </h2>
          <p className="text-xs text-gray-400 font-mono">
            Enter the 6-character room access code
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/40 rounded text-red-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <input
              type="text"
              required
              maxLength={6}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder="e.g. 7X9K2P"
              className="w-full bg-vault-surface border-2 border-vault-border focus:border-cyan-400 rounded px-4 py-3 text-2xl font-mono font-bold text-center tracking-widest text-cyan-400 uppercase focus:outline-none"
            />
          </div>

          <MindVaultButton
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            className="w-full justify-center"
          >
            Enter Arena
            <ArrowRight className="w-4 h-4 ml-2" />
          </MindVaultButton>
        </form>
      </MindVaultCard>
    </div>
  );
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'rooms', 'join', 'page.tsx'), joinRoom);

// 3. app/rooms/[roomCode]/page.tsx (Lobby)
const roomLobby = `'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { getSocket } from '@/lib/socket/client';
import { Users, Crown, Play, CheckCircle2, Circle, MessageSquare, Send, LogOut } from 'lucide-react';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';
import { RoomCode } from '@/components/ui/RoomCode';

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
  const [error, setError] = useState('');

  const fetchRoom = async () => {
    try {
      const res = await fetch(\`/api/rooms/\${roomCode}\`);
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
      PREDICTION_ARENA: \`/games/prediction?session=\${sessionId}\`,
      DETECTIVE: \`/games/detective?session=\${sessionId}\`,
      ESCAPE_ROOM: \`/games/escape-room?session=\${sessionId}\`,
      DRAWICE: \`/games/drawice?session=\${sessionId}\`,
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
      redirectToGame(gameCode, sessionId);
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
      const res = await fetch(\`/api/rooms/\${roomCode}/start\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ rounds: 5 })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start game');

      const socket = getSocket();
      socket.emit('room:start', { roomCode, sessionId: data.sessionId, gameCode: data.gameCode });

      redirectToGame(data.gameCode, data.sessionId);
    } catch (err: any) {
      setError(err.message);
    } finally {
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
  const canStart = isHost && players.length >= (room?.min_players || 1);

  if (loading) {
    return <div className="text-center py-20 font-mono text-cyan-400 animate-pulse">Entering Vault Lobby...</div>;
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
    <div className="space-y-8 py-6">
      {/* Top Lobby Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-vault-card border border-vault-border p-6 rounded-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold text-white tracking-wider">
              {room?.game_name} Lobby
            </h1>
            <RoomCode code={roomCode} />
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
            >
              <Play className="w-4 h-4 mr-1.5" />
              {canStart ? 'Launch Game' : \`Need \${room?.min_players - players.length} More\`}
            </MindVaultButton>
          ) : (
            <div className="text-xs font-mono text-cyan-400 border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 rounded animate-pulse">
              Waiting for host to launch...
            </div>
          )}

          <MindVaultButton
            variant="ghost"
            size="md"
            onClick={async () => {
              if (token) {
                await fetch(\`/api/rooms/\${roomCode}/leave\`, {
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
        <div className="p-3 bg-red-500/10 border border-red-500/40 rounded text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Main Lobby Content: Players & Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Players List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-display font-bold uppercase text-white tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              Connected Players ({players.length} / {room?.max_players})
            </h2>
            <span className="text-xs font-mono text-gray-400">
              Minimum Required: {room?.min_players}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {players.map((p) => {
              const isPlayerHost = p.is_host || p.user_id === room.host_user_id;
              return (
                <MindVaultCard key={p.user_id} className="p-4 flex items-center justify-between">
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
                        {isPlayerHost && <Crown className="w-3.5 h-3.5 text-amber-400" title="Host" />}
                      </div>
                      <span className="text-[10px] font-mono text-gray-400">
                        {isPlayerHost ? 'Room Commander' : 'Player Ready'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400 text-xs font-mono">
                    <CheckCircle2 className="w-4 h-4" /> Ready
                  </div>
                </MindVaultCard>
              );
            })}
          </div>
        </div>

        {/* Live Lobby Chat */}
        <div className="space-y-4">
          <h2 className="text-base font-display font-bold uppercase text-white tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            Lobby Comms
          </h2>

          <MindVaultCard className="p-4 flex flex-col h-[340px]">
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
              {chatMessages.length === 0 ? (
                <div className="text-gray-500 text-center py-10">Room communications channel open.</div>
              ) : (
                chatMessages.map((m) => (
                  <div key={m.id} className="bg-vault-surface/60 border border-vault-border/50 rounded p-2">
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                      <span className="text-cyan-400 font-bold">{m.user?.displayName || 'Player'}</span>
                      <span>{m.timestamp}</span>
                    </div>
                    <div className="text-gray-200">{m.message}</div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendChat} className="flex gap-2 pt-3 border-t border-vault-border mt-2">
              <input
                type="text"
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                placeholder="Send transmission..."
                className="flex-1 bg-vault-surface border border-vault-border rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-sans"
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
`;
fs.writeFileSync(path.join(__dirname, 'app', 'rooms', '[roomCode]', 'page.tsx'), roomLobby);

console.log('Room pages (create, join, lobby) created successfully.');
