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
  Plane,
  UserCheck,
  Check,
  X,
  Bell,
  Coins,
  Sliders,
  DollarSign,
  Percent,
} from 'lucide-react';
import {
  OrchestratorCycleRecord,
  TradingAgentProtocolProfile,
} from '../../lib/agents/protocols/types';
import { CopilotProposal, OperatingMode, AutopilotStakeConfig, DEFAULT_AUTOPILOT_STAKE } from '../../lib/types/trading';

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
  operatingMode?: OperatingMode;
  onToggleOperatingMode?: (mode: OperatingMode) => void;
  pendingProposal?: CopilotProposal | null;
  onApproveProposal?: (proposal: CopilotProposal) => void;
  onRejectProposal?: (proposal: CopilotProposal) => void;
  autopilotStake?: AutopilotStakeConfig;
  onChangeAutopilotStake?: (config: AutopilotStakeConfig) => void;
  currentPrice?: number;
  availableCash?: number;
  symbol?: string;
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
  operatingMode = 'COPILOT',
  onToggleOperatingMode,
  pendingProposal,
  onApproveProposal,
  onRejectProposal,
  autopilotStake = DEFAULT_AUTOPILOT_STAKE,
  onChangeAutopilotStake,
  currentPrice = 64500,
  availableCash = 10000,
  symbol = 'BTC/USDT',
}) => {
  const [showFullAudit, setShowFullAudit] = useState(false);
  const [customAmountInput, setCustomAmountInput] = useState<string>('');

  const STAKE_PRESETS_EUR = [100, 250, 500, 1000, 2500];

  const effectiveStakeEur = React.useMemo(() => {
    if (!autopilotStake) return 500;
    if (autopilotStake.stakeType === 'FIXED_EUR') {
      return autopilotStake.stakeValue;
    }
    if (autopilotStake.stakeType === 'PERCENT_CASH') {
      return availableCash * (autopilotStake.stakeValue / 100);
    }
    // AUTO_KELLY
    return Math.min(availableCash * 0.05, 500);
  }, [autopilotStake, availableCash]);

  const stakeLabel = React.useMemo(() => {
    if (!autopilotStake) return '500 €';
    if (autopilotStake.stakeType === 'FIXED_EUR') {
      return `${autopilotStake.stakeValue.toLocaleString('de-DE')} €`;
    }
    if (autopilotStake.stakeType === 'PERCENT_CASH') {
      return `${autopilotStake.stakeValue}% Cash (~${Math.round(effectiveStakeEur).toLocaleString('de-DE')} €)`;
    }
    return 'Kelly Quant';
  }, [autopilotStake, effectiveStakeEur]);

  const approxUnits = React.useMemo(() => {
    if (!currentPrice || currentPrice <= 0) return '0.00';
    const units = effectiveStakeEur / currentPrice;
    if (units < 0.001) return units.toFixed(6);
    if (units < 1) return units.toFixed(4);
    return units.toFixed(2);
  }, [effectiveStakeEur, currentPrice]);

  const maxPossibleTrades = React.useMemo(() => {
    if (!effectiveStakeEur || effectiveStakeEur <= 0) return 0;
    return Math.floor(availableCash / effectiveStakeEur);
  }, [availableCash, effectiveStakeEur]);

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

        {/* Operating Mode Selector & Live Status Badge */}
        <div className="flex flex-wrap items-center gap-2">
          {onToggleOperatingMode && (
            <div className="flex items-center bg-trading-bg p-0.5 rounded-lg border border-trading-border text-xs">
              <button
                onClick={() => onToggleOperatingMode('COPILOT')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition text-xs ${
                  operatingMode === 'COPILOT'
                    ? 'bg-sky-500/25 text-sky-300 font-bold border border-sky-500/40 shadow-sm'
                    : 'text-trading-muted hover:text-white'
                }`}
                title="Copilot: Assistiert. Jedes Signal wird zur Freigabe vorgelegt (du entscheidest mit)."
              >
                <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Copilot (Mitentscheiden)</span>
                {pendingProposal && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </button>
              <button
                onClick={() => onToggleOperatingMode('PILOT')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition text-xs ${
                  operatingMode === 'PILOT'
                    ? 'bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                    : 'text-trading-muted hover:text-white'
                }`}
                title="Pilot: Vollautomatisch. Signale werden direkt autonom ausgeführt (du entscheidest nicht mit)."
              >
                <Plane className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pilot (Autonom)</span>
              </button>
            </div>
          )}

          {isCircuitTripped ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400 bg-rose-500/20 px-2.5 py-1 rounded-full border border-rose-500/40 animate-pulse">
              <ShieldAlert className="w-3.5 h-3.5" />
              Circuit Breaker Aktiv
            </span>
          ) : isAutoPilot ? (
            <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${
              operatingMode === 'PILOT'
                ? 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40'
                : 'text-sky-400 bg-sky-500/20 border-sky-500/40'
            }`}>
              <span className={`w-2 h-2 rounded-full ${operatingMode === 'PILOT' ? 'bg-emerald-400' : 'bg-sky-400'} animate-ping`} />
              {operatingMode === 'PILOT' ? 'Pilot Taktend (Auto-Exec)' : 'Copilot Taktend (Signal-Radar)'}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {availableProfiles.map((p) => {
            const isSelected = p.id === activeProfile.id;
            const isTurbo = p.id === 'QUANT_ALPHA_TURBO';
            return (
              <button
                key={p.id}
                onClick={() => onSelectProfile(p)}
                className={`p-2 rounded-lg border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? isTurbo
                      ? 'bg-purple-950/40 border-purple-500 shadow-md shadow-purple-500/20'
                      : 'bg-trading-card border-sky-500/50 shadow-md shadow-sky-500/10'
                    : 'bg-trading-bg border-trading-border hover:border-trading-border/80 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold ${isSelected ? (isTurbo ? 'text-purple-300' : 'text-white') : 'text-slate-300'}`}>
                    {p.name.replace(/\s*\(.*\)/, '')}
                  </span>
                  <span className={`text-[9px] px-1 py-0.2 rounded border ${
                    isSelected 
                      ? isTurbo 
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold' 
                        : 'bg-sky-500/20 text-sky-300 border-sky-500/30' 
                      : 'bg-trading-surface text-trading-muted border-trading-border'
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

      {/* 2b. Autopilot Einsatz & Budget-Steuerung */}
      <div className={`p-3 rounded-xl border transition-all ${
        operatingMode === 'PILOT'
          ? 'bg-emerald-950/25 border-emerald-500/40 shadow-sm'
          : 'bg-trading-bg/60 border-trading-border/80'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Coins className={`w-4 h-4 ${operatingMode === 'PILOT' ? 'text-emerald-400' : 'text-sky-400'}`} />
            <span className="text-xs font-bold text-white">
              Einsatz pro Trade (Autopilot-Budget):
            </span>
            <span className={`text-[11px] font-black px-2 py-0.5 rounded border ${
              operatingMode === 'PILOT'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-sky-500/20 text-sky-300 border-sky-500/40'
            }`}>
              {stakeLabel}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[10px] text-trading-muted">
            <span>Verfügbares Cash:</span>
            <span className="text-white font-bold">{availableCash.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
          </div>
        </div>

        {/* Schnellwahl-Pills (Presets) */}
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {STAKE_PRESETS_EUR.map((val) => {
            const isSelected = autopilotStake?.stakeType === 'FIXED_EUR' && autopilotStake.stakeValue === val;
            return (
              <button
                key={val}
                type="button"
                onClick={() => {
                  if (onChangeAutopilotStake) {
                    onChangeAutopilotStake({ stakeType: 'FIXED_EUR', stakeValue: val });
                  }
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 border ${
                  isSelected
                    ? operatingMode === 'PILOT'
                      ? 'bg-emerald-500 text-black border-emerald-400 shadow-sm shadow-emerald-500/30'
                      : 'bg-sky-500 text-black border-sky-400 shadow-sm shadow-sky-500/30'
                    : 'bg-trading-surface hover:bg-trading-card text-slate-300 border-trading-border hover:border-trading-border/80'
                }`}
              >
                {val.toLocaleString('de-DE')} €
              </button>
            );
          })}

          {/* Prozent-Schnellwahl */}
          <button
            type="button"
            onClick={() => {
              if (onChangeAutopilotStake) {
                onChangeAutopilotStake({ stakeType: 'PERCENT_CASH', stakeValue: 5 });
              }
            }}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition border ${
              autopilotStake?.stakeType === 'PERCENT_CASH' && autopilotStake.stakeValue === 5
                ? 'bg-sky-500 text-black border-sky-400'
                : 'bg-trading-surface hover:bg-trading-card text-slate-300 border-trading-border'
            }`}
            title="5% des verfügbaren Cashs pro Trade"
          >
            5% Cash
          </button>
          <button
            type="button"
            onClick={() => {
              if (onChangeAutopilotStake) {
                onChangeAutopilotStake({ stakeType: 'PERCENT_CASH', stakeValue: 10 });
              }
            }}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition border ${
              autopilotStake?.stakeType === 'PERCENT_CASH' && autopilotStake.stakeValue === 10
                ? 'bg-sky-500 text-black border-sky-400'
                : 'bg-trading-surface hover:bg-trading-card text-slate-300 border-trading-border'
            }`}
            title="10% des verfügbaren Cashs pro Trade"
          >
            10% Cash
          </button>

          {/* Kelly Auto Pill */}
          <button
            type="button"
            onClick={() => {
              if (onChangeAutopilotStake) {
                onChangeAutopilotStake({ stakeType: 'AUTO_KELLY', stakeValue: 0.25 });
              }
            }}
            className={`px-2 py-1 rounded-lg text-xs font-bold transition border ${
              autopilotStake?.stakeType === 'AUTO_KELLY'
                ? 'bg-purple-500 text-black border-purple-400 shadow-sm shadow-purple-500/30'
                : 'bg-trading-surface hover:bg-trading-card text-slate-300 border-trading-border'
            }`}
            title="Kelly-Formel: Berechnet optimale fraktionale Größe nach Volatilität & Win-Rate"
          >
            Kelly Quant
          </button>
        </div>

        {/* Individuelle Eingabe & Live-Berechnung */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-trading-border/50 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="text-trading-muted">Freier Betrag:</span>
            <div className="flex items-center bg-trading-bg rounded border border-trading-border px-1.5 py-0.5">
              <input
                type="number"
                min={15}
                max={Math.max(100000, availableCash)}
                step={50}
                placeholder="z.B. 750"
                value={customAmountInput}
                onChange={(e) => setCustomAmountInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customAmountInput) {
                    const num = parseFloat(customAmountInput);
                    if (!isNaN(num) && num >= 15 && onChangeAutopilotStake) {
                      onChangeAutopilotStake({ stakeType: 'FIXED_EUR', stakeValue: num });
                      setCustomAmountInput('');
                    }
                  }
                }}
                className="w-20 bg-transparent text-white text-xs outline-none font-mono"
              />
              <span className="text-trading-muted text-xs mr-1">€</span>
              <button
                type="button"
                disabled={!customAmountInput || isNaN(parseFloat(customAmountInput)) || parseFloat(customAmountInput) < 15}
                onClick={() => {
                  const num = parseFloat(customAmountInput);
                  if (!isNaN(num) && num >= 15 && onChangeAutopilotStake) {
                    onChangeAutopilotStake({ stakeType: 'FIXED_EUR', stakeValue: num });
                    setCustomAmountInput('');
                  }
                }}
                className="px-1.5 py-0.5 bg-sky-500/20 hover:bg-sky-500/40 text-sky-300 rounded text-[10px] font-bold disabled:opacity-30 transition"
              >
                Setzen
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-trading-muted">
            <span>≈ <span className="text-white font-bold">{approxUnits}</span> {symbol.split('/')[0]} bei {currentPrice.toLocaleString('de-DE')} €</span>
            <span>•</span>
            <span>Max. <span className="text-emerald-400 font-bold">{maxPossibleTrades}</span> Trades möglich</span>
          </div>
        </div>
      </div>

      {/* 3. Action Control Buttons & Mode Info */}
      <div className="flex flex-col gap-2">
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
                className={`flex-1 py-3 rounded-xl font-black uppercase tracking-wider text-xs transition flex items-center justify-center gap-2 shadow-lg ${
                  isAutoPilot
                    ? 'bg-rose-500 hover:bg-rose-600 text-white'
                    : operatingMode === 'PILOT'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
                    : 'bg-trading-accent hover:bg-sky-400 text-black shadow-sky-500/20'
                }`}
              >
                {isAutoPilot ? (
                  <>
                    <Square className="w-4 h-4 fill-white" />
                    {operatingMode === 'PILOT'
                      ? `Pilot Stoppen (Aktiv: ${stakeLabel})`
                      : 'Copilot-Radar Stoppen'}
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-black" />
                    {operatingMode === 'PILOT'
                      ? `Pilot Starten mit ${stakeLabel} Einsatz`
                      : 'Copilot-Radar Starten (Signale suchen)'}
                  </>
                )}
              </button>

              <button
                onClick={onStepCycle}
                title="Führt genau einen atomaren Deliberationszyklus der 5 Unteragenten aus"
                className="py-3 px-4 rounded-xl bg-trading-card hover:bg-trading-bg text-white border border-trading-border text-xs font-bold transition flex items-center gap-1.5"
              >
                <StepForward className="w-4 h-4 text-sky-400" />
                Einzelschritt
              </button>
            </>
          )}
        </div>

        <div className="text-[10px] text-trading-muted flex items-center justify-between px-1">
          <span>
            {operatingMode === 'COPILOT'
              ? '🧑‍✈️ Copilot-Modus aktiv: Du entscheidest mit. Signale erfordern deine Freigabe.'
              : `✈️ Pilot-Modus aktiv: Vollautomatisch mit ${stakeLabel} pro Order. Du drückst Start — den Rest erledigt die App.`}
          </span>
          {pendingProposal && operatingMode === 'COPILOT' && (
            <span className="text-amber-400 font-bold flex items-center gap-1 animate-pulse">
              <Bell className="w-3 h-3" />
              1 Signal wartet auf deine Freigabe
            </span>
          )}
        </div>
      </div>

      {/* 3b. Copilot Decision Box / Freigabe-HUD (wenn ein Vorschlag vorliegt) */}
      {pendingProposal && operatingMode === 'COPILOT' && onApproveProposal && onRejectProposal && (
        <div className="bg-gradient-to-r from-sky-950/70 via-trading-card to-sky-950/70 border-2 border-sky-500/60 rounded-xl p-4 shadow-xl shadow-sky-500/10 animate-pulse-subtle flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-sky-500/30">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-black uppercase text-white tracking-wide block">
                  Copilot Freigabe: Neuer Trade-Vorschlag
                </span>
                <span className="text-[10px] text-sky-300">
                  Judikative P_J hat Signal geprüft. Du entscheidest mit — jetzt freigeben oder verwerfen.
                </span>
              </div>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-full font-bold flex items-center gap-1 animate-pulse">
              <Bell className="w-3 h-3 text-amber-400" />
              Wartet auf Freigabe
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-trading-bg/80 p-2.5 rounded-lg border border-trading-border">
              <span className="text-[10px] text-trading-muted block uppercase font-semibold">Richtung / Aktion</span>
              <span className={`text-sm font-black flex items-center gap-1 ${pendingProposal.side === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {pendingProposal.side === 'BUY' ? 'KAUFEN (BUY)' : 'VERKAUFEN (SELL)'}
              </span>
            </div>
            <div className="bg-trading-bg/80 p-2.5 rounded-lg border border-trading-border">
              <span className="text-[10px] text-trading-muted block uppercase font-semibold">Asset & Menge</span>
              <span className="text-sm font-bold text-white">
                {pendingProposal.amount} {pendingProposal.symbol}
              </span>
            </div>
            <div className="bg-trading-bg/80 p-2.5 rounded-lg border border-trading-border">
              <span className="text-[10px] text-trading-muted block uppercase font-semibold">Kurs / Typ</span>
              <span className="text-sm font-bold text-sky-300">
                {pendingProposal.expectedPrice.toLocaleString('de-DE')} € ({pendingProposal.type})
              </span>
            </div>
            <div className="bg-trading-bg/80 p-2.5 rounded-lg border border-trading-border">
              <span className="text-[10px] text-trading-muted block uppercase font-semibold">Confluence & Modell</span>
              <span className="text-sm font-bold text-amber-300 truncate" title={pendingProposal.strategyUsed}>
                {pendingProposal.confluenceScore}% • {pendingProposal.strategyUsed.split('_')[0]}
              </span>
            </div>
          </div>

          {pendingProposal.rationale && (
            <div className="text-[11px] text-slate-200 bg-trading-bg/60 p-2.5 rounded-lg border border-trading-border/60">
              <span className="text-sky-400 font-bold mr-1">Strategie-Begründung:</span>
              {pendingProposal.rationale}
              {pendingProposal.riskEur && (
                <span className="ml-2 text-trading-muted">
                  (Max. Risiko: {pendingProposal.riskEur.toFixed(2)} €)
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => onApproveProposal(pendingProposal)}
              className="flex-1 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Check className="w-4 h-4" />
              Trade Bestätigen & Jetzt Ausführen
            </button>
            <button
              onClick={() => onRejectProposal(pendingProposal)}
              className="py-2.5 px-5 rounded-lg bg-trading-bg hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-trading-border hover:border-rose-500/40 font-bold text-xs transition flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Verwerfen
            </button>
          </div>
        </div>
      )}


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
