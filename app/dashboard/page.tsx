'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { Target, Search, KeyRound, Palette, Plus, Trophy, Award, History, ArrowRight } from 'lucide-react';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';

export default function DashboardPage() {
  const { dbUser, loading } = useAuth();
  const [openRooms, setOpenRooms] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/rooms')
      .then(res => res.json())
      .then(data => setOpenRooms(data.rooms || []))
      .catch(() => {});
  }, []);

  const games = [
    { code: 'PREDICTION_ARENA', name: 'Prediction Arena', icon: Target, color: 'text-cyan-400', players: '2-10' },
    { code: 'DETECTIVE', name: 'Detective', icon: Search, color: 'text-red-400', players: '1-10' },
    { code: 'ESCAPE_ROOM', name: 'Escape Room', icon: KeyRound, color: 'text-amber-400', players: '1-5' },
    { code: 'DRAWICE', name: 'Drawice', icon: Palette, color: 'text-purple-400', players: '2-10' },
  ];

  if (loading) {
    return <div className="text-center py-20 font-mono text-cyan-400 animate-pulse">Synchronizing MindVault Identity...</div>;
  }

  return (
    <div className="space-y-10 py-6">
      {/* Player Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-vault-card border border-vault-border p-6 rounded-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-500 p-1">
            <div className="w-full h-full bg-vault-dark rounded-full overflow-hidden flex items-center justify-center font-display font-bold text-xl text-white">
              {dbUser?.avatarUrl ? (
                <img src={dbUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                dbUser?.displayName?.charAt(0).toUpperCase() || 'V'
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-display font-bold text-white">
                {dbUser?.displayName || 'Strategist'}
              </h1>
              {dbUser?.isAdmin && (
                <span className="text-[10px] font-mono bg-purple-500/20 text-purple-400 border border-purple-500/40 px-2 py-0.5 rounded">
                  ADMIN
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              {dbUser?.email}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/rooms/create">
            <MindVaultButton variant="primary" size="md">
              <Plus className="w-4 h-4 mr-1.5" /> Create Game Room
            </MindVaultButton>
          </Link>
          <Link href="/rooms/join">
            <MindVaultButton variant="secondary" size="md">
              Join Room
            </MindVaultButton>
          </Link>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <section className="space-y-4">
        <h2 className="text-lg font-display font-bold uppercase text-white tracking-wider">
          Quick Match Launcher
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {games.map((g) => {
            const Icon = g.icon;
            return (
              <MindVaultCard key={g.code} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Icon className={`w-6 h-6 ${g.color}`} />
                  <span className="text-[11px] font-mono text-gray-400">{g.players}</span>
                </div>
                <h3 className="font-display font-bold text-white text-base">{g.name}</h3>
                <Link href={`/rooms/create?game=${g.code}`}>
                  <MindVaultButton variant="secondary" size="sm" className="w-full justify-center">
                    Host Arena
                  </MindVaultButton>
                </Link>
              </MindVaultCard>
            );
          })}
        </div>
      </section>

      {/* Active Rooms */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-bold uppercase text-white tracking-wider">
            Active Waiting Rooms
          </h2>
          <span className="text-xs font-mono text-gray-400">{openRooms.length} available</span>
        </div>

        {openRooms.length === 0 ? (
          <div className="text-center py-10 bg-vault-card/40 border border-vault-border rounded-lg text-sm text-gray-400">
            No public rooms currently waiting. Create one to start playing!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {openRooms.map((room) => (
              <MindVaultCard key={room.room_id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-white">{room.game_name}</span>
                  <span className="text-xs font-mono text-cyan-400 font-bold">{room.room_code}</span>
                </div>
                <div className="text-xs text-gray-400 space-y-1">
                  <div>Host: <span className="text-gray-200">{room.host_name}</span></div>
                  <div>Players: <span className="text-cyan-300 font-mono">{room.current_players} / {room.max_players}</span></div>
                </div>
                <Link href={`/rooms/${room.room_code}`}>
                  <MindVaultButton variant="primary" size="sm" className="w-full justify-center">
                    Enter Lobby
                  </MindVaultButton>
                </Link>
              </MindVaultCard>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
