'use client';
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
