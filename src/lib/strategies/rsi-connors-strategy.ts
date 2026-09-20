import { StrategyExecutor } from '../backtesting/hygiene-engine';
import { StrategySignal } from '../types/trading';

function calculateRsi2(history: { close: number }[], period: number = 2): number {
  if (history.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;

  for (let i = history.length - period; i < history.length; i++) {
    const diff = history[i].close - history[i - 1].close;
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * Larry Connors RSI-2 Strategy
 * Hochpräziser Reversal-Algorithmus:
 * - Handelt nur in Richtung des übergeordneten Trends (Kurs > SMA 200).
 * - Kauft extreme kurzfristige Überverkäufe (RSI(2) < 10).
 * - Schneller Ausstieg, sobald der Kurs den kurzfristigen Durchschnitt (SMA 5) überschreitet.
 */
export const executeRsiConnorsStrategy: StrategyExecutor = (
  candle,
  index,
  history,
  portfolioManager,
  params
) => {
  const trendSmaPeriod = params.trendSma ?? 50; // In Backtests oft 50 oder 200
  const exitSmaPeriod = params.exitSma ?? 5;
  const oversoldThreshold = params.oversoldThreshold ?? 10;
  const overboughtThreshold = params.overboughtThreshold ?? 85;

  if (history.length < Math.max(trendSmaPeriod, 5) + 2) return null;

  const currentPrice = candle.close;
  const p = portfolioManager.getPortfolio();
  const currentPos = p.positions[candle.symbol ?? 'BTC/USDT'];

  const rsi2 = calculateRsi2(history, 2);

  // Trend-SMA
  const trendSlice = history.slice(-trendSmaPeriod);
  const trendSma = trendSlice.reduce((sum, c) => sum + c.close, 0) / trendSmaPeriod;

  // Exit-SMA
  const exitSlice = history.slice(-exitSmaPeriod);
  const exitSma = exitSlice.reduce((sum, c) => sum + c.close, 0) / exitSmaPeriod;

  // 1. Entry: Übergeordneter Aufwärtstrend + extremer 2-Kerzen-Überverkauf
  if (currentPrice > trendSma && rsi2 <= oversoldThreshold && (!currentPos || currentPos.amount <= 0)) {
    return {
      action: 'BUY',
      symbol: candle.symbol ?? 'BTC/USDT',
      price: currentPrice,
      confidence: 88,
      reason: `Connors RSI-2 Reversal: Kurs ${currentPrice} über SMA ${trendSma.toFixed(2)}, RSI(2) bei extremen ${rsi2.toFixed(1)} Punkten.`,
    };
  }

  // 2. Exit: Kurs erreicht kurzfristigen Mittelwert oder RSI(2) überkauft
  if (currentPos && currentPos.amount > 0) {
    if (currentPrice > exitSma || rsi2 >= overboughtThreshold) {
      return {
        action: 'SELL',
        symbol: candle.symbol ?? 'BTC/USDT',
        price: currentPrice,
        amount: currentPos.amount,
        confidence: 82,
        reason: `Connors RSI-2 Exit: Kurs über SMA ${exitSmaPeriod} (${exitSma.toFixed(2)}) oder RSI(2) (${rsi2.toFixed(1)}) überkauft.`,
      };
    }
  }

  return null;
};
