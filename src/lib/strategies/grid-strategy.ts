import { StrategyExecutor } from '../backtesting/hygiene-engine';
import { StrategySignal } from '../types/trading';

/**
 * Grid Trading Bot
 * Platziert ein dynamisches oder statisches Preisraster (Lower/Upper Bound).
 * Kauft bei Unterschreiten eines Raster-Levels, verkauft bei Überschreiten.
 */
export const executeGridStrategy: StrategyExecutor = (
  candle,
  index,
  history,
  portfolioManager,
  params
) => {
  const lowerBound = params.lowerBound ?? 50000;
  const upperBound = params.upperBound ?? 70000;
  const gridCount = params.gridCount ?? 10;
  const step = (upperBound - lowerBound) / gridCount;

  const currentPrice = candle.close;
  if (currentPrice < lowerBound || currentPrice > upperBound) {
    return null; // Außerhalb der Grid-Range
  }

  const p = portfolioManager.getPortfolio();
  const currentPos = p.positions[candle.symbol ?? 'BTC/USDT'];

  // Bestimme aktuelles Grid-Level
  const currentLevel = Math.floor((currentPrice - lowerBound) / step);
  const prevCandle = history[index - 1];
  if (!prevCandle) return null;

  const prevLevel = Math.floor((prevCandle.close - lowerBound) / step);

  // Wenn der Preis von oben nach unten eine Grid-Linie kreuzt -> KAUF
  if (currentLevel < prevLevel && p.cash > 100) {
    const buyAmount = (p.cash * 0.15) / currentPrice;
    return {
      action: 'BUY',
      symbol: candle.symbol ?? 'BTC/USDT',
      price: currentPrice,
      amount: buyAmount,
      confidence: 0.85,
      reason: `Grid Level ${currentLevel} erreicht (Unterstützung). Rebound-Kauf.`,
    };
  }

  // Wenn der Preis von unten nach oben eine Grid-Linie kreuzt -> VERKAUF
  if (currentLevel > prevLevel && currentPos && currentPos.amount > 0) {
    const sellAmount = currentPos.amount * 0.3; // Teilverkäufe zur Gewinnsicherung
    return {
      action: 'SELL',
      symbol: candle.symbol ?? 'BTC/USDT',
      price: currentPrice,
      amount: sellAmount,
      confidence: 0.85,
      reason: `Grid Level ${currentLevel} erreicht (Widerstand). Profit-Taking.`,
    };
  }

  return null;
};
