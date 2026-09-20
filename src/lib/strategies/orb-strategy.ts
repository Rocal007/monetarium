import { StrategyExecutor } from '../backtesting/hygiene-engine';
import { StrategySignal } from '../types/trading';

/**
 * Opening Range Breakout (ORB) Strategy
 * Institutioneller Intraday-Algorithmus:
 * - Ermittelt die Handelsspanne der ersten N Kerzen (Opening Range).
 * - Triggert Long-Einstieg bei Ausbruch über das Hoch der Eröffnungsspanne.
 * - Sichert Gewinne mit dynamischem Trailing oder Reversal unter die Spannen-Mitte.
 */
export const executeOrbStrategy: StrategyExecutor = (
  candle,
  index,
  history,
  portfolioManager,
  params
) => {
  const rangeBars = params.rangeBars ?? 15;
  const bufferPercent = (params.bufferPercent ?? 0.1) / 100;

  if (history.length < rangeBars + 2) return null;

  const openingRange = history.slice(0, rangeBars);
  const orbHigh = Math.max(...openingRange.map((c) => c.high));
  const orbLow = Math.min(...openingRange.map((c) => c.low));
  const orbMid = (orbHigh + orbLow) / 2;

  const currentPrice = candle.close;
  const p = portfolioManager.getPortfolio();
  const currentPos = p.positions[candle.symbol ?? 'BTC/USDT'];

  const triggerPrice = orbHigh * (1 + bufferPercent);

  // 1. Long Breakout Signal
  if (currentPrice > triggerPrice && (!currentPos || currentPos.amount <= 0)) {
    return {
      action: 'BUY',
      symbol: candle.symbol ?? 'BTC/USDT',
      price: currentPrice,
      confidence: 80,
      reason: `ORB Breakout: Kurs ${currentPrice} übersteigt Opening-Range-Hoch (${orbHigh.toFixed(2)}) um ${bufferPercent * 100}%.`,
    };
  }

  // 2. Exit bei Rückfall unter die Range-Mitte
  if (currentPos && currentPos.amount > 0 && currentPrice < orbMid) {
    return {
      action: 'SELL',
      symbol: candle.symbol ?? 'BTC/USDT',
      price: currentPrice,
      amount: currentPos.amount,
      confidence: 85,
      reason: `ORB Stop: Kurs ${currentPrice} fällt unter Opening-Range-Gleichgewicht (${orbMid.toFixed(2)}).`,
    };
  }

  return null;
};
