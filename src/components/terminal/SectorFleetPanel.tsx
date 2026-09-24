'use client';

import React, { useState } from 'react';
import {
  Coins,
  Shield,
  Cpu,
  Car,
  Bot,
  Zap,
  CheckCircle2,
  TrendingUp,
  Radio,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { SectorAgentInfo, SectorType } from '../../lib/types/sectors';

interface SectorFleetPanelProps {
  sectors: SectorAgentInfo[];
  activeSector: SectorType;
  selectedSymbol: string;
  onSelectSector: (sector: SectorType) => void;
  onSelectSymbol: (symbol: string) => void;
  onExecuteOmniMarketInvestment?: () => Promise<void>;
}

export const SectorFleetPanel: React.FC<SectorFleetPanelProps> = ({
  sectors,
  activeSector,
  selectedSymbol,
  onSelectSector,
  onSelectSymbol,
  onExecuteOmniMarketInvestment,
}) => {
  const [isInvesting, setIsInvesting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const handleRunOmniInvestment = async () => {
    if (!onExecuteOmniMarketInvestment || isInvesting) return;
    try {
      setIsInvesting(true);
      setIsSuccess(false);
      await onExecuteOmniMarketInvestment();
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (err) {
      console.error('Fehler bei Omni-Market-Investition:', err);
    } finally {
      setIsInvesting(false);
    }
  };
  const getSectorIcon = (sector: SectorType) => {
    switch (sector) {
      case 'CRYPTO':
        return <Coins className="w-4 h-4 text-emerald-400" />;
      case 'DEFENSE':
        return <Shield className="w-4 h-4 text-rose-400" />;
      case 'AI_COMPUTE':
        return <Cpu className="w-4 h-4 text-indigo-400" />;
      case 'AUTOMOTIVE':
        return <Car className="w-4 h-4 text-amber-400" />;
      case 'HUMANOID_ROBOTS':
        return <Bot className="w-4 h-4 text-purple-400" />;
    }
  };

  const getThemeClasses = (colorTheme: string, isActive: boolean) => {
    if (!isActive) {
      return 'bg-trading-surface border-trading-border/70 hover:border-trading-border hover:bg-trading-card/50 text-trading-muted';
    }

    switch (colorTheme) {
      case 'emerald':
        return 'bg-emerald-950/20 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.15)] text-white';
      case 'rose':
        return 'bg-rose-950/20 border-rose-500/50 shadow-[0_0_12px_rgba(244,63,94,0.15)] text-white';
      case 'indigo':
        return 'bg-indigo-950/20 border-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.15)] text-white';
      case 'amber':
        return 'bg-amber-950/20 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.15)] text-white';
      case 'purple':
        return 'bg-purple-950/20 border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.15)] text-white';
      default:
        return 'bg-sky-950/20 border-sky-500/50 text-white';
    }
  };

  return (
    <div className="bg-trading-surface border border-trading-border rounded-xl p-4 font-mono flex flex-col gap-3.5 shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-trading-border/60">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-white">NEXUS Sektor-Flotte</span>
              <span className="text-[10px] bg-sky-500/20 text-sky-300 px-1.5 py-0.2 rounded border border-sky-500/30">
                5 Branchen-Agenten
              </span>
            </div>
            <p className="text-[10px] text-trading-muted">
              Spezialisierte Subagenten mit maßgeschneiderten Asset-Universen und News-Treibern
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onExecuteOmniMarketInvestment && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRunOmniInvestment();
              }}
              disabled={isInvesting}
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 transition shadow-sm ${
                isSuccess
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-gradient-to-r from-emerald-500/20 via-sky-500/20 to-purple-500/20 hover:from-emerald-500/30 hover:to-purple-500/30 text-white border-sky-500/40 shadow-sky-500/10'
              }`}
              title="80% des Kapitals über 20 Assets aller 5 Sektoren & globale Leitindizes verteilen"
            >
              {isInvesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-400" />
                  <span>Investiere in 20 Assets...</span>
                </>
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>In alle Märkte investiert!</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>In alle Märkte & Sektor-Flotte investieren</span>
                </>
              )}
            </button>
          )}

          <div className="flex items-center gap-1.5 text-[11px] text-trading-muted">
            <span>Aktiver Sektor:</span>
            <span className="text-white font-bold px-2 py-0.5 rounded bg-trading-card border border-trading-border">
              {sectors.find((s) => s.sector === activeSector)?.name || activeSector}
            </span>
          </div>
        </div>
      </div>

      {/* 5 Sektor-Karten */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {sectors.map((sec) => {
          const isActive = sec.sector === activeSector;
          const themeClass = getThemeClasses(sec.colorTheme, isActive);

          return (
            <div
              key={sec.id}
              onClick={() => onSelectSector(sec.sector)}
              className={`rounded-xl border p-3 flex flex-col justify-between gap-2.5 cursor-pointer transition-all duration-200 ${themeClass}`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded bg-slate-800/80 border border-slate-700">
                    {getSectorIcon(sec.sector)}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs leading-tight text-white">{sec.name}</h4>
                    <span className="text-[9px] text-trading-muted">{sec.badge}</span>
                  </div>
                </div>

                {isActive ? (
                  <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.5 rounded">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    AKTIV
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-400 bg-slate-800/60 px-1.5 py-0.5 rounded">
                    STANDBY
                  </span>
                )}
              </div>

              {/* Kurzbeschreibung & News-Fokus */}
              <div className="text-[10px] text-trading-muted line-clamp-2 font-sans">
                {sec.description}
              </div>

              {/* Konfidenz-Bar & News-Fokus */}
              <div className="flex flex-col gap-1 pt-1 border-t border-trading-border/40 text-[10px]">
                <div className="flex justify-between items-center text-trading-muted">
                  <span>News-Treiber:</span>
                  <span className="text-sky-300 font-mono text-[9px] truncate max-w-[110px]">
                    {sec.focusNewsCategory.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex justify-between items-center text-trading-muted">
                  <span>Konfidenz:</span>
                  <span className="text-white font-bold">{sec.convictionScore}%</span>
                </div>
              </div>

              {/* Asset Universe Quick-Pills */}
              <div className="flex flex-wrap gap-1 pt-1">
                {sec.universe.map((asset) => {
                  const isSymbolSelected = asset.symbol === selectedSymbol;
                  return (
                    <button
                      key={asset.symbol}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSector(sec.sector);
                        onSelectSymbol(asset.symbol);
                      }}
                      title={`${asset.name} (${asset.basePrice} $)`}
                      className={`text-[9px] px-1.5 py-0.5 rounded border font-mono transition ${
                        isSymbolSelected
                          ? 'bg-white text-slate-900 border-white font-bold shadow-sm'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {asset.symbol.replace('/USDT', '')}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
