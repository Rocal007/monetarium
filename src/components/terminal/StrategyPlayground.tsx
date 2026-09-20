'use client';

import React, { useState } from 'react';
import { Bot, Play, Square, Webhook, Copy, Check, TrendingUp, RefreshCw, Shield, Zap } from 'lucide-react';
import { StrategyCategory, StrategyType } from '../../lib/types/trading';
import {
  getAllStrategies,
  getStrategiesByCategory,
  getStrategyMetadata,
} from '../../lib/strategies/strategy-registry';

interface StrategyPlaygroundProps {
  activeBot: StrategyType | null;
  onStartBot: (type: StrategyType, params: Record<string, number>) => void;
  onStopBot: () => void;
}

export const StrategyPlayground: React.FC<StrategyPlaygroundProps> = ({
  activeBot,
  onStartBot,
  onStopBot,
}) => {
  const [activeCategory, setActiveCategory] = useState<StrategyCategory>('TREND');
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyType>('TURTLE');
  const [customParams, setCustomParams] = useState<Record<string, number>>({});
  const [copied, setCopied] = useState(false);

  const currentMetadata = getStrategyMetadata(selectedStrategy);
  const strategiesInCurrentCategory = getStrategiesByCategory(activeCategory);

  const handleCategorySelect = (cat: StrategyCategory) => {
    setActiveCategory(cat);
    const firstInCat = getStrategiesByCategory(cat)[0];
    if (firstInCat) {
      setSelectedStrategy(firstInCat.id);
      setCustomParams({});
    }
  };

  const handleParamChange = (key: string, value: number) => {
    setCustomParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleStart = () => {
    const finalParams = {
      ...currentMetadata.defaultParams,
      ...customParams,
    };
    onStartBot(selectedStrategy, finalParams);
  };

  const copyWebhookCode = () => {
    const pineCode = `// TradingView Alert Webhook Payload für Monetarium Paper Trading\n{\n  "action": "{{strategy.order.action}}",\n  "symbol": "BTC/USDT",\n  "price": {{close}},\n  "orderType": "MARKET",\n  "strategy": "${selectedStrategy}"\n}`;
    navigator.clipboard.writeText(pineCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryIcon = (cat: StrategyCategory) => {
    switch (cat) {
      case 'TREND':
        return <TrendingUp className="w-3.5 h-3.5" />;
      case 'MEAN_REVERSION':
        return <RefreshCw className="w-3.5 h-3.5" />;
      case 'OPTIONS':
        return <Shield className="w-3.5 h-3.5" />;
      case 'EXECUTION_RISK':
        return <Zap className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="bg-trading-surface border border-trading-border rounded-xl p-4 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-trading-border/60 mb-3">
          <span className="font-bold text-sm text-white flex items-center gap-2">
            <Bot className="w-4 h-4 text-trading-accent" />
            Algorithmen & Bot-Playground
          </span>
          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            14 Quant-Algorithmen
          </span>
        </div>

        {/* 4 Category Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-trading-bg rounded-lg border border-trading-border mb-3 text-[11px] font-mono">
          {(
            [
              { id: 'TREND', label: 'Trend' },
              { id: 'MEAN_REVERSION', label: 'Mean Rev' },
              { id: 'OPTIONS', label: 'Optionen' },
              { id: 'EXECUTION_RISK', label: 'Execution' },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategorySelect(cat.id)}
              className={`py-1.5 px-1 rounded flex items-center justify-center gap-1 transition ${
                activeCategory === cat.id
                  ? 'bg-trading-card text-trading-accent font-bold border border-trading-accent/30 shadow-sm'
                  : 'text-trading-muted hover:text-white'
              }`}
            >
              {getCategoryIcon(cat.id)}
              <span className="truncate">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Strategy Selector Pills */}
        <div className="flex flex-wrap gap-1.5 mb-3 font-mono text-xs">
          {strategiesInCurrentCategory.map((strat) => {
            const isSelected = selectedStrategy === strat.id;
            return (
              <button
                key={strat.id}
                onClick={() => {
                  setSelectedStrategy(strat.id);
                  setCustomParams({});
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] transition ${
                  isSelected
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50 font-bold'
                    : 'bg-trading-card/40 text-trading-muted hover:text-white border border-trading-border/50'
                }`}
              >
                {strat.name.split(' ')[0]} {strat.name.split(' ')[1] || ''}
              </button>
            );
          })}
        </div>

        {/* Selected Strategy Info Card */}
        <div className="bg-trading-card/50 border border-trading-border/60 rounded-lg p-3 mb-3 font-mono text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-white text-xs">{currentMetadata.name}</span>
            <span className="text-[10px] bg-slate-800 text-sky-400 px-2 py-0.5 rounded border border-slate-700">
              {currentMetadata.badge}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug mb-2 font-sans">
            {currentMetadata.description}
          </p>
          <div className="bg-slate-900/60 p-1.5 rounded text-[10px] text-trading-accent border border-trading-border/40 truncate">
            Formel: <span className="text-white font-mono">{currentMetadata.formula}</span>
          </div>
        </div>

        {/* Dynamic Parameter Controls */}
        <div className="space-y-2.5 font-mono text-xs mb-4">
          <span className="text-[10px] uppercase font-bold text-trading-muted tracking-wider block">
            Parameter-Konfiguration
          </span>

          {currentMetadata.paramDefs.map((def) => {
            const val = customParams[def.key] ?? def.defaultValue;
            return (
              <div key={def.key} className="bg-trading-card/30 p-2 rounded border border-trading-border/40">
                <div className="flex justify-between text-[11px] text-trading-muted mb-1">
                  <span>{def.label}:</span>
                  <span className="text-white font-bold">{val}</span>
                </div>
                <input
                  type="range"
                  min={def.min ?? 1}
                  max={def.max ?? (val > 1000 ? val * 2 : 100)}
                  step={def.step ?? 1}
                  value={val}
                  onChange={(e) => handleParamChange(def.key, Number(e.target.value))}
                  className="w-full accent-sky-400"
                />
              </div>
            );
          })}
        </div>

        {/* Bot Runner Button */}
        {activeBot ? (
          <button
            onClick={onStopBot}
            className="w-full py-2.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-wider text-xs transition flex items-center justify-center gap-2 shadow-lg glow-sell"
          >
            <Square className="w-4 h-4 fill-white" />
            Aktiven {activeBot} Bot stoppen
          </button>
        ) : (
          <button
            onClick={handleStart}
            className="w-full py-2.5 rounded-lg bg-trading-accent hover:bg-sky-500 text-black font-black uppercase tracking-wider text-xs transition flex items-center justify-center gap-2 shadow-lg glow-accent"
          >
            <Play className="w-4 h-4 fill-black" />
            {currentMetadata.name} im Paper Trading starten
          </button>
        )}
      </div>

      {/* TradingView Webhook Helper */}
      <div className="pt-3 mt-4 border-t border-trading-border/60">
        <div className="flex items-center justify-between text-xs text-trading-muted mb-1">
          <span className="flex items-center gap-1.5 text-white font-bold text-[11px]">
            <Webhook className="w-3.5 h-3.5 text-emerald-400" />
            TradingView Webhook Hookup
          </span>
          <button
            onClick={copyWebhookCode}
            className="flex items-center gap-1 text-[10px] bg-trading-bg px-2 py-0.5 rounded border border-trading-border hover:text-white transition"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Kopiert' : 'Pine Script Payload'}
          </button>
        </div>
        <p className="text-[10px] text-trading-muted">
          Unterstützt TradingView Webhook-Alerts für alle 14 Strategiemuster.
        </p>
      </div>
    </div>
  );
};
