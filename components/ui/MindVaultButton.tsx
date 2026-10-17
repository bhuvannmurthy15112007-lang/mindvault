'use client';
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
