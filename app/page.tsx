'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Target,
  Search,
  KeyRound,
  Palette,
  Users,
  ArrowRight,
  ShieldCheck,
  Zap,
  Database,
  Sparkles,
  Lock,
  ChevronDown,
  Activity,
  Cpu,
  Layers,
  Flame,
  Clock,
  Compass,
  Trophy,
  Award,
  Crown,
  Radio,
  FileText,
  BarChart2
} from 'lucide-react';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';
import DynamicVaultHeroScene from '@/components/3d/VaultHeroSceneWrapper';
import DynamicAtmosphericParticles from '@/components/3d/AtmosphericParticlesWrapper';

export default function LandingPage() {
  const router = useRouter();
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [quickRoomCode, setQuickRoomCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  useEffect(() => {
    // Check DB health
    fetch('/api/db-health')
      .then((res) => res.json())
      .then((data) => setDbConnected(data.ok))
      .catch(() => setDbConnected(false));

    // Fetch real leaderboard data for the Hall of Champions
    fetch('/api/leaderboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.leaderboard && Array.isArray(data.leaderboard)) {
          setLeaderboardData(data.leaderboard.slice(0, 3));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingLeaderboard(false));
  }, []);

  const handleQuickJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickRoomCode.trim().toUpperCase();
    if (!clean) {
      setJoinError('Please enter a room code');
      return;
    }
    router.push(`/rooms/join?code=${clean}`);
  };

  const games = [
    {
      code: 'PREDICTION_ARENA',
      name: 'Prediction Arena',
      href: '/games/prediction',
      players: '2–10 Players',
      sector: 'SECTOR 01',
      tagline: 'Pure Mathematical Strategy',
      description:
        'Calculate human psychology and probability. Submit an integer from 0 to 100 to strike the elusive target (average × 0.8). Dodge duplicate penalties, unlock exact target strikes, and trigger the game-inverting 0-vs-100 counter rule.',
      accent: 'border-cyan-500/50 text-cyan-400 bg-cyan-950/30 shadow-glow-cyan/20',
      tagColor: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
      icon: Target,
      bgGradient: 'from-cyan-950/30 via-vault-card to-vault-dark',
      glow: 'cyan' as const,
      features: ['30s Round Timer', 'Target: Avg × 0.8', 'Duplicate Penalty', '0-vs-100 Inversion'],
    },
    {
      code: 'DETECTIVE',
      name: 'Detective',
      href: '/games/detective',
      players: '1–10 Players',
      sector: 'SECTOR 02',
      tagline: 'Noir Forensic Mystery',
      description:
        'Step into rain-slicked crime scenes. Interrogate suspicious personas, uncover hidden evidence, crack encrypted forensic timestamps within a strict 100-point budget, and submit the definitive indictment before time expires.',
      accent: 'border-red-500/50 text-red-400 bg-red-950/30 shadow-glow-crimson/20',
      tagColor: 'text-red-400 border-red-500/30 bg-red-500/10',
      icon: Search,
      bgGradient: 'from-red-950/30 via-vault-card to-vault-dark',
      glow: 'crimson' as const,
      features: ['100 Action Budget', '4 Crime Scenes', 'Forensic Ciphers', 'Formal Accusation'],
    },
    {
      code: 'ESCAPE_ROOM',
      name: 'Escape Room',
      href: '/games/escape-room',
      players: '1–5 Players',
      sector: 'SECTOR 03',
      tagline: 'Cooperative Vault Breakout',
      description:
        'Trapped inside a multi-chamber high-tech vault. Inspect evidence objects, deduce keypad combinations, synchronize harmonic frequencies, and coordinate as a team before the 10-minute countdown hits zero.',
      accent: 'border-amber-500/50 text-amber-400 bg-amber-950/30 shadow-glow-amber/20',
      tagColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
      icon: KeyRound,
      bgGradient: 'from-amber-950/30 via-vault-card to-vault-dark',
      glow: 'amber' as const,
      features: ['10:00 Vault Timer', '6-Tab Terminal', 'Strictly 2 Hints', 'EASY / MED / HARD'],
    },
    {
      code: 'DRAWICE',
      name: 'Drawice',
      href: '/games/drawice',
      players: '2–10 Players',
      sector: 'SECTOR 04',
      tagline: 'Multiplayer Drawing Studio',
      description:
        'Dynamic competitive drawing and guessing. Take turns at the digital easel with low-latency stroke synchronization, while opponents race to decrypt sketches for high-speed ranked score bonuses.',
      accent: 'border-purple-500/50 text-purple-400 bg-purple-950/30 shadow-glow-purple/20',
      tagColor: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
      icon: Palette,
      bgGradient: 'from-purple-950/30 via-vault-card to-vault-dark',
      glow: 'purple' as const,
      features: ['Live Socket Strokes', 'Fair Artist Rotation', 'Speed Score Decay', 'Secret Word Choice'],
    },
  ];

  return (
    <div className="relative min-h-screen space-y-20 py-1 sm:py-3 overflow-hidden">
      {/* 3D Atmospheric Background Particle Field */}
      <DynamicAtmosphericParticles count={150} />

      {/* ======================================================== */}
      {/* 1. CINEMATIC 3D VAULT HERO SANCTUM */}
      {/* ======================================================== */}
      <section className="relative min-h-[78vh] sm:min-h-[82vh] flex flex-col items-center justify-center text-center px-4 pt-1 pb-8 overflow-hidden">
        {/* Three.js 3D Vault Sanctum Container */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
          <div className="w-full h-full max-w-6xl max-h-[850px]">
            <DynamicVaultHeroScene />
          </div>
        </div>

        {/* Foreground Hero HUD & Anime Typography */}
        <div className="relative z-10 max-w-4xl mx-auto space-y-4 sm:space-y-5 pt-0 sm:pt-1 backdrop-blur-[1px]">
          {/* Cyber Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-cyan-500/40 bg-vault-surface/90 backdrop-blur-md text-cyan-400 text-[11px] font-mono tracking-widest uppercase shadow-glow-cyan/20">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
            <Database className="w-3.5 h-3.5" />
            <span>MINDVAULT ARCHIVE // 2.0 PROTOCOL</span>
            <span className="text-gray-500">•</span>
            <span className="text-emerald-400">MYSQL 8+ INNODB ONLINE</span>
          </div>

          {/* Main Title with Anime Sub-Caption */}
          <div className="space-y-1">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-black tracking-tighter uppercase text-white leading-none drop-shadow-2xl">
              MIND<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400">VAULT</span>
            </h1>
            <div className="font-mono text-xs sm:text-sm text-cyan-400/90 tracking-[0.3em] uppercase">
              THE NEURAL GAMING SANCTUM
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl font-display font-bold text-gray-200 tracking-wide">
            Think. Investigate. Solve. Create.
          </p>

          {/* Platform Description */}
          <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto leading-relaxed font-sans">
            A high-stakes, server-authoritative multiplayer platform. Enter the vault to experience pure
            mathematical deduction, noir detective investigation, cooperative room breakout, and real-time
            artistic warfare.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <a href="#vault-arenas">
              <MindVaultButton variant="primary" size="lg" className="min-w-[190px] shadow-glow-cyan text-sm sm:text-base">
                <Zap className="w-4 h-4 mr-2" />
                Enter The Vault
              </MindVaultButton>
            </a>
            <Link href="/rooms/create">
              <MindVaultButton variant="secondary" size="lg" className="min-w-[170px] text-sm sm:text-base">
                <Cpu className="w-4 h-4 mr-2 text-cyan-400" />
                Create Arena
              </MindVaultButton>
            </Link>
            <Link href="/rooms/join">
              <MindVaultButton variant="ghost" size="lg" className="min-w-[160px] border border-vault-border text-sm sm:text-base">
                <Users className="w-4 h-4 mr-2 text-purple-400" />
                Join Room
              </MindVaultButton>
            </Link>
          </div>

          {/* Quick Telemetry Bar */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-mono text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>ACID INNODB ENGINE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>SOCKET.IO REAL-TIME</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span>4 CANONICAL SECTORS</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-500 animate-bounce pointer-events-none">
          <span className="text-[10px] font-mono tracking-widest uppercase">EXPLORE VAULT SECTORS</span>
          <ChevronDown className="w-4 h-4 text-cyan-400" />
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. THE FOUR VAULT ARENAS (SECTORS) */}
      {/* ======================================================== */}
      <section id="vault-arenas" className="space-y-8 scroll-mt-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-vault-border pb-5 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-vault-card border border-vault-border text-xs font-mono text-cyan-400 uppercase tracking-widest mb-2">
              <Layers className="w-3.5 h-3.5" />
              SELECT ACCESS LEVEL // 4 ACTIVE SECTORS
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-black uppercase text-white tracking-wider">
              The Four Vault Arenas
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 font-mono mt-1">
              Authoritative game sessions, synchronized multiplayer states, and persistent MySQL statistics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/rooms/join">
              <MindVaultButton variant="secondary" size="sm">
                <Compass className="w-3.5 h-3.5 mr-1 text-cyan-400" /> Join via Code
              </MindVaultButton>
            </Link>
            <Link href="/games">
              <MindVaultButton variant="ghost" size="sm">
                All Arena Intel <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </MindVaultButton>
            </Link>
          </div>
        </div>

        {/* 4 Sector Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {games.map((g) => {
            const Icon = g.icon;
            return (
              <MindVaultCard
                key={g.code}
                glow={g.glow}
                className={`relative bg-gradient-to-br ${g.bgGradient} flex flex-col justify-between group overflow-hidden border border-vault-border hover:border-gray-500 transition-all duration-300 shadow-xl`}
              >
                {/* Sector background badge */}
                <div className="absolute top-3 right-4 font-mono text-[10px] font-bold text-gray-600 uppercase tracking-widest pointer-events-none">
                  {g.sector}
                </div>

                <div className="space-y-5">
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3.5 rounded-xl border ${g.accent} transition-transform group-hover:scale-105 duration-200`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-display font-black text-white group-hover:text-cyan-300 transition-colors">
                          {g.name}
                        </h3>
                        <span className="text-xs font-mono text-gray-400 uppercase tracking-wider block mt-0.5">
                          {g.tagline}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badges / Player limit */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className={`text-[11px] font-mono px-2.5 py-1 rounded border ${g.tagColor}`}>
                      {g.players}
                    </span>
                    {g.features.map((feat, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-mono bg-vault-surface/80 border border-vault-border/80 px-2 py-0.5 rounded text-gray-300"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-300 leading-relaxed font-sans">
                    {g.description}
                  </p>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-6 flex items-center justify-between border-t border-vault-border/60 mt-6 gap-3">
                  <Link
                    href={g.href}
                    className="text-xs font-display font-bold uppercase tracking-wider text-gray-400 group-hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    Arena Dossier <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                  </Link>

                  <div className="flex items-center gap-2">
                    <Link href={`/rooms/create?game=${g.code}`}>
                      <MindVaultButton variant="primary" size="sm" className="shadow-none group-hover:shadow-glow-cyan">
                        Host Arena
                      </MindVaultButton>
                    </Link>
                  </div>
                </div>
              </MindVaultCard>
            );
          })}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. THE MULTIPLAYER NEURAL FABRIC (HOW IT WORKS) */}
      {/* ======================================================== */}
      <section className="space-y-6">
        <div className="border-b border-vault-border pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-vault-card border border-vault-border text-xs font-mono text-purple-400 uppercase tracking-widest mb-1">
            <Radio className="w-3.5 h-3.5" />
            ARCHITECTURE BLUEPRINT
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-wider">
            The Multiplayer Neural Fabric
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 font-mono mt-1">
            How MindVault coordinates zero-trust server-authoritative multiplayer matches.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MindVaultCard className="p-6 space-y-3 bg-vault-card border-vault-border">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-mono font-bold text-lg">
              01
            </div>
            <h3 className="font-display font-bold text-white text-base uppercase">Host Initializes Room</h3>
            <p className="text-xs text-gray-300 font-sans leading-relaxed">
              The match commander selects an arena sector, player limits (2–10), and game parameters. 
              The server commits an ACID transaction generating a unique 6-character access key.
            </p>
          </MindVaultCard>

          <MindVaultCard className="p-6 space-y-3 bg-vault-card border-vault-border">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center font-mono font-bold text-lg">
              02
            </div>
            <h3 className="font-display font-bold text-white text-base uppercase">Squad Connects via Key</h3>
            <p className="text-xs text-gray-300 font-sans leading-relaxed">
              Challengers enter the room code to initiate a low-latency Socket.IO handshake, joining the real-time 
              lobby with live presence, chat comms, and player ready states.
            </p>
          </MindVaultCard>

          <MindVaultCard className="p-6 space-y-3 bg-vault-card border-vault-border">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-mono font-bold text-lg">
              03
            </div>
            <h3 className="font-display font-bold text-white text-base uppercase">Authoritative Combat</h3>
            <p className="text-xs text-gray-300 font-sans leading-relaxed">
              Timers, duplicate number locks, puzzle salt hashes, and drawing stroke validation execute strictly on the server. 
              Outcomes and achievements persist permanently to MySQL.
            </p>
          </MindVaultCard>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. HALL OF CHAMPIONS (LIVE LEADERBOARD PREVIEW) */}
      {/* ======================================================== */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-vault-border pb-4 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-vault-card border border-vault-border text-xs font-mono text-amber-400 uppercase tracking-widest mb-1">
              <Trophy className="w-3.5 h-3.5" />
              LIVE COMPETITIVE STANDINGS
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-wider">
              Hall of Champions
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 font-mono mt-1">
              Live ranking data queried directly from the authoritative MySQL database.
            </p>
          </div>

          <Link href="/leaderboard">
            <MindVaultButton variant="secondary" size="sm">
              <BarChart2 className="w-3.5 h-3.5 mr-1 text-amber-400" /> Full Leaderboard
            </MindVaultButton>
          </Link>
        </div>

        {leaderboardData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {leaderboardData.map((player, idx) => {
              const ranks = ['S-RANK #1', 'A-RANK #2', 'B-RANK #3'];
              const borders = ['border-amber-500/50 bg-gradient-to-b from-amber-950/20 to-vault-card', 'border-gray-400/40 bg-vault-card', 'border-amber-700/40 bg-vault-card'];
              const textCols = ['text-amber-400', 'text-gray-300', 'text-amber-600'];
              return (
                <MindVaultCard key={player.user_id || idx} className={`p-6 text-center space-y-4 border ${borders[idx] || 'border-vault-border'}`}>
                  <div className="relative inline-block">
                    <div className="w-16 h-16 rounded-full bg-vault-dark border-2 border-amber-400/60 mx-auto flex items-center justify-center font-display font-black text-2xl text-amber-300 overflow-hidden">
                      {player.avatar_url ? (
                        <img src={player.avatar_url} alt={player.display_name} className="w-full h-full object-cover" />
                      ) : (
                        player.display_name?.charAt(0).toUpperCase() || 'P'
                      )}
                    </div>
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold bg-amber-400 text-black px-2 py-0.5 rounded-full uppercase">
                      {ranks[idx]}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display font-bold text-lg text-white">{player.display_name}</h3>
                    <div className={`font-mono text-xl font-black ${textCols[idx]}`}>
                      {Math.round(player.total_score || 0)} PTS
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-gray-400 pt-2 border-t border-vault-border/50">
                    <div>Wins: <span className="text-white font-bold">{player.wins || 0}</span></div>
                    <div>Played: <span className="text-white font-bold">{player.games_played || 0}</span></div>
                  </div>
                </MindVaultCard>
              );
            })}
          </div>
        ) : (
          <MindVaultCard className="p-8 text-center space-y-3 bg-vault-card/40 border-dashed border-vault-border">
            <Trophy className="w-8 h-8 text-amber-400/60 mx-auto" />
            <h3 className="font-display font-bold text-white text-base uppercase">
              Season 01 Vault Protocol Active
            </h3>
            <p className="text-xs text-gray-400 font-mono max-w-md mx-auto">
              Leaderboard registry is currently tracking live matches. Host an arena game to claim the first S-Rank title!
            </p>
            <div className="pt-2">
              <Link href="/rooms/create">
                <MindVaultButton variant="primary" size="sm">
                  <Zap className="w-3.5 h-3.5 mr-1" /> Host Match Now
                </MindVaultButton>
              </Link>
            </div>
          </MindVaultCard>
        )}
      </section>

      {/* ======================================================== */}
      {/* 5. RAPID ACCESS TERMINAL (JOIN MATCH VIA CODE) */}
      {/* ======================================================== */}
      <section className="relative rounded-2xl bg-gradient-to-r from-vault-card via-vault-surface to-vault-card border border-vault-border p-8 md:p-10 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
            <Lock className="w-3.5 h-3.5" />
            DIRECT ARENA ACCESS
          </div>

          <h3 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-wider">
            Have an Arena Invite Code?
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto font-mono">
            Enter your 6-character room access key to establish an instant low-latency socket handshake.
          </p>

          <form onSubmit={handleQuickJoin} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto pt-2">
            <input
              type="text"
              value={quickRoomCode}
              onChange={(e) => {
                setQuickRoomCode(e.target.value.toUpperCase());
                setJoinError('');
              }}
              placeholder="ENTER ROOM CODE (e.g. A9B2C4)"
              maxLength={10}
              className="w-full px-4 py-3 bg-vault-dark border border-vault-border rounded font-mono text-center text-lg text-cyan-400 placeholder-gray-600 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 uppercase tracking-widest"
            />
            <MindVaultButton variant="primary" size="md" type="submit" className="w-full sm:w-auto whitespace-nowrap">
              Connect <ArrowRight className="w-4 h-4 ml-1" />
            </MindVaultButton>
          </form>

          {joinError && (
            <p className="text-xs font-mono text-red-400 animate-pulse">{joinError}</p>
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. PLATFORM ARCHITECTURE & VERIFICATION HUD */}
      {/* ======================================================== */}
      <section className="bg-vault-card/30 border border-vault-border rounded-xl p-8 space-y-8">
        <div className="text-center space-y-2">
          <h3 className="text-xl font-display font-black text-white uppercase tracking-wider">
            Platform Architecture & Authoritative Standards
          </h3>
          <p className="text-xs font-mono text-gray-400">
            Built with uncompromising data integrity, zero client trust, and real-time state synchronization.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="p-5 rounded-lg bg-vault-surface/60 border border-vault-border/80 space-y-2 hover:border-cyan-500/40 transition-colors">
            <div className="font-mono text-cyan-400 font-bold text-lg flex items-center justify-center gap-2">
              <Database className="w-4 h-4" /> InnoDB ACID Engine
            </div>
            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              Foreign keys, unique room constraints, and atomic transactions enforce complete database integrity
              across all game states and user achievements.
            </p>
          </div>

          <div className="p-5 rounded-lg bg-vault-surface/60 border border-vault-border/80 space-y-2 hover:border-emerald-500/40 transition-colors">
            <div className="font-mono text-emerald-400 font-bold text-lg flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Server Authoritative
            </div>
            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              10-minute escape countdowns, 30s prediction locks, forensic evidence budgets, and secret drawing
              words are strictly evaluated server-side.
            </p>
          </div>

          <div className="p-5 rounded-lg bg-vault-surface/60 border border-vault-border/80 space-y-2 hover:border-purple-500/40 transition-colors">
            <div className="font-mono text-purple-400 font-bold text-lg flex items-center justify-center gap-2">
              <Activity className="w-4 h-4" /> Socket.IO Synchrony
            </div>
            <p className="text-xs text-gray-400 leading-relaxed font-sans">
              Sub-millisecond WebSocket event transport powers synchronized live brush strokes, simultaneous round
              reveals, and instant multiplayer lobbies.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
