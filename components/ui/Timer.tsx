'use client';
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
          <span className={`font-mono text-base font-bold ${isUrgent ? 'text-red-400 animate-pulse' : 'text-gray-100'}`}>
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
