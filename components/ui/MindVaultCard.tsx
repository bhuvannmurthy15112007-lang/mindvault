'use client';
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
