'use client';

import React, { useState } from 'react';
import { OrderSide, OrderType } from '../../lib/types/trading';
import { Shield, ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react';

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
}

export const OrderPanel: React.FC<OrderPanelProps> = ({
  currentPrice,
  symbol,
  cashBalance,
  currentHolding,
  onSubmitOrder,
}) => {
  const [side, setSide] = useState<OrderSide>('BUY');
  const [type, setType] = useState<OrderType>('MARKET');
  const [amount, setAmount] = useState<string>('0.05');
  const [limitPrice, setLimitPrice] = useState<string>(currentPrice.toString());
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
        <div className="flex items-center justify-between pb-3 border-b border-trading-border/60 mb-4">
          <span className="font-bold text-sm text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            Orderbuch-Ausführung
          </span>
          <span className="text-[10px] font-mono text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Zero-Risk Sim
          </span>
        </div>

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

      <div className="pt-3 border-t border-trading-border/60 text-[10px] text-trading-muted text-center">
        Echte Marktmechanik: Taker/Maker Gebühren & Orderbuch-Slippage aktiv.
      </div>
    </div>
  );
};
