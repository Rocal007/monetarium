'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Server, 
  Search,
  Globe,
  Activity,
  Gamepad2,
  Zap,
  Plane,
  UserCheck,
  Bell,
} from 'lucide-react';
import { Portfolio, OperatingMode } from '../../lib/types/trading';
import { EngineType } from '../../lib/engines/engine-manager';
import { DataSentinelOverallState } from '../../lib/types/data-integrity';

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
  dataSentinelState?: DataSentinelOverallState;
  onOpenDataSentinelModal?: () => void;
  onOpenArcadeModal?: () => void;
  onOpenCryptoAutoInvestModal?: () => void;
  operatingMode?: OperatingMode;
  onToggleOperatingMode?: (mode: OperatingMode) => void;
  pendingProposalCount?: number;
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
  dataSentinelState,
  onOpenDataSentinelModal,
  onOpenArcadeModal,
  onOpenCryptoAutoInvestModal,
  operatingMode = 'COPILOT',
  onToggleOperatingMode,
  pendingProposalCount = 0,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const isPositive = change24h >= 0;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSelectSymbol(searchInput.trim().toUpperCase());
      setSearchInput('');
    }
  };

  const getEngineLabel = (type: EngineType) => {
    switch (type) {
      case 'SIMULATED_PAPER':
        return 'Paper Sim';
      case 'SPEED_TRADER_ARCADE':
        return 'Arcade Sim';
      case 'TRADINGVIEW_WEBHOOK':
        return 'TradingView';
      case 'CCXT_CRYPTO':
        return 'CCXT (Binance/Kraken)';
      case 'ALPACA_EQUITY':
        return 'Alpaca (Aktien)';
    }
  };

  const popularSymbols = [
    { sym: 'BTC/USDT', label: 'BTC' },
    { sym: 'SPY', label: 'S&P 500' },
    { sym: 'QQQ', label: 'Nasdaq' },
    { sym: 'NVDA', label: 'Nvidia' },
    { sym: 'DAX', label: 'DAX 40' },
    { sym: 'GLD', label: 'Gold' },
  ];

  return (
    <header className="bg-trading-surface border-b border-trading-border px-3 sm:px-4 py-2.5 sticky top-0 z-40 flex flex-col gap-2.5 max-w-full min-w-0">
      {/* ROW 1: BRAND IDENTITY + LIVE STATS + PORTFOLIO BALANCE */}
      <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
        {/* Left: Brand & Mode */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-emerald-400 flex-shrink-0 flex items-center justify-center text-black font-black text-lg shadow-lg">
            M
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-base sm:text-lg tracking-wider text-white">MONETARIUM</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-semibold whitespace-nowrap">
                <ShieldCheck className="w-3 h-3" /> Paper Trading
              </span>
            </div>
            <p className="text-xs text-trading-muted flex items-center gap-1 truncate">
              <span className={`w-2 h-2 rounded-full shrink-0 ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="truncate">{isLive ? 'Live Feed' : 'Sim'} • {activeEngine === 'SIMULATED_PAPER' || activeEngine === 'SPEED_TRADER_ARCADE' ? 'Paper-Trading' : 'Broker-Schnittstelle'}</span>
            </p>
          </div>
        </div>

        {/* Right: Active Ticker Stats & Virtual Portfolio Balance */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 min-w-0 ml-auto">
          {/* Ticker Stats */}
          <div className="flex items-center gap-3 sm:gap-5 font-mono text-xs">
            <div>
              <span className="text-trading-muted block text-[10px] uppercase flex items-center gap-1">
                <Globe className="w-2.5 h-2.5 text-sky-400" />
                {selectedSymbol}
              </span>
              <span className={`text-sm sm:text-base font-bold flex items-center gap-1 whitespace-nowrap ${isPositive ? 'text-trading-buy' : 'text-trading-sell'}`}>
                {isPositive ? <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                {currentPrice.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </span>
            </div>

            <div>
              <span className="text-trading-muted block text-[10px] uppercase">24h Änd.</span>
              <span className={`font-semibold text-xs sm:text-sm whitespace-nowrap ${isPositive ? 'text-trading-buy' : 'text-trading-sell'}`}>
                {isPositive ? '+' : ''}{change24h.toFixed(2)}%
              </span>
            </div>

            <div className="hidden md:block">
              <span className="text-trading-muted block text-[10px] uppercase">24h H / T</span>
              <span className="text-trading-text whitespace-nowrap">
                {high24h.toLocaleString('de-DE', { maximumFractionDigits: 0 })} / {low24h.toLocaleString('de-DE', { maximumFractionDigits: 0 })} €
              </span>
            </div>
          </div>

          {/* Virtual Portfolio Balance & Reset */}
          <div className="bg-trading-bg px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-trading-border flex items-center gap-2 sm:gap-3 shrink-0">
            <div>
              <span className="text-[10px] uppercase text-trading-muted block font-mono">Guthaben</span>
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-xs sm:text-sm font-bold font-mono text-white whitespace-nowrap">
                  {portfolio.equity.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </span>
                <span className={`text-[10px] sm:text-[11px] font-mono whitespace-nowrap ${portfolio.realizedPnL >= 0 ? 'text-trading-buy' : 'text-trading-sell'}`}>
                  {portfolio.realizedPnL >= 0 ? '+' : ''}{portfolio.realizedPnL.toFixed(2)} €
                </span>
              </div>
            </div>
            <button
              onClick={onResetPortfolio}
              title="Portfolio auf 10.000 € zurücksetzen"
              className="p-1 sm:p-1.5 rounded bg-trading-card hover:bg-slate-700 text-trading-muted hover:text-white transition shrink-0"
            >
              <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ROW 2: ACTION CONTROLS & COMMAND BAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-trading-border/50 min-w-0">
        {/* Action Buttons Group */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
          {/* Active Trade Engine Switcher */}
          <button
            onClick={onOpenEngineModal}
            className="flex items-center gap-1.5 bg-trading-bg hover:bg-trading-card px-2.5 py-1.5 rounded-lg border border-trading-border/80 text-xs font-mono transition group shrink-0"
            title="Trade Engine & Broker Integration konfigurieren"
          >
            <Server className="w-3.5 h-3.5 text-trading-accent group-hover:rotate-12 transition-transform" />
            <span className="text-trading-muted hidden sm:inline">Engine:</span>
            <span className="text-white font-bold">{getEngineLabel(activeEngine)}</span>
          </button>

          {/* PILOT / COPILOT Mode Switcher (Grundeinstellung) */}
          {onToggleOperatingMode && (
            <div className="flex items-center bg-trading-bg p-0.5 rounded-lg border border-trading-border/80 text-xs font-mono shrink-0">
              <button
                onClick={() => onToggleOperatingMode('COPILOT')}
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded transition ${
                  operatingMode === 'COPILOT'
                    ? 'bg-sky-500/25 text-sky-300 font-bold border border-sky-500/40 shadow-sm'
                    : 'text-trading-muted hover:text-white'
                }`}
                title="Copilot-Modus: Assistiertes Trading. Du entscheidest bei jedem Signal mit (Bestätigen/Ablehnen)."
              >
                <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>Copilot</span>
                {pendingProposalCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </button>
              <button
                onClick={() => onToggleOperatingMode('PILOT')}
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded transition ${
                  operatingMode === 'PILOT'
                    ? 'bg-emerald-500/25 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm'
                    : 'text-trading-muted hover:text-white'
                }`}
                title="Pilot-Modus: Vollautomatisches Trading. Signale werden autonom ohne Mitentscheidung ausgeführt."
              >
                <Plane className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pilot</span>
              </button>
            </div>
          )}

          {/* Pending Freigabe Notification Pill */}
          {pendingProposalCount > 0 && operatingMode === 'COPILOT' && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-[11px] font-mono font-bold text-amber-300 animate-pulse shrink-0">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>{pendingProposalCount} Freigabe offen</span>
            </div>
          )}

          {/* Data Sentinel Real-Data Stream Indicator */}
          {dataSentinelState && onOpenDataSentinelModal && (
            <button
              onClick={onOpenDataSentinelModal}
              className="flex items-center gap-1.5 bg-trading-bg hover:bg-trading-card px-2.5 py-1.5 rounded-lg border border-trading-border/80 text-xs font-mono transition group shrink-0"
              title="Data Sentinel Agent: Echtzeit-Datenverbindung & Integritäts-Audit öffnen"
            >
              <Activity className={`w-3.5 h-3.5 ${dataSentinelState.status === 'OPTIMAL' ? 'text-emerald-400' : 'text-amber-400 animate-pulse'} group-hover:scale-110 transition-transform`} />
              <span className="text-trading-muted hidden md:inline">Sentinel:</span>
              <span className={`font-bold ${dataSentinelState.status === 'OPTIMAL' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {dataSentinelState.overallScore.toFixed(0)}%<span className="hidden sm:inline"> • {dataSentinelState.avgLatencyMs}ms</span>
              </span>
            </button>
          )}

          {/* Speed-Trader Arcade Launcher Button */}
          {onOpenArcadeModal && (
            <button
              onClick={onOpenArcadeModal}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500/20 via-sky-500/20 to-emerald-500/20 hover:from-emerald-500/30 hover:to-sky-500/30 px-2.5 sm:px-3 py-1.5 rounded-lg border border-emerald-500/50 text-xs font-mono font-black text-emerald-300 shadow-md shadow-emerald-500/10 transition group animate-pulse hover:animate-none shrink-0"
              title="Speed-Trader Arcade Engine: Marktsimulation mit bis zu 20x Speed, Event-Shocks & AI-Duell"
            >
              <Gamepad2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 group-hover:scale-125 transition-transform" />
              <span className="tracking-wide">Arcade<span className="hidden sm:inline"> spielen</span></span>
            </button>
          )}

          {/* Krypto Auto-Invest & Robo-Advisor Launcher */}
          {onOpenCryptoAutoInvestModal && (
            <button
              onClick={onOpenCryptoAutoInvestModal}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500/25 via-sky-500/20 to-amber-500/25 hover:from-emerald-500/35 hover:to-amber-500/35 px-2.5 sm:px-3 py-1.5 rounded-lg border border-emerald-500/50 text-xs font-mono font-bold text-white shadow-md shadow-emerald-500/10 transition group shrink-0"
              title="Krypto Auto-Invest: Automatische Auswahl & KI-Portfolio-Allokation"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 group-hover:scale-125 transition-transform" />
              <span className="tracking-wide"><span className="hidden sm:inline">Krypto </span>Auto-Invest</span>
            </button>
          )}
        </div>

        {/* Universal Global Market Ticker Search & Quick Pills */}
        <div className="flex items-center gap-2 min-w-0 flex-1 sm:flex-initial justify-end">
          {/* Quick Global Picks */}
          <div className="hidden xl:flex bg-trading-bg p-1 rounded-lg border border-trading-border text-xs font-mono shrink-0">
            {popularSymbols.map(({ sym, label }) => {
              const isSelected = selectedSymbol === sym || (sym === 'SPY' && selectedSymbol.includes('SPY'));
              return (
                <button
                  key={sym}
                  onClick={() => onSelectSymbol(sym)}
                  className={`px-2 py-1 rounded transition-all ${
                    isSelected
                      ? 'bg-trading-card text-trading-accent font-bold shadow-sm'
                      : 'text-trading-muted hover:text-white'
                  }`}
                  title={`${label} (${sym})`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Any Symbol Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center flex-1 sm:flex-initial min-w-[140px] max-w-full sm:max-w-xs">
            <div className="absolute left-2.5 text-trading-muted pointer-events-none">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Ticker suchen (z.B. AAPL)..."
              className="bg-trading-bg border border-trading-border rounded-lg pl-8 pr-11 py-1.5 text-xs text-white placeholder-trading-muted font-mono w-full sm:w-48 md:w-56 focus:outline-none focus:border-trading-accent transition"
            />
            <button
              type="submit"
              className="absolute right-1 px-1.5 py-0.5 bg-trading-card hover:bg-slate-700 text-trading-accent text-[10px] font-mono rounded font-bold transition border border-trading-border/60"
            >
              GO
            </button>
          </form>
        </div>
      </div>
    </header>
  );
};
