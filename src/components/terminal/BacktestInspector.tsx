'use client';

import React, { useState } from 'react';
import { BacktestHygieneEngine } from '../../lib/backtesting/hygiene-engine';
import { BacktestResult, Candle, StrategyType } from '../../lib/types/trading';
import {
  getAllStrategies,
  getStrategyExecutor,
  getStrategyMetadata,
} from '../../lib/strategies/strategy-registry';
import { ShieldCheck, ShieldAlert, Play, Split, CheckCircle2, AlertTriangle, XOctagon } from 'lucide-react';

interface BacktestInspectorProps {
  candles: Candle[];
  symbol: string;
}

export const BacktestInspector: React.FC<BacktestInspectorProps> = ({ candles, symbol }) => {
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyType>('TURTLE');
  const [inSampleRatio, setInSampleRatio] = useState(0.7); // 70% In-Sample, 30% Out-of-Sample
  const [feeRate, setFeeRate] = useState(0.001); // 0.1%
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const allStrategies = getAllStrategies();

  const handleRunBacktest = () => {
    setIsRunning(true);
    setTimeout(() => {
      const stratExecutor = getStrategyExecutor(selectedStrategy);
      const meta = getStrategyMetadata(selectedStrategy);
      const params = meta.defaultParams;

      try {
        const res = BacktestHygieneEngine.runBacktest(
          candles,
          {
            symbol,
            strategyName: selectedStrategy,
            initialCapital: 10000,
            inSampleRatio,
            feeRate,
            slippageRate: 0.0005,
            params,
          },
          stratExecutor
        );
        setBacktestResult(res);
      } catch (err: any) {
        console.error('Backtest Fehler:', err);
      } finally {
        setIsRunning(false);
      }
    }, 100);
  };

  return (
    <div className="bg-trading-surface border border-trading-border rounded-xl p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-trading-border/60 gap-2">
        <div className="flex items-center gap-2">
          <Split className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-sm text-white">
            Backtesting-Hygiene & Overfitting-Guard
          </span>
          <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">
            Out-of-Sample Partitioning (14 Algorithmen)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-trading-muted text-[11px]">Train / Test Split:</span>
            <span className="text-white font-bold">{(inSampleRatio * 100).toFixed(0)}% / {((1 - inSampleRatio) * 100).toFixed(0)}%</span>
          </div>
          <button
            onClick={handleRunBacktest}
            disabled={isRunning}
            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black font-black uppercase text-xs transition flex items-center gap-1.5 shadow"
          >
            <Play className="w-3.5 h-3.5 fill-black" />
            {isRunning ? 'Prüfung läuft...' : 'Hygiene-Backtest starten'}
          </button>
        </div>
      </div>

      {/* Configuration Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-trading-bg p-3 rounded-lg border border-trading-border text-xs font-mono">
        <div>
          <label className="block text-[10px] text-trading-muted mb-1">Strategie-Modell (14 Algorithmen)</label>
          <select
            value={selectedStrategy}
            onChange={(e) => setSelectedStrategy(e.target.value as StrategyType)}
            className="w-full bg-trading-surface border border-trading-border rounded px-2.5 py-1 text-white focus:outline-none"
          >
            <optgroup label="📈 Trend & Breakout">
              <option value="MOMENTUM">EMA Momentum Breakout</option>
              <option value="TURTLE">Turtle Donchian Breakout</option>
              <option value="SUPERTREND">SuperTrend Dynamic Volatility</option>
              <option value="ORB">Opening Range Breakout (ORB)</option>
              <option value="SEARCH_ATTENTION_MOMENTUM">Search Visibility Momentum (SVI Alpha)</option>
            </optgroup>
            <optgroup label="🔄 Mean Reversion & Arbitrage">
              <option value="GRID">Mean-Reversion Grid Bot</option>
              <option value="BOLLINGER_REVERSION">Bollinger Z-Score Reversion</option>
              <option value="RSI_CONNORS">Larry Connors RSI-2</option>
              <option value="PAIRS_TRADING">Statistische Arbitrage (Pairs)</option>
              <option value="DCA">Dollar-Cost Averaging (DCA)</option>
            </optgroup>
            <optgroup label="🛡️ Optionen & Derivate">
              <option value="COLLAR_CYLINDER">Zylinder-Option (Collar / Fence)</option>
              <option value="STRADDLE">Long Straddle Volatility Breakout</option>
            </optgroup>
            <optgroup label="⚡ Execution & Portfolioschutz">
              <option value="TWAP">TWAP Execution Slicing</option>
              <option value="VWAP">VWAP Value & Execution</option>
              <option value="CPPI">CPPI Dynamic Portfolio Insurance</option>
            </optgroup>
          </select>
        </div>

        <div>
          <label className="block text-[10px] text-trading-muted mb-1">In-Sample Ratio (Trainingsdaten)</label>
          <input
            type="range"
            min="0.5"
            max="0.85"
            step="0.05"
            value={inSampleRatio}
            onChange={(e) => setInSampleRatio(parseFloat(e.target.value))}
            className="w-full accent-emerald-400"
          />
        </div>

        <div>
          <label className="block text-[10px] text-trading-muted mb-1">Reale Ausführungsgebühr</label>
          <select
            value={feeRate}
            onChange={(e) => setFeeRate(parseFloat(e.target.value))}
            className="w-full bg-trading-surface border border-trading-border rounded px-2.5 py-1 text-white focus:outline-none"
          >
            <option value={0.001}>0.10% (Krypto Standard Taker)</option>
            <option value={0.0005}>0.05% (VIP / Maker Rabatt)</option>
            <option value={0.0002}>0.02% (Aktien Broker Fee)</option>
          </select>
        </div>
      </div>

      {/* Results View */}
      {backtestResult ? (
        <div className="space-y-4">
          {/* Overfitting Banner */}
          <div
            className={`p-3 rounded-lg border flex items-center justify-between ${
              backtestResult.overfittingVerdict === 'STABLE'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : backtestResult.overfittingVerdict === 'MODERATE_RISK'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
          >
            <div className="flex items-center gap-3">
              {backtestResult.overfittingVerdict === 'STABLE' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              ) : backtestResult.overfittingVerdict === 'MODERATE_RISK' ? (
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
              ) : (
                <XOctagon className="w-5 h-5 text-rose-400 flex-shrink-0" />
              )}
              <div>
                <span className="font-bold text-xs uppercase tracking-wider block">
                  Overfitting-Status: [{backtestResult.overfittingVerdict}] — Hygiene Score: {backtestResult.overfittingScore}
                </span>
                <span className="text-[11px] opacity-90">
                  {backtestResult.overfittingVerdict === 'STABLE'
                    ? 'Strategie generalisiert stabil auf ungesehene Testdaten (Out-of-Sample). Kein Curve-Fitting erkannt.'
                    : backtestResult.overfittingVerdict === 'MODERATE_RISK'
                    ? 'Mäßiger Leistungsabfall im Blind-Test. Prüfe Parameter-Empfindlichkeit vor Live-Einsatz.'
                    : 'WARNUNG: Starkes Overfitting! Die Strategie scheitert auf ungesehenen Daten. Historische Anpassung zu eng!'}
                </span>
              </div>
            </div>
          </div>

          {/* Side-by-Side Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border border-trading-border rounded-lg overflow-hidden">
              <thead className="bg-trading-bg text-[10px] text-trading-muted uppercase">
                <tr>
                  <th className="p-2.5">Kennzahl</th>
                  <th className="p-2.5 text-sky-400">In-Sample ({(inSampleRatio * 100).toFixed(0)}% Training)</th>
                  <th className="p-2.5 text-emerald-400">Out-of-Sample ({((1 - inSampleRatio) * 100).toFixed(0)}% Blind-Test)</th>
                  <th className="p-2.5">Delta / Abweichung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-trading-border/30">
                <tr className="hover:bg-trading-bg/40">
                  <td className="p-2.5 font-bold text-white">Gesamtrendite</td>
                  <td className="p-2.5 text-sky-400 font-bold">
                    {backtestResult.inSampleMetrics.totalReturnPercent >= 0 ? '+' : ''}
                    {backtestResult.inSampleMetrics.totalReturnPercent.toFixed(2)}%
                  </td>
                  <td className="p-2.5 text-emerald-400 font-bold">
                    {backtestResult.outOfSampleMetrics.totalReturnPercent >= 0 ? '+' : ''}
                    {backtestResult.outOfSampleMetrics.totalReturnPercent.toFixed(2)}%
                  </td>
                  <td className="p-2.5 text-trading-muted">
                    {(backtestResult.outOfSampleMetrics.totalReturnPercent - backtestResult.inSampleMetrics.totalReturnPercent).toFixed(2)}%
                  </td>
                </tr>

                <tr className="hover:bg-trading-bg/40">
                  <td className="p-2.5 font-bold text-white">Sharpe Ratio</td>
                  <td className="p-2.5 text-sky-400">{backtestResult.inSampleMetrics.sharpeRatio.toFixed(2)}</td>
                  <td className="p-2.5 text-emerald-400">{backtestResult.outOfSampleMetrics.sharpeRatio.toFixed(2)}</td>
                  <td className="p-2.5 text-trading-muted">
                    {(backtestResult.outOfSampleMetrics.sharpeRatio - backtestResult.inSampleMetrics.sharpeRatio).toFixed(2)}
                  </td>
                </tr>

                <tr className="hover:bg-trading-bg/40">
                  <td className="p-2.5 font-bold text-white">Max Drawdown</td>
                  <td className="p-2.5 text-trading-sell">-{backtestResult.inSampleMetrics.maxDrawdownPercent.toFixed(2)}%</td>
                  <td className="p-2.5 text-trading-sell">-{backtestResult.outOfSampleMetrics.maxDrawdownPercent.toFixed(2)}%</td>
                  <td className="p-2.5 text-trading-muted">
                    {(backtestResult.outOfSampleMetrics.maxDrawdownPercent - backtestResult.inSampleMetrics.maxDrawdownPercent).toFixed(2)}%
                  </td>
                </tr>

                <tr className="hover:bg-trading-bg/40">
                  <td className="p-2.5 font-bold text-white">Trefferquote (Win Rate)</td>
                  <td className="p-2.5 text-white">{backtestResult.inSampleMetrics.winRate.toFixed(1)}%</td>
                  <td className="p-2.5 text-white">{backtestResult.outOfSampleMetrics.winRate.toFixed(1)}%</td>
                  <td className="p-2.5 text-trading-muted">
                    {(backtestResult.outOfSampleMetrics.winRate - backtestResult.inSampleMetrics.winRate).toFixed(1)}%
                  </td>
                </tr>

                <tr className="hover:bg-trading-bg/40">
                  <td className="p-2.5 font-bold text-white">Profit Factor</td>
                  <td className="p-2.5 text-white">{backtestResult.inSampleMetrics.profitFactor.toFixed(2)}</td>
                  <td className="p-2.5 text-white">{backtestResult.outOfSampleMetrics.profitFactor.toFixed(2)}</td>
                  <td className="p-2.5 text-trading-muted">
                    {(backtestResult.outOfSampleMetrics.profitFactor - backtestResult.inSampleMetrics.profitFactor).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-trading-muted font-mono bg-trading-bg/40 rounded-lg border border-dashed border-trading-border">
          Klicke auf &quot;Hygiene-Backtest starten&quot;, um die Trainings- und Testpartitionierung zu berechnen.
        </div>
      )}
    </div>
  );
};
