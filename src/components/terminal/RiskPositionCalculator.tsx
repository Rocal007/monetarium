'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Sliders,
  DollarSign,
  PlayCircle,
  Scale,
  Zap,
  Calculator,
} from 'lucide-react';
import { OrderSide, OrderType } from '../../lib/types/trading';

interface RiskPositionCalculatorProps {
  currentPrice: number;
  symbol: string;
  cashBalance: number;
  onExecuteSimulatedTrade: (params: {
    side: OrderSide;
    type: OrderType;
    amount: number;
    price: number;
    stopLoss: number;
    takeProfit: number;
    riskPercent: number;
    crvMultiplier: number;
  }) => void;
}

export const RiskPositionCalculator: React.FC<RiskPositionCalculatorProps> = ({
  currentPrice,
  symbol,
  cashBalance,
  onExecuteSimulatedTrade,
}) => {
  // 1. Schieberegler Zustände
  const [tradeCapital, setTradeCapital] = useState<number>(500); // Kapital in $
  const [riskTolerancePercent, setRiskTolerancePercent] = useState<number>(2.0); // Stop-Loss Puffer in %
  const [crvMultiplier, setCrvMultiplier] = useState<number>(2.5); // Chance-Risiko Multiplikator (1:2.5)

  // 2. Mathematische Ableitung (Kelly & Risiko-Allokation)
  const calculations = useMemo(() => {
    const capital = Math.min(tradeCapital, cashBalance > 0 ? cashBalance : tradeCapital);
    const amount = currentPrice > 0 ? capital / currentPrice : 0;

    // Stop Loss & Take Profit Preise (richtungsabhängig)
    const stopLossDistance = currentPrice * (riskTolerancePercent / 100);
    const stopLossPriceBuy = Math.max(0, currentPrice - stopLossDistance);
    const takeProfitDistance = stopLossDistance * crvMultiplier;
    const takeProfitPriceBuy = currentPrice + takeProfitDistance;

    const stopLossPriceSell = currentPrice + stopLossDistance;
    const takeProfitPriceSell = Math.max(0, currentPrice - takeProfitDistance);

    // Absolute Beträge in Euro / USD
    const maxLossAmount = amount * stopLossDistance;
    const targetGainAmount = amount * takeProfitDistance;

    // Kelly-Kriterium Näherung (bei 55% Winrate und gewähltem CRV)
    const p = 0.55;
    const b = crvMultiplier;
    const kellyFraction = Math.max(0, Math.min(0.25, (p * b - (1 - p)) / b));
    const recommendedCapital = (cashBalance > 0 ? cashBalance : 10000) * kellyFraction;

    return {
      capital,
      amount,
      stopLossPrice: stopLossPriceBuy,
      takeProfitPrice: takeProfitPriceBuy,
      stopLossPriceBuy,
      takeProfitPriceBuy,
      stopLossPriceSell,
      takeProfitPriceSell,
      maxLossAmount,
      targetGainAmount,
      recommendedCapital,
      kellyFraction,
    };
  }, [tradeCapital, cashBalance, currentPrice, riskTolerancePercent, crvMultiplier]);

  const handleQuickExecute = (side: OrderSide) => {
    if (currentPrice <= 0 || calculations.amount <= 0) return;

    const stopLoss = side === 'BUY' ? calculations.stopLossPriceBuy : calculations.stopLossPriceSell;
    const takeProfit = side === 'BUY' ? calculations.takeProfitPriceBuy : calculations.takeProfitPriceSell;

    onExecuteSimulatedTrade({
      side,
      type: 'MARKET',
      amount: calculations.amount,
      price: currentPrice,
      stopLoss,
      takeProfit,
      riskPercent: riskTolerancePercent,
      crvMultiplier,
    });
  };

  return (
    <div className="bg-trading-surface border border-trading-border rounded-xl p-4 font-mono flex flex-col gap-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-trading-border/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-white">Risk & Position Calculator</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30 font-semibold">
                Kelly f* & CRV
              </span>
            </div>
            <p className="text-[10px] text-trading-muted">
              Dynamische Allokation & Chance-Risiko-Modellierung für {symbol}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-trading-muted block">Verfügbar:</span>
          <span className="text-xs font-bold text-white">
            {cashBalance.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
          </span>
        </div>
      </div>

      {/* Regler-Sektion */}
      <div className="space-y-3.5 bg-trading-bg p-3 rounded-lg border border-trading-border">
        {/* Slider 1: Kapital */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-trading-muted flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-trading-accent" />
              1. Positionskapital:
            </span>
            <span className="font-bold text-white font-mono">{tradeCapital} $</span>
          </div>
          <input
            type="range"
            min={50}
            max={Math.max(2000, Math.floor(cashBalance))}
            step={25}
            value={tradeCapital}
            onChange={(e) => setTradeCapital(Number(e.target.value))}
            className="w-full accent-trading-accent cursor-pointer h-1.5 bg-slate-700 rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[10px] text-trading-muted">
            <span>50 $</span>
            <span>Kelly Empfehlung: ~{calculations.recommendedCapital.toFixed(0)} $</span>
            <span>{Math.max(2000, Math.floor(cashBalance))} $</span>
          </div>
        </div>

        {/* Slider 2: Stop-Loss Puffer */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-trading-muted flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
              2. Stop-Loss Puffer:
            </span>
            <span className="font-bold text-rose-400 font-mono">-{riskTolerancePercent.toFixed(1)} %</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={6.0}
            step={0.5}
            value={riskTolerancePercent}
            onChange={(e) => setRiskTolerancePercent(Number(e.target.value))}
            className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[10px] text-trading-muted">
            <span>0.5% (Eng)</span>
            <span>2.0% (Standard)</span>
            <span>6.0% (Weit/Volatil)</span>
          </div>
        </div>

        {/* Slider 3: Chance-Risiko-Multiplikator */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-trading-muted flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-emerald-400" />
              3. Zielrendite (CRV):
            </span>
            <span className="font-bold text-emerald-400 font-mono">1 : {crvMultiplier.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={1.0}
            max={4.0}
            step={0.5}
            value={crvMultiplier}
            onChange={(e) => setCrvMultiplier(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[10px] text-trading-muted">
            <span>1:1.0 (Ausgeglichen)</span>
            <span>1:2.5 (Empfohlen)</span>
            <span>1:4.0 (Offensiv)</span>
          </div>
        </div>
      </div>

      {/* Ergebnis-Vorschau */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* Worst Case */}
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 flex flex-col gap-1">
          <span className="text-[10px] text-rose-300 uppercase font-bold tracking-wider">
            Maximaler Verlust (SL)
          </span>
          <span className="text-xl font-bold text-rose-400 font-mono">
            -{calculations.maxLossAmount.toFixed(2)} $
          </span>
          <span className="text-[10px] text-trading-muted">
            Kurs bei: {calculations.stopLossPrice.toFixed(2)} $
          </span>
        </div>

        {/* Best Case */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex flex-col gap-1">
          <span className="text-[10px] text-emerald-300 uppercase font-bold tracking-wider">
            Ziel-Gewinn (TP)
          </span>
          <span className="text-xl font-bold text-emerald-400 font-mono">
            +{calculations.targetGainAmount.toFixed(2)} $
          </span>
          <span className="text-[10px] text-trading-muted">
            Kurs bei: {calculations.takeProfitPrice.toFixed(2)} $
          </span>
        </div>

        {/* Positionsgröße */}
        <div className="bg-trading-bg border border-trading-border rounded-lg p-3 flex flex-col gap-1">
          <span className="text-[10px] text-trading-muted uppercase font-bold tracking-wider">
            Positionsgröße
          </span>
          <span className="text-xl font-bold text-white font-mono">
            {calculations.amount < 1 ? calculations.amount.toFixed(4) : calculations.amount.toFixed(2)}
          </span>
          <span className="text-[10px] text-sky-400 truncate">
            {symbol} @ {currentPrice.toFixed(2)} $
          </span>
        </div>
      </div>

      {/* Ausführungs-Buttons */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={() => handleQuickExecute('BUY')}
          disabled={currentPrice <= 0 || calculations.amount <= 0}
          className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/30 cursor-pointer"
        >
          <PlayCircle className="w-4 h-4" />
          Long Order Ausführen
        </button>

        <button
          onClick={() => handleQuickExecute('SELL')}
          disabled={currentPrice <= 0 || calculations.amount <= 0}
          className="flex-1 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/30 cursor-pointer"
        >
          <PlayCircle className="w-4 h-4" />
          Short / Sell Ausführen
        </button>
      </div>
    </div>
  );
};
