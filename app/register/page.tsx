'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';
import DynamicAtmosphericParticles from '@/components/3d/AtmosphericParticlesWrapper';

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
    <div className="relative max-w-md mx-auto py-16">
      <DynamicAtmosphericParticles count={80} />
      <MindVaultCard className="space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
            Create Strategist Account
          </h2>
          <p className="text-xs text-gray-400 font-mono">
            Database-driven player profile • Authoritative session
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
