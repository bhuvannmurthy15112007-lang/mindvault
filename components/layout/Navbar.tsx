'use client';
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
                className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                  isActive
                    ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-400/30'
                    : 'text-gray-300 hover:text-white hover:bg-vault-card/60'
                }`}
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
