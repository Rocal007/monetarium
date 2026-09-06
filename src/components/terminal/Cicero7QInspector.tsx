'use client';

import React, { useState } from 'react';
import {
  HelpCircle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  MapPin,
  Tag,
  Wrench,
  Compass,
  AlertCircle,
  Sliders,
  ChevronDown,
  ChevronUp,
  History,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Cicero7QRecord } from '../../lib/types/cicero';

interface Cicero7QInspectorProps {
  currentRecord: Cicero7QRecord | null;
  history?: Cicero7QRecord[];
  onSelectHistoricalRecord?: (record: Cicero7QRecord) => void;
}

export const Cicero7QInspector: React.FC<Cicero7QInspectorProps> = ({
  currentRecord,
  history = [],
  onSelectHistoricalRecord,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  if (!currentRecord) {
    return (
      <div className="bg-trading-surface border border-trading-border rounded-xl p-4 font-mono text-center text-trading-muted text-xs flex flex-col items-center justify-center gap-2">
        <HelpCircle className="w-6 h-6 text-trading-muted opacity-50" />
        <p className="font-semibold text-white">Cicero-7Q Inspector bereit</p>
        <p className="text-[11px] max-w-md">
          Sobald ein Trade manuell ausgeführt oder ein Orchestrator-Takt getriggert wird, erscheint hier die vollständige 7Q-Beweiskette (Quis bis Quando).
        </p>
      </div>
    );
  }

  const { quis, quid, ubi, quibus, cur, quomodo, quando, proof } = currentRecord;

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'BUY':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'SELL':
        return 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
      default:
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
    }
  };

  const getSignalBadgeClass = (signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL') => {
    switch (signal) {
      case 'BULLISH':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'BEARISH':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      default:
        return 'text-slate-300 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="bg-trading-surface border border-trading-border rounded-xl p-4 font-mono flex flex-col gap-4 shadow-sm">
      {/* Header mit Proof-Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-trading-border/60">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Cicero-7Q Decision Inspector</span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                Ω_RO Radikale Objektivität
              </span>
            </div>
            <p className="text-[10px] text-trading-muted">
              Lückenlose 7-Säulen-Begründung für jeden Algorithmus- und Benutzertakt
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Judikative Proof Status */}
          {proof.isValidated ? (
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>P_J Proof = 1 (Freigegeben)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-1 rounded">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>P_J Veto (Blockiert: {proof.vetoReason || 'Risiko'})</span>
            </div>
          )}

          {history.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-[11px] px-2 py-1 rounded bg-trading-card border border-trading-border text-trading-muted hover:text-white transition flex items-center gap-1"
            >
              <History className="w-3.5 h-3.5" />
              <span>Historie ({history.length})</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded bg-trading-card border border-trading-border text-trading-muted hover:text-white"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* History Dropdown / Drawer */}
      {showHistory && history.length > 0 && (
        <div className="bg-trading-card border border-trading-border rounded-lg p-2.5 flex flex-col gap-1.5 max-h-48 overflow-y-auto">
          <div className="text-[10px] text-trading-muted uppercase font-bold tracking-wider px-1">
            Letzte verifizierte 7Q-Zyklen:
          </div>
          {history.map((h) => (
            <button
              key={h.id}
              onClick={() => {
                onSelectHistoricalRecord?.(h);
                setShowHistory(false);
              }}
              className={`w-full text-left px-2.5 py-1.5 rounded text-xs flex items-center justify-between border transition ${
                h.id === currentRecord.id
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-white'
                  : 'bg-trading-surface border-trading-border/40 text-trading-muted hover:text-white hover:border-trading-border'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getActionBadgeClass(h.quid.action)}`}>
                  {h.quid.action}
                </span>
                <span>{h.quid.symbol}</span>
                <span className="text-[10px] text-trading-muted">({h.formattedTime})</span>
              </div>
              <div className="text-[11px] font-bold text-slate-300">
                CRV 1:{h.quomodo.riskRewardRatio}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Die 7 Säulen nach Cicero */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* 1. QUIS */}
          <div className="bg-trading-card/60 border border-trading-border/70 rounded-lg p-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-trading-muted text-[10px] uppercase font-bold tracking-wider">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-sky-400" />
                1. QUIS (Wer)
              </span>
              <span className="text-sky-400">{quis.confluenceScore}% Konfluenz</span>
            </div>
            <div className="font-bold text-white text-sm">{quis.agentName}</div>
            <div className="text-[11px] text-trading-muted">{quis.role}</div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
              <div
                className="bg-sky-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, quis.confluenceScore)}%` }}
              />
            </div>
          </div>

          {/* 2. QUID */}
          <div className="bg-trading-card/60 border border-trading-border/70 rounded-lg p-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-trading-muted text-[10px] uppercase font-bold tracking-wider">
              <span className="flex items-center gap-1">
                <Sliders className="w-3 h-3 text-emerald-400" />
                2. QUID (Was)
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getActionBadgeClass(quid.action)}`}>
                {quid.action}
              </span>
            </div>
            <div className="font-bold text-white text-sm">
              {quid.amount} {quid.symbol}
            </div>
            <div className="text-[11px] text-trading-muted">
              Referenzpreis: <span className="text-white font-mono">{quid.price.toLocaleString('de-DE')} $</span>
            </div>
            <div className="text-[10px] text-trading-muted">Order-Typ: {quid.orderType}</div>
          </div>

          {/* 3. UBI */}
          <div className="bg-trading-card/60 border border-trading-border/70 rounded-lg p-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-trading-muted text-[10px] uppercase font-bold tracking-wider">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-400" />
                3. UBI (Wo)
              </span>
              <span className="text-[10px] text-amber-400">{ubi.orderBookDepth} SPREAD</span>
            </div>
            <div className="font-bold text-white text-sm">{ubi.venue}</div>
            <div className="text-[11px] text-trading-muted">
              Regime: <span className="text-slate-300">{ubi.marketRegime}</span>
            </div>
            <div className="text-[10px] text-trading-muted">Slippage-Reserve: {quomodo.slippageEstimateBps} bps</div>
          </div>

          {/* 4. QUIBUS AUXILIIS */}
          <div className="bg-trading-card/60 border border-trading-border/70 rounded-lg p-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-trading-muted text-[10px] uppercase font-bold tracking-wider">
              <span className="flex items-center gap-1">
                <Wrench className="w-3 h-3 text-purple-400" />
                4. QUIBUS (Womit)
              </span>
              <span className="text-[10px] text-purple-300">Indikatoren</span>
            </div>
            <div className="flex flex-col gap-1 mt-0.5">
              {quibus.indicators.map((ind, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px]">
                  <span className="text-trading-muted">{ind.name}:</span>
                  <span className={`px-1.5 py-0.2 rounded border text-[10px] font-bold ${getSignalBadgeClass(ind.signal)}`}>
                    {ind.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 5. CUR (Spans 2 cols on medium+) */}
          <div className="bg-trading-card/60 border border-trading-border/70 rounded-lg p-3 flex flex-col gap-1.5 md:col-span-2">
            <div className="flex items-center justify-between text-trading-muted text-[10px] uppercase font-bold tracking-wider">
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-indigo-400" />
                5. CUR (Warum / Sachlicher Grund)
              </span>
              <span className="text-[10px] text-emerald-400">Radikal Objektiv</span>
            </div>
            <div className="text-xs text-white leading-relaxed font-sans">{cur.rationale}</div>
            <div className="text-[11px] text-trading-muted mt-1 border-t border-trading-border/40 pt-1.5">
              Statistischer Vorteil: <span className="text-indigo-300">{cur.statisticalEdge}</span>
            </div>
          </div>

          {/* 6. QUOMODO */}
          <div className="bg-trading-card/60 border border-trading-border/70 rounded-lg p-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-trading-muted text-[10px] uppercase font-bold tracking-wider">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-teal-400" />
                6. QUOMODO (Wie)
              </span>
              <span className="text-teal-300 font-bold">CRV 1:{quomodo.riskRewardRatio}</span>
            </div>
            <div className="flex flex-col gap-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-rose-400">Stop-Loss:</span>
                <span className="font-mono text-white">
                  {quomodo.stopLossPrice.toFixed(2)} $ (-{quomodo.maxLossUsd} $)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-400">Take-Profit:</span>
                <span className="font-mono text-white">
                  {quomodo.takeProfitPrice.toFixed(2)} $ (+{quomodo.targetGainUsd} $)
                </span>
              </div>
            </div>
          </div>

          {/* 7. QUANDO */}
          <div className="bg-trading-card/60 border border-trading-border/70 rounded-lg p-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-trading-muted text-[10px] uppercase font-bold tracking-wider">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-orange-400" />
                7. QUANDO (Wann)
              </span>
              <span className="text-orange-300 font-mono">{currentRecord.formattedTime}</span>
            </div>
            <div className="font-bold text-white text-xs">{quando.timeframe}</div>
            <div className="text-[11px] text-trading-muted">Gültigkeit: {quando.validityWindow}</div>
            <div className="text-[10px] text-trading-muted">Nächster Takt: {quando.candleCloseExpected}</div>
          </div>
        </div>
      )}

      {/* Judikative Guardrails Checkbox Bar */}
      <div className="bg-trading-card/40 border border-trading-border/50 rounded-lg px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <span className="text-trading-muted font-bold">Judikative Invarianten-Prüfung:</span>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1">
            {proof.invariants.drawdownCheck ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span className={proof.invariants.drawdownCheck ? 'text-slate-300' : 'text-rose-400'}>
              Drawdown &lt; Limit
            </span>
          </div>

          <div className="flex items-center gap-1">
            {proof.invariants.exposureCheck ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span className={proof.invariants.exposureCheck ? 'text-slate-300' : 'text-rose-400'}>
              Exposure &lt; 60%
            </span>
          </div>

          <div className="flex items-center gap-1">
            {proof.invariants.riskSizeCheck ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span className={proof.invariants.riskSizeCheck ? 'text-slate-300' : 'text-rose-400'}>
              Risiko &le; 1.5%
            </span>
          </div>

          <div className="flex items-center gap-1">
            {proof.invariants.cooldownCheck ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span className={proof.invariants.cooldownCheck ? 'text-slate-300' : 'text-rose-400'}>
              Cooldown Inaktiv
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
