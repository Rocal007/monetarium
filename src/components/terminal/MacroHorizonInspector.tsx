'use client';

import React, { useState, useMemo } from 'react';
import { Candle } from '../../lib/types/trading';
import { calculateHorizonPerformances } from '../../lib/analytics/horizon-analytics';
import { MacroPeriodId } from '../../lib/types/timeframe';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  Table as TableIcon,
  ChevronRight,
  ShieldAlert,
  Activity,
  ArrowUpRight,
  Maximize2
} from 'lucide-react';

interface MacroHorizonInspectorProps {
  symbol: string;
  currentPrice: number;
  candles: Candle[];
  activeTimeframe?: string;
  onSelectTimeframe: (tf: string) => void;
}

export const MacroHorizonInspector: React.FC<MacroHorizonInspectorProps> = ({
  symbol,
  currentPrice,
  candles,
  activeTimeframe,
  onSelectTimeframe,
}) => {
  const [viewMode, setViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  const horizons = useMemo(() => {
    return calculateHorizonPerformances(symbol, currentPrice, candles);
  }, [symbol, currentPrice, candles]);

  return (
    <div className="bg-trading-surface border border-trading-border rounded-xl p-3 sm:p-4 flex flex-col gap-3 min-w-0 w-full shadow-lg">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-trading-border/60 gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-white tracking-wide truncate">
                Multi-Perioden & Zeithorizont-Matrix
              </span>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                Woche • Monat • Quartal • 1J • 5J • 10J
              </span>
            </div>
            <p className="text-[10px] text-trading-muted truncate">
              Ganzheitliche Performance- und Risikostruktur für {symbol} (Aktueller Kurs: {currentPrice.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €)
            </p>
          </div>
        </div>

        {/* View Switcher: Cards vs Table */}
        <div className="flex items-center gap-2">
          <div className="flex bg-trading-bg rounded border border-trading-border p-0.5 text-xs font-mono">
            <button
              onClick={() => setViewMode('CARDS')}
              className={`flex items-center gap-1 px-2 py-1 rounded transition text-[11px] ${
                viewMode === 'CARDS'
                  ? 'bg-trading-card text-trading-accent font-bold shadow-sm'
                  : 'text-trading-muted hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              Karten
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`flex items-center gap-1 px-2 py-1 rounded transition text-[11px] ${
                viewMode === 'TABLE'
                  ? 'bg-trading-card text-trading-accent font-bold shadow-sm'
                  : 'text-trading-muted hover:text-white'
              }`}
            >
              <TableIcon className="w-3 h-3" />
              Matrix-Tabelle
            </button>
          </div>
        </div>
      </div>

      {/* CARDS VIEW */}
      {viewMode === 'CARDS' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {horizons.map((h) => {
            const isPositive = h.returnPct >= 0;
            const isSelected = activeTimeframe === h.id;

            return (
              <div
                key={h.id}
                onClick={() => onSelectTimeframe(h.id)}
                className={`relative group cursor-pointer bg-trading-bg hover:bg-trading-card/70 border rounded-xl p-3 transition flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500 ring-1 ring-emerald-500/40 bg-emerald-500/5'
                    : 'border-trading-border hover:border-trading-muted/60'
                }`}
              >
                {/* Period Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-white group-hover:text-emerald-400 transition">
                      {h.label}
                    </span>
                    <span className="text-[10px] font-mono text-trading-muted">
                      ({h.shortLabel})
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-trading-muted px-1 py-0.5 rounded bg-trading-surface border border-trading-border/50">
                    {h.durationLabel}
                  </span>
                </div>

                {/* Return Main Metric */}
                <div className="my-1">
                  <div className="flex items-baseline gap-1">
                    <span
                      className={`text-lg sm:text-xl font-black font-mono tracking-tight ${
                        isPositive ? 'text-trading-buy' : 'text-trading-sell'
                      }`}
                    >
                      {isPositive ? '+' : ''}{h.returnPct.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%
                    </span>
                    {isPositive ? (
                      <TrendingUp className="w-3.5 h-3.5 text-trading-buy shrink-0" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-trading-sell shrink-0" />
                    )}
                  </div>
                  <div className="text-[10px] text-trading-muted font-mono flex items-center gap-1">
                    <span>p.a.</span>
                    <span className={h.annualizedReturnPct >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {h.annualizedReturnPct >= 0 ? '+' : ''}{h.annualizedReturnPct.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Mini SVG Sparkline */}
                <div className="h-8 w-full my-1.5">
                  <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
                    {(() => {
                      const min = Math.min(...h.sparkline);
                      const max = Math.max(...h.sparkline);
                      const range = max - min || 1;
                      const points = h.sparkline
                        .map((val, idx) => {
                          const x = (idx / (h.sparkline.length - 1)) * 100;
                          const y = 28 - ((val - min) / range) * 24;
                          return `${x},${y}`;
                        })
                        .join(' ');
                      return (
                        <polyline
                          points={points}
                          fill="none"
                          stroke={isPositive ? '#10B981' : '#F43F5E'}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity="0.85"
                        />
                      );
                    })()}
                  </svg>
                </div>

                {/* High / Low & Drawdown */}
                <div className="pt-2 border-t border-trading-border/50 text-[10px] font-mono flex flex-col gap-0.5">
                  <div className="flex justify-between text-trading-muted">
                    <span>Spanne:</span>
                    <span className="text-trading-text font-bold">
                      {h.low.toLocaleString('de-DE', { maximumFractionDigits: 0 })} – {h.high.toLocaleString('de-DE', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-trading-muted">
                    <span>Max DD:</span>
                    <span className="text-rose-400">-{h.maxDrawdownPct}%</span>
                  </div>
                </div>

                {/* Click Action Indicator */}
                <div className="mt-2 pt-1 flex items-center justify-between text-[10px] text-trading-muted group-hover:text-emerald-400 transition font-mono border-t border-dashed border-trading-border/40">
                  <span>{isSelected ? '✓ Aktiv im Chart' : 'Im Chart laden'}</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MATRIX TABLE VIEW */}
      {viewMode === 'TABLE' && (
        <div className="overflow-x-auto rounded-lg border border-trading-border">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead className="bg-trading-bg/90 text-trading-muted border-b border-trading-border text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Zeithorizont</th>
                <th className="py-2.5 px-3">Dauer</th>
                <th className="py-2.5 px-3 text-right">Wertentwicklung</th>
                <th className="py-2.5 px-3 text-right">Annualisiert (CAGR)</th>
                <th className="py-2.5 px-3 text-right">Kursspanne (Tief / Hoch)</th>
                <th className="py-2.5 px-3 text-right">Volatilität</th>
                <th className="py-2.5 px-3 text-right">Max Drawdown</th>
                <th className="py-2.5 px-3 text-center">Regime</th>
                <th className="py-2.5 px-3 text-right">Aktion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-trading-border/50 bg-trading-surface">
              {horizons.map((h) => {
                const isPositive = h.returnPct >= 0;
                const isSelected = activeTimeframe === h.id;

                return (
                  <tr
                    key={h.id}
                    className={`hover:bg-trading-card/50 transition ${
                      isSelected ? 'bg-emerald-500/5' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      {h.label} ({h.shortLabel})
                    </td>
                    <td className="py-2.5 px-3 text-trading-muted">{h.durationLabel}</td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono">
                      <span className={isPositive ? 'text-trading-buy' : 'text-trading-sell'}>
                        {isPositive ? '+' : ''}{h.returnPct.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono">
                      <span className={h.annualizedReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {h.annualizedReturnPct >= 0 ? '+' : ''}{h.annualizedReturnPct.toFixed(1)}% p.a.
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-trading-text">
                      {h.low.toLocaleString('de-DE', { maximumFractionDigits: 1 })} € – {h.high.toLocaleString('de-DE', { maximumFractionDigits: 1 })} €
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-amber-400">
                      {h.volatilityPct}%
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-trading-sell">
                      -{h.maxDrawdownPct}%
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                          h.trend === 'BULLISH'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : h.trend === 'BEARISH'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        {h.trend}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onSelectTimeframe(h.id)}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition ${
                          isSelected
                            ? 'bg-emerald-500 text-black'
                            : 'bg-trading-bg hover:bg-emerald-500/20 hover:text-emerald-400 text-trading-muted border border-trading-border'
                        }`}
                      >
                        {isSelected ? 'Aktiv' : 'Chart öffnen'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
