import { StrategyExecutor } from '../backtesting/hygiene-engine';
import { StrategySignal } from '../types/trading';

/**
 * Turtle Trading Breakout Strategy (Donchian Channel)
 * Klassisches System von Richard Dennis & William Eckhardt.
 * - Einstieg: Kauf beim Durchbruch des 20-Kerzen-Höchststands (System 1).
 * - Ausstieg / Stop: Ausstieg beim Bruch des 10-Kerzen-Tiefs oder 2x ATR Stop-Loss.
 */
export const executeTurtleStrategy: StrategyExecutor = (
  candle,
  index,
  history,
  portfolioManager,
  params
) => {
  const entryPeriod = params.entryPeriod ?? 20;
  const exitPeriod = params.exitPeriod ?? 10;
  const atrPeriod = params.atrPeriod ?? 14;

  if (history.length < Math.max(entryPeriod, atrPeriod) + 2) return null;

  const currentPrice = candle.close;
  const p = portfolioManager.getPortfolio();
  const currentPos = p.positions[candle.symbol ?? 'BTC/USDT'];

  // Donchian High / Low der Vorperioden (ohne aktuelle Kerze)
  const lookbackCandles = history.slice(-entryPeriod - 1, -1);
  const donchianHigh = Math.max(...lookbackCandles.map((c) => c.high));

  const exitLookbackCandles = history.slice(-exitPeriod - 1, -1);
  const donchianLow = Math.min(...exitLookbackCandles.map((c) => c.low));

  // ATR-Berechnung
  let trSum = 0;
  const atrSlice = history.slice(-atrPeriod - 1);
  for (let i = 1; i < atrSlice.length; i++) {
    const high = atrSlice[i].high;
    const low = atrSlice[i].low;
    const prevClose = atrSlice[i - 1].close;
    const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
    trSum += tr;
  }
  const atr = trSum / atrPeriod;

  // 1. Long Entry: Kurs bricht über das 20-Perioden-Hoch
  if (currentPrice > donchianHigh && (!currentPos || currentPos.amount <= 0)) {
    const stopDistance = 2.0 * atr;
    const stopLoss = Number((currentPrice - stopDistance).toFixed(2));
    const takeProfit = Number((currentPrice + 4.0 * atr).toFixed(2));

    return {
      action: 'BUY',
      symbol: candle.symbol ?? 'BTC/USDT',
      price: currentPrice,
      confidence: 85,
      reason: `Turtle Breakout: Kurs ${currentPrice} durchbricht ${entryPeriod}-Perioden-Hoch (${donchianHigh.toFixed(2)}). ATR: ${atr.toFixed(2)}. SL: ${stopLoss}`,
    };
  }

  // 2. Exit: Kurs fällt unter das 10-Perioden-Tief oder Stop-Loss
  if (currentPos && currentPos.amount > 0) {
    if (currentPrice < donchianLow) {
      return {
        action: 'SELL',
        symbol: candle.symbol ?? 'BTC/USDT',
        price: currentPrice,
        amount: currentPos.amount,
        confidence: 90,
        reason: `Turtle Exit: Kurs ${currentPrice} fällt unter ${exitPeriod}-Perioden-Tief (${donchianLow.toFixed(2)}).`,
      };
    }
  }

  return null;
};
