import { StrategyExecutor } from '../backtesting/hygiene-engine';
import { Candle, StrategySignal } from '../types/trading';

function calculateEma(candles: Candle[], period: number): number {
  if (candles.length < period) return candles[candles.length - 1].close;
  const k = 2 / (period + 1);
  let ema = candles[0].close;
  for (let i = 1; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k);
  }
  return ema;
}

function calculateRsi(candles: Candle[], period: number = 14): number {
  if (candles.length < period + 1) return 50;
  let gains = 0;
  let losses = 0;

  for (let i = candles.length - period; i < candles.length; i++) {
    const change = candles[i].close - candles[i - 1].close;
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/**
 * Trend-Following Momentum Strategy
 * Kombiniert EMA-Fast (z.B. 9) und EMA-Slow (z.B. 21) Golden Cross mit RSI-Filter.
 */
export const executeMomentumStrategy: StrategyExecutor = (
  candle,
  index,
  history,
  portfolioManager,
  params
) => {
  const fastPeriod = params.fastEma ?? 9;
  const slowPeriod = params.slowEma ?? 21;
  const rsiOversold = params.rsiOversold ?? 35;
  const rsiOverbought = params.rsiOverbought ?? 70;

  if (history.length < slowPeriod + 2) return null;

  const currentPrice = candle.close;
  const p = portfolioManager.getPortfolio();
  const currentPos = p.positions[candle.symbol ?? 'BTC/USDT'];

  const prevCandles = history.slice(0, -1);
  const fastEmaNow = calculateEma(history, fastPeriod);
  const slowEmaNow = calculateEma(history, slowPeriod);
  const fastEmaPrev = calculateEma(prevCandles, fastPeriod);
  const slowEmaPrev = calculateEma(prevCandles, slowPeriod);

  const rsi = calculateRsi(history, 14);

  // Bullisches Signal: Golden Cross (Fast kreuzt Slow von unten) & RSI nicht überkauft
  const isGoldenCross = fastEmaPrev <= slowEmaPrev && fastEmaNow > slowEmaNow;
  if (isGoldenCross && rsi < rsiOverbought && p.cash > 200) {
    const amount = (p.cash * 0.25) / currentPrice;
    return {
      action: 'BUY',
      symbol: candle.symbol ?? 'BTC/USDT',
      price: currentPrice,
      amount,
      confidence: 0.88,
      reason: `Momentum Golden Cross (EMA ${fastPeriod} > ${slowPeriod}), RSI=${rsi.toFixed(0)}. Trendfolge-Einstieg.`,
    };
  }

  // Bärisches Signal: Death Cross oder RSI stark überkauft -> Ausstieg
  const isDeathCross = fastEmaPrev >= slowEmaPrev && fastEmaNow < slowEmaNow;
  if ((isDeathCross || rsi >= rsiOverbought) && currentPos && currentPos.amount > 0) {
    return {
      action: 'SELL',
      symbol: candle.symbol ?? 'BTC/USDT',
      price: currentPrice,
      amount: currentPos.amount,
      confidence: 0.85,
      reason: isDeathCross
        ? `Momentum Death Cross (EMA ${fastPeriod} < ${slowPeriod}). Trendbruch.`
        : `RSI Überkauft (${rsi.toFixed(0)} >= ${rsiOverbought}). Gewinnmitnahme.`,
    };
  }

  return null;
};
