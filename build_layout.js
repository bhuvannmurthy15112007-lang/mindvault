const fs = require('fs');
const path = require('path');

// 1. globals.css
const globalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-dark: #07090E;
  --bg-surface: #0D111A;
  --bg-card: #121826;
  --border-color: #1F293D;
  --cyan-accent: #00F0FF;
}

body {
  background-color: var(--bg-dark);
  color: #F3F4F6;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow-x: hidden;
  background-image: 
    radial-gradient(circle at 50% 0%, rgba(0, 240, 255, 0.04) 0%, transparent 60%),
    radial-gradient(circle at 100% 50%, rgba(99, 102, 241, 0.03) 0%, transparent 50%),
    linear-gradient(to bottom, #07090E 0%, #090D14 100%);
  min-height: 100vh;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #07090E;
}
::-webkit-scrollbar-thumb {
  background: #1F293D;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #374151;
}

/* Cyber grid texture */
.cyber-grid {
  background-size: 40px 40px;
  background-image: 
    linear-gradient(to right, rgba(31, 41, 61, 0.25) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(31, 41, 61, 0.25) 1px, transparent 1px);
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'globals.css'), globalsCss);

// 2. Navbar.tsx
const navbar = `'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Trophy, Award, History, Plus, LogIn, LogOut, User as UserIcon, Settings, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { MindVaultButton } from '../ui/MindVaultButton';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { dbUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/games', label: 'Games', icon: Shield },
    { href: '/rooms/join', label: 'Join Room' },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/achievements', label: 'Achievements', icon: Award },
    { href: '/history', label: 'History', icon: History },
  ];

  if (dbUser?.isAdmin) {
    navLinks.push({ href: '/admin', label: 'Admin', icon: Settings });
  }

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-vault-border/80 bg-vault-dark/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded bg-gradient-to-tr from-cyan-600 via-indigo-600 to-purple-600 p-[1px] group-hover:shadow-glow-cyan transition-all">
            <div className="w-full h-full bg-vault-dark rounded flex items-center justify-center font-display font-black text-cyan-400 text-lg">
              M
            </div>
          </div>
          <div>
            <div className="font-display font-black tracking-wider text-xl text-white group-hover:text-cyan-400 transition-colors">
              MIND<span className="text-cyan-400">VAULT</span>
            </div>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={\`px-3 py-1.5 rounded text-sm font-medium transition-all \${
                  isActive
                    ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-400/30'
                    : 'text-gray-300 hover:text-white hover:bg-vault-card/60'
                }\`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* User / Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/rooms/create">
            <MindVaultButton variant="primary" size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Create Room
            </MindVaultButton>
          </Link>

          {dbUser ? (
            <div className="flex items-center gap-3 pl-2 border-l border-vault-border">
              <Link href="/profile" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-purple-500 p-0.5">
                  <div className="w-full h-full bg-vault-dark rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-gray-200">
                    {dbUser.avatarUrl ? (
                      <img src={dbUser.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      dbUser.displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-200 group-hover:text-cyan-400 transition-colors">
                  {dbUser.displayName}
                </span>
              </Link>
              <button
                onClick={() => logout()}
                className="text-gray-400 hover:text-red-400 p-1.5 rounded transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <MindVaultButton variant="ghost" size="sm">
                  <LogIn className="w-4 h-4 mr-1" />
                  Sign In
                </MindVaultButton>
              </Link>
              <Link href="/register">
                <MindVaultButton variant="secondary" size="sm">
                  Register
                </MindVaultButton>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-vault-border bg-vault-surface/95 px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded text-base font-medium text-gray-200 hover:text-cyan-400 hover:bg-vault-card"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-vault-border flex flex-col gap-2">
            <Link href="/rooms/create" onClick={() => setMobileMenuOpen(false)}>
              <MindVaultButton variant="primary" size="sm" className="w-full justify-center">
                <Plus className="w-4 h-4 mr-1" /> Create Room
              </MindVaultButton>
            </Link>
            {dbUser ? (
              <div className="flex items-center justify-between pt-2">
                <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="text-sm text-cyan-400">
                  Profile: {dbUser.displayName}
                </Link>
                <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="text-sm text-red-400">
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-2 pt-1">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                  <MindVaultButton variant="ghost" size="sm" className="w-full justify-center">Sign In</MindVaultButton>
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="flex-1">
                  <MindVaultButton variant="secondary" size="sm" className="w-full justify-center">Register</MindVaultButton>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
`;
fs.writeFileSync(path.join(__dirname, 'components', 'layout', 'Navbar.tsx'), navbar);

// 3. Footer.tsx
const footer = `'use client';
import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-vault-border/60 bg-vault-dark/95 py-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="font-display font-bold text-white tracking-wider flex items-center gap-2">
            MIND<span className="text-cyan-400">VAULT</span>
            <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30">
              DBMS PLATFORM
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            A Database-Driven Multiplayer Gaming Platform • MySQL 8+ InnoDB Authority
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs text-gray-400 font-mono">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Persistent Socket.IO
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            MySQL 8+ Pooled
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Firebase Auth Verified
          </span>
        </div>
      </div>
    </footer>
  );
};
`;
fs.writeFileSync(path.join(__dirname, 'components', 'layout', 'Footer.tsx'), footer);

// 4. app/layout.tsx
const layoutTsx = `import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { DatabaseErrorModal } from '@/components/ui/DatabaseErrorModal';

export const metadata: Metadata = {
  title: 'MindVault | A Database-Driven Multiplayer Gaming Platform',
  description: 'Enterprise DBMS multiplayer platform featuring Prediction Arena, Detective, Escape Room, and Drawice.'
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600;700&family=Space+Grotesk:wght@500;600;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-vault-dark text-gray-100 cyber-grid selection:bg-cyan-500 selection:text-black">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <Footer />
          <DatabaseErrorModal />
        </AuthProvider>
      </body>
    </html>
  );
}
`;
fs.writeFileSync(path.join(__dirname, 'app', 'layout.tsx'), layoutTsx);

console.log('Layout & Global CSS created successfully.');
