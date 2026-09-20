'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Activity,
  Zap,
  Server,
  RefreshCw,
  X,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Clock,
  Database,
  ArrowRightLeft,
} from 'lucide-react';
import { DataSentinelOverallState, DataSourceId } from '../../lib/types/data-integrity';

interface DataSentinelModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: DataSentinelOverallState;
  onRunDiagnostics: () => Promise<void>;
}

export const DataSentinelModal: React.FC<DataSentinelModalProps> = ({
  isOpen,
  onClose,
  telemetry,
  onRunDiagnostics,
}) => {
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const handleDiagnose = async () => {
    setIsRunning(true);
    try {
      await onRunDiagnostics();
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPTIMAL':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'DEGRADED':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'FAILOVER':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      default:
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    }
  };

  const getLatencyColor = (ms: number) => {
    if (ms < 50) return 'text-emerald-400';
    if (ms < 150) return 'text-sky-400';
    if (ms < 400) return 'text-amber-400';
    return 'text-rose-400';
  };

  const providers = Object.values(telemetry.providers);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-mono">
      <div className="bg-trading-surface border border-trading-border rounded-xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-trading-border flex items-center justify-between bg-trading-bg/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Data Sentinel Agent
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <Activity className="w-3 h-3 animate-pulse" /> Operator D_real
                </span>
              </div>
              <p className="text-xs text-trading-muted">
                Wächter für fehlerfreie Echtzeit-Marktdaten • Multi-Source Failover & Zero-Garbage Audit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-trading-muted hover:text-white p-1.5 rounded-lg hover:bg-trading-card transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Top Status & KPI Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-trading-bg p-3 rounded-lg border border-trading-border">
              <span className="text-[10px] text-trading-muted uppercase block mb-1">
                System-Zustand
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-1 rounded border ${getStatusBadge(telemetry.status)}`}>
                  {telemetry.status}
                </span>
                <span className="text-xs text-slate-300">
                  {telemetry.status === 'OPTIMAL' ? 'Alle Verbindungen stabil' : 'Eingeschränkt'}
                </span>
              </div>
            </div>

            <div className="bg-trading-bg p-3 rounded-lg border border-trading-border">
              <span className="text-[10px] text-trading-muted uppercase block mb-1">
                Integritäts-Score
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-emerald-400">
                  {telemetry.overallScore.toFixed(1)}%
                </span>
                <span className="text-[10px] text-trading-muted">Zero-Garbage Proof</span>
              </div>
            </div>

            <div className="bg-trading-bg p-3 rounded-lg border border-trading-border">
              <span className="text-[10px] text-trading-muted uppercase block mb-1">
                Ø Latenz (Roundtrip)
              </span>
              <div className="flex items-baseline gap-2">
                <span className={`text-lg font-bold ${getLatencyColor(telemetry.avgLatencyMs)}`}>
                  {telemetry.avgLatencyMs} ms
                </span>
                <span className="text-[10px] text-trading-muted">Live Ping</span>
              </div>
            </div>
          </div>

          {/* Provider Matrix */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-sky-400" />
                Überwachte reale Datenverbindungen:
              </span>
              <span className="text-[10px] text-trading-muted">
                {providers.length} Provider konfiguriert
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {providers.map((p) => {
                const isOptimal = p.state === 'OPTIMAL';
                return (
                  <div
                    key={p.id}
                    className="bg-trading-bg p-3 rounded-lg border border-trading-border hover:border-trading-border/80 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isOptimal ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
                          <span className="text-xs font-bold text-white">{p.name}</span>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${getStatusBadge(p.state)}`}>
                          {p.state}
                        </span>
                      </div>
                      <div className="text-[10px] text-trading-muted font-mono truncate mb-2">
                        {p.activeEndpoint}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-trading-border/40">
                      <div className="flex items-center gap-1.5">
                        <Radio className="w-3 h-3 text-trading-muted" />
                        <span className="text-trading-muted">Latenz:</span>
                        <span className={`font-bold ${getLatencyColor(p.pingMs)}`}>
                          {p.pingMs} ms
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-trading-muted">
                        <span className="text-emerald-400">✓ {p.successCount}</span>
                        {p.errorCount > 0 && <span className="text-rose-400">✗ {p.errorCount}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Trigger */}
          <div className="bg-trading-card p-3 rounded-lg border border-trading-border flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-white block">
                Echtzeit-Diagnose & Multi-Provider Re-Sync
              </span>
              <span className="text-[10px] text-trading-muted">
                Führt einen deterministischen Health-Ping aller 4 Real-Data Endpunkte durch.
              </span>
            </div>
            <button
              onClick={handleDiagnose}
              disabled={isRunning}
              className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:bg-slate-700 text-black font-bold text-xs transition flex items-center gap-2 shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Prüfe Feeds...' : 'Diagnose jetzt ausführen'}
            </button>
          </div>

          {/* Audit Trail & Invariant Logs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                Data Sentinel Audit-Log (D_real Invarianten-Prüfung):
              </span>
              <span className="text-[10px] text-trading-muted">
                Letzte {telemetry.recentAuditLog.length} Ereignisse
              </span>
            </div>
            <div className="bg-black/50 p-3 rounded-lg border border-trading-border max-h-48 overflow-y-auto space-y-1.5 text-[11px]">
              {telemetry.recentAuditLog.length === 0 ? (
                <div className="text-trading-muted italic">Keine Ereignisse im Log.</div>
              ) : (
                telemetry.recentAuditLog.map((log, idx) => {
                  const levelColor =
                    log.level === 'SUCCESS'
                      ? 'text-emerald-400'
                      : log.level === 'WARN'
                      ? 'text-amber-400'
                      : log.level === 'ERROR'
                      ? 'text-rose-400'
                      : 'text-slate-300';

                  return (
                    <div key={idx} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-trading-muted text-[10px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={`text-[10px] font-bold px-1 rounded bg-slate-800 ${levelColor}`}>
                        {log.level}
                      </span>
                      <span className={levelColor}>{log.message}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-trading-border bg-trading-bg flex justify-between items-center text-[11px] text-trading-muted">
          <span>Integritätsprüfung: Invariante 1–4 aktiv</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-trading-card hover:bg-slate-700 text-white font-semibold transition"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
