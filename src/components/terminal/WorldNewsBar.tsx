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
  Info,
  X,
} from 'lucide-react';
import { MacroSentimentState, WorldNewsItem } from '../../lib/types/news';

interface WorldNewsBarProps {
  macroNews: MacroSentimentState | null;
  isLoading: boolean;
  onRefresh: () => void;
  onTriggerCrisisSimulation: () => void;
  onResetCrisisSimulation: () => void;
}

export const WorldNewsBar: React.FC<WorldNewsBarProps> = ({
  macroNews,
  isLoading,
  onRefresh,
  onTriggerCrisisSimulation,
  onResetCrisisSimulation,
}) => {
  const [selectedArticle, setSelectedArticle] = useState<WorldNewsItem | null>(null);
  const [activeArticleIndex, setActiveArticleIndex] = useState<number>(0);

  if (!macroNews) {
    return (
      <div className="bg-trading-surface border border-trading-border rounded-xl px-4 py-2.5 font-mono text-xs text-trading-muted flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
          <span>Initialisiere Google Cloud IAM News Feed...</span>
        </div>
        <button onClick={onRefresh} className="hover:text-white transition">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const { overallSentiment, sentimentScore, crisisActive, crisisReason, activeProvider, articles } = macroNews;
  const currentArticle = articles[activeArticleIndex] || articles[0];

  const getSentimentBadge = (sentiment: string) => {
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

  return (
    <>
      <div
        className={`border rounded-xl px-4 py-2.5 font-mono flex flex-wrap items-center justify-between gap-3 transition-all ${
          crisisActive
            ? 'bg-rose-950/40 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
            : 'bg-trading-surface border-trading-border'
        }`}
      >
        {/* Linke Seite: Feed-Titel & Sentiment-Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg border ${crisisActive ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse' : 'bg-sky-500/10 border-sky-500/30 text-sky-400'}`}>
              <Globe2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-white">GCP Welt-News</span>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded border border-slate-700">
                  {activeProvider}
                </span>
              </div>
            </div>
          </div>

          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold border ${badge.bg}`}>
            {badge.icon}
            <span>{badge.label}</span>
            <span className="text-[10px] opacity-80">({sentimentScore > 0 ? `+${sentimentScore}` : sentimentScore})</span>
          </div>
        </div>

        {/* Mitte: Ticker-Schlagzeile */}
        {currentArticle && (
          <div
            onClick={() => setSelectedArticle(currentArticle)}
            className="flex-1 max-w-2xl mx-2 flex items-center justify-between gap-2 px-3 py-1 rounded bg-trading-card/60 hover:bg-trading-card border border-trading-border/50 hover:border-trading-border cursor-pointer transition text-xs"
          >
            <div className="flex items-center gap-2 truncate">
              {currentArticle.isBreaking && (
                <span className="text-[10px] font-bold bg-rose-500 text-white px-1.5 py-0.2 rounded shrink-0 animate-pulse">
                  EILMELDUNG
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
              className="text-trading-muted hover:text-white p-0.5"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Rechte Seite: Controls & Notbremse-Simulator */}
        <div className="flex items-center gap-2">
          {crisisActive ? (
            <button
              onClick={onResetCrisisSimulation}
              className="text-[11px] px-2 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 transition font-bold flex items-center gap-1"
            >
              <span>Krise aufheben</span>
            </button>
          ) : (
            <button
              onClick={onTriggerCrisisSimulation}
              title="Simuliert einen geopolitischen Makro-Schock, um die Judikative Notbremse zu testen"
              className="text-[11px] px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition flex items-center gap-1"
            >
              <Zap className="w-3 h-3" />
              <span>Notbremse testen</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="News aktualisieren"
            className="p-1 rounded bg-trading-card border border-trading-border text-trading-muted hover:text-white disabled:opacity-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Detail-Modal für einen Artikel */}
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
              <span className="text-[10px] uppercase font-bold bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30">
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
              <span>Google Cloud IAM Verifikation aktiv</span>
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
