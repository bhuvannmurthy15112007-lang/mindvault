const fs = require('fs');
const path = require('path');

// 1. app/page.tsx (Landing Page)
const landingPage = `'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Target, Search, KeyRound, Palette, Users, ArrowRight, ShieldCheck, Zap, Database } from 'lucide-react';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';

export default function LandingPage() {
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/db-health')
      .then(res => res.json())
      .then(data => setDbConnected(data.ok))
      .catch(() => setDbConnected(false));
  }, []);

  const games = [
    {
      code: 'PREDICTION_ARENA',
      name: 'Prediction Arena',
      href: '/games/prediction',
      players: '5–10 Players',
      tagline: 'Pure Mathematical Strategy',
      description: 'Predict the hidden target (average x 0.8) from 0 to 100. Dodge duplicate penalties, unlock exact target strikes, and trigger the 0->100 counter rule.',
      accent: 'border-cyan-500/40 text-cyan-400 bg-cyan-950/20',
      icon: Target,
      bgGradient: 'from-cyan-950/30 to-vault-card',
      glow: 'cyan' as const
    },
    {
      code: 'DETECTIVE',
      name: 'Detective',
      href: '/games/detective',
      players: '1–10 Players',
      tagline: 'Noir Forensic Mystery',
      description: 'Interrogate suspects, investigate crime scenes, unlock forensic ciphers within strict action budgets, and deliver decisive culprit accusations.',
      accent: 'border-red-500/40 text-red-400 bg-red-950/20',
      icon: Search,
      bgGradient: 'from-red-950/30 to-vault-card',
      glow: 'crimson' as const
    },
    {
      code: 'ESCAPE_ROOM',
      name: 'Escape Room',
      href: '/games/escape-room',
      players: '1–5 Players',
      tagline: 'Cooperative Vault Breakout',
      description: 'Coordinate in real-time to solve interconnected mechanical locks, sequence keypads, and cipher terminals with strictly two precious hints per mission.',
      accent: 'border-amber-500/40 text-amber-400 bg-amber-950/20',
      icon: KeyRound,
      bgGradient: 'from-amber-950/30 to-vault-card',
      glow: 'amber' as const
    },
    {
      code: 'DRAWICE',
      name: 'Drawice',
      href: '/games/drawice',
      players: '2–10 Players',
      tagline: 'Multiplayer Drawing Studio',
      description: 'Fair artist rotation, secret word selections, real-time socket brush strokes, and submission-sequence speed scoring for sharp guessers.',
      accent: 'border-purple-500/40 text-purple-400 bg-purple-950/20',
      icon: Palette,
      bgGradient: 'from-purple-950/30 to-vault-card',
      glow: 'purple' as const
    }
  ];

  return (
    <div className="space-y-20 py-8">
      {/* Hero Section */}
      <section className="relative text-center max-w-4xl mx-auto space-y-6 pt-6 sm:pt-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-mono tracking-widest uppercase">
          <Database className="w-3.5 h-3.5" />
          AUTHORITATIVE MYSQL 8+ INNODB ENGINE
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black tracking-tight uppercase text-white leading-none">
          MIND<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400">VAULT</span>
        </h1>

        <p className="text-xl sm:text-2xl font-display font-medium text-gray-300 tracking-wide">
          Think. Investigate. Solve. Create.
        </p>

        <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
          A database-driven multiplayer gaming platform engineered with enterprise ACID guarantees, 
          server-authoritative game rules, and low-latency Socket.IO state synchronization.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link href="/rooms/create">
            <MindVaultButton variant="primary" size="lg" className="min-w-[180px]">
              <Zap className="w-4 h-4 mr-2" />
              Enter The Vault
            </MindVaultButton>
          </Link>
          <Link href="/rooms/join">
            <MindVaultButton variant="secondary" size="lg" className="min-w-[180px]">
              <Users className="w-4 h-4 mr-2" />
              Join With Code
            </MindVaultButton>
          </Link>
        </div>
      </section>

      {/* Game Portals Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-vault-border pb-4">
          <div>
            <h2 className="text-2xl font-display font-bold uppercase text-white tracking-wider">
              The Four Vault Arenas
            </h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              Unified authentication, room matchmaking, authoritative scoring, and persistent statistics.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {games.map((g) => {
            const Icon = g.icon;
            return (
              <MindVaultCard
                key={g.code}
                glow={g.glow}
                className={\`bg-gradient-to-br \${g.bgGradient} flex flex-col justify-between group\`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={\`p-3 rounded-lg border \${g.accent}\`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-display font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {g.name}
                        </h3>
                        <span className="text-xs font-mono text-gray-400 uppercase tracking-wider block">
                          {g.tagline}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono bg-vault-surface/80 border border-vault-border px-2.5 py-1 rounded text-gray-300">
                      {g.players}
                    </span>
                  </div>

                  <p className="text-sm text-gray-300 leading-relaxed">
                    {g.description}
                  </p>
                </div>

                <div className="pt-6 flex items-center justify-between border-t border-vault-border/50 mt-6">
                  <Link href={g.href} className="text-xs font-display uppercase tracking-wider text-gray-400 group-hover:text-white flex items-center gap-1 transition-colors">
                    Game Overview <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <Link href={\`/rooms/create?game=\${g.code}\`}>
                    <MindVaultButton variant="secondary" size="sm">
                      Create Arena
                    </MindVaultButton>
                  </Link>
                </div>
              </MindVaultCard>
            );
          })}
        </div>
      </section>

      {/* Architecture Highlights */}
      <section className="bg-vault-card/40 border border-vault-border rounded-xl p-8">
        <h3 className="text-lg font-display font-bold text-white uppercase tracking-wider mb-6 text-center">
          Platform Architecture & Verification
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="p-4 rounded-lg bg-vault-surface/60 border border-vault-border/80 space-y-2">
            <div className="font-mono text-cyan-400 font-bold text-lg">InnoDB Engine</div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Foreign keys, unique constraints, and ACID transactions enforce strict data integrity across all game states.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-vault-surface/60 border border-vault-border/80 space-y-2">
            <div className="font-mono text-emerald-400 font-bold text-lg">Server Authoritative</div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Timers, duplicate rules, targets, cipher hashing, and submission order are strictly computed server-side.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-vault-surface/60 border border-vault-border/80 space-y-2">
            <div className="font-mono text-purple-400 font-bold text-lg">Socket.IO Real-Time</div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Low-latency WebSocket event channels power live drawings, room lobbies, and simultaneous round reveals.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'page.tsx'), landingPage);

// 2. app/login/page.tsx
const loginPage = `'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-16">
      <MindVaultCard className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
            Sign In to MindVault
          </h2>
          <p className="text-xs text-gray-400 font-mono">
            Firebase Auth Verified • MySQL User Synchronization
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/40 rounded p-3 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-vault-surface border border-vault-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 font-sans"
              placeholder="strategist@mindvault.io"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-vault-surface border border-vault-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 font-sans"
              placeholder="••••••••"
            />
          </div>

          <MindVaultButton
            type="submit"
            variant="primary"
            size="md"
            isLoading={loading}
            className="w-full justify-center mt-2"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Authenticate
          </MindVaultButton>
        </form>

        <div className="text-center text-xs text-gray-400 border-t border-vault-border pt-4">
          New to the platform?{' '}
          <Link href="/register" className="text-cyan-400 hover:underline">
            Register an Account
          </Link>
        </div>
      </MindVaultCard>
    </div>
  );
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'login', 'page.tsx'), loginPage);

