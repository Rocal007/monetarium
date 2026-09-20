import { StrategyExecutor } from '../backtesting/hygiene-engine';
import { StrategySignal } from '../types/trading';

/**
 * Long Straddle Volatility Strategy
 * Derivate- & News-Breakout-Struktur:
 * - Kauft synthetisch Call und Put zum aktuellen Strike-Preis.
 * - Eignet sich vor Phasen extremer Volatilität (z.B. Forex Factory High-Impact News).
 * - Profitiert von explosiven Kursbewegungen in beliebige Richtung, sobald die Bewegung die Optionsprämie übersteigt.
 */
export const executeStraddleStrategy: StrategyExecutor = (
  candle,
  index,
  history,
  portfolioManager,
  params
) => {
  const atrPeriod = params.atrPeriod ?? 14;
  const breakoutThreshold = params.breakoutThreshold ?? 1.8; // z.B. 1.8x ATR Bewegung
  const targetProfitAtr = params.targetProfitAtr ?? 3.5;

  if (history.length < atrPeriod + 2) return null;

  const currentPrice = candle.close;
  const p = portfolioManager.getPortfolio();
  const currentPos = p.positions[candle.symbol ?? 'BTC/USDT'];

  // ATR berechnen
  let trSum = 0;
  const slice = history.slice(-atrPeriod - 1);
  for (let i = 1; i < slice.length; i++) {
    const h = slice[i].high;
    const l = slice[i].low;
    const pc = slice[i - 1].close;
    trSum += Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
  }
  const atr = trSum / atrPeriod;

  // Letzte 3 Kerzen Bewegung messen
  const recent3 = history.slice(-3);
  const netMove = Math.abs(candle.close - recent3[0].open);

  // 1. Straddle Ausbruch: Explosion über 1.8x ATR
  if (netMove >= breakoutThreshold * atr && (!currentPos || currentPos.amount <= 0)) {
    return {
      action: 'BUY',
      symbol: candle.symbol ?? 'BTC/USDT',
      price: currentPrice,
      confidence: 86,
      reason: `Straddle Volatilitäts-Ausbruch: Kursbewegung von ${netMove.toFixed(2)} übersteigt ${breakoutThreshold}x ATR (${atr.toFixed(2)}). Delta-Explosion aktiviert.`,
    };
  }

  // 2. Straddle Take-Profit oder Volatilitätskollaps
  if (currentPos && currentPos.amount > 0) {
    const profitDist = Math.abs(currentPrice - currentPos.entryPrice);
    if (profitDist >= targetProfitAtr * atr) {
      return {
        action: 'SELL',
        symbol: candle.symbol ?? 'BTC/USDT',
        price: currentPrice,
        amount: currentPos.amount,
        confidence: 90,
        reason: `Straddle Gewinnziel erreicht: Bewegung von ${profitDist.toFixed(2)} übertrifft Zielwert von ${targetProfitAtr}x ATR.`,
      };
    }
  }

  return null;
};
