'use client';
import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export const RoomCode: React.FC<{ code: string }> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="group relative inline-flex items-center gap-2 bg-vault-surface hover:bg-vault-hover border border-vault-border hover:border-cyan-400/50 px-3.5 py-1.5 rounded transition-all select-none"
      title="Click to copy room code"
    >
      <span className="text-xs text-gray-400 font-mono">ROOM:</span>
      <span className="font-mono text-base font-bold text-cyan-400 tracking-wider group-hover:text-white">
        {code}
      </span>
      {copied ? (
        <Check className="w-4 h-4 text-emerald-400" />
      ) : (
        <Copy className="w-4 h-4 text-gray-400 group-hover:text-cyan-400" />
      )}
    </button>
  );
};
