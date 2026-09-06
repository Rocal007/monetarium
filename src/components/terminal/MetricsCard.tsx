'use client';

import React from 'react';
import { QuantMetrics } from '../../lib/types/trading';
import { Percent, ShieldAlert, Award, TrendingUp, Scale, HelpCircle } from 'lucide-react';

interface MetricsCardProps {
  metrics: QuantMetrics;
  title?: string;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({ metrics, title = 'Quantitative Risikokennzahlen' }) => {
  const isSharpeGood = metrics.sharpeRatio >= 1.0;
  const isSortinoGood = metrics.sortinoRatio >= 1.5;

  return (
    <div className="bg-trading-surface border border-trading-border rounded-xl p-4">
      <div className="flex items-center justify-between pb-3 border-b border-trading-border/60 mb-3">
        <span className="font-bold text-sm text-white flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          {title}
        </span>
        <span className="text-[10px] font-mono text-trading-muted">
          Marktmechanik & Statistik
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Return */}
        <div className="bg-trading-bg p-2.5 rounded-lg border border-trading-border">
          <div className="flex items-center justify-between text-[10px] text-trading-muted mb-1">
            <span>Rendite (Gesamt)</span>
            <TrendingUp className="w-3 h-3 text-trading-buy" />
          </div>
          <div className={`text-base font-bold font-mono ${metrics.totalReturnPercent >= 0 ? 'text-trading-buy' : 'text-trading-sell'}`}>
            {metrics.totalReturnPercent >= 0 ? '+' : ''}{metrics.totalReturnPercent.toFixed(2)}%
          </div>
          <span className="text-[10px] text-trading-muted font-mono">
            {metrics.totalReturn.toFixed(2)} € PnL
          </span>
        </div>

        {/* Sharpe Ratio */}
        <div className="bg-trading-bg p-2.5 rounded-lg border border-trading-border">
          <div className="flex items-center justify-between text-[10px] text-trading-muted mb-1" title="Sharpe Ratio: Risikoadjustierte Rendite pro Einheit Volatilität (Ziel: > 1.0)">
            <span className="flex items-center gap-1">Sharpe Ratio <HelpCircle className="w-2.5 h-2.5" /></span>
            <Scale className="w-3 h-3 text-sky-400" />
          </div>
          <div className={`text-base font-bold font-mono ${isSharpeGood ? 'text-sky-400' : 'text-amber-400'}`}>
            {metrics.sharpeRatio.toFixed(2)}
          </div>
          <span className="text-[10px] text-trading-muted font-mono">
            {metrics.sharpeRatio >= 2 ? 'Exzellent' : metrics.sharpeRatio >= 1 ? 'Gut' : 'Suboptimal'}
          </span>
        </div>

        {/* Sortino Ratio */}
        <div className="bg-trading-bg p-2.5 rounded-lg border border-trading-border">
          <div className="flex items-center justify-between text-[10px] text-trading-muted mb-1" title="Sortino Ratio: Bestraft nur Verlust-Volatilität (Ziel: > 1.5)">
            <span className="flex items-center gap-1">Sortino Ratio <HelpCircle className="w-2.5 h-2.5" /></span>
            <Scale className="w-3 h-3 text-emerald-400" />
          </div>
          <div className={`text-base font-bold font-mono ${isSortinoGood ? 'text-emerald-400' : 'text-amber-400'}`}>
            {metrics.sortinoRatio.toFixed(2)}
          </div>
          <span className="text-[10px] text-trading-muted font-mono">
            Downside-Risk Fokus
          </span>
        </div>

        {/* Maximum Drawdown */}
        <div className="bg-trading-bg p-2.5 rounded-lg border border-trading-border">
          <div className="flex items-center justify-between text-[10px] text-trading-muted mb-1" title="Max Drawdown: Größter Verlust vom Allzeithoch">
            <span className="flex items-center gap-1">Max Drawdown <HelpCircle className="w-2.5 h-2.5" /></span>
            <ShieldAlert className="w-3 h-3 text-trading-sell" />
          </div>
          <div className="text-base font-bold font-mono text-trading-sell">
            -{metrics.maxDrawdownPercent.toFixed(2)}%
          </div>
          <span className="text-[10px] text-trading-muted font-mono">
            -{metrics.maxDrawdown.toFixed(2)} € Peak-to-Trough
          </span>
        </div>

        {/* Win Rate */}
        <div className="bg-trading-bg p-2.5 rounded-lg border border-trading-border">
          <div className="flex items-center justify-between text-[10px] text-trading-muted mb-1">
            <span>Trefferquote (Win Rate)</span>
            <Percent className="w-3 h-3 text-amber-400" />
          </div>
          <div className="text-base font-bold font-mono text-white">
            {metrics.winRate.toFixed(1)}%
          </div>
          <span className="text-[10px] text-trading-muted font-mono">
            {metrics.winningTrades}W / {metrics.losingTrades}L ({metrics.totalTrades} Trades)
          </span>
        </div>

        {/* Profit Factor */}
        <div className="bg-trading-bg p-2.5 rounded-lg border border-trading-border">
          <div className="flex items-center justify-between text-[10px] text-trading-muted mb-1" title="Profit Factor: Bruttogewinne / Bruttoverluste (Ziel: > 1.5)">
            <span className="flex items-center gap-1">Profit Factor <HelpCircle className="w-2.5 h-2.5" /></span>
            <Award className="w-3 h-3 text-sky-400" />
          </div>
          <div className={`text-base font-bold font-mono ${metrics.profitFactor >= 1.5 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {metrics.profitFactor.toFixed(2)}
          </div>
          <span className="text-[10px] text-trading-muted font-mono">
            {metrics.profitFactor >= 1.0 ? 'Profitabel' : 'Defizitär'}
          </span>
        </div>
      </div>
    </div>
  );
};
