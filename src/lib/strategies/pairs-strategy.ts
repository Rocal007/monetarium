import { StrategyExecutor } from '../backtesting/hygiene-engine';
import { StrategySignal } from '../types/trading';

/**
 * Statistical Arbitrage & Pairs Trading Strategy
 * Marktneutraler Algorithmus:
 * - Berechnet den Spread und Z-Score gegenüber einem rollierenden Referenzanker (Benchmark).
 * - Kauft das Asset, wenn der Spread statistisch überdehnt nach unten abweicht (Z <= -2.0).
 * - Realisiert Gewinne bei Rückkehr des Spreads zum Gleichgewicht (Z >= 0.0).
 */
export const executePairsTradingStrategy: StrategyExecutor = (
  candle,
  index,
  history,
  portfolioManager,
  params
) => {
  const lookbackPeriod = params.lookbackPeriod ?? 30;
  const entryZScore = params.entryZScore ?? 2.0;

  if (history.length < lookbackPeriod + 2) return null;

  const currentPrice = candle.close;
  const p = portfolioManager.getPortfolio();
  const currentPos = p.positions[candle.symbol ?? 'BTC/USDT'];

  // Synthetischer Spread basierend auf rollierendem Verhältnis zum Median
  const slice = history.slice(-lookbackPeriod);
  const benchmarkValues = slice.map((c, i) => (c.high + c.low) / 2);
  const spreads = slice.map((c, i) => c.close - benchmarkValues[i]);

  const meanSpread = spreads.reduce((a, b) => a + b, 0) / spreads.length;
  const variance = spreads.reduce((a, b) => a + Math.pow(b - meanSpread, 2), 0) / spreads.length;
  const stdSpread = Math.sqrt(variance);

  if (stdSpread === 0) return null;

  const currentSpread = currentPrice - (candle.high + candle.low) / 2;
  const zScore = (currentSpread - meanSpread) / stdSpread;

  // 1. Long Signal bei Unterbewertung des Spreads
  if (zScore <= -entryZScore && (!currentPos || currentPos.amount <= 0)) {
    return {
      action: 'BUY',
      symbol: candle.symbol ?? 'BTC/USDT',
      price: currentPrice,
      confidence: 84,
      reason: `StatArb Pairs Entry: Spread Z-Score bei ${zScore.toFixed(2)} (<= -${entryZScore}). Statistische Konvergenz erwartet.`,
    };
  }

  // 2. Exit bei Konvergenz zum Mittelwert
  if (currentPos && currentPos.amount > 0 && zScore >= 0.2) {
    return {
      action: 'SELL',
      symbol: candle.symbol ?? 'BTC/USDT',
      price: currentPrice,
      amount: currentPos.amount,
      confidence: 86,
      reason: `StatArb Pairs Exit: Spread ist wieder im statistischen Gleichgewicht (Z-Score ${zScore.toFixed(2)}).`,
    };
  }

  return null;
};
