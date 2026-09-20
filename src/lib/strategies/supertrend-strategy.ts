import { StrategyExecutor } from '../backtesting/hygiene-engine';
import { StrategySignal } from '../types/trading';

/**
 * SuperTrend Trading Strategy
 * Trendfolge-Algorithmus basierend auf ATR-Kanalbändern.
 * - Umschaltung auf BUY, wenn der Kurs über das obere Band bricht.
 * - Umschaltung auf SELL, wenn der Kurs unter das untere Band fällt.
 */
export const executeSupertrendStrategy: StrategyExecutor = (
  candle,
  index,
  history,
  portfolioManager,
  params
) => {
  const period = params.atrPeriod ?? 10;
  const multiplier = params.multiplier ?? 3.0;

  if (history.length < period + 2) return null;

  const currentPrice = candle.close;
  const p = portfolioManager.getPortfolio();
  const currentPos = p.positions[candle.symbol ?? 'BTC/USDT'];

  // ATR berechnen
  let trSum = 0;
  const slice = history.slice(-period - 1);
  for (let i = 1; i < slice.length; i++) {
    const high = slice[i].high;
    const low = slice[i].low;
    const prevClose = slice[i - 1].close;
    trSum += Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
  }
  const atr = trSum / period;

  const medianPrice = (candle.high + candle.low) / 2;
  const upperBand = medianPrice + multiplier * atr;
  const lowerBand = medianPrice - multiplier * atr;

  // Vorherige Kerzen zur Trendbestimmung
  const prevCandle = history[history.length - 2];
  const prevMedian = (prevCandle.high + prevCandle.low) / 2;
  const prevUpperBand = prevMedian + multiplier * atr;
  const prevLowerBand = prevMedian - multiplier * atr;

  // Buy Signal: Ausbruch über das obere Band
  if (currentPrice > upperBand && prevCandle.close <= prevUpperBand && (!currentPos || currentPos.amount <= 0)) {
    return {
      action: 'BUY',
      symbol: candle.symbol ?? 'BTC/USDT',
      price: currentPrice,
      confidence: 82,
      reason: `SuperTrend Bullish Flip: Kurs ${currentPrice} übersteigt oberes Band (${upperBand.toFixed(2)}).`,
    };
  }

  // Sell Signal: Unterschreiten des unteren Bandes
  if (currentPos && currentPos.amount > 0 && currentPrice < lowerBand && prevCandle.close >= prevLowerBand) {
    return {
      action: 'SELL',
      symbol: candle.symbol ?? 'BTC/USDT',
      price: currentPrice,
      amount: currentPos.amount,
      confidence: 85,
      reason: `SuperTrend Bearish Flip: Kurs ${currentPrice} fällt unter unteres Band (${lowerBand.toFixed(2)}).`,
    };
  }

  return null;
};
