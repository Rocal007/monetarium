'use client';

import React from 'react';
import { 
  Globe2, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ShieldAlert, 
  Flame, 
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { GlobalMarketItem, GlobalMarketState, GlobalRiskRegime } from '../../lib/types/market';

interface GlobalMarketRadarProps {
  globalMarket: GlobalMarketState;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export const GlobalMarketRadar: React.FC<GlobalMarketRadarProps> = ({
  globalMarket,
  selectedSymbol,
  onSelectSymbol,
  onRefresh,
  isLoading = false,
}) => {
  const getRegimeBadge = (regime: GlobalRiskRegime, score: number) => {
    switch (regime) {
      case 'RISK_ON':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            RISK-ON KLIMA • {score > 0 ? `+${score}` : score} Score
          </span>
        );
      case 'RISK_OFF':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            RISK-OFF KLIMA • {score} Score
          </span>
        );
      case 'VOLATILITY_EXPANSION':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
            <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
            VOLATILITÄTS-SPIKE (VIX {globalMarket.vixLevel.toFixed(1)})
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
            <Activity className="w-3 h-3 text-sky-400" />
            NEUTRALE MARKTKONSOLIDIERUNG
          </span>
        );
    }
  };

  const renderSparkline = (points: number[], isPositive: boolean) => {
    if (!points || points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 56;
    const height = 18;

    const pathD = points
      .map((pt, i) => {
        const x = (i / (points.length - 1)) * width;
        const y = height - ((pt - min) / range) * (height - 4) - 2;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    const strokeColor = isPositive ? '#34d399' : '#f87171';

    return (
      <svg width={width} height={height} className="overflow-visible">
        <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  };

  const formatPrice = (item: GlobalMarketItem) => {
    if (item.category === 'YIELD') return `${item.price.toFixed(2)}%`;
    if (item.price >= 1000) return item.price.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    return item.price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <section className="bg-trading-surface border border-trading-border rounded-xl p-3 font-mono shadow-sm flex flex-col gap-2.5">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-trading-border/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-sm">
            <Globe2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-white tracking-wide">GESAMTBÖRSENMARKT-RADAR</span>
              <span className="text-[9px] bg-slate-800 text-trading-accent px-1.5 py-0.5 rounded border border-trading-border uppercase font-semibold">
                Global Intermarket Watch
              </span>
            </div>
            <p className="text-[10px] text-trading-muted">
              Ganzheitliche Marktbeobachtung: US- & EU-Leitindizes, VIX, US 10Y Zinsen, Rohstoffe & Krypto
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getRegimeBadge(globalMarket.riskRegime, globalMarket.sentimentScore)}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded bg-trading-bg border border-trading-border text-[10px] text-trading-muted">
            <span>Marktbreite (A/D):</span>
            <span className="text-white font-bold">{globalMarket.advanceDeclineRatio.toFixed(2)}x</span>
          </div>
        </div>
      </div>

      {/* Global Ticker Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
        {globalMarket.items.map((item) => {
          const isSelected = selectedSymbol === item.symbol || selectedSymbol === item.displaySymbol;
          const isPos = item.changePercent24h >= 0;

          return (
            <button
              key={item.symbol}
              type="button"
              onClick={() => onSelectSymbol(item.symbol)}
              title={`${item.name} (${item.displaySymbol}) — Klick zum Laden im Terminal`}
              className={`p-2 rounded-lg border text-left flex flex-col justify-between gap-1.5 transition group ${
                isSelected
                  ? 'bg-sky-950/40 border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                  : 'bg-trading-bg/80 border-trading-border/70 hover:border-trading-border hover:bg-trading-card/50'
              }`}
            >
              {/* Top Row: Symbol & Sparkline */}
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold text-white group-hover:text-trading-accent transition">
                  {item.displaySymbol}
                </span>
                <div className="opacity-70 group-hover:opacity-100 transition">
                  {renderSparkline(item.sparkline, isPos)}
                </div>
              </div>

              {/* Bottom Row: Price & 24h Change */}
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-[11px] font-semibold text-slate-200">
                  {formatPrice(item)}
                </span>
                <span
                  className={`flex items-center text-[10px] font-bold ${
                    isPos ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isPos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {isPos ? `+${item.changePercent24h.toFixed(2)}%` : `${item.changePercent24h.toFixed(2)}%`}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="pt-1.5 border-t border-trading-border/40 flex items-center justify-between gap-2 text-[10px]">
        <div className="flex items-center gap-1.5 text-trading-muted truncate">
          <Sparkles className="w-3 h-3 text-sky-400 flex-shrink-0" />
          <span className="truncate">{globalMarket.summary}</span>
        </div>
        <div className="text-[9px] text-trading-muted/80 whitespace-nowrap flex-shrink-0">
          VIX: <span className="text-white font-bold">{globalMarket.vixLevel.toFixed(1)}</span> • 10Y: <span className="text-white font-bold">{globalMarket.us10yYield.toFixed(2)}%</span>
        </div>
      </div>
    </section>
  );
};
