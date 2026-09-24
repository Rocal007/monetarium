'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { OrderSide, OrderType, CopilotProposal, OperatingMode } from '../../lib/types/trading';
import { Shield, ArrowUpRight, ArrowDownRight, AlertCircle, Zap, UserCheck, Sparkles, RefreshCw, CheckCircle2 } from 'lucide-react';
import { evaluateAutonomousCryptoDecision } from '../../lib/crypto/crypto-allocator';
import { CryptoBasketExecutionResult } from '../../lib/types/crypto-allocator';

interface OrderPanelProps {
  currentPrice: number;
  symbol: string;
  cashBalance: number;
  currentHolding: number;
  onSubmitOrder: (params: {
    side: OrderSide;
    type: OrderType;
    amount: number;
    price?: number;
    stopLoss?: number;
    takeProfit?: number;
  }) => void;
  onOpenCryptoAutoInvest?: () => void;
  pendingProposal?: CopilotProposal | null;
  operatingMode?: OperatingMode;
  onExecuteAutonomousBasket?: (budget?: number) => Promise<CryptoBasketExecutionResult>;
  vixPrice?: number;
  macroRegime?: string;
}

export const OrderPanel: React.FC<OrderPanelProps> = ({
  currentPrice,
  symbol,
  cashBalance,
  currentHolding,
  onSubmitOrder,
  onOpenCryptoAutoInvest,
  pendingProposal,
  operatingMode,
  onExecuteAutonomousBasket,
  vixPrice,
  macroRegime,
}) => {
  const [panelMode, setPanelMode] = useState<'AUTONOMOUS' | 'MANUAL'>('AUTONOMOUS');
  const [autoBudget, setAutoBudget] = useState<string>('1000');
  const [isAutoExecuting, setIsAutoExecuting] = useState<boolean>(false);
  const [autoSuccessMsg, setAutoSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const defaultSizing = Math.min(cashBalance, Math.max(100, Math.floor(cashBalance * 0.25)));
    setAutoBudget(defaultSizing.toString());
  }, [cashBalance]);

  const autoBudgetNum = Math.max(0, parseFloat(autoBudget) || 0);

  const autonomousDecision = useMemo(() => {
    return evaluateAutonomousCryptoDecision({
      availableCash: cashBalance,
      vixPrice: vixPrice ?? 16.5,
      macroRegime: macroRegime ?? 'RISK_ON',
      customBudget: autoBudgetNum > 0 ? autoBudgetNum : undefined,
    });
  }, [cashBalance, autoBudgetNum, vixPrice, macroRegime]);

  const handleRunAutonomous = async () => {
    if (!onExecuteAutonomousBasket) {
      if (onOpenCryptoAutoInvest) onOpenCryptoAutoInvest();
      return;
    }
    try {
      setIsAutoExecuting(true);
      setAutoSuccessMsg(null);
      setErrorMsg(null);
      const res = await onExecuteAutonomousBasket(autoBudgetNum > 0 ? autoBudgetNum : undefined);
      if (res.success) {
        setAutoSuccessMsg(`✓ ${res.executedOrders.length} Krypto-Orders erfolgreich platziert (${res.totalInvested.toFixed(0)} € investiert)!`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Fehler beim autonomen Krypto-Investment');
    } finally {
      setIsAutoExecuting(false);
    }
  };

  const [side, setSide] = useState<OrderSide>('BUY');
  const [type, setType] = useState<OrderType>('MARKET');
  const [amount, setAmount] = useState<string>('0.05');
  const [limitPrice, setLimitPrice] = useState<string>(currentPrice.toString());
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Synchronisiere Limitpreis und Standardmenge bei Asset-Wechsel
  useEffect(() => {
    setLimitPrice(currentPrice.toString());
    if (currentPrice > 10000) {
      setAmount('0.01');
    } else if (currentPrice > 1000) {
      setAmount('0.1');
    } else if (currentPrice > 50) {
      setAmount('1');
    } else {
      setAmount('10');
    }
  }, [symbol, currentPrice]);

  const numAmount = parseFloat(amount) || 0;
  const targetPrice = type === 'MARKET' ? currentPrice : parseFloat(limitPrice) || currentPrice;
  const orderValue = numAmount * targetPrice;
  const estimatedFee = orderValue * 0.001; // 0.1% Taker
  const estimatedSlippage = orderValue * 0.0005; // 0.05%

  const handleQuickPercent = (pct: number) => {
    if (side === 'BUY') {
      const maxSpend = (cashBalance * pct) / 100;
      const calcAmount = maxSpend / currentPrice;
      setAmount(calcAmount.toFixed(4));
    } else {
      const calcAmount = (currentHolding * pct) / 100;
      setAmount(calcAmount.toFixed(4));
    }
  };

  const handleExecute = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (numAmount <= 0) {
      setErrorMsg('Bitte gib einen gültigen Betrag größer als 0 ein.');
      return;
    }

    if (side === 'BUY' && orderValue + estimatedFee > cashBalance) {
      setErrorMsg('Unzureichendes virtuelles Guthaben für diesen Kauf.');
      return;
    }

    if (side === 'SELL' && numAmount > currentHolding) {
      setErrorMsg(`Verkauf übersteigt deinen Bestand von ${currentHolding.toFixed(4)}.`);
      return;
    }

    try {
      onSubmitOrder({
        side,
        type,
        amount: numAmount,
        price: type === 'LIMIT' ? parseFloat(limitPrice) : undefined,
        stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
        takeProfit: takeProfit ? parseFloat(takeProfit) : undefined,
      });
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Fehler bei der Orderausführung');
    }
  };

  return (
    <div className="bg-trading-surface border border-trading-border rounded-xl p-4 flex flex-col justify-between">
      <div>
        {/* Panel Header & Mode Switcher */}
        <div className="flex items-center justify-between pb-3 border-b border-trading-border/60 mb-4">
          <div className="flex bg-trading-bg p-0.5 rounded-lg border border-trading-border text-xs font-mono">
            <button
              type="button"
              onClick={() => { setPanelMode('AUTONOMOUS'); setAutoSuccessMsg(null); setErrorMsg(null); }}
              className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1.5 ${
                panelMode === 'AUTONOMOUS'
                  ? 'bg-gradient-to-r from-emerald-500/25 via-sky-500/20 to-amber-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-trading-muted hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>⚡ KI-Vollautonomie</span>
            </button>
            <button
              type="button"
              onClick={() => { setPanelMode('MANUAL'); setAutoSuccessMsg(null); setErrorMsg(null); }}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                panelMode === 'MANUAL'
                  ? 'bg-trading-card text-white font-bold shadow-sm'
                  : 'text-trading-muted hover:text-white'
              }`}
            >
              Manuelle Order
            </button>
          </div>

          <span className="text-[10px] font-mono text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            {panelMode === 'AUTONOMOUS' ? 'Auto-Allocation' : 'Zero-Risk Sim'}
          </span>
        </div>

        {panelMode === 'AUTONOMOUS' ? (
          /* ======================== AUTONOMER KI-INVESTITIONS-MODUS ======================== */
          <div className="space-y-3.5">
            {/* AI Assessment Card */}
            <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-500/15 via-sky-500/10 to-amber-500/15 border border-emerald-500/40 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  KI-Marktregime erkannt
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  {autonomousDecision.assessment.marketRegime} ({autonomousDecision.assessment.confidenceScore}%)
                </span>
              </div>
              <p className="text-[11px] text-slate-200 leading-snug mb-2 font-medium">
                {autonomousDecision.assessment.rationale}
              </p>
              <div className="text-[10px] font-mono text-trading-muted flex items-center justify-between border-t border-trading-border/50 pt-1.5">
                <span>Strategie: <strong className="text-emerald-400">{autonomousDecision.plan.strategyMeta.name}</strong></span>
                <span className="text-white font-semibold">100% KI-Auswahl</span>
              </div>
            </div>

            {/* Selected Assets Preview */}
            <div>
              <div className="flex justify-between items-center mb-1.5 text-[11px] font-mono">
                <span className="text-trading-muted">KI-Token-Allokation (Summe 100%):</span>
                <span className="text-white font-bold">{autonomousDecision.plan.allocations.length} Krypto-Werte</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {autonomousDecision.plan.allocations.map((item) => (
                  <div key={item.symbol} className="bg-trading-bg p-2 rounded-lg border border-trading-border flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span className="text-white">{item.symbol.split('/')[0]}</span>
                      <span className="text-emerald-400">{item.weightPercent}%</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-trading-muted mt-1">
                      <span>{item.allocatedEur.toFixed(0)} €</span>
                      <span>{item.amount} Stk.</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Budget Input & Quick Chips */}
            <div>
              <div className="flex justify-between items-center mb-1 text-[11px] font-mono">
                <span className="text-trading-muted">Investitions-Budget (€):</span>
                <span className="text-[10px] text-trading-muted">
                  Verfügbar: {cashBalance.toLocaleString('de-DE', { maximumFractionDigits: 2 })} €
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="50"
                  min="50"
                  max={cashBalance}
                  value={autoBudget}
                  onChange={(e) => {
                    setAutoBudget(e.target.value);
                    setAutoSuccessMsg(null);
                    setErrorMsg(null);
                  }}
                  className="w-full bg-trading-bg border border-trading-border rounded-lg pl-3 pr-8 py-2 text-white font-mono text-xs font-bold focus:outline-none focus:border-trading-accent"
                />
                <span className="absolute right-3 top-2 text-xs font-mono text-trading-muted">€</span>
              </div>

              {/* Quick Chips */}
              <div className="grid grid-cols-4 gap-1.5 pt-1.5">
                {[250, 500, 1000, 2500].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setAutoBudget(val.toString());
                      setAutoSuccessMsg(null);
                      setErrorMsg(null);
                    }}
                    className={`py-1 rounded text-[10px] font-mono border transition ${
                      autoBudgetNum === val
                        ? 'bg-trading-accent/20 border-trading-accent text-trading-accent font-bold'
                        : 'bg-trading-bg border-trading-border text-trading-muted hover:text-white'
                    }`}
                  >
                    {val} €
                  </button>
                ))}
              </div>
            </div>

            {/* Success Message */}
            {autoSuccessMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{autoSuccessMsg}</span>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-mono flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 1-Click Autonomous Execution Button */}
            <button
              type="button"
              onClick={handleRunAutonomous}
              disabled={isAutoExecuting || autoBudgetNum <= 0 || autoBudgetNum > cashBalance}
              className={`w-full py-3 rounded-lg font-black uppercase tracking-wider text-xs transition-all shadow-lg flex items-center justify-center gap-2 ${
                isAutoExecuting || autoBudgetNum <= 0 || autoBudgetNum > cashBalance
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 via-sky-500 to-emerald-400 hover:from-emerald-400 hover:to-sky-400 text-black shadow-emerald-500/20'
              }`}
            >
              {isAutoExecuting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>Orders werden platziert...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-black" />
                  <span>Krypto-Auswahl übernehmen & Jetzt investieren ({autonomousDecision.plan.totalAllocated.toFixed(0)} €)</span>
                </>
              )}
            </button>

            {/* Deep Modal Link */}
            {onOpenCryptoAutoInvest && (
              <button
                type="button"
                onClick={onOpenCryptoAutoInvest}
                className="w-full text-center text-[11px] font-mono text-trading-muted hover:text-white transition pt-1 block underline"
              >
                Vollständige Allokations-Matrix & Details anzeigen →
              </button>
            )}
          </div>
        ) : (
          /* ======================== MANUELLER ORDER-MODUS ======================== */
          <div>
            {/* Copilot Quick Autofill Proposal Banner */}
            {pendingProposal && pendingProposal.symbol === symbol && (
              <div 
                onClick={() => {
                  setSide(pendingProposal.side);
                  setType(pendingProposal.type);
                  setAmount(pendingProposal.amount.toString());
                  if (pendingProposal.type === 'LIMIT') {
                    setLimitPrice(pendingProposal.expectedPrice.toString());
                  }
                  if (pendingProposal.suggestedStopLoss) {
                    setStopLoss(pendingProposal.suggestedStopLoss.toString());
                  }
                  if (pendingProposal.suggestedTakeProfit) {
                    setTakeProfit(pendingProposal.suggestedTakeProfit.toString());
                  }
                }}
                className="mb-3 p-2.5 rounded-lg bg-sky-950/50 border border-sky-500/50 hover:border-sky-400 cursor-pointer transition flex items-center justify-between group shadow-sm shadow-sky-500/10"
                title="Copilot-Signal in die Maske übernehmen"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-sky-500/20 text-sky-400">
                    <UserCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-sky-300 block group-hover:text-white transition">
                      Copilot-Vorschlag für {symbol} übernehmen
                    </span>
                    <span className="text-[10px] text-trading-muted block">
                      {pendingProposal.side} {pendingProposal.amount} @ {pendingProposal.expectedPrice.toLocaleString('de-DE')} € ({pendingProposal.strategyUsed.split('_')[0]})
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-bold group-hover:bg-sky-500 group-hover:text-black transition">
                  Einfügen
                </span>
              </div>
            )}

            {/* Buy / Sell Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-trading-bg rounded-lg border border-trading-border mb-4">
          <button
            type="button"
            onClick={() => setSide('BUY')}
            className={`py-2 rounded-md font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              side === 'BUY'
                ? 'bg-trading-buy text-black shadow-lg font-black'
                : 'text-trading-muted hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" /> Kaufen (Long)
          </button>
          <button
            type="button"
            onClick={() => setSide('SELL')}
            className={`py-2 rounded-md font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              side === 'SELL'
                ? 'bg-trading-sell text-white shadow-lg font-black'
                : 'text-trading-muted hover:text-white'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" /> Verkaufen (Short/Exit)
          </button>
        </div>

        {/* Order Type Selector */}
        <div className="flex gap-2 mb-4 text-xs font-mono">
          <button
            type="button"
            onClick={() => setType('MARKET')}
            className={`flex-1 py-1 px-2 rounded border text-center transition ${
              type === 'MARKET'
                ? 'bg-trading-card text-trading-accent border-trading-accent/40 font-bold'
                : 'bg-trading-bg text-trading-muted border-trading-border'
            }`}
          >
            Market
          </button>
          <button
            type="button"
            onClick={() => setType('LIMIT')}
            className={`flex-1 py-1 px-2 rounded border text-center transition ${
              type === 'LIMIT'
                ? 'bg-trading-card text-trading-accent border-trading-accent/40 font-bold'
                : 'bg-trading-bg text-trading-muted border-trading-border'
            }`}
          >
            Limit
          </button>
        </div>

        <form onSubmit={handleExecute} className="space-y-3 font-mono text-xs">
          {/* Limit Price Input if type is LIMIT */}
          {type === 'LIMIT' && (
            <div>
              <label className="block text-[11px] text-trading-muted mb-1">Limit Preis (€)</label>
              <input
                type="number"
                step="any"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="w-full bg-trading-bg border border-trading-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-trading-accent"
              />
            </div>
          )}

          {/* Amount Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] text-trading-muted">Menge ({symbol.split('/')[0]})</label>
              <span className="text-[10px] text-trading-muted">
                {side === 'BUY'
                  ? `Verfügbar: ${cashBalance.toLocaleString('de-DE', { maximumFractionDigits: 2 })} €`
                  : `Bestand: ${currentHolding.toFixed(4)}`}
              </span>
            </div>
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-trading-bg border border-trading-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-trading-accent"
            />
          </div>

          {/* Quick Percentage Buttons */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {[25, 50, 75, 100].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => handleQuickPercent(pct)}
                className="py-1 bg-trading-bg hover:bg-trading-card border border-trading-border rounded text-[10px] text-trading-muted hover:text-white transition"
              >
                {pct}%
              </button>
            ))}
          </div>

          {/* Stop-Loss & Take-Profit Optional */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div>
              <label className="block text-[10px] text-trading-muted mb-1">Stop-Loss (€)</label>
              <input
                type="number"
                step="any"
                placeholder="Optional"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                className="w-full bg-trading-bg border border-trading-border rounded-lg px-2.5 py-1.5 text-white text-[11px] focus:outline-none focus:border-trading-sell"
              />
            </div>
            <div>
              <label className="block text-[10px] text-trading-muted mb-1">Take-Profit (€)</label>
              <input
                type="number"
                step="any"
                placeholder="Optional"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                className="w-full bg-trading-bg border border-trading-border rounded-lg px-2.5 py-1.5 text-white text-[11px] focus:outline-none focus:border-trading-buy"
              />
            </div>
          </div>

          {/* Order Summary & Realistic Slippage/Fee Preview */}
          <div className="bg-trading-bg p-2.5 rounded-lg border border-trading-border space-y-1.5 text-[11px]">
            <div className="flex justify-between text-trading-muted">
              <span>Orderwert:</span>
              <span className="text-white font-bold">{orderValue.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-trading-muted">
              <span>Geschätzte Gebühr (0.1%):</span>
              <span className="text-trading-text">{estimatedFee.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-trading-muted">
              <span>Simulierte Slippage (~0.05%):</span>
              <span className="text-amber-400">~{estimatedSlippage.toFixed(2)} €</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

            {/* Execution Button */}
            <button
              type="submit"
              className={`w-full py-3 rounded-lg font-black uppercase tracking-wider text-xs transition-all shadow-lg ${
                side === 'BUY'
                  ? 'bg-trading-buy hover:bg-trading-buyHover text-black'
                  : 'bg-trading-sell hover:bg-trading-sellHover text-white'
              }`}
            >
              {side === 'BUY' ? `Kauf ${numAmount} ${symbol.split('/')[0]} platzieren` : `Verkauf ${numAmount} ${symbol.split('/')[0]} platzieren`}
            </button>
          </form>
        </div>
      )}
    </div>

      <div className="pt-3 border-t border-trading-border/60 text-[10px] text-trading-muted text-center">
        Echte Marktmechanik: Taker/Maker Gebühren & Orderbuch-Slippage aktiv.
      </div>
    </div>
  );
};
