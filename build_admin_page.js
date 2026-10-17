const fs = require('fs');
const path = require('path');

const adminPage = `'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { Settings, Users, Search, KeyRound, Palette, Award, Plus, Check, AlertTriangle } from 'lucide-react';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';

export default function AdminDashboardPage() {
  const { dbUser, token, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<'users' | 'detective' | 'escape' | 'drawice' | 'achievements'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [words, setWords] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [newWord, setNewWord] = useState('');
  const [wordCategory, setWordCategory] = useState('Science');
  const [wordDiff, setWordDiff] = useState('MEDIUM');
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    if (!token) return;
    const res = await fetch('/api/admin/users', { headers: { 'Authorization': 'Bearer ' + token } });
    const data = await res.json();
    if (res.ok) setUsers(data.users || []);
  };

  const fetchWords = async () => {
    if (!token) return;
    const res = await fetch('/api/admin/drawice/words', { headers: { 'Authorization': 'Bearer ' + token } });
    const data = await res.json();
    if (res.ok) setWords(data.words || []);
  };

  const fetchCases = async () => {
    if (!token) return;
    const res = await fetch('/api/admin/detective/cases', { headers: { 'Authorization': 'Bearer ' + token } });
    const data = await res.json();
    if (res.ok) setCases(data.cases || []);
  };

  const fetchAchievements = async () => {
    if (!token) return;
    const res = await fetch('/api/admin/achievements', { headers: { 'Authorization': 'Bearer ' + token } });
    const data = await res.json();
    if (res.ok) setAchievements(data.achievements || []);
  };

  useEffect(() => {
    if (dbUser?.isAdmin) {
      if (tab === 'users') fetchUsers();
      if (tab === 'drawice') fetchWords();
      if (tab === 'detective') fetchCases();
      if (tab === 'achievements') fetchAchievements();
    }
  }, [dbUser, tab, token]);

  const handleUpdateStatus = async (userId: number, accountStatus: string) => {
    if (!token) return;
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ userId, accountStatus })
    });
    fetchUsers();
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !token) return;
    await fetch('/api/admin/drawice/words', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ word: newWord.trim(), category: wordCategory, difficulty: wordDiff })
    });
    setNewWord('');
    fetchWords();
  };

  if (authLoading) return <div className="text-center py-20 font-mono text-cyan-400">Verifying Admin Clearance...</div>;

  if (!dbUser?.isAdmin) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <MindVaultCard className="space-y-4 border-red-500">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-display font-bold text-white uppercase">Access Denied</h2>
          <p className="text-xs text-gray-300 font-mono">
            Elevated ADMIN credentials required in MySQL user_roles table to access this terminal.
          </p>
        </MindVaultCard>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6">
      <div className="border-b border-vault-border pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-purple-400" />
            <h1 className="text-3xl font-display font-black text-white uppercase tracking-wider">
              Admin Command Center
            </h1>
          </div>
          <p className="text-xs text-gray-400 font-mono mt-1">
            Authoritative MySQL data management: Users, Detective cases, Escape scenarios, Drawice words, Achievements.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-vault-border pb-2">
        {[
          { key: 'users', label: 'User Directory', icon: Users },
          { key: 'detective', label: 'Detective Cases', icon: Search },
          { key: 'drawice', label: 'Drawice Words', icon: Palette },
          { key: 'achievements', label: 'Achievements Registry', icon: Award },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={'px-4 py-2 text-xs font-display font-bold uppercase tracking-wider rounded flex items-center gap-2 transition-all ' + (tab === t.key ? 'bg-purple-600 text-white shadow-glow-purple/20' : 'bg-vault-card border border-vault-border text-gray-300 hover:text-white')}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'users' && (
        <MindVaultCard className="p-0 overflow-hidden">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-vault-surface/80 border-b border-vault-border text-gray-400 uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Strategist</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Roles</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vault-border/50">
              {users.map((u) => (
                <tr key={u.user_id} className="hover:bg-vault-hover/50">
                  <td className="py-3 px-4 text-gray-400">#{u.user_id}</td>
                  <td className="py-3 px-4 font-sans font-medium text-white">{u.display_name}</td>
                  <td className="py-3 px-4 text-gray-300">{u.email}</td>
                  <td className="py-3 px-4 text-cyan-400 font-bold">{u.roles || 'PLAYER'}</td>
                  <td className="py-3 px-4">
                    <span className={'px-2 py-0.5 rounded text-[10px] ' + (u.account_status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400')}>
                      {u.account_status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    {u.account_status === 'ACTIVE' ? (
                      <button onClick={() => handleUpdateStatus(u.user_id, 'SUSPENDED')} className="text-red-400 hover:underline">
                        Suspend
                      </button>
                    ) : (
                      <button onClick={() => handleUpdateStatus(u.user_id, 'ACTIVE')} className="text-emerald-400 hover:underline">
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </MindVaultCard>
      )}

      {tab === 'drawice' && (
        <div className="space-y-6">
          <MindVaultCard className="p-5 space-y-4">
            <h3 className="font-display font-bold text-white uppercase text-sm">Add Word to Drawice Bank</h3>
            <form onSubmit={handleAddWord} className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[10px] font-mono text-gray-400 mb-1">Word</label>
                <input
                  type="text"
                  required
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  placeholder="e.g. Hologram"
                  className="w-full bg-vault-surface border border-vault-border rounded p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-gray-400 mb-1">Category</label>
                <input
                  type="text"
                  value={wordCategory}
                  onChange={(e) => setWordCategory(e.target.value)}
                  className="bg-vault-surface border border-vault-border rounded p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-gray-400 mb-1">Difficulty</label>
                <select
                  value={wordDiff}
                  onChange={(e) => setWordDiff(e.target.value)}
                  className="bg-vault-surface border border-vault-border rounded p-2 text-xs text-white"
                >
                  <option value="EASY">EASY</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HARD">HARD</option>
                </select>
              </div>
              <MindVaultButton type="submit" variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-1" /> Add Word
              </MindVaultButton>
            </form>
          </MindVaultCard>

          <MindVaultCard className="p-0 overflow-hidden">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-vault-surface/80 border-b border-vault-border text-gray-400 uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-4">Word</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Difficulty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vault-border/50">
                {words.map((w) => (
                  <tr key={w.word_id} className="hover:bg-vault-hover/50">
                    <td className="py-3 px-4 text-white font-bold">{w.word}</td>
                    <td className="py-3 px-4 text-gray-300">{w.category}</td>
                    <td className="py-3 px-4 text-purple-400">{w.difficulty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </MindVaultCard>
        </div>
      )}

      {tab === 'detective' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cases.map((c) => (
              <MindVaultCard key={c.case_id} className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-white text-base">{c.title}</h3>
                  <span className="text-xs font-mono text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">{c.difficulty}</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">{c.synopsis}</p>
                <div className="text-[11px] font-mono text-gray-400 pt-2 border-t border-vault-border">
                  Starting Budget: <span className="text-cyan-400 font-bold">{c.investigation_budget} pts</span>
                </div>
              </MindVaultCard>
            ))}
          </div>
        </div>
      )}

      {tab === 'achievements' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((a) => (
            <MindVaultCard key={a.achievement_id} className="p-4 space-y-2">
              <h3 className="font-display font-bold text-white text-sm">{a.name}</h3>
              <p className="text-xs text-gray-300">{a.description}</p>
              <div className="text-[10px] font-mono text-gray-400">
                Type: <span className="text-cyan-400">{a.requirement_type}</span> ({a.requirement_value})
              </div>
            </MindVaultCard>
          ))}
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync(path.join(__dirname, 'app', 'admin', 'page.tsx'), adminPage);
console.log('Admin Dashboard page written successfully.');
