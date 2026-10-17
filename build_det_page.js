const fs = require('fs');
const path = require('path');

const detPage = `'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Search, UserCheck, MapPin, FileText, Key, AlertCircle } from 'lucide-react';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';

export default function DetectiveGamePage() {
  const searchParams = useSearchParams();
  const sessionId = parseInt(searchParams.get('session') || '0', 10);
  const { token } = useAuth();

  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'suspects' | 'locations' | 'evidence' | 'timeline' | 'puzzles'>('suspects');
  const [cipherInput, setCipherInput] = useState('');
  const [accuseModalOpen, setAccuseModalOpen] = useState(false);
  const [accuseSuspectId, setAccuseSuspectId] = useState<number>(1);
  const [accuseMotive, setAccuseMotive] = useState('');
  const [accuseEvidenceId, setAccuseEvidenceId] = useState<number>(1);
  const [accuseReasoning, setAccuseReasoning] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetective = async () => {
    if (!sessionId || !token) return;
    try {
      const res = await fetch('/api/games/detective/' + sessionId, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
        if (json.myAccusation) setResult(json.myAccusation);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetective();
  }, [sessionId, token]);

  const handleAction = async (actionType: string, targetId: number, answer?: string) => {
    if (!token) return;
    try {
      const res = await fetch('/api/games/detective/' + sessionId + '/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ actionType, targetId, answer })
      });
      const resData = await res.json();
      if (res.ok) {
        alert(resData.summary);
        fetchDetective();
      } else {
        alert(resData.error || 'Action failed');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleAccusation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const res = await fetch('/api/games/detective/' + sessionId + '/accuse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          suspectId: accuseSuspectId,
          motive: accuseMotive,
          evidenceId: accuseEvidenceId,
          reasoning: accuseReasoning
        })
      });
      const resData = await res.json();
      if (res.ok) {
        setResult(resData);
        setAccuseModalOpen(false);
        fetchDetective();
      } else {
        alert(resData.error || 'Accusation failed');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return <div className="text-center py-20 font-mono text-cyan-400">Loading Case Dossier...</div>;

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-red-950/40 via-vault-card to-vault-surface border border-red-500/30 p-6 rounded-xl">
        <div>
          <span className="text-xs font-mono bg-red-500/20 text-red-300 border border-red-500/40 px-2.5 py-0.5 rounded">
            CASE #01 • {data?.detectiveSession?.difficulty}
          </span>
          <h1 className="text-3xl font-display font-black text-white uppercase tracking-wider mt-1">
            {data?.detectiveSession?.title || 'The Obsidian Heist'}
          </h1>
          <p className="text-xs text-gray-300 max-w-xl mt-1 leading-relaxed">
            {data?.detectiveSession?.synopsis}
          </p>
        </div>

        <div className="bg-vault-surface border border-vault-border px-5 py-3 rounded-lg text-center font-mono">
          <div className="text-[10px] text-gray-400 uppercase tracking-widest">Investigation Budget</div>
          <div className="text-2xl font-bold text-red-400">
            {data?.detectiveSession?.remaining_budget || 0} PTS
          </div>
          <MindVaultButton
            variant="danger"
            size="sm"
            onClick={() => setAccuseModalOpen(true)}
            className="mt-2 w-full justify-center"
          >
            Deliver Accusation
          </MindVaultButton>
        </div>
      </div>

      {result && (
        <MindVaultCard className="p-6 border-red-500 bg-red-950/20 text-center space-y-4">
          <h3 className="text-xl font-display font-bold text-white uppercase">
            {result.is_correct ? 'Case Solved: Culprit Identified!' : 'Accusation Concluded: Case Recorded'}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto font-mono text-xs">
            <div className="bg-black/40 p-2 rounded">Suspect: {result.suspect_score || 0} pts</div>
            <div className="bg-black/40 p-2 rounded">Evidence: {result.evidence_score || 0} pts</div>
            <div className="bg-black/40 p-2 rounded">Motive: {result.motive_score || 0} pts</div>
            <div className="bg-black/40 p-2 rounded">Efficiency: {result.efficiency_bonus || 0} pts</div>
          </div>
          <div className="text-lg font-mono text-cyan-400 font-bold">
            Total Score: {result.final_score || 0} / 120 PTS
          </div>
        </MindVaultCard>
      )}

      <div className="flex border-b border-vault-border gap-2">
        {[
          { key: 'suspects', label: 'Suspects Dossier', icon: UserCheck },
          { key: 'locations', label: 'Locations', icon: MapPin },
          { key: 'evidence', label: 'Evidence', icon: FileText },
          { key: 'timeline', label: 'Timeline', icon: Search },
          { key: 'puzzles', label: 'Ciphers', icon: Key },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={'px-4 py-2.5 text-xs font-display font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all ' + (activeTab === t.key ? 'border-red-400 text-red-400 bg-red-500/10' : 'border-transparent text-gray-400 hover:text-white')}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'suspects' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data?.suspects?.map((s: any) => (
            <MindVaultCard key={s.suspect_id} className="p-5 space-y-3">
              <h4 className="font-display font-bold text-white text-base">{s.name} ({s.occupation})</h4>
              <p className="text-xs text-gray-300">{s.background}</p>
              <div className="bg-black/40 p-2 rounded border border-vault-border text-xs font-mono text-gray-400">
                Alibi: <span className="text-gray-200">{s.alibi}</span>
              </div>
              <MindVaultButton variant="secondary" size="sm" className="w-full justify-center" onClick={() => handleAction('INTERROGATE', s.suspect_id)}>
                Interrogate (-{s.interrogation_cost} Budget)
              </MindVaultButton>
            </MindVaultCard>
          ))}
        </div>
      )}

      {activeTab === 'locations' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data?.locations?.map((l: any) => (
            <MindVaultCard key={l.location_id} className="p-5 space-y-3">
              <h4 className="font-display font-bold text-white text-base">{l.name}</h4>
              <p className="text-xs text-gray-300">{l.description}</p>
              <MindVaultButton variant="secondary" size="sm" className="w-full justify-center" onClick={() => handleAction('SEARCH_LOCATION', l.location_id)}>
                Search (-{l.action_cost} Budget)
              </MindVaultButton>
            </MindVaultCard>
          ))}
        </div>
      )}

      {activeTab === 'evidence' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data?.evidence?.map((e: any) => (
            <MindVaultCard key={e.evidence_id} className="p-5 space-y-3">
              <h4 className="font-display font-bold text-white text-base">{e.title}</h4>
              <p className="text-xs text-gray-300">{e.description}</p>
              <MindVaultButton variant="secondary" size="sm" className="w-full justify-center" onClick={() => handleAction('ANALYZE_EVIDENCE', e.evidence_id)}>
                Analyze (-{e.analysis_cost} Budget)
              </MindVaultButton>
            </MindVaultCard>
          ))}
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="max-w-2xl mx-auto space-y-3">
          {data?.timeline?.map((t: any) => (
            <div key={t.event_id} className="flex gap-4 p-4 rounded bg-vault-card border border-vault-border">
              <span className="font-mono text-cyan-400 font-bold text-xs whitespace-nowrap">{t.timestamp_label}</span>
              <p className="text-xs text-gray-200">{t.event_description}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'puzzles' && (
        <div className="max-w-xl mx-auto space-y-6">
          {data?.puzzles?.map((p: any) => (
            <MindVaultCard key={p.puzzle_id} className="p-6 space-y-4">
              <h4 className="font-display font-bold text-white text-base">Forensic Cipher</h4>
              <p className="text-sm font-mono text-cyan-300 bg-black/40 p-3 rounded border border-vault-border">{p.prompt}</p>
              <div className="text-xs text-amber-400 font-mono">Hint: {p.hint}</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cipherInput}
                  onChange={(e) => setCipherInput(e.target.value)}
                  placeholder="Enter deciphered plaintext..."
                  className="flex-1 bg-vault-surface border border-vault-border rounded px-3 py-2 text-sm text-white focus:outline-none font-mono"
                />
                <MindVaultButton variant="primary" size="md" onClick={() => handleAction('SOLVE_PUZZLE', p.puzzle_id, cipherInput)}>
                  Verify
                </MindVaultButton>
              </div>
            </MindVaultCard>
          ))}
        </div>
      )}

      {accuseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <MindVaultCard className="max-w-xl w-full p-6 space-y-4 border-red-500">
            <h3 className="text-xl font-display font-bold text-white uppercase">Formal Case Accusation</h3>
            <form onSubmit={handleAccusation} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Accused Culprit</label>
                <select value={accuseSuspectId} onChange={(e) => setAccuseSuspectId(parseInt(e.target.value, 10))} className="w-full bg-vault-surface border border-vault-border p-2 rounded text-white">
                  {data?.suspects?.map((s: any) => (
                    <option key={s.suspect_id} value={s.suspect_id}>{s.name} ({s.occupation})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Decisive Evidence</label>
                <select value={accuseEvidenceId} onChange={(e) => setAccuseEvidenceId(parseInt(e.target.value, 10))} className="w-full bg-vault-surface border border-vault-border p-2 rounded text-white">
                  {data?.evidence?.map((e: any) => (
                    <option key={e.evidence_id} value={e.evidence_id}>{e.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Stated Motive</label>
                <input type="text" required value={accuseMotive} onChange={(e) => setAccuseMotive(e.target.value)} placeholder="e.g. Financial extortion" className="w-full bg-vault-surface border border-vault-border p-2 rounded text-white font-sans text-sm" />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Reasoning</label>
                <textarea rows={3} required value={accuseReasoning} onChange={(e) => setAccuseReasoning(e.target.value)} placeholder="Provide timeline and circumstantial deduction..." className="w-full bg-vault-surface border border-vault-border p-2 rounded text-white font-sans text-sm" />
              </div>
              <div className="flex gap-3">
                <MindVaultButton type="submit" variant="danger" size="md" className="flex-1 justify-center">Deliver Formal Accusation</MindVaultButton>
                <MindVaultButton type="button" variant="ghost" size="md" onClick={() => setAccuseModalOpen(false)}>Cancel</MindVaultButton>
              </div>
            </form>
          </MindVaultCard>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync(path.join(__dirname, 'app', 'games', 'detective', 'page.tsx'), detPage);
console.log('Detective game page written successfully.');
