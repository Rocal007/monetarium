'use client';

import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Flame, 
  ShieldAlert, 
  Sparkles, 
  Activity, 
  Compass, 
  Layers,
  AlertTriangle
} from 'lucide-react';
import { Candle } from '../../lib/types/trading';
import { SearchVisibilityEngine, AttentionRegime } from '../../lib/analytics/search-visibility-engine';

interface SearchVisibilityRadarProps {
  symbol: string;
  currentPrice: number;
  candles: Candle[];
}

export const SearchVisibilityRadar: React.FC<SearchVisibilityRadarProps> = ({
  symbol,
  currentPrice,
  candles,
}) => {
  const metrics = useMemo(() => {
    return SearchVisibilityEngine.getMetrics(symbol, currentPrice, candles);
  }, [symbol, currentPrice, candles]);

  const getRegimeColor = (regime: AttentionRegime) => {
    switch (regime) {
      case 'BREAKOUT_CONFIRMED':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          bar: 'bg-emerald-500',
        };
      case 'EUPHORIA_OVERHEATED':
        return {
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          bar: 'bg-rose-500',
        };
      case 'ACCUMULATION':
        return {
          bg: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
          badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          bar: 'bg-sky-500',
        };
      case 'APATHY':
        return {
          bg: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
          badge: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
          bar: 'bg-slate-500',
        };
      default:
        return {
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          bar: 'bg-amber-500',
        };
    }
  };

  const colors = getRegimeColor(metrics.regime);

  // SVG-Punkte für 14-Tage Sparkline
  const sparklinePoints = useMemo(() => {
    if (!metrics.history || metrics.history.length === 0) return '';
    const minVal = 0;
    const maxVal = 100;
    const width = 140;
    const height = 36;
    const step = width / (metrics.history.length - 1);
    return metrics.history
      .map((val, idx) => {
        const x = idx * step;
        const y = height - ((val - minVal) / (maxVal - minVal)) * height;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [metrics.history]);

  return (
    <div className="bg-trading-surface border border-trading-border rounded-xl p-4 font-mono flex flex-col gap-3 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-trading-border/60">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded border ${colors.bg}`}>
            <Search className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-white">Search Visibility & Attention Radar</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${colors.badge}`}>
                {metrics.regime.replace('_', ' ')}
              </span>
            </div>
            <p className="text-[10px] text-trading-muted">
              Google Trends & Search Volume Index (SVI) als quantitativer Sentiment- & Momentum-Faktor
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-trading-muted text-[11px]">Trade-Modifikator:</span>
          <span className={`font-bold px-2 py-0.5 rounded border text-xs ${
            metrics.confidenceModifier >= 1.0 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
              : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
          }`}>
            {(metrics.confidenceModifier * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Grid: Kennzahlen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Metric 1: SVI Score */}
        <div className="bg-trading-bg p-3 rounded-lg border border-trading-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-trading-muted">
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-sky-400" /> SVI Score
            </span>
            <span className="text-[10px] font-bold text-white">{metrics.svi} / 100</span>
          </div>
          <div className="mt-1">
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${colors.bar}`}
                style={{ width: `${metrics.svi}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between items-center text-[10px] text-trading-muted mt-1.5 pt-1 border-t border-trading-border/40">
            <span>7d Schnitt:</span>
            <span className="text-white font-semibold">{metrics.svi7dAvg}</span>
          </div>
        </div>

        {/* Metric 2: Search Momentum (24h Delta) */}
        <div className="bg-trading-bg p-3 rounded-lg border border-trading-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-trading-muted">
            <span className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400" /> 24h Such-Momentum
            </span>
            {metrics.delta24h >= 0 ? (
              <TrendingUp className="w-3 h-3 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-rose-400" />
            )}
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-lg font-bold font-mono ${
              metrics.delta24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {metrics.delta24h >= 0 ? '+' : ''}{metrics.delta24h}%
            </span>
            <span className="text-[10px] text-trading-muted">7d: {metrics.delta7d >= 0 ? '+' : ''}{metrics.delta7d}%</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-trading-muted mt-1.5 pt-1 border-t border-trading-border/40">
            <span>Signal-Hebel:</span>
            <span className="text-sky-300 font-semibold">{metrics.confidenceModifier}x</span>
          </div>
        </div>

        {/* Metric 3: Retail Euphoria & Top Risk */}
        <div className="bg-trading-bg p-3 rounded-lg border border-trading-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-trading-muted">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-rose-400" /> Retail-Euphorie
            </span>
            <span className="text-[10px] font-bold text-white">{metrics.retailEuphoriaScore}%</span>
          </div>
          <div className="mt-1">
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  metrics.retailEuphoriaScore > 75 ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${metrics.retailEuphoriaScore}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between items-center text-[10px] text-trading-muted mt-1.5 pt-1 border-t border-trading-border/40">
            <span>Top-Risiko:</span>
            <span className={metrics.retailEuphoriaScore > 75 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-semibold'}>
              {metrics.retailEuphoriaScore > 75 ? 'EXTREM (VETO)' : 'KONTROLLIERT'}
            </span>
          </div>
        </div>

        {/* Metric 4: 14-Tage Sparkline */}
        <div className="bg-trading-bg p-3 rounded-lg border border-trading-border flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-trading-muted mb-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" /> 14-Tage Trend
            </span>
            <span className="text-[9px] text-trading-muted">Google Trends</span>
          </div>
          <div className="h-9 w-full flex items-center justify-center">
            <svg viewBox="0 0 140 36" className="w-full h-full overflow-visible">
              <polyline
                fill="none"
                stroke={metrics.delta24h >= 0 ? '#10B981' : '#F43F5E'}
                strokeWidth="1.8"
                points={sparklinePoints}
              />
            </svg>
          </div>
          <div className="flex justify-between items-center text-[9px] text-trading-muted pt-1 border-t border-trading-border/40">
            <span>Vor 14d: {metrics.history[0]}</span>
            <span className="text-white font-bold">Heute: {metrics.svi}</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Interpretation & Top Keywords */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-trading-border/50 text-[11px]">
        <div className="flex items-center gap-2 text-slate-300">
          <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="text-trading-muted">Quant-Analyse:</span>
          <span className="text-white font-sans">{metrics.notes}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-trading-muted">Trending Queries:</span>
          {metrics.topKeywords.slice(0, 3).map((kw, i) => (
            <span 
              key={i}
              className="text-[9px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono"
            >
              {kw}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
