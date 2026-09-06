'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Play,
  Square,
  StepForward,
  Shield,
  ShieldAlert,
  Zap,
  TrendingUp,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import {
  OrchestratorCycleRecord,
  TradingAgentProtocolProfile,
} from '../../lib/agents/protocols/types';

interface TradingOrchestratorPanelProps {
  activeProfile: TradingAgentProtocolProfile;
  availableProfiles: TradingAgentProtocolProfile[];
  onSelectProfile: (profile: TradingAgentProtocolProfile) => void;
  isAutoPilot: boolean;
  onToggleAutoPilot: () => void;
  onStepCycle: () => void;
  latestRecord: OrchestratorCycleRecord | null;
  auditTrail: OrchestratorCycleRecord[];
  isCircuitTripped: boolean;
  onResetCircuitBreaker: () => void;
}

export const TradingOrchestratorPanel: React.FC<TradingOrchestratorPanelProps> = ({
  activeProfile,
  availableProfiles,
  onSelectProfile,
  isAutoPilot,
  onToggleAutoPilot,
  onStepCycle,
  latestRecord,
  auditTrail,
  isCircuitTripped,
  onResetCircuitBreaker,
}) => {
  const [showFullAudit, setShowFullAudit] = useState(false);

  const getRegimeColor = (regime?: string) => {
    switch (regime) {
      case 'BULL_TREND':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'BEAR_TREND':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'HIGH_VOLATILITY':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'CONSOLIDATION':
        return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
      default:
        return 'text-slate-300 bg-slate-500/10 border-slate-500/30';
    }
  };

  const getActionColor = (action?: string) => {
    switch (action) {
      case 'BUY':
        return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40';
      case 'SELL':
        return 'text-rose-400 bg-rose-500/20 border-rose-500/40';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="bg-trading-surface border border-trading-border rounded-xl p-4 flex flex-col gap-4 font-mono">
      {/* 1. Panel Header & System-Operator Formula */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-trading-border/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">
                NEXUS Trading Orchestrator
              </span>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded border border-sky-500/30">
                5 Subagenten
              </span>
            </div>
            <p className="text-[10px] text-trading-muted">
              Systemoperator: <span className="text-sky-400 font-semibold">T = C ∘ P_J ∘ D_L ∘ F</span>
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2">
          {isCircuitTripped ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-500/20 px-2.5 py-1 rounded-full border border-rose-500/40 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              Circuit Breaker Aktiv
            </span>
          ) : isAutoPilot ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Auto-Pilot Taktend
            </span>
          ) : (
            <span className="text-xs text-trading-muted bg-trading-bg px-2.5 py-1 rounded-full border border-trading-border">
              Bereit / Manuell
            </span>
          )}
        </div>
      </div>

      {/* 2. Protokoll-Profil Wähler */}
      <div>
        <div className="flex items-center justify-between text-[11px] text-trading-muted mb-1.5">
          <span className="flex items-center gap-1.5 text-white font-semibold">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            Aktives Protokoll-Profil:
          </span>
          <span className="text-[10px] text-sky-400">Das Protokoll IST der Agent</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {availableProfiles.map((p) => {
            const isSelected = p.id === activeProfile.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectProfile(p)}
                className={`p-2 rounded-lg border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-trading-card border-sky-500/50 shadow-md shadow-sky-500/10'
                    : 'bg-trading-bg border-trading-border hover:border-trading-border/80 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {p.name.split(' ')[0]}
                  </span>
                  <span className={`text-[9px] px-1 py-0.2 rounded border ${
                    isSelected ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' : 'bg-trading-surface text-trading-muted border-trading-border'
                  }`}>
                    {p.badge}
                  </span>
                </div>
                <div className="text-[10px] text-trading-muted line-clamp-1">
                  Risiko: {p.riskGuardian.maxRiskPerTradePercent}% • CB: {p.riskGuardian.maxDrawdownCircuitPercent}%
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-trading-muted mt-1.5 italic">
          {activeProfile.description}
        </p>
      </div>

      {/* 3. Action Control Buttons */}
      <div className="flex items-center gap-2">
        {isCircuitTripped ? (
          <button
            onClick={onResetCircuitBreaker}
            className="flex-1 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-wider text-xs transition flex items-center justify-center gap-2 shadow-lg"
          >
            <Shield className="w-4 h-4" />
            Circuit Breaker Entsperren & Reset
          </button>
        ) : (
          <>
            <button
              onClick={onToggleAutoPilot}
              className={`flex-1 py-2.5 rounded-lg font-black uppercase tracking-wider text-xs transition flex items-center justify-center gap-2 shadow-lg ${
                isAutoPilot
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-trading-accent hover:bg-sky-500 text-black'
              }`}
            >
              {isAutoPilot ? (
                <>
                  <Square className="w-4 h-4 fill-white" />
                  Auto-Pilot Stoppen
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-black" />
                  Auto-Pilot Starten
                </>
              )}
            </button>

            <button
              onClick={onStepCycle}
              title="Führt genau einen atomaren Deliberationszyklus der 5 Unteragenten aus"
              className="py-2.5 px-4 rounded-lg bg-trading-card hover:bg-trading-bg text-white border border-trading-border text-xs font-bold transition flex items-center gap-1.5"
            >
              <StepForward className="w-4 h-4 text-sky-400" />
              Einzelschritt
            </button>
          </>
        )}
      </div>

      {/* 4. Subagenten-Matrix (5 Protokoll-Unteragenten) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] text-trading-muted">
          <span className="font-semibold text-white">Subagenten-Pipeline & Deliberation:</span>
          {latestRecord && (
            <span className="text-[10px] text-trading-muted">
              Zyklus #{latestRecord.cycleIndex} • {new Date(latestRecord.timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
          {/* Subagent 1: Perception Scout */}
          <div className="bg-trading-bg p-2.5 rounded-lg border border-trading-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-trading-muted flex items-center gap-1 font-bold">
                  <Activity className="w-3 h-3 text-sky-400" />
                  1. Perception
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${getRegimeColor(latestRecord?.perception.regime)}`}>
                  {latestRecord?.perception.regime?.replace('_', ' ') ?? 'BEREIT'}
                </span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-trading-muted">RSI:</span>
                  <span className="text-white font-bold">{latestRecord?.perception.rsi ?? 50}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-trading-muted">ATR:</span>
                  <span className="text-white font-bold">{latestRecord?.perception.atrPercent ?? 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-trading-muted">Stärke:</span>
                  <span className="text-sky-400 font-bold">{latestRecord?.perception.trendStrength ?? 0}/100</span>
                </div>
              </div>
            </div>
            <div className="mt-2 pt-1 border-t border-trading-border/50 text-[9px] text-trading-muted line-clamp-2">
              {latestRecord?.perception.summary ?? 'Wartet auf Kerzentakt...'}
            </div>
          </div>

          {/* Subagent 2: Alpha Generator */}
          <div className="bg-trading-bg p-2.5 rounded-lg border border-trading-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-trading-muted flex items-center gap-1 font-bold">
                  <Zap className="w-3 h-3 text-amber-400" />
                  2. Alpha Hypothese
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${getActionColor(latestRecord?.hypothesis.action)}`}>
                  {latestRecord?.hypothesis.action ?? 'HOLD'}
                </span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-trading-muted">Confluence:</span>
                  <span className="text-amber-400 font-bold">{latestRecord?.hypothesis.confluenceScore ?? 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-trading-muted">Strategie:</span>
                  <span className="text-white truncate max-w-[80px]" title={latestRecord?.hypothesis.strategyUsed}>
                    {latestRecord?.hypothesis.strategyUsed?.split('_')[0] ?? '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-trading-muted">Ziel RRR:</span>
                  <span className="text-sky-400 font-bold">{activeProfile.alphaStrategy.targetRiskRewardRatio}:1</span>
                </div>
              </div>
            </div>
            <div className="mt-2 pt-1 border-t border-trading-border/50 text-[9px] text-trading-muted line-clamp-2">
              {latestRecord?.hypothesis.rationale ?? 'Keine aktive Hypothese.'}
            </div>
          </div>

          {/* Subagent 3: Risk Guardian (Judikative P_J) */}
          <div className="bg-trading-bg p-2.5 rounded-lg border border-trading-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-trading-muted flex items-center gap-1 font-bold">
                  <Shield className="w-3 h-3 text-emerald-400" />
                  3. Judikative P_J
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${
                  latestRecord?.riskProof.passed
                    ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
                    : 'text-rose-400 bg-rose-500/20 border-rose-500/30'
                }`}>
                  {latestRecord?.riskProof.passed ? 'PROOF OK' : 'VETO'}
                </span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-trading-muted">Allokation:</span>
                  <span className="text-white font-bold">{latestRecord?.riskProof.approvedAmount ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-trading-muted">Risiko max:</span>
                  <span className="text-trading-muted">{latestRecord?.riskProof.riskPerTradeEuro?.toFixed(1) ?? '0'} €</span>
                </div>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-trading-muted">Invarianten:</span>
                  <span className="flex items-center gap-1 text-[9px]">
                    {latestRecord?.riskProof.invariantsChecked.drawdownOk ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <XCircle className="w-3 h-3 text-rose-400" />
                    )}
                    {latestRecord?.riskProof.invariantsChecked.exposureOk ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <XCircle className="w-3 h-3 text-rose-400" />
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-2 pt-1 border-t border-trading-border/50 text-[9px] text-trading-muted line-clamp-2">
              {latestRecord?.riskProof.vetoReason ?? 'Alle 4 Risiko-Invarianten erfüllt.'}
            </div>
          </div>

          {/* Subagent 4: Execution Officer */}
          <div className="bg-trading-bg p-2.5 rounded-lg border border-trading-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-trading-muted flex items-center gap-1 font-bold">
                  <TrendingUp className="w-3 h-3 text-sky-400" />
                  4. Execution
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${
                  latestRecord?.execution.status === 'EXECUTED'
                    ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'
                    : 'text-slate-400 bg-slate-500/10 border-slate-500/20'
                }`}>
                  {latestRecord?.execution.status ?? 'IDLE'}
                </span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-trading-muted">Typ:</span>
                  <span className="text-white font-bold">{latestRecord?.execution.type ?? activeProfile.executionRouting.defaultOrderType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-trading-muted">Slippage:</span>
                  <span className="text-white font-bold">{latestRecord?.execution.slippageBps ?? 0} bps</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-trading-muted">Route:</span>
                  <span className="text-sky-400 font-bold">VIRTUAL</span>
                </div>
              </div>
            </div>
            <div className="mt-2 pt-1 border-t border-trading-border/50 text-[9px] text-trading-muted line-clamp-2">
              {latestRecord?.execution.notes ?? 'Wartet auf autorisierte Order.'}
            </div>
          </div>

          {/* Subagent 5: Quant Evaluator (Cache C) */}
          <div className="bg-trading-bg p-2.5 rounded-lg border border-trading-border flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-trading-muted flex items-center gap-1 font-bold">
                  <Clock className="w-3 h-3 text-purple-400" />
                  5. Cache & Quant
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${
                  latestRecord?.telemetry.cached
                    ? 'text-purple-400 bg-purple-500/20 border-purple-500/30'
                    : 'text-sky-400 bg-sky-500/20 border-sky-500/30'
                }`}>
                  {latestRecord?.telemetry.cached ? 'CACHE C' : 'RECOMPUTE'}
                </span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-trading-muted">Sharpe:</span>
                  <span className="text-white font-bold">{latestRecord?.telemetry.rollingSharpe ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-trading-muted">Drawdown:</span>
                  <span className="text-rose-400 font-bold">{latestRecord?.telemetry.drawdownPercent ?? 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-trading-muted">Δ Fixpunkt:</span>
                  <span className="text-emerald-400 font-bold">≤ {latestRecord?.telemetry.fixpointDelta ?? 0}</span>
                </div>
              </div>
            </div>
            <div className="mt-2 pt-1 border-t border-trading-border/50 text-[9px] text-trading-muted line-clamp-2">
              {latestRecord?.telemetry.cached
                ? 'Idempotenter Cache-Treffer: Rechnerische Energie minimiert.'
                : 'Zustandsfixpunkt aktualisiert.'}
            </div>
          </div>
        </div>
      </div>

      {/* 5. Live Decision Stream / Audit Trail */}
      <div className="pt-2 border-t border-trading-border/60">
        <button
          onClick={() => setShowFullAudit(!showFullAudit)}
          className="w-full flex items-center justify-between text-xs text-trading-muted hover:text-white py-1 transition"
        >
          <span className="flex items-center gap-1.5 font-bold">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            Live-Audit-Trail & Entscheidungsprotokoll ({auditTrail.length} Zyklen)
          </span>
          {showFullAudit ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showFullAudit && (
          <div className="mt-2 max-h-48 overflow-y-auto space-y-1.5 pr-1 text-[10px]">
            {auditTrail.length === 0 ? (
              <div className="text-trading-muted text-center py-4">
                Noch keine Zyklen ausgeführt. Starte den Auto-Pilot oder klicke auf „Einzelschritt“.
              </div>
            ) : (
              auditTrail.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-trading-bg p-2 rounded border border-trading-border flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between text-trading-muted">
                    <span className="font-bold text-white">
                      Zyklus #{rec.cycleIndex} • {rec.symbol} @ {rec.price.toLocaleString('de-DE')} €
                    </span>
                    <span>{new Date(rec.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-[10px]">
                    <span className={`px-1.5 py-0.2 rounded border font-bold ${getRegimeColor(rec.perception.regime)}`}>
                      {rec.perception.regime}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded border font-bold ${getActionColor(rec.hypothesis.action)}`}>
                      Hypothese: {rec.hypothesis.action} ({rec.hypothesis.confluenceScore}%)
                    </span>
                    <span className={`px-1.5 py-0.2 rounded border font-bold ${
                      rec.riskProof.passed ? 'text-emerald-400 border-emerald-500/30' : 'text-rose-400 border-rose-500/30'
                    }`}>
                      Judikative P_J: {rec.riskProof.passed ? 'PASSED' : 'VETO'}
                    </span>
                    <span className="text-slate-300">
                      Status: {rec.execution.status}
                    </span>
                  </div>
                  {rec.riskProof.vetoReason && (
                    <div className="text-amber-400 text-[9px] flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {rec.riskProof.vetoReason}
                    </div>
                  )}
                  <div className="text-trading-muted text-[9px] truncate">
                    {rec.hypothesis.rationale}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
