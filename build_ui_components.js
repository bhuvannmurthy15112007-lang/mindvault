const fs = require('fs');
const path = require('path');

// 1. MindVaultButton.tsx
const btn = `'use client';
import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'emerald' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const MindVaultButton: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  ...props
}) => {
  const base = "relative inline-flex items-center justify-center font-display font-medium uppercase tracking-wider transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-vault-dark disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-sm",
    md: "px-5 py-2.5 text-sm rounded-sm",
    lg: "px-7 py-3.5 text-base rounded-md"
  };

  const variants = {
    primary: "bg-cyan-500/10 border border-cyan-400 text-cyan-300 hover:bg-cyan-400 hover:text-black hover:shadow-glow-cyan focus:ring-cyan-400",
    secondary: "bg-vault-card border border-vault-border text-gray-200 hover:border-gray-400 hover:bg-vault-hover focus:ring-gray-400",
    danger: "bg-red-500/10 border border-red-500 text-red-400 hover:bg-red-500 hover:text-white hover:shadow-glow-crimson focus:ring-red-500",
    emerald: "bg-emerald-500/10 border border-emerald-400 text-emerald-300 hover:bg-emerald-400 hover:text-black hover:shadow-glow-emerald focus:ring-emerald-400",
    amber: "bg-amber-500/10 border border-amber-400 text-amber-300 hover:bg-amber-400 hover:text-black hover:shadow-glow-amber focus:ring-amber-400",
    ghost: "bg-transparent text-gray-400 hover:text-white hover:bg-vault-card/50"
  };

  return (
    <button
      className={clsx(base, sizes[size], variants[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Processing...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
`;
fs.writeFileSync(path.join(__dirname, 'components', 'ui', 'MindVaultButton.tsx'), btn);

// 2. MindVaultCard.tsx
const card = `'use client';
import React from 'react';
import clsx from 'clsx';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: 'cyan' | 'emerald' | 'crimson' | 'amber' | 'purple' | 'none';
  interactive?: boolean;
}

export const MindVaultCard: React.FC<CardProps> = ({
  children,
  glow = 'none',
  interactive = false,
  className,
  ...props
}) => {
  const glows = {
    none: 'border-vault-border',
    cyan: 'border-cyan-500/40 hover:border-cyan-400 hover:shadow-glow-cyan',
    emerald: 'border-emerald-500/40 hover:border-emerald-400 hover:shadow-glow-emerald',
    crimson: 'border-red-500/40 hover:border-red-400 hover:shadow-glow-crimson',
    amber: 'border-amber-500/40 hover:border-amber-400 hover:shadow-glow-amber',
    purple: 'border-purple-500/40 hover:border-purple-400 hover:shadow-glow-purple',
  };

  return (
    <div
      className={clsx(
        "relative rounded-lg bg-vault-card/80 backdrop-blur-md border p-6 transition-all duration-300",
        glows[glow],
        interactive && "cursor-pointer hover:-translate-y-1 hover:bg-vault-hover/90",
        className
      )}
      {...props}
    >
      {/* Corner cyber accent line */}
      <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none overflow-hidden">
        <div className="absolute transform rotate-45 bg-vault-border w-12 h-0.5 -right-3 top-2" />
      </div>
      {children}
    </div>
  );
};
`;
fs.writeFileSync(path.join(__dirname, 'components', 'ui', 'MindVaultCard.tsx'), card);

// 3. Timer.tsx
const timer = `'use client';
import React from 'react';

interface TimerProps {
  secondsRemaining: number;
  totalSeconds: number;
  label?: string;
}

export const Timer: React.FC<TimerProps> = ({
  secondsRemaining,
  totalSeconds,
  label = 'ROUND TIMER'
}) => {
  const percentage = Math.max(0, Math.min(100, (secondsRemaining / totalSeconds) * 100));
  const isUrgent = secondsRemaining <= 10 && secondsRemaining > 0;

  const strokeColor = isUrgent ? '#EF4444' : secondsRemaining <= totalSeconds * 0.4 ? '#F59E0B' : '#00F0FF';

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex items-center gap-3 bg-vault-surface/80 border border-vault-border px-4 py-2 rounded-lg backdrop-blur">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="w-16 h-16 transform -rotate-90">
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="#1F293D"
            strokeWidth="4"
            fill="transparent"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke={strokeColor}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-linear"
            fill="transparent"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={\`font-mono text-base font-bold \${isUrgent ? 'text-red-400 animate-pulse' : 'text-gray-100'}\`}>
            {secondsRemaining}s
          </span>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] tracking-widest uppercase font-display text-gray-400">{label}</span>
        <span className="text-xs font-mono text-gray-300">
          {Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
};
`;
fs.writeFileSync(path.join(__dirname, 'components', 'ui', 'Timer.tsx'), timer);

// 4. RoomCode.tsx
const roomCode = `'use client';
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
`;
fs.writeFileSync(path.join(__dirname, 'components', 'ui', 'RoomCode.tsx'), roomCode);

