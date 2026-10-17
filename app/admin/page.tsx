'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  Settings,
  Users,
  Search,
  KeyRound,
  Palette,
  Award,
  Plus,
  Check,
  AlertTriangle,
  Eye,
  Trash2,
  X,
  FileText,
  CheckCircle2,
  Clock,
  Shield,
  MapPin,
  HelpCircle,
  Lock,
  Target,
  RefreshCw
} from 'lucide-react';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';

export default function AdminDashboardPage() {
  const { dbUser, token, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<'users' | 'detective' | 'escape' | 'drawice' | 'prediction' | 'achievements'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [words, setWords] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [newWord, setNewWord] = useState('');
  const [wordCategory, setWordCategory] = useState('Science');
  const [wordDiff, setWordDiff] = useState('MEDIUM');
  const [loading, setLoading] = useState(false);

  // User Promotion State
  const [promoteModalUser, setPromoteModalUser] = useState<any | null>(null);
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [promotionFeedback, setPromotionFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Escape Room Scenarios State
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<number | null>(null);
  const [scenarioDetails, setScenarioDetails] = useState<any | null>(null);
  const [scenarioDetailLoading, setScenarioDetailLoading] = useState(false);
  const [activeScenarioTab, setActiveScenarioTab] = useState<
    'rooms' | 'objects' | 'clues' | 'puzzles' | 'locks' | 'hints'
  >('rooms');
  const [showNewScenarioModal, setShowNewScenarioModal] = useState(false);
  const [newScenarioForm, setNewScenarioForm] = useState({
    title: '',
    themeDescription: '',
    timeLimitSeconds: 600,
    difficulty: 'MEDIUM'
  });

  // Detective Case Management State
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [newCaseForm, setNewCaseForm] = useState({
    title: '',
    synopsis: '',
    difficulty: 'MEDIUM',
    investigationBudget: 100,
    incidentLocation: '',
    incidentTime: ''
  });

  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [caseDetails, setCaseDetails] = useState<any | null>(null);
  const [caseDetailLoading, setCaseDetailLoading] = useState(false);
  const [activeCaseTab, setActiveCaseTab] = useState<
    'suspects' | 'locations' | 'evidence' | 'clues' | 'timeline' | 'puzzles' | 'solution'
  >('suspects');

  // New component forms
  const [newSuspect, setNewSuspect] = useState({
    name: '',
    occupation: '',
    background: '',
    alibi: '',
    is_culprit: false,
    interrogation_transcript: '',
    motive_description: '',
    interrogation_cost: 10
  });

  const [newLocation, setNewLocation] = useState({
    name: '',
    description: '',
    search_findings: '',
    action_cost: 10
  });

  const [newEvidence, setNewEvidence] = useState({
    title: '',
    description: '',
    forensic_details: '',
    is_critical: false,
    is_red_herring: false,
    analysis_cost: 15,
    location_id: '',
    suspect_id: ''
  });

  const [newClue, setNewClue] = useState({
    clue_text: '',
    deduction_notes: '',
    action_cost: 10,
    evidence_id: ''
  });

  const [newTimeline, setNewTimeline] = useState({
    timestamp_label: '',
    event_description: '',
    suspect_id: '',
    is_verified: true
  });

  const [newPuzzle, setNewPuzzle] = useState({
    prompt: '',
    accepted_plaintext: '',
    hint: '',
    unlocked_clue_text: '',
    action_cost: 20
  });

  const [solutionForm, setSolutionForm] = useState({
    culprit_suspect_id: '',
    motive: '',
    murder_weapon_or_method: '',
    critical_evidence_summary: '',
    explanation: ''
  });

  const fetchUsers = async () => {
    if (!token) return;
    const res = await fetch('/api/admin/users', { headers: { Authorization: 'Bearer ' + token } });
    const data = await res.json();
    if (res.ok) setUsers(data.users || []);
  };

  const fetchWords = async () => {
    if (!token) return;
    const res = await fetch('/api/admin/drawice/words', { headers: { Authorization: 'Bearer ' + token } });
    const data = await res.json();
    if (res.ok) setWords(data.words || []);
  };

  const fetchCases = async () => {
    if (!token) return;
    const res = await fetch('/api/admin/detective/cases', { headers: { Authorization: 'Bearer ' + token } });
    const data = await res.json();
    if (res.ok) setCases(data.cases || []);
  };

  const fetchAchievements = async () => {
    if (!token) return;
    const res = await fetch('/api/admin/achievements', { headers: { Authorization: 'Bearer ' + token } });
    const data = await res.json();
    if (res.ok) setAchievements(data.achievements || []);
  };

  const fetchCaseDetails = async (caseId: number) => {
    if (!token) return;
    setCaseDetailLoading(true);
    setSelectedCaseId(caseId);
    try {
      const res = await fetch(`/api/admin/detective/cases/${caseId}`, {
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      if (res.ok) {
        setCaseDetails(data);
        if (data.solution) {
          setSolutionForm({
            culprit_suspect_id: String(data.solution.culprit_suspect_id || ''),
            motive: data.solution.motive || '',
            murder_weapon_or_method: data.solution.murder_weapon_or_method || '',
            critical_evidence_summary: data.solution.critical_evidence_summary || '',
            explanation: data.solution.explanation || ''
          });
        } else {
          setSolutionForm({
            culprit_suspect_id: '',
            motive: '',
            murder_weapon_or_method: '',
            critical_evidence_summary: '',
            explanation: ''
          });
        }
      }
    } finally {
      setCaseDetailLoading(false);
    }
  };

  const fetchScenarios = async () => {
    if (!token) return;
    const res = await fetch('/api/admin/escape/scenarios', { headers: { Authorization: 'Bearer ' + token } });
    const data = await res.json();
    if (res.ok) setScenarios(data.scenarios || []);
  };

  const fetchScenarioDetails = async (scenarioId: number) => {
    if (!token) return;
    setScenarioDetailLoading(true);
    setSelectedScenarioId(scenarioId);
    try {
      const res = await fetch(`/api/admin/escape/scenarios/${scenarioId}`, {
        headers: { Authorization: 'Bearer ' + token }
      });
      const data = await res.json();
      if (res.ok) {
        setScenarioDetails(data);
      }
    } finally {
      setScenarioDetailLoading(false);
    }
  };

  const handleToggleScenarioStatus = async (scenarioId: number, currentStatus: boolean) => {
    if (!token) return;
    await fetch(`/api/admin/escape/scenarios/${scenarioId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify({ is_active: !currentStatus })
    });
    fetchScenarios();
  };

  const handleCreateScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newScenarioForm.title.trim()) return;
    const res = await fetch('/api/admin/escape/scenarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify(newScenarioForm)
    });
    if (res.ok) {
      setShowNewScenarioModal(false);
      setNewScenarioForm({
        title: '',
        themeDescription: '',
        timeLimitSeconds: 600,
        difficulty: 'MEDIUM'
      });
      fetchScenarios();
    }
  };

  const handlePromoteUser = async () => {
    if (!token || !promoteModalUser) return;
    setPromoteLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({
          userId: promoteModalUser.user_id,
          action: 'PROMOTE_TO_ADMIN'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setPromotionFeedback({
          message: `Strategist "${promoteModalUser.display_name}" (#${promoteModalUser.user_id}) has been successfully promoted to Administrator. Privileges are active immediately.`,
          type: 'success'
        });
        setPromoteModalUser(null);
        fetchUsers();
      } else {
        setPromotionFeedback({
          message: data.error || 'Failed to promote user.',
          type: 'error'
        });
      }
    } catch (err: any) {
      setPromotionFeedback({
        message: err.message || 'Network error during promotion.',
        type: 'error'
      });
    } finally {
      setPromoteLoading(false);
    }
  };

  useEffect(() => {
    if (dbUser?.isAdmin) {
      if (tab === 'users') fetchUsers();
      if (tab === 'drawice') fetchWords();
      if (tab === 'detective') fetchCases();
      if (tab === 'escape') fetchScenarios();
      if (tab === 'achievements') fetchAchievements();
    }
  }, [dbUser, tab, token]);

  const handleUpdateStatus = async (userId: number, accountStatus: string) => {
    if (!token) return;
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
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
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify({ word: newWord.trim(), category: wordCategory, difficulty: wordDiff })
    });
    setNewWord('');
    fetchWords();
  };

  const handleToggleCaseStatus = async (caseId: number, currentStatus: boolean) => {
    if (!token) return;
    await fetch(`/api/admin/detective/cases/${caseId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify({ is_active: !currentStatus })
    });
    fetchCases();
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newCaseForm.title.trim()) return;
    const res = await fetch('/api/admin/detective/cases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify(newCaseForm)
    });
    if (res.ok) {
      setShowNewCaseModal(false);
      setNewCaseForm({
        title: '',
        synopsis: '',
        difficulty: 'MEDIUM',
        investigationBudget: 100,
        incidentLocation: '',
        incidentTime: ''
      });
      fetchCases();
    }
  };

  const handleAddComponent = async (componentType: string, data: any) => {
    if (!token || !selectedCaseId) return;
    const res = await fetch(`/api/admin/detective/cases/${selectedCaseId}/components`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token
      },
      body: JSON.stringify({ componentType, data })
    });
    if (res.ok) {
      fetchCaseDetails(selectedCaseId);
    }
  };

  const handleDeleteComponent = async (componentType: string, id: number) => {
    if (!token || !selectedCaseId) return;
    const res = await fetch(`/api/admin/detective/cases/${selectedCaseId}/components?type=${componentType}&id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token }
    });
    if (res.ok) {
      fetchCaseDetails(selectedCaseId);
    }
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
          { key: 'escape', label: 'Escape Scenarios', icon: KeyRound },
          { key: 'drawice', label: 'Drawice Words', icon: Palette },
          { key: 'prediction', label: 'Prediction Arena', icon: Target },
          { key: 'achievements', label: 'Achievements Registry', icon: Award }
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className={
                'px-4 py-2 text-xs font-display font-bold uppercase tracking-wider rounded flex items-center gap-2 transition-all ' +
                (tab === t.key
                  ? 'bg-purple-600 text-white shadow-glow-purple/20'
                  : 'bg-vault-card border border-vault-border text-gray-300 hover:text-white')
              }
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'users' && (
        <div className="space-y-4">
          {promotionFeedback && (
            <div
              className={`p-4 rounded-lg flex items-center justify-between text-xs font-mono border ${
                promotionFeedback.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-950/40 border-red-500/40 text-red-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {promotionFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                )}
                <span>{promotionFeedback.message}</span>
              </div>
              <button
                onClick={() => setPromotionFeedback(null)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

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
                {users.map((u) => {
                  const isAdmin = u.roles?.includes('ADMIN');
                  return (
                    <tr key={u.user_id} className="hover:bg-vault-hover/50">
                      <td className="py-3 px-4 text-gray-400">#{u.user_id}</td>
                      <td className="py-3 px-4 font-sans font-medium text-white">{u.display_name}</td>
                      <td className="py-3 px-4 text-gray-300">{u.email}</td>
                      <td className="py-3 px-4">
                        {isAdmin ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold inline-flex items-center gap-1">
                            <Shield className="w-3 h-3 text-purple-400" /> ADMIN
                          </span>
                        ) : (
                          <span className="text-cyan-400 font-bold">{u.roles || 'PLAYER'}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={
                            'px-2 py-0.5 rounded text-[10px] ' +
                            (u.account_status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400')
                          }
                        >
                          {u.account_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {!isAdmin && (
                          <button
                            onClick={() => setPromoteModalUser(u)}
                            className="text-purple-400 hover:text-purple-300 hover:underline inline-flex items-center gap-1 font-bold mr-2"
                            title="Promote user to Admin"
                          >
                            <Shield className="w-3 h-3" />
                            Promote to Admin
                          </button>
                        )}
                        {u.account_status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleUpdateStatus(u.user_id, 'SUSPENDED')}
                            className="text-red-400 hover:underline"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(u.user_id, 'ACTIVE')}
                            className="text-emerald-400 hover:underline"
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </MindVaultCard>
        </div>
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
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Search className="w-5 h-5 text-amber-400" />
              Detective Case Files
            </h2>
            <MindVaultButton variant="primary" size="sm" onClick={() => setShowNewCaseModal(true)}>
              <Plus className="w-4 h-4 mr-1" /> New Case File
            </MindVaultButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cases.map((c) => (
              <MindVaultCard key={c.case_id} className="p-5 space-y-3 flex flex-col justify-between border-vault-border hover:border-amber-500/50 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={
                        'text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ' +
                        (c.difficulty === 'EASY'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : c.difficulty === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-rose-500/20 text-rose-400')
                      }
                    >
                      {c.difficulty}
                    </span>
                    <button
                      onClick={() => handleToggleCaseStatus(c.case_id, Boolean(c.is_active))}
                      className={
                        'text-[10px] font-mono px-2 py-0.5 rounded uppercase border ' +
                        (c.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20')
                      }
                    >
                      {c.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                  </div>
                  <h3 className="font-display font-bold text-white text-base leading-snug">{c.title}</h3>
                  <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">{c.synopsis}</p>
                </div>

                <div className="pt-3 border-t border-vault-border space-y-2">
                  <div className="flex justify-between text-[11px] font-mono text-gray-400">
                    <span>Budget:</span>
                    <span className="text-cyan-400 font-bold">{c.investigation_budget} pts</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-gray-400">
                    <span>Location:</span>
                    <span className="text-gray-300 truncate max-w-[150px]">{c.incident_location || 'Not Specified'}</span>
                  </div>
                  <MindVaultButton
                    variant="secondary"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => fetchCaseDetails(c.case_id)}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1 text-amber-400" />
                    Configure Case & Elements
                  </MindVaultButton>
                </div>
              </MindVaultCard>
            ))}
          </div>
        </div>
      )}

      {tab === 'escape' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                Escape Room Scenarios ({scenarios.length})
              </h2>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Authoritative chamber sequence, clue placement, puzzle locks, and countdown timers.
              </p>
            </div>
            <MindVaultButton variant="primary" size="sm" onClick={() => setShowNewScenarioModal(true)}>
              <Plus className="w-4 h-4 mr-1" /> New Scenario
            </MindVaultButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scenarios.map((s) => (
              <MindVaultCard key={s.scenario_id} className="p-5 space-y-3 flex flex-col justify-between border-vault-border hover:border-amber-500/50 transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={
                        'text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ' +
                        (s.difficulty === 'EASY'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : s.difficulty === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30')
                      }
                    >
                      {s.difficulty || 'MEDIUM'}
                    </span>
                    <button
                      onClick={() => handleToggleScenarioStatus(s.scenario_id, Boolean(s.is_active))}
                      className={
                        'text-[10px] font-mono px-2 py-0.5 rounded uppercase border ' +
                        (s.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20')
                      }
                    >
                      {s.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                  </div>
                  <h3 className="font-display font-bold text-white text-base leading-snug">{s.title}</h3>
                  <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed">{s.theme_description}</p>
                </div>

                <div className="pt-3 border-t border-vault-border space-y-2">
                  <div className="flex justify-between text-[11px] font-mono text-gray-400">
                    <span>Purge Timer:</span>
                    <span className="text-cyan-400 font-bold">{Math.floor((s.time_limit_seconds || 600) / 60)}m ({s.time_limit_seconds || 600}s)</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-gray-400">
                    <span>Max Scoring:</span>
                    <span className="text-amber-400 font-bold">30 pts (10/room)</span>
                  </div>
                  <MindVaultButton
                    variant="secondary"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => fetchScenarioDetails(s.scenario_id)}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1 text-cyan-400" /> Inspect Scenario Components
                  </MindVaultButton>
                </div>
              </MindVaultCard>
            ))}
          </div>
        </div>
      )}

      {tab === 'prediction' && (
        <div className="space-y-6">
          <div className="border-b border-vault-border pb-3">
            <h2 className="text-lg font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              Prediction Arena Engine & Parameters
            </h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              Live mathematical parameters, target calculations, selection timer, and multi-player scoring ladders.
            </p>
          </div>

          {/* Engine Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MindVaultCard className="p-4 space-y-1 border-cyan-500/30">
              <div className="text-[10px] font-mono uppercase text-gray-400">Target Formula</div>
              <div className="text-xl font-bold font-mono text-cyan-300">0.8 × Average</div>
              <div className="text-[11px] text-gray-400 font-mono">Target = (Sum of all inputs ÷ N) × 0.8</div>
            </MindVaultCard>
            <MindVaultCard className="p-4 space-y-1 border-amber-500/30">
              <div className="text-[10px] font-mono uppercase text-gray-400">Selection Timer</div>
              <div className="text-xl font-bold font-mono text-amber-300">30 Seconds</div>
              <div className="text-[11px] text-gray-400 font-mono">Strict submission window per round</div>
            </MindVaultCard>
            <MindVaultCard className="p-4 space-y-1 border-purple-500/30">
              <div className="text-[10px] font-mono uppercase text-gray-400">Player Range</div>
              <div className="text-xl font-bold font-mono text-purple-300">2 – 10 Players</div>
              <div className="text-[11px] text-gray-400 font-mono">Full multiplayer match support</div>
            </MindVaultCard>
            <MindVaultCard className="p-4 space-y-1 border-emerald-500/30">
              <div className="text-[10px] font-mono uppercase text-gray-400">Valid Number Range</div>
              <div className="text-xl font-bold font-mono text-emerald-300">0 to 100</div>
              <div className="text-[11px] text-gray-400 font-mono">Integers only; exact bonus: +2 pts</div>
            </MindVaultCard>
          </div>

          {/* Scoring Tables Matrix */}
          <MindVaultCard className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-white uppercase text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                Player-Count Scoring Distribution Matrix
              </h3>
              <span className="text-[10px] font-mono text-gray-400 uppercase">Authoritative Ladder</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-vault-surface/80 border-b border-vault-border text-gray-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Player Count</th>
                    <th className="py-2.5 px-3 text-cyan-400">1st Place</th>
                    <th className="py-2.5 px-3 text-cyan-400">2nd Place</th>
                    <th className="py-2.5 px-3 text-cyan-400">3rd Place</th>
                    <th className="py-2.5 px-3 text-cyan-400">4th Place</th>
                    <th className="py-2.5 px-3 text-cyan-400">5th Place</th>
                    <th className="py-2.5 px-3 text-cyan-400">6th Place</th>
                    <th className="py-2.5 px-3 text-rose-400">Duplicate Penalty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-vault-border/50">
                  <tr className="hover:bg-vault-hover/40">
                    <td className="py-2.5 px-3 font-bold text-white">2 Players</td>
                    <td className="py-2.5 px-3 text-amber-400 font-bold">5 pts</td>
                    <td className="py-2.5 px-3 text-gray-300">2 pts</td>
                    <td className="py-2.5 px-3 text-gray-600">—</td>
                    <td className="py-2.5 px-3 text-gray-600">—</td>
                    <td className="py-2.5 px-3 text-gray-600">—</td>
                    <td className="py-2.5 px-3 text-gray-600">—</td>
                    <td className="py-2.5 px-3 text-rose-400">-1 pt</td>
                  </tr>
                  <tr className="hover:bg-vault-hover/40">
                    <td className="py-2.5 px-3 font-bold text-white">3 Players</td>
                    <td className="py-2.5 px-3 text-amber-400 font-bold">6 pts</td>
                    <td className="py-2.5 px-3 text-gray-300">3 pts</td>
                    <td className="py-2.5 px-3 text-gray-400">1 pt</td>
                    <td className="py-2.5 px-3 text-gray-600">—</td>
                    <td className="py-2.5 px-3 text-gray-600">—</td>
                    <td className="py-2.5 px-3 text-gray-600">—</td>
                    <td className="py-2.5 px-3 text-rose-400">-1 pt</td>
                  </tr>
                  <tr className="hover:bg-vault-hover/40">
                    <td className="py-2.5 px-3 font-bold text-white">4 Players</td>
                    <td className="py-2.5 px-3 text-amber-400 font-bold">8 pts</td>
                    <td className="py-2.5 px-3 text-gray-300">5 pts</td>
                    <td className="py-2.5 px-3 text-gray-400">2 pts</td>
                    <td className="py-2.5 px-3 text-gray-500">1 pt</td>
                    <td className="py-2.5 px-3 text-gray-600">—</td>
                    <td className="py-2.5 px-3 text-gray-600">—</td>
                    <td className="py-2.5 px-3 text-rose-400">-1 pt</td>
                  </tr>
                  <tr className="hover:bg-vault-hover/40">
                    <td className="py-2.5 px-3 font-bold text-white">5–10 Players</td>
                    <td className="py-2.5 px-3 text-amber-400 font-bold">10 pts</td>
                    <td className="py-2.5 px-3 text-gray-300">7 pts</td>
                    <td className="py-2.5 px-3 text-gray-400">5 pts</td>
                    <td className="py-2.5 px-3 text-gray-500">3 pts</td>
                    <td className="py-2.5 px-3 text-gray-500">2 pts</td>
                    <td className="py-2.5 px-3 text-gray-500">1 pt</td>
                    <td className="py-2.5 px-3 text-rose-400">-1 pt</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-vault-border/60 text-xs font-mono">
              <div className="p-3 bg-vault-surface rounded border border-vault-border space-y-1">
                <div className="text-cyan-400 font-bold uppercase text-[11px]">Special Rule: Exact Target (+2 pts)</div>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  If an eligible player's submitted integer exactly matches the mathematical target, they receive 1st place points plus +2 bonus points, and all other non-duplicate players suffer a -2 point deduction.
                </p>
              </div>
              <div className="p-3 bg-vault-surface rounded border border-vault-border space-y-1">
                <div className="text-purple-400 font-bold uppercase text-[11px]">Special Rule: 0 ↔ 100 Inversion</div>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  If at least one player chooses 0 and exactly one player chooses 100, the player choosing 100 wins the round outright.
                </p>
              </div>
            </div>
          </MindVaultCard>
        </div>
      )}

      {tab === 'achievements' && (
        <div className="space-y-6">
          <div className="border-b border-vault-border pb-3">
            <h2 className="text-lg font-display font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Achievements Registry ({achievements.length})
            </h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              Authoritative achievements catalog across Prediction Arena, Detective, Escape Room, and Drawice.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((ach) => (
              <MindVaultCard key={ach.achievement_id} className="p-4 space-y-3 border-vault-border hover:border-amber-500/40 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-white text-sm">{ach.name}</h4>
                      <span className="text-[10px] font-mono text-cyan-400 uppercase">{ach.game_code || 'ALL GAMES'}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
                    +{ach.xp_points || 50} XP
                  </span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed font-sans">{ach.description}</p>
                <div className="pt-2 border-t border-vault-border/60 flex items-center justify-between text-[10px] font-mono text-gray-400">
                  <span>Requirement:</span>
                  <span className="text-white font-bold">{ach.requirement_type} = {ach.requirement_value}</span>
                </div>
              </MindVaultCard>
            ))}
          </div>
        </div>
      )}

      {/* Case Configuration Modal */}
      {selectedCaseId && caseDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-vault-card border border-amber-500/40 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-vault-border pb-4">
              <div>
                <span className="text-xs font-mono text-amber-400 uppercase tracking-widest">
                  Case #{selectedCaseId} Configuration Terminal
                </span>
                <h2 className="text-2xl font-display font-black text-white">{caseDetails.caseData?.title}</h2>
                <p className="text-xs text-gray-400 font-mono mt-1">
                  Budget: {caseDetails.caseData?.investigation_budget} pts | Difficulty: {caseDetails.caseData?.difficulty}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedCaseId(null);
                  setCaseDetails(null);
                }}
                className="text-gray-400 hover:text-white p-1 rounded"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Sub-Tabs for Configuration */}
            <div className="flex flex-wrap gap-2 border-b border-vault-border pb-2">
              {[
                { key: 'suspects', label: `Suspects (${caseDetails.suspects?.length || 0})` },
                { key: 'locations', label: `Locations (${caseDetails.locations?.length || 0})` },
                { key: 'evidence', label: `Evidence (${caseDetails.evidence?.length || 0})` },
                { key: 'clues', label: `Clues (${caseDetails.clues?.length || 0})` },
                { key: 'timeline', label: `Timeline (${caseDetails.timeline?.length || 0})` },
                { key: 'puzzles', label: `Puzzles (${caseDetails.puzzles?.length || 0})` },
                { key: 'solution', label: 'Authoritative Solution' }
              ].map((st) => (
                <button
                  key={st.key}
                  onClick={() => setActiveCaseTab(st.key as any)}
                  className={
                    'px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-all ' +
                    (activeCaseTab === st.key
                      ? 'bg-amber-500 text-black font-bold'
                      : 'bg-vault-surface border border-vault-border text-gray-300 hover:text-white')
                  }
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* TAB: Suspects */}
            {activeCaseTab === 'suspects' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {caseDetails.suspects?.map((s: any) => (
                    <div key={s.suspect_id} className="p-3 bg-vault-surface border border-vault-border rounded space-y-1 relative">
                      <button
                        onClick={() => handleDeleteComponent('suspect', s.suspect_id)}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{s.name}</span>
                        <span className="text-[10px] text-gray-400 font-mono">({s.occupation})</span>
                        {s.is_culprit ? (
                          <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-mono font-bold">
                            CULPRIT
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-300 font-mono text-[11px]">{s.alibi}</p>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-vault-surface/60 border border-vault-border rounded-lg space-y-3">
                  <h4 className="text-xs font-mono font-bold text-amber-400 uppercase">Add Suspect</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      placeholder="Suspect Name"
                      value={newSuspect.name}
                      onChange={(e) => setNewSuspect({ ...newSuspect, name: e.target.value })}
                      className="bg-vault-card border border-vault-border rounded p-2 text-xs text-white"
                    />
                    <input
                      placeholder="Occupation"
                      value={newSuspect.occupation}
                      onChange={(e) => setNewSuspect({ ...newSuspect, occupation: e.target.value })}
                      className="bg-vault-card border border-vault-border rounded p-2 text-xs text-white"
                    />
                    <input
                      placeholder="Alibi"
                      value={newSuspect.alibi}
                      onChange={(e) => setNewSuspect({ ...newSuspect, alibi: e.target.value })}
                      className="bg-vault-card border border-vault-border rounded p-2 text-xs text-white md:col-span-2"
                    />
                    <textarea
                      placeholder="Interrogation Transcript / Statement"
                      value={newSuspect.interrogation_transcript}
                      onChange={(e) => setNewSuspect({ ...newSuspect, interrogation_transcript: e.target.value })}
                      className="bg-vault-card border border-vault-border rounded p-2 text-xs text-white md:col-span-2"
                      rows={2}
                    />
                    <label className="flex items-center gap-2 text-xs text-gray-300">
                      <input
                        type="checkbox"
                        checked={newSuspect.is_culprit}
                        onChange={(e) => setNewSuspect({ ...newSuspect, is_culprit: e.target.checked })}
                      />
                      Is Culprit?
                    </label>
                  </div>
                  <MindVaultButton
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      if (!newSuspect.name.trim()) return;
                      handleAddComponent('suspect', newSuspect);
                      setNewSuspect({
                        name: '',
                        occupation: '',
                        background: '',
                        alibi: '',
                        is_culprit: false,
                        interrogation_transcript: '',
                        motive_description: '',
                        interrogation_cost: 10
                      });
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Suspect
                  </MindVaultButton>
                </div>
              </div>
            )}

            {/* TAB: Locations */}
            {activeCaseTab === 'locations' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {caseDetails.locations?.map((l: any) => (
                    <div key={l.location_id} className="p-3 bg-vault-surface border border-vault-border rounded space-y-1 relative">
                      <button
                        onClick={() => handleDeleteComponent('location', l.location_id)}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-white text-sm">{l.name}</span>
                      <p className="text-xs text-gray-300 font-mono text-[11px]">{l.search_findings || l.description}</p>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-vault-surface/60 border border-vault-border rounded-lg space-y-3">
                  <h4 className="text-xs font-mono font-bold text-amber-400 uppercase">Add Crime Location</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      placeholder="Location Name"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                      className="bg-vault-card border border-vault-border rounded p-2 text-xs text-white"
                    />
                    <input
                      placeholder="Action Cost (pts)"
                      type="number"
                      value={newLocation.action_cost}
                      onChange={(e) => setNewLocation({ ...newLocation, action_cost: parseInt(e.target.value) || 10 })}
                      className="bg-vault-card border border-vault-border rounded p-2 text-xs text-white"
                    />
                    <textarea
                      placeholder="Search Findings / Detailed Description"
                      value={newLocation.search_findings}
                      onChange={(e) => setNewLocation({ ...newLocation, search_findings: e.target.value })}
                      className="bg-vault-card border border-vault-border rounded p-2 text-xs text-white md:col-span-2"
                      rows={2}
                    />
                  </div>
                  <MindVaultButton
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      if (!newLocation.name.trim()) return;
                      handleAddComponent('location', newLocation);
                      setNewLocation({ name: '', description: '', search_findings: '', action_cost: 10 });
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Location
                  </MindVaultButton>
                </div>
              </div>
            )}

            {/* TAB: Evidence */}
            {activeCaseTab === 'evidence' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {caseDetails.evidence?.map((ev: any) => (
                    <div key={ev.evidence_id} className="p-3 bg-vault-surface border border-vault-border rounded space-y-1 relative">
                      <button
                        onClick={() => handleDeleteComponent('evidence', ev.evidence_id)}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{ev.title}</span>
                        {ev.is_critical ? (
                          <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold">
                            CRITICAL
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-300 font-mono text-[11px]">{ev.forensic_details || ev.description}</p>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-vault-surface/60 border border-vault-border rounded-lg space-y-3">
                  <h4 className="text-xs font-mono font-bold text-amber-400 uppercase">Add Forensic Evidence</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      placeholder="Evidence Title"
                      value={newEvidence.title}
                      onChange={(e) => setNewEvidence({ ...newEvidence, title: e.target.value })}
                      className="bg-vault-card border border-vault-border rounded p-2 text-xs text-white"
                    />
                    <select
                      value={newEvidence.location_id}
                      onChange={(e) => setNewEvidence({ ...newEvidence, location_id: e.target.value })}
                      className="bg-vault-card border border-vault-border rounded p-2 text-xs text-white"
                    >
                      <option value="">-- Linked Location (Optional) --</option>
                      {caseDetails.locations?.map((l: any) => (
                        <option key={l.location_id} value={l.location_id}>
                          {l.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={newEvidence.suspect_id}
                      onChange={(e) => setNewEvidence({ ...newEvidence, suspect_id: e.target.value })}
                      className="bg-vault-card border border-vault-border rounded p-2 text-xs text-white"
                    >
                      <option value="">-- Linked Suspect (Optional) --</option>
                      {caseDetails.suspects?.map((s: any) => (
                        <option key={s.suspect_id} value={s.suspect_id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <label className="flex items-center gap-2 text-xs text-gray-300">
                      <input
                        type="checkbox"
                        checked={newEvidence.is_critical}
                        onChange={(e) => setNewEvidence({ ...newEvidence, is_critical: e.target.checked })}
                      />
                      Is Critical Evidence?
                    </label>
                    <textarea
                      placeholder="Forensic Details / Chemical Analysis"
                      value={newEvidence.forensic_details}
                      onChange={(e) => setNewEvidence({ ...newEvidence, forensic_details: e.target.value })}
                      className="bg-vault-card border border-vault-border rounded p-2 text-xs text-white md:col-span-2"
                      rows={2}
                    />
                  </div>
                  <MindVaultButton
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      if (!newEvidence.title.trim()) return;
                      handleAddComponent('evidence', newEvidence);
                      setNewEvidence({
                        title: '',
                        description: '',
                        forensic_details: '',
                        is_critical: false,
                        is_red_herring: false,
                        analysis_cost: 15,
                        location_id: '',
                        suspect_id: ''
                      });
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Evidence
                  </MindVaultButton>
                </div>
              </div>
            )}

            {/* TAB: Clues */}
            {activeCaseTab === 'clues' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {caseDetails.clues?.map((c: any) => (
                    <div key={c.clue_id} className="p-3 bg-vault-surface border border-vault-border rounded space-y-1 relative">
                      <button
                        onClick={() => handleDeleteComponent('clue', c.clue_id)}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <p className="text-xs text-white font-mono">{c.clue_text}</p>
                      <p className="text-[11px] text-amber-400/90 font-mono">{c.deduction_notes}</p>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-vault-surface/60 border border-vault-border rounded-lg space-y-3">
                  <h4 className="text-xs font-mono font-bold text-amber-400 uppercase">Add Investigative Clue</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      placeholder="Clue Text"
                      value={newClue.clue_text}
                      onChange={(e) => setNewClue({ ...newClue, clue_text: e.target.value })}
                      className="bg-vault-card border border-vault-border rounded p-2 text-xs text-white"
                    />
                    <select
                      value={newClue.evidence_id}
                      onChange={(e) => setNewClue({ ...newClue, evidence_id: e.target.value })}
                      className="bg-vault-card border border-vault-border rounded p-2 text-xs text-white"
                    >
                      <option value="">-- Linked Evidence (Optional) --</option>
                      {caseDetails.evidence?.map((ev: any) => (
                        <option key={ev.evidence_id} value={ev.evidence_id}>
                          {ev.title}
                        </option>
                      ))}
                    </select>
                    <textarea
                      placeholder="Deduction Notes / Key Takeaways"
                      value={newClue.deduction_notes}
                      onChange={(e) => setNewClue({ ...newClue, deduction_notes: e.target.value })}
                      className="bg-vault-card border border-vault-border rounded p-2 text-xs text-white md:col-span-2"
                      rows={2}
                    />
                  </div>
                  <MindVaultButton
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      if (!newClue.clue_text.trim()) return;
                      handleAddComponent('clue', newClue);
                      setNewClue({ clue_text: '', deduction_notes: '', action_cost: 10, evidence_id: '' });
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Clue
                  </MindVaultButton>
                </div>
              </div>
            )}

            {/* TAB: Timeline */}
            {activeCaseTab === 'timeline' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  {caseDetails.timeline?.map((t: any) => (
                    <div key={t.event_id} className="p-3 bg-vault-surface border border-vault-border rounded flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-cyan-400 font-bold">{t.timestamp_label}</span>
                        <span className="text-xs text-gray-300">{t.event_description}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteComponent('timeline', t.event_id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-vault-surface/60 border border-vault-border rounded-lg space-y-3">
                  <h4 className="text-xs font-mono font-bold text-amber-400 uppercase">Add Timeline Event</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      placeholder="Timestamp (e.g. 11:45 PM)"
                      value={newTimeline.timestamp_label}
                      onChange={(e) => setNewTimeline({ ...newTimeline, timestamp_label: e.target.value })}
                      className="bg-vault-card border border-vault-border rounded p-2 text-xs text-white"
                    />
                    <input
                      placeholder="Event Description"
                      value={newTimeline.event_description}
                      onChange={(e) => setNewTimeline({ ...newTimeline, event_description: e.target.value })}
                      className="bg-vault-card border border-vault-border rounded p-2 text-xs text-white"
                    />
                  </div>
                  <MindVaultButton
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      if (!newTimeline.timestamp_label.trim() || !newTimeline.event_description.trim()) return;
                      handleAddComponent('timeline', newTimeline);
                      setNewTimeline({ timestamp_label: '', event_description: '', suspect_id: '', is_verified: true });
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Timeline Event
                  </MindVaultButton>
                </div>
              </div>
            )}

            {/* TAB: Puzzles */}
            {activeCaseTab === 'puzzles' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {caseDetails.puzzles?.map((p: any) => (
                    <div key={p.puzzle_id} className="p-3 bg-vault-surface border border-vault-border rounded space-y-1 relative">
                      <button
                        onClick={() => handleDeleteComponent('puzzle', p.puzzle_id)}
                        className="absolute top-2 right-2 text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span className="font-bold text-white text-xs">{p.puzzle_type}</span>
                        <span className="text-[10px] text-cyan-400 font-mono font-bold">Answer: {p.accepted_plaintext}</span>
                      </div>
                      <p className="text-xs text-gray-300 font-mono">{p.prompt}</p>
                      <p className="text-[10px] text-gray-400 font-mono">Unlock: {p.unlocked_clue_text}</p>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-vault-surface/60 border border-vault-border rounded-lg space-y-3">
                  <h4 className="text-xs font-mono font-bold text-amber-400 uppercase">Add Forensic Cipher / Puzzle</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      placeholder="Puzzle Prompt / Encrypted Cipher"
                      value={newPuzzle.prompt}
                      onChange={(e) => setNewPuzzle({ ...newPuzzle, prompt: e.target.value })}
                      className="bg-vault-card border border-vault-border rounded p-2 text-xs text-white"
                    />
                    <input
                      placeholder="Accepted Plaintext Answer (e.g. 4421)"
                      value={newPuzzle.accepted_plaintext}
                      onChange={(e) => setNewPuzzle({ ...newPuzzle, accepted_plaintext: e.target.value })}
                      className="bg-vault-card border border-vault-border rounded p-2 text-xs text-white"
                    />
                    <input
                      placeholder="Hint"
                      value={newPuzzle.hint}
                      onChange={(e) => setNewPuzzle({ ...newPuzzle, hint: e.target.value })}
                      className="bg-vault-card border border-vault-border rounded p-2 text-xs text-white"
                    />
                    <input
                      placeholder="Unlocked Clue Text on Decryption"
                      value={newPuzzle.unlocked_clue_text}
                      onChange={(e) => setNewPuzzle({ ...newPuzzle, unlocked_clue_text: e.target.value })}
                      className="bg-vault-card border border-vault-border rounded p-2 text-xs text-white"
                    />
                  </div>
                  <MindVaultButton
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      if (!newPuzzle.prompt.trim() || !newPuzzle.accepted_plaintext.trim()) return;
                      handleAddComponent('puzzle', newPuzzle);
                      setNewPuzzle({ prompt: '', accepted_plaintext: '', hint: '', unlocked_clue_text: '', action_cost: 20 });
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Puzzle
                  </MindVaultButton>
                </div>
              </div>
            )}

            {/* TAB: Authoritative Solution */}
            {activeCaseTab === 'solution' && (
              <div className="space-y-4">
                <div className="p-4 bg-vault-surface/60 border border-vault-border rounded-lg space-y-3">
                  <h4 className="text-xs font-mono font-bold text-amber-400 uppercase">Configure Official Case Solution</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 mb-1">True Culprit</label>
                      <select
                        value={solutionForm.culprit_suspect_id}
                        onChange={(e) => setSolutionForm({ ...solutionForm, culprit_suspect_id: e.target.value })}
                        className="w-full bg-vault-card border border-vault-border rounded p-2 text-xs text-white"
                      >
                        <option value="">-- Select Culprit --</option>
                        {caseDetails.suspects?.map((s: any) => (
                          <option key={s.suspect_id} value={s.suspect_id}>
                            {s.name} ({s.occupation})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 mb-1">Official Motive</label>
                      <input
                        placeholder="e.g. Gambling debts, pressure from black-market syndicates"
                        value={solutionForm.motive}
                        onChange={(e) => setSolutionForm({ ...solutionForm, motive: e.target.value })}
                        className="w-full bg-vault-card border border-vault-border rounded p-2 text-xs text-white"
                      >
                      </input>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono text-gray-400 mb-1">Method / Weapon</label>
                      <input
                        placeholder="e.g. Ultrasonic vibration override via maintenance booth"
                        value={solutionForm.murder_weapon_or_method}
                        onChange={(e) => setSolutionForm({ ...solutionForm, murder_weapon_or_method: e.target.value })}
                        className="w-full bg-vault-card border border-vault-border rounded p-2 text-xs text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono text-gray-400 mb-1">Critical Evidence Summary</label>
                      <textarea
                        placeholder="Summary of conclusive evidence proving the case..."
                        value={solutionForm.critical_evidence_summary}
                        onChange={(e) => setSolutionForm({ ...solutionForm, critical_evidence_summary: e.target.value })}
                        className="w-full bg-vault-card border border-vault-border rounded p-2 text-xs text-white"
                        rows={2}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-mono text-gray-400 mb-1">Full Explanatory Solution</label>
                      <textarea
                        placeholder="Comprehensive step-by-step breakdown of how the crime was executed and solved..."
                        value={solutionForm.explanation}
                        onChange={(e) => setSolutionForm({ ...solutionForm, explanation: e.target.value })}
                        className="w-full bg-vault-card border border-vault-border rounded p-2 text-xs text-white"
                        rows={3}
                      />
                    </div>
                  </div>
                  <MindVaultButton
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      if (!solutionForm.culprit_suspect_id) return;
                      handleAddComponent('solution', solutionForm);
                    }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Save Authoritative Solution
                  </MindVaultButton>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Case Modal */}
      {showNewCaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-vault-card border border-amber-500/40 rounded-xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-vault-border pb-3">
              <h3 className="text-lg font-display font-bold text-white uppercase flex items-center gap-2">
                <Search className="w-5 h-5 text-amber-400" />
                Create New Detective Case
              </h3>
              <button onClick={() => setShowNewCaseModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCase} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-gray-400 mb-1">Case Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Quantum Breach"
                  value={newCaseForm.title}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, title: e.target.value })}
                  className="w-full bg-vault-surface border border-vault-border rounded p-2 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 mb-1">Difficulty</label>
                  <select
                    value={newCaseForm.difficulty}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, difficulty: e.target.value })}
                    className="w-full bg-vault-surface border border-vault-border rounded p-2 text-xs text-white"
                  >
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 mb-1">Investigation Budget (pts)</label>
                  <input
                    type="number"
                    value={newCaseForm.investigationBudget}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, investigationBudget: parseInt(e.target.value) || 100 })}
                    className="w-full bg-vault-surface border border-vault-border rounded p-2 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono text-gray-400 mb-1">Incident Location</label>
                <input
                  type="text"
                  placeholder="e.g. Cygnus Research Complex, Level 9"
                  value={newCaseForm.incidentLocation}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, incidentLocation: e.target.value })}
                  className="w-full bg-vault-surface border border-vault-border rounded p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-gray-400 mb-1">Incident Time</label>
                <input
                  type="text"
                  placeholder="e.g. 02:15 AM"
                  value={newCaseForm.incidentTime}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, incidentTime: e.target.value })}
                  className="w-full bg-vault-surface border border-vault-border rounded p-2 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-gray-400 mb-1">Synopsis</label>
                <textarea
                  required
                  rows={3}
                  placeholder="A detailed narrative of the crime scenario..."
                  value={newCaseForm.synopsis}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, synopsis: e.target.value })}
                  className="w-full bg-vault-surface border border-vault-border rounded p-2 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-vault-border">
                <MindVaultButton type="button" variant="ghost" size="sm" onClick={() => setShowNewCaseModal(false)}>
                  Cancel
                </MindVaultButton>
                <MindVaultButton type="submit" variant="primary" size="sm">
                  <Check className="w-4 h-4 mr-1" /> Create Case File
                </MindVaultButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Promotion Confirmation Modal */}
      {promoteModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-vault-card border border-purple-500/50 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-vault-border pb-3">
              <h3 className="text-lg font-display font-bold text-white uppercase flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                Promote User to Admin
              </h3>
              <button
                onClick={() => setPromoteModalUser(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs text-gray-300">
              <p>
                Are you sure you want to promote strategist{' '}
                <span className="text-white font-bold">{promoteModalUser.display_name}</span> (ID: #
                {promoteModalUser.user_id}, <span className="text-gray-400">{promoteModalUser.email}</span>) to{' '}
                <span className="text-purple-400 font-bold">ADMINISTRATOR</span>?
              </p>

              <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded text-purple-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-purple-300 uppercase text-[11px]">
                  <AlertTriangle className="w-4 h-4 text-purple-400" /> Elevated Privileges
                </div>
                <p className="text-[11px] leading-relaxed">
                  This user will immediately receive elevated clearance, full access to the Admin Command Center,
                  game management controls, and authoritative MySQL database tools.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-vault-border">
              <MindVaultButton
                type="button"
                variant="ghost"
                size="sm"
                disabled={promoteLoading}
                onClick={() => setPromoteModalUser(null)}
              >
                Cancel
              </MindVaultButton>
              <MindVaultButton
                type="button"
                variant="primary"
                size="sm"
                isLoading={promoteLoading}
                onClick={handlePromoteUser}
                className="bg-purple-600 hover:bg-purple-500 text-white"
              >
                <Check className="w-4 h-4 mr-1" /> Confirm Promotion
              </MindVaultButton>
            </div>
          </div>
        </div>
      )}

      {/* New Escape Scenario Modal */}
      {showNewScenarioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-vault-card border border-amber-500/40 rounded-xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-vault-border pb-3">
              <h3 className="text-lg font-display font-bold text-white uppercase flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                Create New Escape Scenario
              </h3>
              <button onClick={() => setShowNewScenarioModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateScenario} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[10px] text-gray-400 mb-1 uppercase">Scenario Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sub-Level Cyber Vault Protocol"
                  value={newScenarioForm.title}
                  onChange={(e) => setNewScenarioForm({ ...newScenarioForm, title: e.target.value })}
                  className="w-full bg-vault-surface border border-vault-border rounded p-2 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1 uppercase">Difficulty</label>
                  <select
                    value={newScenarioForm.difficulty}
                    onChange={(e) => setNewScenarioForm({ ...newScenarioForm, difficulty: e.target.value })}
                    className="w-full bg-vault-surface border border-vault-border rounded p-2 text-xs text-white"
                  >
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1 uppercase">Purge Timer (Seconds)</label>
                  <input
                    type="number"
                    value={newScenarioForm.timeLimitSeconds}
                    onChange={(e) =>
                      setNewScenarioForm({
                        ...newScenarioForm,
                        timeLimitSeconds: parseInt(e.target.value, 10) || 600
                      })
                    }
                    className="w-full bg-vault-surface border border-vault-border rounded p-2 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-gray-400 mb-1 uppercase">Theme & Narrative Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Environmental briefing and security lockdown narrative..."
                  value={newScenarioForm.themeDescription}
                  onChange={(e) => setNewScenarioForm({ ...newScenarioForm, themeDescription: e.target.value })}
                  className="w-full bg-vault-surface border border-vault-border rounded p-2 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-vault-border">
                <MindVaultButton type="button" variant="ghost" size="sm" onClick={() => setShowNewScenarioModal(false)}>
                  Cancel
                </MindVaultButton>
                <MindVaultButton type="submit" variant="primary" size="sm">
                  <Check className="w-4 h-4 mr-1" /> Create Scenario
                </MindVaultButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Escape Scenario Elements Inspector Modal */}
      {selectedScenarioId && scenarioDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-vault-card border border-amber-500/40 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-start justify-between border-b border-vault-border pb-4">
              <div>
                <span className="text-xs font-mono text-amber-400 uppercase tracking-widest">
                  Scenario #{selectedScenarioId} Inspection Terminal
                </span>
                <h2 className="text-2xl font-display font-black text-white">{scenarioDetails.scenario?.title}</h2>
                <p className="text-xs text-gray-400 font-mono mt-1">
                  Difficulty: {scenarioDetails.scenario?.difficulty} | Purge Window:{' '}
                  {Math.floor((scenarioDetails.scenario?.time_limit_seconds || 600) / 60)}m (
                  {scenarioDetails.scenario?.time_limit_seconds || 600}s)
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedScenarioId(null);
                  setScenarioDetails(null);
                }}
                className="text-gray-400 hover:text-white p-1 rounded"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Sub-Tabs for Scenario */}
            <div className="flex flex-wrap gap-2 border-b border-vault-border pb-2">
              {[
                { key: 'rooms', label: `Rooms (${scenarioDetails.rooms?.length || 0})` },
                { key: 'objects', label: `Objects (${scenarioDetails.objects?.length || 0})` },
                { key: 'clues', label: `Clues (${scenarioDetails.clues?.length || 0})` },
                { key: 'puzzles', label: `Puzzles (${scenarioDetails.puzzles?.length || 0})` },
                { key: 'locks', label: `Locks (${scenarioDetails.locks?.length || 0})` },
                { key: 'hints', label: `Hints (${scenarioDetails.hints?.length || 0})` }
              ].map((st) => (
                <button
                  key={st.key}
                  onClick={() => setActiveScenarioTab(st.key as any)}
                  className={
                    'px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-all ' +
                    (activeScenarioTab === st.key
                      ? 'bg-amber-500 text-black font-bold'
                      : 'bg-vault-surface border border-vault-border text-gray-300 hover:text-white')
                  }
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* TAB: Rooms */}
            {activeScenarioTab === 'rooms' && (
              <div className="space-y-3 font-mono text-xs">
                {scenarioDetails.rooms?.map((r: any) => (
                  <div key={r.escape_room_id} className="p-4 bg-vault-surface border border-vault-border rounded-lg space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">
                        Chamber Sector #{r.sequence_order}: {r.room_name}
                      </span>
                      <span className="text-[10px] text-amber-400 uppercase font-bold">{r.ambient_theme}</span>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{r.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: Objects */}
            {activeScenarioTab === 'objects' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                {scenarioDetails.objects?.map((o: any) => (
                  <div key={o.object_id} className="p-3 bg-vault-surface border border-vault-border rounded space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{o.name}</span>
                      <span
                        className={
                          'text-[10px] px-2 py-0.5 rounded font-bold uppercase ' +
                          (o.is_locked ? 'bg-amber-500/20 text-amber-400' : 'bg-cyan-500/20 text-cyan-400')
                        }
                      >
                        {o.is_locked ? 'Locked Mechanism' : 'Investigative Object'}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400">Sector: {o.room_name}</div>
                    <p className="text-gray-300 leading-relaxed">{o.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: Clues */}
            {activeScenarioTab === 'clues' && (
              <div className="space-y-3 font-mono text-xs">
                {scenarioDetails.clues?.map((c: any) => (
                  <div key={c.clue_id} className="p-3 bg-vault-surface border border-vault-border rounded space-y-2">
                    <div className="flex items-center justify-between text-cyan-400 text-[11px] font-bold">
                      <span>Source Object: {c.object_name}</span>
                      <span>Clue ID #{c.clue_id}</span>
                    </div>
                    {c.image_url && (
                      <div className="p-1 bg-black/50 border border-vault-border rounded max-w-[200px]">
                        <img src={c.image_url} alt="Clue schematic" className="max-h-24 object-contain" />
                      </div>
                    )}
                    <p className="text-white italic bg-black/30 p-2.5 rounded border border-vault-border/60">
                      "{c.clue_text}"
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: Puzzles */}
            {activeScenarioTab === 'puzzles' && (
              <div className="space-y-3 font-mono text-xs">
                {scenarioDetails.puzzles?.map((p: any) => (
                  <div key={p.puzzle_id} className="p-3 bg-vault-surface border border-vault-border rounded space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">Target Mechanism: {p.object_name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-amber-500/20 text-amber-400">
                        Answer: {p.accepted_plaintext || 'N/A'}
                      </span>
                    </div>
                    <div className="text-gray-300 bg-black/40 p-2.5 rounded border border-vault-border/60">
                      <div className="text-[10px] uppercase text-gray-400 mb-1">Puzzle Prompt:</div>
                      {p.puzzle_prompt}
                    </div>
                    {p.hint_text && (
                      <div className="text-[11px] text-gray-400">
                        <span className="text-amber-400 font-bold">Built-in Hint:</span> {p.hint_text}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* TAB: Locks */}
            {activeScenarioTab === 'locks' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                {scenarioDetails.locks?.map((l: any) => (
                  <div key={l.lock_id} className="p-3 bg-vault-surface border border-vault-border rounded space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{l.lock_name}</span>
                      {l.is_exit_door ? (
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Exit Door
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-amber-500/20 text-amber-400">
                          Bulkhead Lock
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-400">Sector: {l.room_name}</div>
                    <div className="text-[10px] text-cyan-400">Lock Type: {l.lock_type}</div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB: Hints */}
            {activeScenarioTab === 'hints' && (
              <div className="space-y-3 font-mono text-xs">
                {scenarioDetails.hints?.map((h: any) => (
                  <div key={h.hint_id} className="p-3 bg-vault-surface border border-vault-border rounded space-y-1">
                    <div className="flex items-center justify-between text-amber-400 font-bold">
                      <span>Room ID #{h.room_id}</span>
                      <span>Hint #{h.hint_number}</span>
                    </div>
                    <p className="text-gray-300 leading-relaxed">{h.hint_text}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-vault-border">
              <MindVaultButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedScenarioId(null);
                  setScenarioDetails(null);
                }}
              >
                Close Inspector
              </MindVaultButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
