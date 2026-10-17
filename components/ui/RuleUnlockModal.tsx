'use client';
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
