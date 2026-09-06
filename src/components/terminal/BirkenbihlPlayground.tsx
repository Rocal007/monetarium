'use client';

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Sliders,
  DollarSign,
  HelpCircle,
  PlayCircle,
  Scale,
  Brain,
  Zap,
} from 'lucide-react';
import { OrderSide, OrderType } from '../../lib/types/trading';

interface BirkenbihlPlaygroundProps {
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

export const BirkenbihlPlayground: React.FC<BirkenbihlPlaygroundProps> = ({
  currentPrice,
  symbol,
  cashBalance,
  onExecuteSimulatedTrade,
}) => {
  // 1. Schieberegler Zustände
  const [tradeCapital, setTradeCapital] = useState<number>(500); // Kapital in $
  const [riskTolerancePercent, setRiskTolerancePercent] = useState<number>(2.0); // Stop-Loss Puffer in %
  const [crvMultiplier, setCrvMultiplier] = useState<number>(2.5); // Chance-Risiko Multiplikator (1:2.5)

  // 2. Mathematische Ableitung (Intuitive Dekodierung)
  const calculations = useMemo(() => {
    const capital = Math.min(tradeCapital, cashBalance > 0 ? cashBalance : tradeCapital);
    const amount = currentPrice > 0 ? capital / currentPrice : 0;

    // Stop Loss & Take Profit Preise
    const stopLossDistance = currentPrice * (riskTolerancePercent / 100);
    const stopLossPrice = Math.max(0, currentPrice - stopLossDistance);

    const takeProfitDistance = stopLossDistance * crvMultiplier;
    const takeProfitPrice = currentPrice + takeProfitDistance;

    // Absolute Beträge in Euro / USD
    const maxLossAmount = amount * stopLossDistance;
    const targetGainAmount = amount * takeProfitDistance;

    // Birkenbihl-Urteil & Ampel
    let rating = 'EXCELLENT';
    let ratingText = 'Hervorragend: Der Zielgewinn übertrifft das Verlustrisiko um mehr als das Doppelte.';
    let ratingColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';

    if (crvMultiplier < 1.5) {
      rating = 'POOR';
      ratingText = 'Ungünstig: Das Risiko steht in keinem gesunden Verhältnis zum Ertrag (Pauken-Gefahr).';
      ratingColor = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    } else if (crvMultiplier < 2.0) {
      rating = 'FAIR';
      ratingText = 'Solide: Brauchbares Verhältnis, erfordert aber strikte Ausstiegsdisziplin.';
      ratingColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    }

    return {
      capital,
      amount,
      stopLossPrice,
      takeProfitPrice,
      maxLossAmount,
      targetGainAmount,
      rating,
      ratingText,
      ratingColor,
    };
  }, [currentPrice, tradeCapital, riskTolerancePercent, crvMultiplier, cashBalance]);

  const handleSimulateClick = () => {
    onExecuteSimulatedTrade({
      side: 'BUY',
      type: 'MARKET',
      amount: Number(calculations.amount.toFixed(4)),
      price: currentPrice,
      stopLoss: Number(calculations.stopLossPrice.toFixed(2)),
      takeProfit: Number(calculations.takeProfitPrice.toFixed(2)),
      riskPercent: riskTolerancePercent,
      crvMultiplier,
    });
  };

  return (
    <div className="bg-trading-surface border border-trading-border rounded-xl p-4 font-mono flex flex-col gap-4 shadow-sm">
      {/* Header mit Birkenbihl-Formel */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-trading-border/60">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Birkenbihl Neurodidaktik Playground</span>
              <span className="text-[10px] bg-pink-500/20 text-pink-300 px-1.5 py-0.5 rounded border border-pink-500/30">
                η_Spiel &gt; 1
              </span>
            </div>
            <p className="text-[10px] text-trading-muted">
              W_aktiv = Assoziation · [Dekodierung / Pauken → 0] · Spieltrieb
            </p>
          </div>
        </div>
        <div className="text-[11px] text-trading-muted">
          Symbol: <span className="text-white font-bold">{symbol}</span>
        </div>
      </div>

      {/* 3 Interaktive Schieberegler */}
      <div className="flex flex-col gap-3.5 bg-trading-card/40 border border-trading-border/50 rounded-lg p-3.5">
        {/* Slider 1: Kapitaleinsatz */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-trading-muted flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-sky-400" />
              1. Geplanter Kapitaleinsatz:
            </span>
            <span className="font-bold text-white font-mono">{tradeCapital} $</span>
          </div>
          <input
            type="range"
            min={50}
            max={Math.max(2000, Math.floor(cashBalance))}
            step={50}
            value={tradeCapital}
            onChange={(e) => setTradeCapital(Number(e.target.value))}
            className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg appearance-none"
          />
          <div className="flex justify-between text-[10px] text-trading-muted">
            <span>50 $ (Mikro)</span>
            <span>Verfügbares Cash: {cashBalance.toFixed(0)} $</span>
            <span>{Math.max(2000, Math.floor(cashBalance))} $</span>
          </div>
        </div>

        {/* Slider 2: Risikotoleranz / Stop-Loss Puffer */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-trading-muted flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
              2. Reißleine / Stop-Loss Puffer:
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
            <span>0.5% (Eng/Konservativ)</span>
            <span>2.0% (Standard)</span>
            <span>6.0% (Weit/Volatil)</span>
          </div>
        </div>

        {/* Slider 3: Chance-Risiko-Multiplikator */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-trading-muted flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-emerald-400" />
              3. Zielrendite (Chance-Risiko):
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

      {/* Birkenbihl Direkte Dekodierung (Große, klare Werte ohne Pauken) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* Worst Case */}
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 flex flex-col gap-1">
          <span className="text-[10px] text-rose-300 uppercase font-bold tracking-wider">
            Maximaler Verlust (Stop-Loss)
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
            Zielgewinn (Take-Profit)
          </span>
          <span className="text-xl font-bold text-emerald-400 font-mono">
            +{calculations.targetGainAmount.toFixed(2)} $
          </span>
          <span className="text-[10px] text-trading-muted">
            Kurs bei: {calculations.takeProfitPrice.toFixed(2)} $
          </span>
        </div>

        {/* Netto Positionsgröße */}
        <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg p-3 flex flex-col gap-1">
          <span className="text-[10px] text-sky-300 uppercase font-bold tracking-wider">
            Positionsgröße (Virtuell)
          </span>
          <span className="text-xl font-bold text-sky-400 font-mono">
            {calculations.amount.toFixed(4)} {symbol.split('/')[0]}
          </span>
          <span className="text-[10px] text-trading-muted">
            Kapitalwert: {calculations.capital.toFixed(2)} $
          </span>
        </div>
      </div>

      {/* Birkenbihl-Urteil & Ampel */}
      <div className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${calculations.ratingColor}`}>
        <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
        <div className="flex flex-col gap-0.5">
          <span className="font-bold">Neurodidaktische Bewertung:</span>
          <p className="text-[11px] leading-relaxed font-sans">{calculations.ratingText}</p>
        </div>
      </div>

      {/* Simulations-Button */}
      <button
        onClick={handleSimulateClick}
        disabled={calculations.capital <= 0}
        className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <PlayCircle className="w-4 h-4" />
        <span>Trade mit diesen Schutzschranken simulieren (Order senden)</span>
      </button>
    </div>
  );
};
