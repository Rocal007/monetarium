import { StrategyExecutor } from '../backtesting/hygiene-engine';
import { StrategySignal } from '../types/trading';

/**
 * Bollinger Bands Mean-Reversion Strategy
 * Statistischer Reversion-Algorithmus:
 * - Berechnet den gleitenden Durchschnitt (SMA) und Standardabweichungen (Z-Score).
 * - Kauft bei statistischen Extremen (Kurs berührt oder unterschreitet das untere Band Z <= -2.0).
 * - Realisiert Gewinne bei Rückkehr zum Mittelwert (SMA) oder oberen Band.
 */
export const executeBollingerStrategy: StrategyExecutor = (
  candle,
  index,
  history,
  portfolioManager,
  params
) => {
  const period = params.period ?? 20;
  const numStdDev = params.stdDev ?? 2.0;

  if (history.length < period + 2) return null;

  const currentPrice = candle.close;
  const p = portfolioManager.getPortfolio();
  const currentPos = p.positions[candle.symbol ?? 'BTC/USDT'];

  const slice = history.slice(-period);
  const sum = slice.reduce((acc, c) => acc + c.close, 0);
  const sma = sum / period;

  const variance = slice.reduce((acc, c) => acc + Math.pow(c.close - sma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return null;

  const zScore = (currentPrice - sma) / stdDev;
  const lowerBand = sma - numStdDev * stdDev;
  const upperBand = sma + numStdDev * stdDev;

  // 1. Mean-Reversion Buy Signal bei überverkauftem Zustand
  if (zScore <= -numStdDev && (!currentPos || currentPos.amount <= 0)) {
    return {
      action: 'BUY',
      symbol: candle.symbol ?? 'BTC/USDT',
      price: currentPrice,
      confidence: 85,
      reason: `Bollinger Reversion Buy: Kurs ${currentPrice} liegt bei Z-Score ${zScore.toFixed(2)} (unter Band ${lowerBand.toFixed(2)}).`,
    };
  }

  // 2. Take-Profit bei Erreichen des Mittelwerts oder oberen Bandes
  if (currentPos && currentPos.amount > 0) {
    if (currentPrice >= sma || zScore >= 1.0) {
      return {
        action: 'SELL',
        symbol: candle.symbol ?? 'BTC/USDT',
        price: currentPrice,
        amount: currentPos.amount,
        confidence: 80,
        reason: `Bollinger Take-Profit: Kurs ${currentPrice} hat den statistischen Mittelwert (${sma.toFixed(2)}, Z-Score ${zScore.toFixed(2)}) erreicht.`,
      };
    }

    // Stop-Loss bei extremem Trend-Bruch (Z-Score < -3.5)
    if (zScore <= -3.5) {
      return {
        action: 'SELL',
        symbol: candle.symbol ?? 'BTC/USDT',
        price: currentPrice,
        amount: currentPos.amount,
        confidence: 95,
        reason: `Bollinger Stop-Loss: Extremabweichung Z-Score ${zScore.toFixed(2)} signalisiert strukturellen Abwärtstrend.`,
      };
    }
  }

  return null;
};
