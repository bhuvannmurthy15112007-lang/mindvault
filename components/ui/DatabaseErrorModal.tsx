'use client';
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
