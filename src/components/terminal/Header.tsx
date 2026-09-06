'use client';

import React from 'react';
import { ShieldCheck, RefreshCw, TrendingUp, TrendingDown, Server } from 'lucide-react';
import { Portfolio } from '../../lib/types/trading';
import { EngineType } from '../../lib/engines/engine-manager';

interface HeaderProps {
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  currentPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  portfolio: Portfolio;
  onResetPortfolio: () => void;
  isLive: boolean;
  activeEngine: EngineType;
  onOpenEngineModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedSymbol,
  onSelectSymbol,
  currentPrice,
  change24h,
  high24h,
  low24h,
  portfolio,
  onResetPortfolio,
  isLive,
  activeEngine,
  onOpenEngineModal,
}) => {
  const isPositive = change24h >= 0;

  const getEngineLabel = (type: EngineType) => {
    switch (type) {
      case 'SIMULATED_PAPER':
        return 'Paper Sim';
      case 'TRADINGVIEW_WEBHOOK':
        return 'TradingView';
      case 'CCXT_CRYPTO':
        return 'CCXT (Binance/Kraken)';
      case 'ALPACA_EQUITY':
        return 'Alpaca (Aktien)';
    }
  };

  return (
    <header className="bg-trading-surface border-b border-trading-border px-4 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
      {/* Brand & Mode */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center text-black font-black text-lg shadow-lg">
            M
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-wider text-white">MONETARIUM</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3 h-3" /> Paper Trading
              </span>
            </div>
            <p className="text-xs text-trading-muted flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              {isLive ? 'Live Feed aktiv' : 'Simulationsmodus'} • Risikofreie Ausführung
            </p>
          </div>
        </div>

        {/* Active Trade Engine Switcher */}
        <button
          onClick={onOpenEngineModal}
          className="flex items-center gap-1.5 bg-trading-bg hover:bg-trading-card px-2.5 py-1.5 rounded-lg border border-trading-border/80 text-xs font-mono transition group ml-2"
          title="Trade Engine & Broker Integration konfigurieren"
        >
          <Server className="w-3.5 h-3.5 text-trading-accent group-hover:rotate-12 transition-transform" />
          <span className="text-trading-muted">Engine:</span>
          <span className="text-white font-bold">{getEngineLabel(activeEngine)}</span>
        </button>

        {/* Symbol Selector */}
        <div className="flex bg-trading-bg p-1 rounded-lg border border-trading-border text-xs font-mono ml-2">
          {['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'SPY (S&P 500)'].map((sym) => (
            <button
              key={sym}
              onClick={() => onSelectSymbol(sym)}
              className={`px-2.5 py-1 rounded transition-all ${
                selectedSymbol === sym
                  ? 'bg-trading-card text-trading-accent font-bold shadow-sm'
                  : 'text-trading-muted hover:text-white'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>
      </div>

      {/* Ticker Stats */}
      <div className="flex items-center gap-6 font-mono text-xs">
        <div>
          <span className="text-trading-muted block text-[10px] uppercase">Marktpreis</span>
          <span className={`text-base font-bold flex items-center gap-1 ${isPositive ? 'text-trading-buy' : 'text-trading-sell'}`}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {currentPrice.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </span>
        </div>

        <div>
          <span className="text-trading-muted block text-[10px] uppercase">24h Änd.</span>
          <span className={`font-semibold ${isPositive ? 'text-trading-buy' : 'text-trading-sell'}`}>
            {isPositive ? '+' : ''}{change24h.toFixed(2)}%
          </span>
        </div>

        <div className="hidden sm:block">
          <span className="text-trading-muted block text-[10px] uppercase">24h Hoch / Tief</span>
          <span className="text-trading-text">
            {high24h.toLocaleString('de-DE', { maximumFractionDigits: 0 })} / {low24h.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €
          </span>
        </div>
      </div>

      {/* Virtual Portfolio Balance & Reset */}
      <div className="flex items-center gap-4">
        <div className="bg-trading-bg px-3 py-1.5 rounded-lg border border-trading-border flex items-center gap-3">
          <div>
            <span className="text-[10px] uppercase text-trading-muted block font-mono">Virtuelles Guthaben</span>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold font-mono text-white">
                {portfolio.equity.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </span>
              <span className={`text-[11px] font-mono ${portfolio.realizedPnL >= 0 ? 'text-trading-buy' : 'text-trading-sell'}`}>
                {portfolio.realizedPnL >= 0 ? '+' : ''}{portfolio.realizedPnL.toFixed(2)} €
              </span>
            </div>
          </div>
          <button
            onClick={onResetPortfolio}
            title="Portfolio auf 10.000 € zurücksetzen"
            className="p-1.5 rounded bg-trading-card hover:bg-slate-700 text-trading-muted hover:text-white transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