// 5. RuleUnlockModal.tsx (Prediction Arena special requirement)
const ruleModal = `'use client';
import React from 'react';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import { MindVaultButton } from './MindVaultButton';

interface RuleModalProps {
  isOpen: boolean;
  ruleNumber: number;
  ruleName: string;
  explanation: string;
  example: string;
  onContinue: () => void;
}

export const RuleUnlockModal: React.FC<RuleModalProps> = ({
  isOpen,
  ruleNumber,
  ruleName,
  explanation,
  example,
  onContinue
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
      <div className="relative max-w-xl w-full bg-gradient-to-b from-cyan-950/40 via-vault-card to-vault-dark border-2 border-cyan-400 p-8 rounded-xl shadow-2xl shadow-cyan-500/20 text-center">
        {/* Glowing badge */}
        <div className="inline-flex items-center gap-2 bg-cyan-500/20 border border-cyan-400 px-4 py-1.5 rounded-full text-xs font-mono font-bold text-cyan-300 uppercase tracking-widest mb-6 animate-pulse">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          ARENA PROTOCOL UPDATE
        </div>

        <h2 className="text-3xl sm:text-4xl font-display font-black text-white tracking-wide uppercase mb-2">
          NEW RULE UNLOCKED
        </h2>

        <div className="text-lg font-mono text-cyan-400 font-bold mb-6">
          RULE #{ruleNumber}: {ruleName}
        </div>

        <div className="bg-vault-surface/80 border border-vault-border rounded-lg p-5 text-left mb-6 space-y-3">
          <div>
            <span className="text-xs uppercase font-mono tracking-wider text-gray-400 block mb-1">
              RULE SPECIFICATION
            </span>
            <p className="text-sm text-gray-200 leading-relaxed">
              {explanation}
            </p>
          </div>

          <div className="border-t border-vault-border pt-3">
            <span className="text-xs uppercase font-mono tracking-wider text-amber-400 block mb-1">
              TACTICAL EXAMPLE
            </span>
            <p className="text-xs text-gray-300 font-mono bg-black/40 p-2.5 rounded border border-vault-border/50">
              {example}
            </p>
          </div>
        </div>

        <MindVaultButton
          variant="primary"
          size="lg"
          className="w-full justify-center"
          onClick={onContinue}
        >
          Acknowledge & Continue
          <ArrowRight className="w-5 h-5 ml-2" />
        </MindVaultButton>
      </div>
    </div>
  );
};
`;
fs.writeFileSync(path.join(__dirname, 'components', 'ui', 'RuleUnlockModal.tsx'), ruleModal);

// 6. DatabaseErrorModal.tsx (For when MySQL is offline)
const dbError = `'use client';
import React, { useEffect, useState } from 'react';
import { Database, AlertTriangle, RefreshCw } from 'lucide-react';
import { MindVaultButton } from './MindVaultButton';

export const DatabaseErrorModal: React.FC = () => {
  const [dbStatus, setDbStatus] = useState<{ ok: boolean; message: string; host?: string; port?: number; error?: string } | null>(null);
  const [checking, setChecking] = useState(false);

  const checkConnection = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/db-health');
      const data = await res.json();
      setDbStatus(data);
    } catch (e: any) {
      setDbStatus({ ok: false, message: 'Server unreachable', error: e.message });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  if (!dbStatus || dbStatus.ok) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
      <div className="max-w-lg w-full bg-vault-card border border-red-500/60 p-6 rounded-lg shadow-2xl text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-500/10 border border-red-500 flex items-center justify-center">
          <Database className="w-7 h-7 text-red-400" />
        </div>

        <h3 className="text-xl font-display font-bold text-white mb-2 uppercase tracking-wider">
          MySQL Database Unreachable
        </h3>

        <p className="text-sm text-gray-300 mb-4 leading-relaxed">
          MindVault is strictly database-driven and requires an active <strong>MySQL 8+</strong> connection.
          In-memory mock fallbacks are disabled to protect data integrity.
        </p>

        <div className="bg-black/60 border border-vault-border rounded p-3 text-left font-mono text-xs text-gray-300 mb-6 space-y-1">
          <div><span className="text-gray-500">Target Host:</span> {dbStatus.host || 'localhost'}:{dbStatus.port || 3306}</div>
          <div><span className="text-gray-500">Error Code:</span> <span className="text-red-400">{dbStatus.error || 'ECONNREFUSED'}</span></div>
          <div className="mt-2 text-gray-400 text-[11px]">
            Run: <code className="text-cyan-400">mysql -u root -p &lt; database/mindvault.sql</code>
          </div>
        </div>

        <MindVaultButton
          variant="danger"
          size="md"
          isLoading={checking}
          onClick={checkConnection}
          className="w-full justify-center"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry Connection
        </MindVaultButton>
      </div>
    </div>
  );
};
`;
fs.writeFileSync(path.join(__dirname, 'components', 'ui', 'DatabaseErrorModal.tsx'), dbError);

console.log('UI components generated successfully.');
