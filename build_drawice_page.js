const fs = require('fs');
const path = require('path');

const drawicePage = `'use client';
import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { getSocket } from '@/lib/socket/client';
import { Palette, Send, Trash2 } from 'lucide-react';
import { MindVaultButton } from '@/components/ui/MindVaultButton';
import { MindVaultCard } from '@/components/ui/MindVaultCard';
import { Timer } from '@/components/ui/Timer';

export default function DrawiceGamePage() {
  const searchParams = useSearchParams();
  const sessionId = parseInt(searchParams.get('session') || '0', 10);
  const { token, dbUser } = useAuth();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [data, setData] = useState<any>(null);
  const [wordChoices, setWordChoices] = useState<any[]>([]);
  const [guessInput, setGuessInput] = useState('');
  const [selectedColor, setSelectedColor] = useState('#00F0FF');
  const [brushSize, setBrushSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [guesses, setGuesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDrawice = async () => {
    if (!sessionId || !token) return;
    try {
      const res = await fetch('/api/games/drawice/' + sessionId, {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
        setGuesses(json.guesses || []);
        if (json.round?.isArtist && json.round?.status === 'CHOOSING') {
          fetchWordChoices();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchWordChoices = async () => {
    if (!token) return;
    const res = await fetch('/api/games/drawice/' + sessionId + '/word-choices', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const json = await res.json();
    if (res.ok) setWordChoices(json.choices || []);
  };

  useEffect(() => {
    fetchDrawice();
    const interval = setInterval(fetchDrawice, 3000);

    const socket = getSocket(token || undefined);
    socket.connect();
    socket.emit('session:join', { sessionId, user: dbUser });

    socket.on('drawice:stroke', (stroke: any) => drawRemoteStroke(stroke));
    socket.on('drawice:clear', () => clearCanvasLocally());
    socket.on('drawice:round_reveal', () => fetchDrawice());

    return () => {
      clearInterval(interval);
      socket.off('drawice:stroke');
      socket.off('drawice:clear');
      socket.off('drawice:round_reveal');
    };
  }, [sessionId, token]);

  const drawRemoteStroke = (stroke: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(stroke.x0, stroke.y0);
    ctx.lineTo(stroke.x1, stroke.y1);
    ctx.stroke();
  };

  const clearCanvasLocally = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSelectWord = async (wordId: number) => {
    if (!token) return;
    await fetch('/api/games/drawice/' + sessionId + '/select-word', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ wordId })
    });
    fetchDrawice();
  };

  const handleSendGuess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim() || !token) return;
    try {
      const res = await fetch('/api/games/drawice/' + sessionId + '/guess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({ guessText: guessInput.trim() })
      });
      if (res.ok) {
        setGuessInput('');
        fetchDrawice();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const startDrawing = (e: any) => {
    if (!data?.round?.isArtist || data?.round?.status !== 'DRAWING') return;
    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    lastPos.current = { x: clientX - rect.left, y: clientY - rect.top };
  };

  const draw = (e: any) => {
    if (!isDrawing || !lastPos.current || !data?.round?.isArtist) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const currentX = clientX - rect.left;
    const currentY = clientY - rect.top;

    const stroke = {
      x0: lastPos.current.x,
      y0: lastPos.current.y,
      x1: currentX,
      y1: currentY,
      color: selectedColor,
      size: brushSize
    };

    drawRemoteStroke(stroke);
    const socket = getSocket();
    socket.emit('drawice:stroke', { sessionId, strokeData: stroke });
    lastPos.current = { x: currentX, y: currentY };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  if (loading) return <div className="text-center py-20 font-mono text-cyan-400">Loading Drawing Studio...</div>;

  const isArtist = data?.round?.isArtist;
  const status = data?.round?.status;

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-950/40 via-vault-card to-vault-surface border border-purple-500/30 p-6 rounded-xl">
        <div>
          <span className="text-xs font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 rounded">
            ROUND {data?.round?.round_number || 1} • {isArtist ? 'YOU ARE THE ARTIST' : 'ARTIST: ' + data?.round?.artist_name}
          </span>
          <h1 className="text-3xl font-display font-black text-white uppercase tracking-wider mt-1">
            Drawice Studio
          </h1>
          {isArtist && data?.round?.secretWord && (
            <div className="mt-1 font-mono text-xs text-cyan-400 font-bold">
              YOUR SECRET WORD: <span className="text-white text-base bg-cyan-500/20 px-2 py-0.5 rounded border border-cyan-400">{data?.round?.secretWord}</span>
            </div>
          )}
        </div>
        <Timer secondsRemaining={60} totalSeconds={60} label="STUDIO ROUND" />
      </div>

      {isArtist && status === 'CHOOSING' && (
        <MindVaultCard className="p-8 text-center space-y-6 border-purple-500 max-w-xl mx-auto">
          <h2 className="text-2xl font-display font-bold text-white uppercase">Choose Your Secret Word</h2>
          <p className="text-xs text-gray-300 font-mono">Only you will see this word choice.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {wordChoices.map((w) => (
              <MindVaultButton key={w.id} variant="primary" size="md" onClick={() => handleSelectWord(w.id)}>
                {w.word}
              </MindVaultButton>
            ))}
          </div>
        </MindVaultCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {isArtist && (
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-vault-card border border-vault-border rounded-lg">
              <div className="flex items-center gap-2">
                {['#00F0FF', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#FFFFFF'].map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    style={{ backgroundColor: c }}
                    className={'w-6 h-6 rounded-full border-2 transition-transform ' + (selectedColor === c ? 'scale-125 border-white' : 'border-transparent')}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-400">Size:</span>
                {[2, 4, 8, 14].map((s) => (
                  <button
                    key={s}
                    onClick={() => setBrushSize(s)}
                    className={'px-2 py-1 text-xs font-mono rounded ' + (brushSize === s ? 'bg-cyan-500 text-black font-bold' : 'bg-vault-surface text-gray-300')}
                  >
                    {s}px
                  </button>
                ))}
              </div>
              <button
                onClick={() => {
                  clearCanvasLocally();
                  const socket = getSocket();
                  socket.emit('drawice:clear', { sessionId });
                }}
                className="p-1.5 text-gray-400 hover:text-red-400 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="relative w-full aspect-[4/3] bg-vault-dark border-2 border-vault-border rounded-xl overflow-hidden shadow-2xl">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-full cursor-crosshair touch-none"
            />
          </div>
        </div>

        <div className="space-y-4">
          <MindVaultCard className="p-4 flex flex-col h-[520px]">
            <div className="border-b border-vault-border pb-3 mb-2 flex items-center justify-between">
              <h3 className="font-display font-bold text-white text-sm uppercase tracking-wider">Guess Feed</h3>
              <span className="text-[10px] font-mono text-gray-400">1st=10, 2nd=9...</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
              {guesses.length === 0 ? (
                <div className="text-gray-500 text-center py-16">Private guess channel active.</div>
              ) : (
                guesses.map((g) => (
                  <div key={g.guess_id} className={'p-2.5 rounded border flex items-center justify-between ' + (g.is_correct ? 'border-emerald-500 bg-emerald-950/20 text-emerald-300' : 'border-vault-border bg-vault-surface text-gray-300')}>
                    <div>
                      <span className="font-bold text-gray-200">{g.display_name}: </span>
                      <span>{g.guess_text}</span>
                    </div>
                    {g.is_correct && <span className="font-bold text-emerald-400">+{g.points_awarded} pts</span>}
                  </div>
                ))
              )}
            </div>

            {!isArtist && status === 'DRAWING' && (
              <form onSubmit={handleSendGuess} className="flex gap-2 pt-3 border-t border-vault-border mt-2">
                <input
                  type="text"
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  placeholder="Type guess..."
                  className="flex-1 bg-vault-surface border border-vault-border rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-400 font-sans"
                />
                <MindVaultButton type="submit" variant="primary" size="sm">
                  <Send className="w-3.5 h-3.5" />
                </MindVaultButton>
              </form>
            )}
          </MindVaultCard>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(path.join(__dirname, 'app', 'games', 'drawice', 'page.tsx'), drawicePage);
console.log('Drawice game page written successfully.');
