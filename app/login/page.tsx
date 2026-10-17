'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';
import DynamicAtmosphericParticles from '@/components/3d/AtmosphericParticlesWrapper';

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
    <div className="relative max-w-md mx-auto py-16">
      <DynamicAtmosphericParticles count={80} />
      <MindVaultCard className="space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wider">
            Sign In to MindVault
          </h2>
          <p className="text-xs text-gray-400 font-mono">
            Strategist Authentication • MySQL User Session
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