// 3. app/register/page.tsx
const registerPage = `'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, displayName);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-16">
      <MindVaultCard className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
            Create Strategist Account
          </h2>
          <p className="text-xs text-gray-400 font-mono">
            Creates Firebase Auth credentials and MySQL user_profile record
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/40 rounded p-3 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1">
              Strategist Display Name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-vault-surface border border-vault-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 font-sans"
              placeholder="e.g. CipherMaster"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-vault-surface border border-vault-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 font-sans"
              placeholder="strategist@mindvault.io"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-vault-surface border border-vault-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 font-sans"
              placeholder="Minimum 6 characters"
            />
          </div>

          <MindVaultButton
            type="submit"
            variant="primary"
            size="md"
            isLoading={loading}
            className="w-full justify-center mt-2"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Register & Enter
          </MindVaultButton>
        </form>

        <div className="text-center text-xs text-gray-400 border-t border-vault-border pt-4">
          Already registered?{' '}
          <Link href="/login" className="text-cyan-400 hover:underline">
            Sign In
          </Link>
        </div>
      </MindVaultCard>
    </div>
  );
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'register', 'page.tsx'), registerPage);

// 4. app/dashboard/page.tsx
const dashboardPage = `'use client';
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
    { code: 'PREDICTION_ARENA', name: 'Prediction Arena', icon: Target, color: 'text-cyan-400', players: '5-10' },
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
                  <Icon className={\`w-6 h-6 \${g.color}\`} />
                  <span className="text-[11px] font-mono text-gray-400">{g.players}</span>
                </div>
                <h3 className="font-display font-bold text-white text-base">{g.name}</h3>
                <Link href={\`/rooms/create?game=\${g.code}\`}>
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
                <Link href={\`/rooms/\${room.room_code}\`}>
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
`;
fs.writeFileSync(path.join(__dirname, 'app', 'dashboard', 'page.tsx'), dashboardPage);

// 5. app/profile/page.tsx
const profilePage = `'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { User, Save, CheckCircle } from 'lucide-react';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';

export default function ProfilePage() {
  const { dbUser, token, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (dbUser) {
      setDisplayName(dbUser.displayName || '');
      setAvatarUrl(dbUser.avatarUrl || '');
    }
  }, [dbUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ displayName, phoneNumber, bio, avatarUrl })
      });
      if (res.ok) {
        setSaved(true);
        await refreshUser();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <MindVaultCard className="space-y-6">
        <div className="border-b border-vault-border pb-4">
          <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
            Strategist Profile
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-1">
            MySQL user_profiles table record
          </p>
        </div>

        {saved && (
          <div className="bg-emerald-500/10 border border-emerald-500/40 rounded p-3 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>Profile successfully updated in MySQL database.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1">
              Display Name
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-vault-surface border border-vault-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1">
              Avatar Image URL
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
              className="w-full bg-vault-surface border border-vault-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1">
              Phone Number (Optional)
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full bg-vault-surface border border-vault-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-300 mb-1">
              Strategist Bio
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-vault-surface border border-vault-border rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <MindVaultButton
            type="submit"
            variant="primary"
            size="md"
            isLoading={saving}
            className="w-full justify-center"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Profile
          </MindVaultButton>
        </form>
      </MindVaultCard>
    </div>
  );
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'profile', 'page.tsx'), profilePage);

console.log('Landing, Login, Register, Dashboard, and Profile pages created successfully.');
