'use client';

import React, { useState } from 'react';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Flame, 
  Star, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles,
  Search,
  ExternalLink,
  SlidersHorizontal
} from 'lucide-react';
import { GICSSectorPerformance, GlobalMarketScreenerData, MarketMover } from '../../lib/types/market';

interface GlobalMarketScreenerProps {
  screenerData: GlobalMarketScreenerData;
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  defaultExpanded?: boolean;
}

type ScreenerTab = 'GAINERS' | 'LOSERS' | 'UNUSUAL_VOLUME' | 'BREAKOUTS' | 'SECTORS';

export const GlobalMarketScreener: React.FC<GlobalMarketScreenerProps> = ({
  screenerData,
  selectedSymbol,
  onSelectSymbol,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [activeTab, setActiveTab] = useState<ScreenerTab>('GAINERS');
  const [filterClass, setFilterClass] = useState<'ALL' | 'EQUITY' | 'CRYPTO' | 'COMMODITY'>('ALL');

  const renderSparkline = (points: number[], isPositive: boolean) => {
    if (!points || points.length < 2) return null;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;
    const width = 50;
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

  const getFilteredMovers = (list: MarketMover[]) => {
    if (filterClass === 'ALL') return list;
    return list.filter((m) => m.assetClass === filterClass);
  };

  const currentList = 
    activeTab === 'GAINERS' ? getFilteredMovers(screenerData.gainers) :
    activeTab === 'LOSERS' ? getFilteredMovers(screenerData.losers) :
    activeTab === 'UNUSUAL_VOLUME' ? getFilteredMovers(screenerData.unusualVolume) :
    activeTab === 'BREAKOUTS' ? getFilteredMovers(screenerData.breakouts) :
    [];

  return (
    <section className="bg-trading-surface border border-trading-border rounded-xl p-3 font-mono shadow-sm flex flex-col gap-3 transition-all duration-300">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-trading-border/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-white tracking-wide">GESAMTBÖRSENMARKT-SCREENER</span>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 uppercase font-semibold">
                Live Movers & Sektoren
              </span>
            </div>
            <p className="text-[10px] text-trading-muted">
              Vollständige Markterfassung: Top Gainers, Losers, Smart-Money Volumen, 52W-Ausbrüche & 11 GICS-Branchen
            </p>
          </div>
        </div>

        {/* Tab Switcher & Collapse Button */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex bg-trading-bg p-0.5 rounded-lg border border-trading-border text-[11px]">
            <button
              onClick={() => setActiveTab('GAINERS')}
              className={`px-2 py-1 rounded flex items-center gap-1 transition ${
                activeTab === 'GAINERS' ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30' : 'text-trading-muted hover:text-white'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              <span>Gewinner ({screenerData.gainers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('LOSERS')}
              className={`px-2 py-1 rounded flex items-center gap-1 transition ${
                activeTab === 'LOSERS' ? 'bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30' : 'text-trading-muted hover:text-white'
              }`}
            >
              <TrendingDown className="w-3 h-3" />
              <span>Verlierer ({screenerData.losers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('UNUSUAL_VOLUME')}
              className={`px-2 py-1 rounded flex items-center gap-1 transition ${
                activeTab === 'UNUSUAL_VOLUME' ? 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30' : 'text-trading-muted hover:text-white'
              }`}
            >
              <Flame className="w-3 h-3" />
              <span>Volumen ({screenerData.unusualVolume.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('BREAKOUTS')}
              className={`px-2 py-1 rounded flex items-center gap-1 transition ${
                activeTab === 'BREAKOUTS' ? 'bg-purple-500/20 text-purple-400 font-bold border border-purple-500/30' : 'text-trading-muted hover:text-white'
              }`}
            >
              <Star className="w-3 h-3" />
              <span>52W Ausbrüche ({screenerData.breakouts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('SECTORS')}
              className={`px-2 py-1 rounded flex items-center gap-1 transition ${
                activeTab === 'SECTORS' ? 'bg-sky-500/20 text-sky-400 font-bold border border-sky-500/30' : 'text-trading-muted hover:text-white'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>11 Sektoren</span>
            </button>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Screener einklappen' : 'Screener ausklappen'}
            className="p-1 rounded bg-trading-bg hover:bg-trading-card text-trading-muted hover:text-white border border-trading-border transition"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="flex flex-col gap-2.5">
          {/* Asset Class Filter Bar (for mover tabs) */}
          {activeTab !== 'SECTORS' && (
            <div className="flex items-center justify-between text-[10px] text-trading-muted">
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3 h-3 text-trading-accent" />
                <span>Assetklasse filtern:</span>
                {(['ALL', 'EQUITY', 'CRYPTO', 'COMMODITY'] as const).map((cls) => (
                  <button
                    key={cls}
                    onClick={() => setFilterClass(cls)}
                    className={`px-1.5 py-0.5 rounded border transition ${
                      filterClass === cls
                        ? 'bg-trading-card text-trading-accent border-trading-accent font-bold'
                        : 'bg-trading-bg text-trading-muted border-trading-border hover:text-white'
                    }`}
                  >
                    {cls === 'ALL' ? 'Alle Märkte' : cls === 'EQUITY' ? 'Aktien / ETFs' : cls === 'CRYPTO' ? 'Krypto' : 'Rohstoffe'}
                  </button>
                ))}
              </div>

              <span className="text-[9px] text-trading-muted">
                Klick auf ein Asset lädt es direkt in Chart & Trading-Orchestrator
              </span>
            </div>
          )}

          {/* TAB: 11 GICS SECTORS */}
          {activeTab === 'SECTORS' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {screenerData.sectors.map((sec) => {
                const isPos = sec.changePercent24h >= 0;
                const isSelected = selectedSymbol === sec.etfSymbol;

                return (
                  <div
                    key={sec.id}
                    onClick={() => onSelectSymbol(sec.etfSymbol)}
                    className={`p-2.5 rounded-lg border cursor-pointer transition flex flex-col justify-between gap-2 group ${
                      isSelected
                        ? 'bg-sky-950/40 border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
                        : 'bg-trading-bg/80 border-trading-border/70 hover:border-trading-border hover:bg-trading-card/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <span className="text-[11px] font-bold text-white group-hover:text-trading-accent transition block truncate">
                          {sec.name}
                        </span>
                        <span className="text-[9px] text-trading-muted font-mono">
                          ETF: {sec.etfSymbol}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold flex items-center ${
                          isPos ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPos ? `+${sec.changePercent24h.toFixed(2)}%` : `${sec.changePercent24h.toFixed(2)}%`}
                      </span>
                    </div>

                    <div className="text-[9px] text-trading-muted line-clamp-2 font-sans">
                      {sec.description}
                    </div>

                    <div className="pt-1 border-t border-trading-border/40 flex items-center justify-between text-[9px]">
                      <span className="text-slate-400 truncate max-w-[100px]">{sec.leadingStock}</span>
                      <span
                        className={`px-1 py-0.2 rounded font-semibold ${
                          sec.momentum === 'BULLISH'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : sec.momentum === 'BEARISH'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {sec.momentum}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TAB: MOVERS (GAINERS, LOSERS, VOLUME, BREAKOUTS) */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {currentList.map((mover) => {
                const isPos = mover.changePercent24h >= 0;
                const isSelected = selectedSymbol === mover.symbol;

                return (
                  <div
                    key={mover.symbol}
                    onClick={() => onSelectSymbol(mover.symbol)}
                    className={`p-3 rounded-lg border cursor-pointer transition flex flex-col justify-between gap-2 group ${
                      isSelected
                        ? 'bg-sky-950/40 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
                        : 'bg-trading-bg/80 border-trading-border/70 hover:border-trading-border hover:bg-trading-card/60'
                    }`}
                  >
                    {/* Header: Symbol & Price */}
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white group-hover:text-trading-accent transition">
                            {mover.symbol}
                          </span>
                          <span className="text-[8px] bg-slate-800 text-slate-300 px-1 rounded uppercase">
                            {mover.assetClass}
                          </span>
                        </div>
                        <span className="text-[10px] text-trading-muted truncate block max-w-[150px]">
                          {mover.name}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-white block">
                          {mover.price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
                        </span>
                        <span
                          className={`text-[10px] font-bold flex items-center justify-end ${
                            isPos ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isPos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {isPos ? `+${mover.changePercent24h.toFixed(2)}%` : `${mover.changePercent24h.toFixed(2)}%`}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Catalyst & Sparkline */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-trading-border/40">
                      <div className="text-[9px] text-sky-300/90 font-sans line-clamp-2 flex-1">
                        {mover.catalyst}
                      </div>
                      <div className="opacity-70 group-hover:opacity-100 transition flex-shrink-0">
                        {renderSparkline(mover.sparkline, isPos)}
                      </div>
                    </div>

                    {/* Footer: Volume, Sector & Action Button */}
                    <div className="flex items-center justify-between pt-1 border-t border-trading-border/30 text-[9px] text-trading-muted">
                      <div className="flex items-center gap-1">
                        <span>Vol:</span>
                        <span className="text-white font-bold">{mover.volume}</span>
                        <span className="text-amber-400 font-bold">({mover.volumeRatio}x)</span>
                      </div>

                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 group-hover:bg-sky-500/20 group-hover:text-sky-300 group-hover:border group-hover:border-sky-500/30 transition">
                        Laden ➔
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
