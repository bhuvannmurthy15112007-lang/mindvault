'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  Users,
  ArrowRight,
  Shield,
  KeyRound,
  Plus,
  Compass,
  Sparkles,
  Layers,
  Radio,
  Lock,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';
import DynamicAtmosphericParticles from '@/components/3d/AtmosphericParticlesWrapper';

function JoinRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, dbUser } = useAuth();

  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-populate from URL query parameter (e.g. /rooms/join?code=XYZ123)
  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam) {
      setRoomCode(codeParam.trim().toUpperCase());
    }
  }, [searchParams]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = roomCode.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter a valid room code.');
      return;
    }

    if (!token) {
      router.push(`/login?redirect=/rooms/join?code=${cleanCode}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/rooms/${cleanCode}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to connect to room. Check the code and try again.');
      }

      router.push(`/rooms/${cleanCode}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPaste = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        const clean = text.trim().replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase();
        if (clean) {
          setRoomCode(clean);
          setError('');
        }
      }
    } catch {
      // ignore clipboard error
    }
  };

  return (
    <div className="relative min-h-[80vh] flex flex-col justify-center py-8 px-4 max-w-4xl mx-auto space-y-12">
      <DynamicAtmosphericParticles count={100} />

      {/* Header Banner */}
      <div className="text-center space-y-3 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-xs font-mono tracking-widest uppercase">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          MULTIPLAYER LOBBY HANDSHAKE
        </div>
        <h1 className="text-4xl sm:text-5xl font-display font-black text-white uppercase tracking-wider">
          Join Arena Room
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 font-mono max-w-xl mx-auto">
          Synchronize with an active multiplayer match via 6-character room access key.
        </p>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start relative z-10">
        {/* Left Side: How Multiplayer Works Card (2 cols) */}
        <div className="md:col-span-2 space-y-5">
          <MindVaultCard className="p-6 space-y-5 bg-gradient-to-b from-vault-card to-vault-surface border-vault-border shadow-xl">
            <div className="flex items-center gap-2 border-b border-vault-border pb-3">
              <Shield className="w-4 h-4 text-cyan-400" />
              <h3 className="font-display font-bold text-white text-xs uppercase tracking-wider">
                Multiplayer Protocol
              </h3>
            </div>

            <div className="space-y-4 text-xs font-sans text-gray-300">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <div className="font-bold text-white font-mono uppercase text-[11px]">Host Creates Match</div>
                  <p className="text-gray-400 mt-0.5 leading-relaxed">
                    A player configures player limits, difficulty, and rules, generating a unique encrypted room key.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <div className="font-bold text-white font-mono uppercase text-[11px]">Squad Enters Code</div>
                  <p className="text-gray-400 mt-0.5 leading-relaxed">
                    Players enter the 6-character code into the terminal to establish a WebSocket channel.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <div className="font-bold text-white font-mono uppercase text-[11px]">Authoritative Combat</div>
                  <p className="text-gray-400 mt-0.5 leading-relaxed">
                    When all players assemble, the host triggers Launch. All rounds and scores are verified server-side.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-vault-border/60 flex flex-col gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">
                Want to lead a match instead?
              </span>
              <Link href="/rooms/create">
                <MindVaultButton variant="secondary" size="sm" className="w-full justify-center">
                  <Plus className="w-3.5 h-3.5 mr-1 text-cyan-400" /> Host New Room
                </MindVaultButton>
              </Link>
            </div>
          </MindVaultCard>

          {/* Quick Hub Navigation */}
          <div className="flex items-center justify-between px-2 text-xs font-mono text-gray-400">
            <Link href="/games" className="hover:text-cyan-400 transition-colors flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" /> All 4 Arenas
            </Link>
            <Link href="/" className="hover:text-white transition-colors">
              Vault Entrance
            </Link>
          </div>
        </div>

        {/* Right Side: Access Key Terminal (3 cols) */}
        <div className="md:col-span-3">
          <MindVaultCard className="p-8 space-y-6 bg-gradient-to-br from-vault-card via-vault-surface to-vault-dark border-cyan-500/40 shadow-glow-cyan/10">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Lock className="w-5 h-5 text-cyan-400" />
                  Terminal Input
                </h2>
                <span className="text-[11px] font-mono text-gray-400 bg-vault-surface border border-vault-border px-2 py-0.5 rounded">
                  {roomCode.length}/6 CHARS
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono">
                Type or paste the room access code provided by your lobby host.
              </p>
            </div>

            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/40 rounded-lg text-red-400 text-xs font-mono flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleJoin} className="space-y-6">
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={roomCode}
                    onChange={(e) => {
                      setRoomCode(e.target.value.toUpperCase());
                      setError('');
                    }}
                    placeholder="e.g. 7X9K2P"
                    autoFocus
                    className="w-full bg-vault-dark border-2 border-vault-border focus:border-cyan-400 rounded-lg px-6 py-4 text-3xl font-mono font-black text-center tracking-[0.3em] text-cyan-400 placeholder-gray-700 uppercase focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={handleQuickPaste}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-mono text-gray-400 hover:text-cyan-300 bg-vault-surface/80 border border-vault-border rounded hover:border-cyan-500/40 transition-colors"
                  >
                    Paste
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <MindVaultButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={loading}
                  className="w-full justify-center text-base py-3.5 shadow-glow-cyan"
                >
                  <KeyRound className="w-4 h-4 mr-2" />
                  Connect to Match Room
                  <ArrowRight className="w-4 h-4 ml-2" />
                </MindVaultButton>

                <div className="flex items-center justify-between text-[11px] font-mono text-gray-500 pt-2 border-t border-vault-border/50">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    SOCKET GATEWAY READY
                  </span>
                  <span>ENTERPRISE ACID GUARANTEED</span>
                </div>
              </div>
            </form>
          </MindVaultCard>
        </div>
      </div>
    </div>
  );
}

export default function JoinRoomPage() {
  return (
    <React.Suspense
      fallback={
        <div className="text-center py-24 font-mono text-cyan-400 animate-pulse">
          INITIALIZING MULTIPLAYER GATEWAY...
        </div>
      }
    >
      <JoinRoomContent />
    </React.Suspense>
  );
}
