'use client';

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Info,
  DollarSign,
  PieChart,
  Layers,
  Flame,
  Activity
} from 'lucide-react';
import { 
  CryptoBasketExecutionResult, 
  CryptoBasketPlan, 
  CryptoStrategyProfile 
} from '../../lib/types/crypto-allocator';
import { 
  CRYPTO_STRATEGIES, 
  generateCryptoBasketPlan,
  evaluateAutonomousCryptoDecision 
} from '../../lib/crypto/crypto-allocator';

interface CryptoAutoInvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCash: number;
  onExecuteBasket: (plan: CryptoBasketPlan) => Promise<CryptoBasketExecutionResult>;
  onSelectSymbol?: (symbol: string) => void;
  vixPrice?: number;
  macroRegime?: string;
}

export const CryptoAutoInvestModal: React.FC<CryptoAutoInvestModalProps> = ({
  isOpen,
  onClose,
  availableCash,
  onExecuteBasket,
  onSelectSymbol,
  vixPrice = 16.5,
  macroRegime = 'RISK_ON',
}) => {
  const [isAutonomousMode, setIsAutonomousMode] = useState<boolean>(true);
  const [selectedStrategy, setSelectedStrategy] = useState<CryptoStrategyProfile>('CORE_BLUECHIP');
  const defaultBudget = Math.min(availableCash, Math.max(100, Math.floor(availableCash * 0.25)));
  const [budgetInput, setBudgetInput] = useState<string>(defaultBudget.toString());
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<CryptoBasketExecutionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dcaEnabled, setDcaEnabled] = useState<boolean>(false);

  const budgetNum = Math.max(0, parseFloat(budgetInput) || 0);

  // Erzeuge dynamischen Krypto-Allokationsplan (autonom oder manuell)
  const plan: CryptoBasketPlan = useMemo(() => {
    if (isAutonomousMode) {
      const { plan: autoPlan } = evaluateAutonomousCryptoDecision({
        availableCash,
        vixPrice,
        macroRegime,
        customBudget: budgetNum > 0 ? budgetNum : undefined,
      });
      return autoPlan;
    }

    return generateCryptoBasketPlan({
      budget: budgetNum,
      availableCash,
      strategy: selectedStrategy,
    });
  }, [isAutonomousMode, budgetNum, availableCash, selectedStrategy, vixPrice, macroRegime]);

  if (!isOpen) return null;

  const handleQuickBudget = (amount: number) => {
    setBudgetInput(amount.toString());
    setExecutionResult(null);
    setErrorMessage(null);
  };

  const handlePercentBudget = (pct: number) => {
    const calculated = Math.floor((availableCash * pct) / 100);
    setBudgetInput(calculated.toString());
    setExecutionResult(null);
    setErrorMessage(null);
  };

  const handleExecute = async () => {
    if (!plan.isExecutable) {
      setErrorMessage(plan.validationError || 'Der Krypto-Basket kann nicht ausgeführt werden.');
      return;
    }

    try {
      setIsExecuting(true);
      setErrorMessage(null);
      const res = await onExecuteBasket(plan);
      setExecutionResult(res);
    } catch (err: any) {
      setErrorMessage(err.message || 'Fehler bei der Ausführung der Krypto-Orders.');
    } finally {
      setIsExecuting(false);
    }
  };

  const getRiskBadgeColor = (risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'SPECULATIVE') => {
    switch (risk) {
      case 'LOW':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'MEDIUM':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'HIGH':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'SPECULATIVE':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  };

  const getStrategyIcon = (strat: CryptoStrategyProfile) => {
    switch (strat) {
      case 'CORE_BLUECHIP':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'SMART_MOMENTUM':
        return <TrendingUp className="w-4 h-4 text-sky-400" />;
      case 'ATTENTION_ALPHA':
        return <Flame className="w-4 h-4 text-amber-400" />;
      case 'DIP_ACCUMULATOR':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-trading-surface border border-trading-border rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="p-4 border-b border-trading-border flex items-center justify-between bg-trading-bg/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-500 via-emerald-500 to-amber-400 flex items-center justify-center text-black font-black shadow-lg">
              <Zap className="w-5 h-5 fill-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  Krypto Auto-Invest & KI-Portfolio-Auswahl
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-semibold">
                  Robo-Advisor
                </span>
              </div>
              <p className="text-xs text-trading-muted">
                Automatische Krypto-Selektion, quantitative Risikogewichtung und 1-Klick-Orderausführung
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-trading-muted hover:text-white hover:bg-trading-card transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-6">
          {/* Schritt 1: KI-Vollautonomie vs. Manuelle Strategiewahl */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-trading-muted font-bold">
                <Layers className="w-3.5 h-3.5 text-trading-accent" />
                <span>1. Krypto-Auswahl & Strategie</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAutonomousMode(!isAutonomousMode)}
                  className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition ${
                    isAutonomousMode
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold'
                      : 'bg-trading-card text-trading-muted hover:text-white border-trading-border'
                  }`}
                >
                  {isAutonomousMode ? '⚡ Modus: KI-Vollautonomie' : 'Manuelle Strategiewahl'}
                </button>
              </div>
            </div>

            {isAutonomousMode ? (
              <div className="bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-amber-500/10 border border-emerald-500/40 rounded-xl p-4 shadow-lg shadow-emerald-500/5">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-amber-400/20 text-amber-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-white">Vollautonome Marktanalyse & KI-Entscheidung</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                      {plan.assessment?.marketRegime} ({plan.assessment?.confidenceScore}% Konfidenz)
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                    Gewählt: {plan.strategyMeta.name}
                  </span>
                </div>

                <p className="text-xs text-slate-200 mb-3 leading-relaxed">
                  {plan.assessment?.rationale}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-trading-muted border-t border-trading-border/50 pt-2.5">
                  <span>Makro-Confluence: <strong className="text-sky-400">{plan.assessment?.macroConfluence}</strong></span>
                  <span>Empfohlenes Kelly-Budget: <strong className="text-amber-400">{plan.assessment?.recommendedBudgetPercent}% des Barbestands</strong></span>
                  <span className="text-emerald-400/90 font-bold">✓ 100% automatisierte Token-Filterung & Gewichtung</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {(Object.keys(CRYPTO_STRATEGIES) as CryptoStrategyProfile[]).map((stratKey) => {
                  const meta = CRYPTO_STRATEGIES[stratKey];
                  const isSelected = selectedStrategy === stratKey;

                  return (
                    <div
                      key={stratKey}
                      onClick={() => {
                        setSelectedStrategy(stratKey);
                        setExecutionResult(null);
                        setErrorMessage(null);
                      }}
                      className={`p-3.5 rounded-lg border cursor-pointer transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-trading-card border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                          : 'bg-trading-bg hover:bg-trading-card/60 border-trading-border text-trading-muted'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                            {getStrategyIcon(stratKey)}
                            <span>{meta.name}</span>
                          </div>
                          <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded border ${getRiskBadgeColor(meta.riskLevel)}`}>
                            {meta.riskLevel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-medium mb-1.5 leading-snug">
                          {meta.tagline}
                        </p>
                        <p className="text-[10px] text-trading-muted leading-relaxed line-clamp-2">
                          {meta.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-trading-border/60 flex items-center justify-between text-[10px] font-mono text-trading-muted">
                        <span>Fokus:</span>
                        <span className="text-trading-accent font-semibold">{meta.targetAssets.map((a) => a.split('/')[0]).join(', ')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Schritt 2: Budget-Wahl */}
          <section className="bg-trading-bg p-4 rounded-xl border border-trading-border">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-trading-muted font-bold">
                <DollarSign className="w-3.5 h-3.5 text-trading-buy" />
                <span>2. Investitions-Budget festlegen</span>
              </div>
              <div className="text-xs font-mono">
                <span className="text-trading-muted mr-2">Verfügbares Bargeld:</span>
                <span className="text-white font-bold">
                  {availableCash.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <input
                  type="number"
                  min="10"
                  max={availableCash}
                  value={budgetInput}
                  onChange={(e) => {
                    setBudgetInput(e.target.value);
                    setExecutionResult(null);
                    setErrorMessage(null);
                  }}
                  placeholder="Budget in €"
                  className="w-full bg-trading-surface border border-trading-border rounded-lg pl-3 pr-8 py-2 text-sm font-mono text-white focus:outline-none focus:border-trading-accent transition font-bold"
                />
                <span className="absolute right-3 top-2.5 text-xs text-trading-muted font-mono font-bold">€</span>
              </div>

              {/* Quick Chips in EUR */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {[100, 250, 500, 1000, 2500].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => handleQuickBudget(amt)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono transition ${
                      budgetNum === amt
                        ? 'bg-trading-accent/20 border-trading-accent text-trading-accent font-bold'
                        : 'bg-trading-surface border-trading-border text-trading-muted hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {amt} €
                  </button>
                ))}
              </div>

              {/* Quick Chips in Percent of Cash */}
              <div className="flex items-center gap-1.5 border-l border-trading-border pl-2 ml-1">
                {[25, 50, 100].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => handlePercentBudget(pct)}
                    className="px-2 py-1.5 rounded-lg border border-trading-border bg-trading-surface text-[11px] font-mono text-trading-muted hover:text-emerald-400 hover:border-emerald-500/40 transition font-medium"
                    title={`${pct}% des virtuellen Guthabens investieren`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Fehlerhinweis bei Budget-Überschreitung */}
            {plan.validationError && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{plan.validationError}</span>
              </div>
            )}
          </section>

          {/* Schritt 3: Allokations- & Auswahl-Vorschau */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-trading-muted font-bold">
                <PieChart className="w-3.5 h-3.5 text-trading-accent" />
                <span>3. Automatische Krypto-Auswahl & Gewichtungs-Vorschau</span>
              </div>
              <span className="text-[11px] text-trading-muted font-mono">
                {plan.allocations.length} Krypto-Assets ausgewählt • Summe: <strong>100%</strong>
              </span>
            </div>

            <div className="border border-trading-border rounded-xl overflow-hidden bg-trading-bg">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-trading-surface border-b border-trading-border text-[10px] text-trading-muted uppercase">
                    <tr>
                      <th className="p-3">Krypto-Asset</th>
                      <th className="p-3">Gewichtung</th>
                      <th className="p-3 text-right">EUR-Allokation</th>
                      <th className="p-3 text-right">Token-Menge</th>
                      <th className="p-3 text-right">Kurs</th>
                      <th className="p-3 text-center">Score</th>
                      <th className="p-3">Begründung (Quantitative Rationale)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-trading-border/60">
                    {plan.allocations.map((item) => (
                      <tr key={item.symbol} className="hover:bg-trading-card/40 transition group">
                        <td className="p-3">
                          <button
                            onClick={() => {
                              if (onSelectSymbol) onSelectSymbol(item.symbol);
                            }}
                            className="text-left group-hover:text-trading-accent transition flex items-center gap-2"
                            title="Im Terminal-Chart anzeigen"
                          >
                            <span className="font-bold text-white group-hover:text-trading-accent">{item.symbol}</span>
                            <span className="text-[10px] text-trading-muted">{item.name}</span>
                          </button>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white w-10">{item.weightPercent}%</span>
                            <div className="w-16 bg-trading-surface h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-400 h-full rounded-full"
                                style={{ width: `${item.weightPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="p-3 text-right font-bold text-white">
                          {item.allocatedEur.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </td>

                        <td className="p-3 text-right font-semibold text-sky-400">
                          {item.amount.toLocaleString('de-DE', { maximumFractionDigits: item.price > 1000 ? 6 : 4 })}
                        </td>

                        <td className="p-3 text-right text-trading-muted">
                          {item.price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </td>

                        <td className="p-3 text-center">
                          <span className="px-1.5 py-0.5 rounded bg-trading-surface border border-trading-border text-[10px] font-bold text-emerald-400">
                            {item.confluenceScore}/100
                          </span>
                        </td>

                        <td className="p-3 text-[11px] text-slate-300 font-sans">
                          {item.rationale}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Kosten- und Slippage-Übersicht */}
              <div className="p-3 bg-trading-surface/60 border-t border-trading-border flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                <div className="flex items-center gap-4">
                  <span className="text-trading-muted">
                    Geschätzte Gebühren: <strong className="text-white">~{plan.totalFees.toFixed(2)} €</strong> (0.1% Taker)
                  </span>
                  <span className="text-trading-muted">
                    Geschätzte Slippage: <strong className="text-white">~{plan.totalSlippage.toFixed(2)} €</strong> (0.05%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-trading-muted uppercase text-[10px]">Gesamtinvestition:</span>
                  <span className="text-base font-bold font-mono text-emerald-400">
                    {plan.totalAllocated.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Ausführungs-Ergebnis bei Erfolg */}
          {executionResult && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40 animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold font-mono text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Krypto-Basket erfolgreich im Portfolio platziert!</span>
                </div>
                <span className="text-xs font-mono text-trading-muted">
                  {new Date(executionResult.timestamp).toLocaleTimeString('de-DE')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                {executionResult.executedOrders.map((ord) => (
                  <div key={ord.orderId} className="bg-trading-bg/80 p-2.5 rounded-lg border border-emerald-500/20 text-xs font-mono">
                    <div className="flex items-center justify-between text-white font-bold mb-1">
                      <span>{ord.symbol}</span>
                      <span className="text-emerald-400">GEFÜLLT</span>
                    </div>
                    <div className="text-[11px] text-trading-muted flex flex-col gap-0.5">
                      <span>Menge: {ord.amount}</span>
                      <span>Kurs: {ord.price.toFixed(2)} €</span>
                      <span>Gesamt: {ord.totalCost.toFixed(2)} €</span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-slate-300">
                Die Positionen sind nun aktiv und werden im <strong>Position Tracker</strong> überwacht. Stop-Loss und Trailing-Regeln greifen gemäß System-Protokoll.
              </p>
            </div>
          )}

          {/* Fehlermeldung */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer mit Action Buttons */}
        <div className="p-4 border-t border-trading-border bg-trading-bg/80 flex flex-wrap items-center justify-between gap-4">
          {/* DCA / Sparplan Switch */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dcaEnabled}
              onChange={(e) => setDcaEnabled(e.target.checked)}
              className="rounded bg-trading-surface border-trading-border text-trading-accent focus:ring-0 w-4 h-4"
            />
            <div className="text-xs font-mono">
              <span className="text-white font-bold block">Autopilot / Sparplan-Modus</span>
              <span className="text-[10px] text-trading-muted">
                {dcaEnabled ? 'Regelmäßige Wiederholung bei Signal-Konfluenz aktiv' : 'Einmalige Ausführung'}
              </span>
            </div>
          </label>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-trading-card hover:bg-slate-700 text-trading-muted hover:text-white text-xs font-mono transition"
            >
              Schließen
            </button>

            <button
              onClick={handleExecute}
              disabled={!plan.isExecutable || isExecuting}
              className={`px-6 py-2.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-lg ${
                plan.isExecutable && !isExecuting
                  ? 'bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-black shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>Orders werden ausgeführt...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-black" />
                  <span>
                    {isAutonomousMode ? '🚀 Krypto-Auswahl übernehmen & Jetzt investieren' : 'Auswahl bestätigen & Investieren'} ({plan.totalAllocated.toFixed(0)} €)
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
