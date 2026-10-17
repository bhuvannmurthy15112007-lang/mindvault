'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { getSocket } from '@/lib/socket/client';
import {
  Search,
  UserCheck,
  MapPin,
  FileText,
  Key,
  AlertCircle,
  Clock,
  Shield,
  Trophy,
  CheckCircle2,
  XCircle,
  Eye,
  BookOpen,
  MessageSquare,
  Send,
  ArrowRight,
  Sparkles,
  HelpCircle,
  FileQuestion
} from 'lucide-react';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';
import { DetectiveBriefing } from '@/components/games/DetectiveBriefing';

export default function DetectiveGamePage() {
  return (
    <React.Suspense
      fallback={
        <div className="text-center py-24 font-mono text-cyan-400 animate-pulse">
          OPENING DETECTIVE CASE FILE...
        </div>
      }
    >
      <DetectiveGameContent />
    </React.Suspense>
  );
}

function DetectiveGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = parseInt(searchParams.get('session') || '0', 10);
  const { token, dbUser } = useAuth();

  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    'suspects' | 'locations' | 'evidence' | 'clues' | 'timeline' | 'puzzles'
  >('suspects');
  const [cipherInputs, setCipherInputs] = useState<Record<number, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [inspectModal, setInspectModal] = useState<{
    title: string;
    subtitle?: string;
    content: string;
    type: 'suspect' | 'location' | 'evidence' | 'clue' | 'puzzle';
  } | null>(null);

  // Accusation Modal State
  const [accuseModalOpen, setAccuseModalOpen] = useState(false);
  const [accuseSuspectId, setAccuseSuspectId] = useState<number>(0);
  const [accuseMotive, setAccuseMotive] = useState('');
  const [accuseEvidenceId, setAccuseEvidenceId] = useState<number>(0);
  const [accuseReasoning, setAccuseReasoning] = useState('');
  const [submittingAccusation, setSubmittingAccusation] = useState(false);
  const [accusationError, setAccusationError] = useState('');

  // Live Notification Feed
  const [liveLog, setLiveLog] = useState<string[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchDetective = useCallback(async () => {
    if (!sessionId || !token) return;
    try {
      const res = await fetch('/api/games/detective/' + sessionId, {
        headers: { Authorization: 'Bearer ' + token }
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
        if (json.suspects && json.suspects.length > 0 && !accuseSuspectId) {
          setAccuseSuspectId(json.suspects[0].suspect_id);
        }
        if (json.evidence && json.evidence.length > 0 && !accuseEvidenceId) {
          setAccuseEvidenceId(json.evidence[0].evidence_id);
        }
      }
    } catch (e) {
      console.error('[Detective] fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [sessionId, token, accuseSuspectId, accuseEvidenceId]);

  useEffect(() => {
    fetchDetective();
    const interval = setInterval(fetchDetective, 4000);

    const socket = getSocket(token || undefined);
    socket.connect();
    socket.emit('session:join', { sessionId, user: dbUser });

    socket.on('detective:action_taken', (evt: any) => {
      setLiveLog((prev) => [
        `[${new Date().toLocaleTimeString()}] ${evt.displayName} performed an investigation action.`,
        ...prev.slice(0, 15)
      ]);
      fetchDetective();
    });

    socket.on('detective:player_accused', (evt: any) => {
      setLiveLog((prev) => [
        `[${new Date().toLocaleTimeString()}] ${evt.displayName} submitted their formal accusation!`,
        ...prev.slice(0, 15)
      ]);
      fetchDetective();
    });

    socket.on('room:chat_message', (msg: any) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    return () => {
      clearInterval(interval);
      socket.off('detective:action_taken');
      socket.off('detective:player_accused');
      socket.off('room:chat_message');
    };
  }, [sessionId, token, dbUser, fetchDetective]);

  // Execute Investigation Action
  const handleAction = async (actionType: string, targetId: number, answer?: string) => {
    if (!token) return;
    const actionKey = `${actionType}_${targetId}`;
    setActionLoading(actionKey);

    try {
      const res = await fetch('/api/games/detective/' + sessionId + '/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({ actionType, targetId, answer })
      });
      const resData = await res.json();
      if (res.ok) {
        setInspectModal({
          title: 'Investigation Discovery',
          subtitle: `Action: ${actionType.replace('_', ' ')}`,
          content: resData.summary,
          type: 'evidence'
        });
        fetchDetective();
      } else {
        alert(resData.error || 'Action failed');
      }
    } catch (e: any) {
      alert(e.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  // Submit Formal Accusation
  const handleAccusation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || submittingAccusation) return;

    if (!accuseMotive.trim() || !accuseReasoning.trim()) {
      setAccusationError('Please provide both the stated motive and deduction reasoning.');
      return;
    }

    setSubmittingAccusation(true);
    setAccusationError('');

    try {
      const res = await fetch('/api/games/detective/' + sessionId + '/accuse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify({
          suspectId: accuseSuspectId,
          motive: accuseMotive.trim(),
          evidenceId: accuseEvidenceId,
          reasoning: accuseReasoning.trim()
        })
      });
      const resData = await res.json();
      if (res.ok) {
        setAccuseModalOpen(false);
        fetchDetective();
      } else {
        setAccusationError(resData.error || 'Accusation failed');
      }
    } catch (e: any) {
      setAccusationError(e.message || 'Accusation failed');
    } finally {
      setSubmittingAccusation(false);
    }
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const socket = getSocket();
    socket.emit('room:chat', {
      roomCode: 'session_' + sessionId,
      message: chatInput.trim(),
      user: dbUser
    });
    setChatInput('');
  };

  if (!sessionId) {
    return <DetectiveBriefing />;
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-4">
        <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-400 rounded-full animate-spin" />
        <div className="font-mono text-red-400 text-sm tracking-wider animate-pulse">
          OPENING CONFIDENTIAL DOSSIER...
        </div>
      </div>
    );
  }

  const detSession = data?.detectiveSession;
  const myAccusation = data?.myAccusation;
  const solution = data?.solutionRevelation;
  const suspects = data?.suspects || [];
  const locations = data?.locations || [];
  const evidence = data?.evidence || [];
  const timeline = data?.timeline || [];
  const puzzles = data?.puzzles || [];
  const discoveredClues = data?.discoveredClues || [];
  const myDiscoveries = data?.myDiscoveries || [];
  const players = data?.players || [];
  const userBudget = detSession?.userRemainingBudget || 0;

  // Set of discovered target IDs for quick lookup
  const discoveredSet = new Set(myDiscoveries.map((d: any) => `${d.discovery_type}_${d.target_id}`));

  return (
    <div className="space-y-6 py-4 animate-fadeIn">
      {/* Top Dossier Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-gradient-to-r from-red-950/60 via-vault-card to-vault-surface border border-red-500/30 p-6 rounded-xl shadow-xl">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono bg-red-500/20 text-red-300 border border-red-500/40 px-2.5 py-0.5 rounded font-bold">
              CASE #{detSession?.case_id || 1} • {detSession?.difficulty || 'MEDIUM'}
            </span>
            <span className="text-xs font-mono bg-vault-surface text-gray-300 border border-vault-border px-2.5 py-0.5 rounded flex items-center gap-1">
              <MapPin className="w-3 h-3 text-red-400" />
              {detSession?.incident_location || 'Classified Facility'}
            </span>
            <span className="text-xs font-mono bg-vault-surface text-gray-300 border border-vault-border px-2.5 py-0.5 rounded flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              {detSession?.incident_time || 'Midnight'}
            </span>
          </div>

          <h1 className="text-3xl font-display font-black text-white uppercase tracking-wider">
            {detSession?.title || 'Classified Mystery'}
          </h1>
          <p className="text-xs text-gray-300 font-sans leading-relaxed">
            {detSession?.synopsis}
          </p>
        </div>

        {/* Action Budget & Accuse Button */}
        <div className="flex flex-row lg:flex-col items-center justify-between w-full lg:w-auto gap-4 bg-vault-surface/80 border border-vault-border p-4 rounded-xl text-center">
          <div>
            <div className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
              Your Investigation Budget
            </div>
            <div className="text-3xl font-mono font-bold text-red-400 tracking-tight">
              {userBudget}{' '}
              <span className="text-xs text-gray-500 font-normal">/ {detSession?.investigation_budget || 100}</span>
            </div>
          </div>

          {!myAccusation ? (
            <MindVaultButton
              variant="danger"
              size="md"
              onClick={() => setAccuseModalOpen(true)}
              className="w-full justify-center shadow-glow-red/20"
            >
              <AlertCircle className="w-4 h-4 mr-1.5" />
              Deliver Accusation
            </MindVaultButton>
          ) : (
            <div className="text-xs font-mono text-emerald-400 border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 rounded flex items-center gap-1.5 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Accusation Delivered
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* CASE RESOLUTION BANNER (When User Submitted Accusation) */}
      {/* ======================================================== */}
      {myAccusation && (
        <div
          className={`p-6 rounded-xl border space-y-4 shadow-2xl animate-fadeIn ${
            myAccusation.is_correct
              ? 'border-emerald-500/50 bg-gradient-to-r from-emerald-950/40 via-vault-card to-vault-surface'
              : 'border-red-500/50 bg-gradient-to-r from-red-950/40 via-vault-card to-vault-surface'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-vault-border pb-3">
            <div className="flex items-center gap-3">
              {myAccusation.is_correct ? (
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500 flex items-center justify-center text-red-400">
                  <XCircle className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-display font-bold text-white uppercase">
                  {myAccusation.is_correct ? 'Case Solved: True Culprit Identified!' : 'Accusation Concluded: Incomplete Solve'}
                </h3>
                <p className="text-xs font-mono text-gray-300">
                  {myAccusation.is_correct
                    ? 'Your deduction successfully established the culprit, motive, and evidence chain.'
                    : 'Your accusation missed key forensic links, but your investigation log has been permanently recorded.'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-cyan-400">
                {myAccusation.final_score} / 120 PTS
              </div>
              <div className="text-[10px] font-mono text-gray-400">Authoritative Score</div>
            </div>
          </div>

          {/* Score Breakdown Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
            <div className="bg-black/40 p-3 rounded-lg border border-vault-border">
              <div className="text-[10px] text-gray-400">Culprit</div>
              <div className="text-base font-bold text-white">{myAccusation.suspect_score} / 40 pts</div>
            </div>
            <div className="bg-black/40 p-3 rounded-lg border border-vault-border">
              <div className="text-[10px] text-gray-400">Motive</div>
              <div className="text-base font-bold text-white">{myAccusation.motive_score} / 25 pts</div>
            </div>
            <div className="bg-black/40 p-3 rounded-lg border border-vault-border">
              <div className="text-[10px] text-gray-400">Evidence</div>
              <div className="text-base font-bold text-white">{myAccusation.evidence_score} / 20 pts</div>
            </div>
            <div className="bg-black/40 p-3 rounded-lg border border-vault-border">
              <div className="text-[10px] text-gray-400">Reasoning</div>
              <div className="text-base font-bold text-white">{myAccusation.reasoning_score} / 15 pts</div>
            </div>
            <div className="bg-black/40 p-3 rounded-lg border border-vault-border">
              <div className="text-[10px] text-gray-400">Efficiency Bonus</div>
              <div className="text-base font-bold text-emerald-400">+{myAccusation.efficiency_bonus} pts</div>
            </div>
          </div>

          {/* Solution Revelation */}
          {solution && (
            <div className="p-4 rounded-lg bg-black/50 border border-vault-border space-y-2 text-xs">
              <div className="font-display font-bold uppercase text-amber-300 text-sm">
                Confidential Case Resolution Dossier
              </div>
              <div className="text-gray-300">
                <span className="font-bold text-white">True Culprit:</span> {solution.culpritName}
              </div>
              <div className="text-gray-300">
                <span className="font-bold text-white">Established Motive:</span> {solution.motive}
              </div>
              <div className="text-gray-300">
                <span className="font-bold text-white">Critical Evidence:</span> {solution.criticalEvidenceSummary}
              </div>
              <div className="text-gray-300 font-sans leading-relaxed pt-1 border-t border-vault-border">
                <span className="font-bold text-white">Case Summary:</span> {solution.explanation}
              </div>
            </div>
          )}

          {/* Navigation Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link href="/games" className="w-full sm:w-auto">
              <MindVaultButton variant="ghost" size="md" className="w-full justify-center">
                Return to Games
              </MindVaultButton>
            </Link>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link href="/leaderboard" className="flex-1 sm:flex-initial">
                <MindVaultButton variant="secondary" size="md" className="w-full justify-center">
                  <Trophy className="w-4 h-4 mr-1.5" />
                  View Leaderboards
                </MindVaultButton>
              </Link>
              <Link href="/rooms/create?game=DETECTIVE" className="flex-1 sm:flex-initial">
                <MindVaultButton variant="primary" size="md" className="w-full justify-center">
                  Investigate Another Case
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </MindVaultButton>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="flex border-b border-vault-border gap-2 overflow-x-auto pb-1">
        {[
          { key: 'suspects', label: `Suspects (${suspects.length})`, icon: UserCheck },
          { key: 'locations', label: `Locations (${locations.length})`, icon: MapPin },
          { key: 'evidence', label: `Evidence (${evidence.length})`, icon: FileText },
          { key: 'clues', label: `Discovered Clues (${discoveredClues.length})`, icon: Sparkles },
          { key: 'timeline', label: `Timeline (${timeline.length})`, icon: Clock },
          { key: 'puzzles', label: `Forensic Ciphers (${puzzles.length})`, icon: Key },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`px-4 py-2.5 text-xs font-display font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-red-400 text-red-400 bg-red-500/10'
                  : 'border-transparent text-gray-400 hover:text-white hover:bg-vault-card/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB CONTENT */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Investigation Files */}
        <div className="lg:col-span-2 space-y-4">
          {/* 1. SUSPECTS */}
          {activeTab === 'suspects' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {suspects.map((s: any) => {
                const isInterrogated = discoveredSet.has(`SUSPECT_STATEMENT_${s.suspect_id}`);
                const isWorking = actionLoading === `INTERROGATE_${s.suspect_id}`;

                return (
                  <MindVaultCard key={s.suspect_id} className="p-5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-display font-bold text-white text-base">{s.name}</h4>
                          <span className="text-[11px] font-mono text-cyan-400">{s.occupation}</span>
                        </div>
                        {isInterrogated && (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                            INTERROGATED
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-300 leading-relaxed font-sans">{s.background}</p>

                      <div className="bg-black/40 p-2.5 rounded border border-vault-border text-xs font-mono text-gray-400">
                        <span className="text-gray-400 font-bold">Stated Alibi:</span>{' '}
                        <span className="text-gray-200">{s.alibi}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-vault-border flex gap-2">
                      <MindVaultButton
                        variant={isInterrogated ? 'secondary' : 'primary'}
                        size="sm"
                        isLoading={isWorking}
                        disabled={userBudget < (s.interrogation_cost || 10) || !!myAccusation}
                        onClick={() => handleAction('INTERROGATE', s.suspect_id)}
                        className="flex-1 justify-center"
                      >
                        {isInterrogated ? 'Re-interrogate' : `Interrogate (-${s.interrogation_cost || 10} pts)`}
                      </MindVaultButton>

                      {isInterrogated && (
                        <MindVaultButton
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setInspectModal({
                              title: `Suspect Testimony: ${s.name}`,
                              subtitle: s.occupation,
                              content: s.alibi,
                              type: 'suspect'
                            })
                          }
                          className="px-2.5"
                          title="Inspect Testimony"
                        >
                          <Eye className="w-4 h-4" />
                        </MindVaultButton>
                      )}
                    </div>
                  </MindVaultCard>
                );
              })}
            </div>
          )}

          {/* 2. LOCATIONS */}
          {activeTab === 'locations' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {locations.map((loc: any) => {
                const isSearched = discoveredSet.has(`LOCATION_SEARCH_${loc.location_id}`);
                const isWorking = actionLoading === `SEARCH_LOCATION_${loc.location_id}`;

                return (
                  <MindVaultCard key={loc.location_id} className="p-5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-display font-bold text-white text-base flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-red-400" />
                          {loc.name}
                        </h4>
                        {isSearched && (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                            SEARCHED
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-300 leading-relaxed font-sans">{loc.description}</p>
                    </div>

                    <div className="pt-2 border-t border-vault-border flex gap-2">
                      <MindVaultButton
                        variant={isSearched ? 'secondary' : 'primary'}
                        size="sm"
                        isLoading={isWorking}
                        disabled={userBudget < (loc.action_cost || 10) || !!myAccusation}
                        onClick={() => handleAction('SEARCH_LOCATION', loc.location_id)}
                        className="flex-1 justify-center"
                      >
                        {isSearched ? 'Search Again' : `Search Site (-${loc.action_cost || 10} pts)`}
                      </MindVaultButton>

                      {isSearched && (
                        <MindVaultButton
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setInspectModal({
                              title: `Location Log: ${loc.name}`,
                              content: loc.description,
                              type: 'location'
                            })
                          }
                          className="px-2.5"
                          title="Examine Site Findings"
                        >
                          <Eye className="w-4 h-4" />
                        </MindVaultButton>
                      )}
                    </div>
                  </MindVaultCard>
                );
              })}
            </div>
          )}

          {/* 3. EVIDENCE */}
          {activeTab === 'evidence' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {evidence.map((ev: any) => {
                const isAnalyzed = discoveredSet.has(`EVIDENCE_${ev.evidence_id}`);
                const isWorking = actionLoading === `ANALYZE_EVIDENCE_${ev.evidence_id}`;

                return (
                  <MindVaultCard key={ev.evidence_id} className="p-5 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-display font-bold text-white text-base flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-cyan-400" />
                          {ev.title}
                        </h4>
                        {isAnalyzed && (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                            ANALYZED
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-gray-300 leading-relaxed font-sans">{ev.description}</p>
                    </div>

                    <div className="pt-2 border-t border-vault-border flex gap-2">
                      <MindVaultButton
                        variant={isAnalyzed ? 'secondary' : 'primary'}
                        size="sm"
                        isLoading={isWorking}
                        disabled={userBudget < (ev.analysis_cost || 15) || !!myAccusation}
                        onClick={() => handleAction('ANALYZE_EVIDENCE', ev.evidence_id)}
                        className="flex-1 justify-center"
                      >
                        {isAnalyzed ? 'Re-analyze' : `Forensic Analysis (-${ev.analysis_cost || 15} pts)`}
                      </MindVaultButton>

                      <MindVaultButton
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setInspectModal({
                            title: `Evidence File: ${ev.title}`,
                            content: ev.description,
                            type: 'evidence'
                          })
                        }
                        className="px-2.5"
                        title="View Evidence Details"
                      >
                        <Eye className="w-4 h-4" />
                      </MindVaultButton>
                    </div>
                  </MindVaultCard>
                );
              })}
            </div>
          )}

          {/* 4. DISCOVERED CLUES */}
          {activeTab === 'clues' && (
            <div className="space-y-3">
              {discoveredClues.length === 0 ? (
                <MindVaultCard className="p-12 text-center space-y-3">
                  <FileQuestion className="w-10 h-10 text-gray-500 mx-auto" />
                  <h4 className="font-display font-bold text-white text-base">No Clues Discovered Yet</h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto font-mono">
                    Interrogate suspects, analyze physical evidence, search locations, or decode forensic ciphers to unlock investigative clues.
                  </p>
                </MindVaultCard>
              ) : (
                discoveredClues.map((c: any) => (
                  <MindVaultCard key={c.clue_id} className="p-4 space-y-2 border-purple-500/40 bg-purple-950/10">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="font-display font-bold text-white text-sm">Investigative Clue #{c.clue_id}</span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-400">
                        {new Date(c.discovered_at).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-xs text-purple-200 font-mono leading-relaxed bg-black/40 p-3 rounded border border-purple-500/20">
                      {c.clue_text}
                    </p>

                    {c.deduction_notes && (
                      <div className="text-[11px] text-gray-300 font-sans">
                        <span className="font-bold text-cyan-300">Deduction:</span> {c.deduction_notes}
                      </div>
                    )}
                  </MindVaultCard>
                ))
              )}
            </div>
          )}

          {/* 5. TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-3">
              {timeline.map((t: any) => {
                const isChecked = discoveredSet.has(`TIMELINE_EVENT_${t.event_id}`);
                const isWorking = actionLoading === `CHECK_TIMELINE_${t.event_id}`;

                return (
                  <div
                    key={t.event_id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-vault-card border border-vault-border"
                  >
                    <div className="flex items-start gap-4">
                      <span className="font-mono text-cyan-400 font-bold text-xs whitespace-nowrap bg-vault-surface px-2.5 py-1 rounded border border-vault-border">
                        {t.timestamp_label}
                      </span>
                      <p className="text-xs text-gray-200 font-sans leading-relaxed">{t.event_description}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <MindVaultButton
                        variant={isChecked ? 'secondary' : 'ghost'}
                        size="sm"
                        isLoading={isWorking}
                        disabled={userBudget < 5 || !!myAccusation}
                        onClick={() => handleAction('CHECK_TIMELINE', t.event_id)}
                      >
                        {isChecked ? 'Verified' : 'Check Log (-5 pts)'}
                      </MindVaultButton>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 6. PUZZLES */}
          {activeTab === 'puzzles' && (
            <div className="space-y-4">
              {puzzles.map((pz: any) => {
                const isSolved = discoveredSet.has(`PUZZLE_UNLOCKED_${pz.puzzle_id}`);
                const isWorking = actionLoading === `SOLVE_PUZZLE_${pz.puzzle_id}`;
                const inputVal = cipherInputs[pz.puzzle_id] || '';

                return (
                  <MindVaultCard key={pz.puzzle_id} className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Key className="w-5 h-5 text-amber-400" />
                        <h4 className="font-display font-bold text-white text-base">Forensic Cipher #{pz.puzzle_id}</h4>
                      </div>
                      {isSolved && (
                        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded font-bold">
                          DECRYPTED
                        </span>
                      )}
                    </div>

                    <div className="bg-black/50 p-4 rounded-xl border border-vault-border font-mono text-sm text-cyan-300">
                      {pz.prompt}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-amber-300 bg-amber-500/10 p-2.5 rounded border border-amber-500/20">
                      <HelpCircle className="w-4 h-4 flex-shrink-0" />
                      <span>Forensic Clue Hint: {pz.hint}</span>
                    </div>

                    {!isSolved && !myAccusation && (
                      <div className="flex gap-2 pt-2">
                        <input
                          type="text"
                          value={inputVal}
                          onChange={(e) =>
                            setCipherInputs((prev) => ({ ...prev, [pz.puzzle_id]: e.target.value }))
                          }
                          placeholder="Enter deciphered plaintext..."
                          className="flex-1 bg-vault-surface border border-vault-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-red-400 font-mono"
                        />
                        <MindVaultButton
                          variant="primary"
                          size="md"
                          isLoading={isWorking}
                          disabled={!inputVal.trim() || userBudget < (pz.action_cost || 20)}
                          onClick={() => handleAction('SOLVE_PUZZLE', pz.puzzle_id, inputVal)}
                        >
                          Verify Key (-{pz.action_cost || 20} pts)
                        </MindVaultButton>
                      </div>
                    )}
                  </MindVaultCard>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Col: Live Comms & Investigation Activity */}
        <div className="space-y-4">
          {/* Live Action Activity Feed */}
          <MindVaultCard className="p-4 space-y-3">
            <h3 className="font-display font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Live Investigation Activity
            </h3>

            <div className="space-y-1.5 max-h-40 overflow-y-auto font-mono text-[11px] text-gray-400 pr-1">
              {liveLog.length === 0 ? (
                <div className="text-gray-500 text-center py-6 text-xs">Waiting for field transmissions...</div>
              ) : (
                liveLog.map((log, i) => (
                  <div key={i} className="p-1.5 rounded bg-vault-surface/40 border border-vault-border/50">
                    {log}
                  </div>
                ))
              )}
            </div>
          </MindVaultCard>

          {/* Room Live Comms / Chat */}
          <MindVaultCard className="p-4 flex flex-col h-[340px]">
            <div className="border-b border-vault-border pb-2 mb-2 flex items-center justify-between">
              <h3 className="font-display font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-red-400" />
                Detective Comms
              </h3>
              <span className="text-[10px] font-mono text-gray-500">{players.length} agents</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
              {chatMessages.length === 0 ? (
                <div className="text-gray-500 text-center py-12 text-xs">Secure channel online. Share findings manually.</div>
              ) : (
                chatMessages.map((m) => (
                  <div key={m.id} className="bg-vault-surface/60 border border-vault-border/50 rounded p-2">
                    <div className="flex items-center justify-between text-[10px] text-gray-400 mb-0.5">
                      <span className="text-cyan-400 font-bold">{m.user?.displayName || 'Agent'}</span>
                      <span>{m.timestamp}</span>
                    </div>
                    <div className="text-gray-200">{m.message}</div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendChat} className="flex gap-2 pt-2 border-t border-vault-border mt-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Send dispatch..."
                className="flex-1 bg-vault-surface border border-vault-border rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-red-400 font-sans"
              />
              <MindVaultButton type="submit" variant="primary" size="sm">
                <Send className="w-3.5 h-3.5" />
              </MindVaultButton>
            </form>
          </MindVaultCard>

          {/* Connected Investigators */}
          <MindVaultCard className="p-4 space-y-2">
            <h4 className="text-xs font-display font-bold uppercase tracking-wider text-gray-300">
              Field Investigators ({players.length})
            </h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {players.map((p: any) => (
                <div key={p.user_id} className="flex items-center justify-between p-2 rounded bg-vault-surface/40 border border-vault-border text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-vault-card border border-vault-border flex items-center justify-center font-bold text-[10px] text-white">
                      {p.display_name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-200 font-sans text-xs">{p.display_name}</span>
                  </div>
                  {p.has_accused ? (
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> ACCUSED
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-500">INVESTIGATING</span>
                  )}
                </div>
              ))}
            </div>
          </MindVaultCard>
        </div>
      </div>

      {/* ======================================================== */}
      {/* FORMAL ACCUSATION MODAL */}
      {/* ======================================================== */}
      {accuseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fadeIn">
          <MindVaultCard className="max-w-2xl w-full p-6 space-y-4 border-red-500 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-vault-border pb-3">
              <span className="text-xs font-mono uppercase tracking-widest text-red-400 font-bold">
                FINAL PROCEEDINGS
              </span>
              <h3 className="text-2xl font-display font-black text-white uppercase mt-0.5">
                Deliver Formal Case Accusation
              </h3>
              <p className="text-xs text-gray-300 font-sans mt-1">
                Your accusation will be authoritatively validated. Scoring: Culprit (40 pts), Motive (25 pts), Supporting Evidence (20 pts), Reasoning (15 pts), Efficiency Bonus (up to 20 pts). Max 120 pts.
              </p>
            </div>

            {accusationError && (
              <div className="p-3 bg-red-500/20 border border-red-500 text-red-300 text-xs font-mono rounded">
                {accusationError}
              </div>
            )}

            <form onSubmit={handleAccusation} className="space-y-4 font-mono text-xs">
              {/* Suspect Selection */}
              <div>
                <label className="block text-gray-300 uppercase tracking-wider mb-1.5 font-bold">
                  1. The Suspected Culprit (40 pts)
                </label>
                <select
                  value={accuseSuspectId}
                  onChange={(e) => setAccuseSuspectId(parseInt(e.target.value, 10))}
                  className="w-full bg-vault-surface border border-vault-border rounded-lg p-2.5 text-white font-sans text-sm focus:outline-none focus:border-red-400"
                >
                  {suspects.map((s: any) => (
                    <option key={s.suspect_id} value={s.suspect_id}>
                      {s.name} — {s.occupation}
                    </option>
                  ))}
                </select>
              </div>

              {/* Decisive Evidence Selection */}
              <div>
                <label className="block text-gray-300 uppercase tracking-wider mb-1.5 font-bold">
                  2. Decisive Supporting Evidence (20 pts)
                </label>
                <select
                  value={accuseEvidenceId}
                  onChange={(e) => setAccuseEvidenceId(parseInt(e.target.value, 10))}
                  className="w-full bg-vault-surface border border-vault-border rounded-lg p-2.5 text-white font-sans text-sm focus:outline-none focus:border-red-400"
                >
                  {evidence.map((e: any) => (
                    <option key={e.evidence_id} value={e.evidence_id}>
                      {e.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Motive Input */}
              <div>
                <label className="block text-gray-300 uppercase tracking-wider mb-1.5 font-bold">
                  3. Stated Motive (25 pts)
                </label>
                <input
                  type="text"
                  required
                  value={accuseMotive}
                  onChange={(e) => setAccuseMotive(e.target.value)}
                  placeholder="Explain why the culprit committed the crime (e.g. Black market debt, corporate espionage)..."
                  className="w-full bg-vault-surface border border-vault-border rounded-lg p-2.5 text-white font-sans text-sm focus:outline-none focus:border-red-400"
                />
              </div>

              {/* Reasoning Textarea */}
              <div>
                <label className="block text-gray-300 uppercase tracking-wider mb-1.5 font-bold">
                  4. Timeline & Circumstantial Explanation (15 pts)
                </label>
                <textarea
                  rows={4}
                  required
                  value={accuseReasoning}
                  onChange={(e) => setAccuseReasoning(e.target.value)}
                  placeholder="Demonstrate how the evidence contradicts the alibi and proves the opportunity at the incident time/location..."
                  className="w-full bg-vault-surface border border-vault-border rounded-lg p-2.5 text-white font-sans text-sm focus:outline-none focus:border-red-400"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <MindVaultButton
                  type="submit"
                  variant="danger"
                  size="lg"
                  isLoading={submittingAccusation}
                  className="flex-1 justify-center shadow-glow-red/20"
                >
                  Submit Authoritative Accusation
                </MindVaultButton>
                <MindVaultButton
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => setAccuseModalOpen(false)}
                >
                  Cancel
                </MindVaultButton>
              </div>
            </form>
          </MindVaultCard>
        </div>
      )}

      {/* ======================================================== */}
      {/* INSPECTION DISCOVERY MODAL */}
      {/* ======================================================== */}
      {inspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fadeIn">
          <MindVaultCard className="max-w-lg w-full p-6 space-y-4 border-cyan-500 shadow-2xl">
            <div className="border-b border-vault-border pb-3 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-display font-bold text-white uppercase">{inspectModal.title}</h3>
                {inspectModal.subtitle && (
                  <span className="text-xs font-mono text-cyan-400">{inspectModal.subtitle}</span>
                )}
              </div>
              <button
                onClick={() => setInspectModal(null)}
                className="text-gray-400 hover:text-white p-1 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-black/60 border border-vault-border font-mono text-xs text-gray-200 leading-relaxed max-h-80 overflow-y-auto">
              {inspectModal.content}
            </div>

            <div className="flex justify-end">
              <MindVaultButton variant="secondary" size="sm" onClick={() => setInspectModal(null)}>
                Close Dossier
              </MindVaultButton>
            </div>
          </MindVaultCard>
        </div>
      )}
    </div>
  );
}
