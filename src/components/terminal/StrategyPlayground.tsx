'use client';

import React, { useState } from 'react';
import { Bot, Play, Square, Settings2, Webhook, Copy, Check } from 'lucide-react';
import { StrategyType } from '../../lib/types/trading';

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
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyType>('GRID');
  const [gridLower, setGridLower] = useState(55000);
  const [gridUpper, setGridUpper] = useState(72000);
  const [gridCount, setGridCount] = useState(12);

  const [dcaInterval, setDcaInterval] = useState(10);
  const [dcaTakeProfit, setDcaTakeProfit] = useState(4.5);

  const [fastEma, setFastEma] = useState(9);
  const [slowEma, setSlowEma] = useState(21);

  const [copied, setCopied] = useState(false);

  const handleStart = () => {
    let params: Record<string, number> = {};
    if (selectedStrategy === 'GRID') {
      params = { lowerBound: gridLower, upperBound: gridUpper, gridCount };
    } else if (selectedStrategy === 'DCA') {
      params = { intervalBars: dcaInterval, takeProfitPercent: dcaTakeProfit };
    } else if (selectedStrategy === 'MOMENTUM') {
      params = { fastEma, slowEma, rsiOverbought: 70 };
    }
    onStartBot(selectedStrategy, params);
  };

  const copyWebhookCode = () => {
    const pineCode = `// TradingView Alert Webhook Payload für Monetarium Paper Trading\n{\n  "action": "{{strategy.order.action}}",\n  "symbol": "BTC/USDT",\n  "price": {{close}},\n  "orderType": "MARKET"\n}`;
    navigator.clipboard.writeText(pineCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-trading-surface border border-trading-border rounded-xl p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-trading-border/60 mb-4">
          <span className="font-bold text-sm text-white flex items-center gap-2">
            <Bot className="w-4 h-4 text-trading-accent" />
            Algorithmen & Bot-Playground
          </span>
          <span className="text-[10px] font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
            Pionex & TV-Logik
          </span>
        </div>

        {/* Strategy Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-trading-bg rounded-lg border border-trading-border mb-4 text-xs font-mono">
          <button
            onClick={() => setSelectedStrategy('GRID')}
            className={`py-1.5 rounded transition ${
              selectedStrategy === 'GRID'
                ? 'bg-trading-card text-trading-accent font-bold border border-trading-accent/30'
                : 'text-trading-muted hover:text-white'
            }`}
          >
            Grid Bot
          </button>
          <button
            onClick={() => setSelectedStrategy('DCA')}
            className={`py-1.5 rounded transition ${
              selectedStrategy === 'DCA'
                ? 'bg-trading-card text-trading-accent font-bold border border-trading-accent/30'
                : 'text-trading-muted hover:text-white'
            }`}
          >
            DCA Bot
          </button>
          <button
            onClick={() => setSelectedStrategy('MOMENTUM')}
            className={`py-1.5 rounded transition ${
              selectedStrategy === 'MOMENTUM'
                ? 'bg-trading-card text-trading-accent font-bold border border-trading-accent/30'
                : 'text-trading-muted hover:text-white'
            }`}
          >
            Momentum EMA
          </button>
        </div>

        {/* Parameter Controls */}
        <div className="space-y-3 font-mono text-xs mb-4">
          {selectedStrategy === 'GRID' && (
            <>
              <div>
                <div className="flex justify-between text-[11px] text-trading-muted mb-1">
                  <span>Untere Grenze (Lower Bound):</span>
                  <span className="text-white font-bold">{gridLower.toLocaleString('de-DE')} €</span>
                </div>
                <input
                  type="range"
                  min="40000"
                  max="65000"
                  step="500"
                  value={gridLower}
                  onChange={(e) => setGridLower(Number(e.target.value))}
                  className="w-full accent-sky-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-trading-muted mb-1">
                  <span>Obere Grenze (Upper Bound):</span>
                  <span className="text-white font-bold">{gridUpper.toLocaleString('de-DE')} €</span>
                </div>
                <input
                  type="range"
                  min="65000"
                  max="90000"
                  step="500"
                  value={gridUpper}
                  onChange={(e) => setGridUpper(Number(e.target.value))}
                  className="w-full accent-sky-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-trading-muted mb-1">
                  <span>Raster-Anzahl (Grid Lines):</span>
                  <span className="text-white font-bold">{gridCount} Gitter</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="30"
                  value={gridCount}
                  onChange={(e) => setGridCount(Number(e.target.value))}
                  className="w-full accent-sky-400"
                />
              </div>
            </>
          )}

          {selectedStrategy === 'DCA' && (
            <>
              <div>
                <div className="flex justify-between text-[11px] text-trading-muted mb-1">
                  <span>Kauf-Intervall (Kerzen):</span>
                  <span className="text-white font-bold">Alle {dcaInterval} Balken</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="30"
                  value={dcaInterval}
                  onChange={(e) => setDcaInterval(Number(e.target.value))}
                  className="w-full accent-emerald-400"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-trading-muted mb-1">
                  <span>Take-Profit Ziel:</span>
                  <span className="text-white font-bold">+{dcaTakeProfit}%</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={dcaTakeProfit}
                  onChange={(e) => setDcaTakeProfit(Number(e.target.value))}
                  className="w-full accent-emerald-400"
                />
              </div>
            </>
          )}

          {selectedStrategy === 'MOMENTUM' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-trading-muted mb-1">Fast EMA</label>
                  <input
                    type="number"
                    value={fastEma}
                    onChange={(e) => setFastEma(Number(e.target.value))}
                    className="w-full bg-trading-bg border border-trading-border rounded px-2.5 py-1.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-trading-muted mb-1">Slow EMA</label>
                  <input
                    type="number"
                    value={slowEma}
                    onChange={(e) => setSlowEma(Number(e.target.value))}
                    className="w-full bg-trading-bg border border-trading-border rounded px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>
              <p className="text-[10px] text-trading-muted">
                Golden Cross Trigger bei Ausbruch mit RSI-Überkauft-Schutz (70).
              </p>
            </>
          )}
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
            {selectedStrategy} Bot im Paper Trading starten
          </button>
        )}
      </div>

      {/* TradingView Webhook Helper */}
      <div className="pt-3 mt-4 border-t border-trading-border/60">
        <div className="flex items-center justify-between text-xs text-trading-muted mb-2">
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
          Pine Script Alerts können direkt per Webhook empfangen und mit Slippage-Simulation ausgeführt werden.
        </p>
      </div>
    </div>
  );
};
