'use client';

import React, { useState } from 'react';
import {
  Globe2,
  AlertTriangle,
  Radio,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Zap,
  ShieldAlert,
  CalendarDays,
  Clock,
  Filter,
  X,
} from 'lucide-react';
import { MacroSentimentState, WorldNewsItem } from '../../lib/types/news';

export type NewsProviderType = 'GCP' | 'FOREX_FACTORY';

interface WorldNewsBarProps {
  macroNews: MacroSentimentState | null;
  isLoading: boolean;
  activeProviderType: NewsProviderType;
  onSelectProvider: (provider: NewsProviderType) => void;
  onRefresh: () => void;
  onTriggerCrisisSimulation: () => void;
  onResetCrisisSimulation: () => void;
}

export const WorldNewsBar: React.FC<WorldNewsBarProps> = ({
  macroNews,
  isLoading,
  activeProviderType,
  onSelectProvider,
  onRefresh,
  onTriggerCrisisSimulation,
  onResetCrisisSimulation,
}) => {
  const [selectedArticle, setSelectedArticle] = useState<WorldNewsItem | null>(null);
  const [activeArticleIndex, setActiveArticleIndex] = useState<number>(0);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [impactFilter, setImpactFilter] = useState<'ALL' | 'High' | 'Medium' | 'Low'>('ALL');

  if (!macroNews) {
    return (
      <div className="bg-trading-surface border border-trading-border rounded-xl px-4 py-2.5 font-mono text-xs text-trading-muted flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
          <span>Initialisiere {activeProviderType === 'FOREX_FACTORY' ? 'Forex Factory CDN' : 'Google Cloud IAM'} Feed...</span>
        </div>
        <button onClick={onRefresh} className="hover:text-white transition">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const { overallSentiment, sentimentScore, crisisActive, crisisReason, isBlackoutActive, blackoutReason, activeProvider, articles } = macroNews;
  const currentArticle = articles[activeArticleIndex] || articles[0];

  const getSentimentBadge = (sentiment: string) => {
    if (isBlackoutActive) {
      return {
        bg: 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse',
        icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
        label: 'NEWS-BLACKOUT AKTIV',
      };
    }

    switch (sentiment) {
      case 'CRISIS':
        return {
          bg: 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />,
          label: 'KRISEN-ALARM (BLACK SWAN)',
        };
      case 'BULLISH':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />,
          label: 'BULLISH',
        };
      case 'BEARISH':
        return {
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          icon: <TrendingDown className="w-3.5 h-3.5 text-rose-400" />,
          label: 'BEARISH',
        };
      default:
        return {
          bg: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
          icon: <Minus className="w-3.5 h-3.5 text-slate-300" />,
          label: 'NEUTRAL',
        };
    }
  };

  const badge = getSentimentBadge(overallSentiment);

  const nextArticle = () => {
    if (articles.length > 0) {
      setActiveArticleIndex((prev) => (prev + 1) % articles.length);
    }
  };

  const isForexFactory = activeProviderType === 'FOREX_FACTORY';

  return (
    <>
      <div
        className={`border rounded-xl px-4 py-2.5 font-mono flex flex-wrap items-center justify-between gap-3 transition-all ${
          crisisActive || isBlackoutActive
            ? 'bg-rose-950/40 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
            : 'bg-trading-surface border-trading-border'
        }`}
      >
        {/* Linke Seite: Provider Toggle & Sentiment-Badge */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-trading-card border border-trading-border shrink-0">
            <button
              onClick={() => onSelectProvider('FOREX_FACTORY')}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition ${
                isForexFactory
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-trading-muted hover:text-white'
              }`}
              title="Forex Factory Wirtschaftskalender via Fair Economy CDN"
            >
              <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
              <span>Forex Factory</span>
            </button>

            <button
              onClick={() => onSelectProvider('GCP')}
              className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition ${
                !isForexFactory
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 font-bold'
                  : 'text-trading-muted hover:text-white'
              }`}
              title="Google Cloud IAM Welt- und Finanznachrichten"
            >
              <Globe2 className="w-3.5 h-3.5 text-sky-400" />
              <span>GCP News</span>
            </button>
          </div>

          <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-bold border shrink-0 ${badge.bg}`}>
            {badge.icon}
            <span>{badge.label}</span>
            <span className="text-[10px] opacity-80">({sentimentScore > 0 ? `+${sentimentScore}` : sentimentScore})</span>
          </div>

          {isForexFactory && (
            <button
              onClick={() => setIsCalendarOpen(true)}
              className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition flex items-center gap-1 shrink-0"
              title="Vollständigen Wirtschaftskalender für diese Woche öffnen"
            >
              <CalendarDays className="w-3 h-3 text-amber-400" />
              <span>Kalender ({articles.length})</span>
            </button>
          )}
        </div>

        {/* Mitte: Ticker-Schlagzeile */}
        {currentArticle && (
          <div
            onClick={() => setSelectedArticle(currentArticle)}
            className="flex-1 min-w-[200px] max-w-2xl mx-1 sm:mx-2 flex items-center justify-between gap-2 px-3 py-1 rounded bg-trading-card/60 hover:bg-trading-card border border-trading-border/50 hover:border-trading-border cursor-pointer transition text-xs"
          >
            <div className="flex items-center gap-2 truncate min-w-0">
              {currentArticle.isBreaking && (
                <span className="text-[10px] font-bold bg-rose-500 text-white px-1.5 py-0.2 rounded shrink-0 animate-pulse">
                  HIGH IMPACT
                </span>
              )}
              <span className="text-[10px] text-trading-muted shrink-0">[{currentArticle.source}]</span>
              <span className="text-white truncate font-sans text-xs">{currentArticle.title}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextArticle();
              }}
              title="Nächste Meldung"
              className="text-trading-muted hover:text-white p-0.5 shrink-0"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Rechte Seite: Controls & Notbremse-Simulator */}
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {crisisActive || isBlackoutActive ? (
            <button
              onClick={onResetCrisisSimulation}
              className="text-[11px] px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition font-bold flex items-center gap-1"
            >
              <span>Veto aufheben</span>
            </button>
          ) : (
            <button
              onClick={onTriggerCrisisSimulation}
              title="Simuliert einen geopolitischen Schock / News-Event, um die Judikative Notbremse zu prüfen"
              className="text-[11px] px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition flex items-center gap-1"
            >
              <Zap className="w-3 h-3" />
              <span>Notbremse testen</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Daten aktualisieren"
            className="p-1 rounded bg-trading-card border border-trading-border text-trading-muted hover:text-white disabled:opacity-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Wirtschaftskalender Modal */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
          <div className="bg-trading-surface border border-trading-border rounded-xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-trading-border flex items-center justify-between bg-trading-card/40">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-sm font-bold text-white">Forex Factory — Wirtschaftskalender (Woche)</h2>
                  <p className="text-[11px] text-trading-muted">
                    Echtzeit-Makrodaten von Fair Economy Media CDN mit Judikativem Blackout-Filter
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Filter */}
                <div className="flex items-center gap-1 text-[11px] bg-slate-900 border border-slate-700 rounded p-1">
                  <span className="text-trading-muted px-1">Filter:</span>
                  {(['ALL', 'High', 'Medium', 'Low'] as const).map((imp) => (
                    <button
                      key={imp}
                      onClick={() => setImpactFilter(imp)}
                      className={`px-2 py-0.5 rounded text-[10px] transition ${
                        impactFilter === imp
                          ? imp === 'High'
                            ? 'bg-rose-500 text-white font-bold'
                            : imp === 'Medium'
                            ? 'bg-amber-500 text-black font-bold'
                            : 'bg-sky-600 text-white font-bold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {imp}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setIsCalendarOpen(false)}
                  className="p-1 rounded bg-slate-800 text-trading-muted hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Blackout Warning Bar */}
            {isBlackoutActive && (
              <div className="bg-rose-950/50 border-b border-rose-500/50 p-2.5 px-4 text-xs text-rose-300 flex items-center gap-2 animate-pulse">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="font-bold">JUDIKATIVER SLIPPAGE-SCHUTZ:</span>
                <span>{blackoutReason || 'High-Impact Event im aktiven Zeitfenster'}</span>
              </div>
            )}

            {/* Event List Table */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {articles
                .filter((art) => {
                  if (impactFilter === 'ALL') return true;
                  if (impactFilter === 'High') return art.impactScore >= 80;
                  if (impactFilter === 'Medium') return art.impactScore >= 60 && art.impactScore < 80;
                  if (impactFilter === 'Low') return art.impactScore < 60;
                  return true;
                })
                .map((art) => {
                  const isHigh = art.impactScore >= 80;
                  const isMed = art.impactScore >= 60 && art.impactScore < 80;
                  const dateFormatted = new Date(art.timestamp).toLocaleString('de-DE', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={art.id}
                      onClick={() => setSelectedArticle(art)}
                      className={`p-3 rounded-lg border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        isHigh
                          ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/60'
                          : isMed
                          ? 'bg-amber-950/15 border-amber-500/30 hover:border-amber-500/60'
                          : 'bg-trading-card/40 border-trading-border/60 hover:border-trading-border'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0 border ${
                            isHigh
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                              : isMed
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                          }`}
                        >
                          {isHigh ? 'HIGH' : isMed ? 'MEDIUM' : 'LOW'}
                        </span>

                        <div>
                          <div className="text-xs font-bold text-white font-sans">{art.title}</div>
                          <div className="text-[11px] text-slate-400 font-sans">{art.summary}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-trading-muted shrink-0">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {dateFormatted}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-trading-muted" />
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-trading-border bg-trading-card/40 flex items-center justify-between text-[11px] text-trading-muted">
              <span>Quelle: Forex Factory / Fair Economy Media CDN (Auto-Refresh 60s)</span>
              <button
                onClick={() => setIsCalendarOpen(false)}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white transition font-bold"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail-Modal für einen einzelnen Artikel */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
          <div className="bg-trading-surface border border-trading-border rounded-xl max-w-lg w-full p-5 flex flex-col gap-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedArticle(null)}
              className="absolute top-4 right-4 text-trading-muted hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                {selectedArticle.category}
              </span>
              <span className="text-[10px] text-trading-muted">
                {new Date(selectedArticle.timestamp).toLocaleString('de-DE')}
              </span>
            </div>

            <h3 className="text-sm font-bold text-white leading-snug font-sans">
              {selectedArticle.title}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed font-sans bg-trading-card/50 p-3 rounded-lg border border-trading-border/50">
              {selectedArticle.summary}
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-trading-card p-2.5 rounded border border-trading-border/50">
                <span className="text-[10px] text-trading-muted block">Quelle:</span>
                <span className="font-bold text-white">{selectedArticle.source}</span>
              </div>
              <div className="bg-trading-card p-2.5 rounded border border-trading-border/50">
                <span className="text-[10px] text-trading-muted block">Markt-Auswirkung (Impact):</span>
                <span className="font-bold text-sky-400">{selectedArticle.impactScore} % Relevanz</span>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center text-[11px] text-trading-muted border-t border-trading-border/50">
              <span>{isForexFactory ? 'Forex Factory Feed verifiziert' : 'Google Cloud IAM Verifikation aktiv'}</span>
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white transition font-bold"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
