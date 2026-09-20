import { StrategyExecutor } from '../backtesting/hygiene-engine';
import { StrategySignal } from '../types/trading';

/**
 * TWAP (Time-Weighted Average Price) Execution Strategy
 * Institutioneller Algorithmus:
 * - Zerlegt eine Zielposition in gleichmäßige Zeittranchen (Slices).
 * - Kauft kontinuierlich in festen Zeitintervallen zur Glättung des Durchschnittspreises.
 * - Schließt Positionen nach Erreichen des Zeithorizonts oder bei Trendumkehr.
 */
export const executeTwapStrategy: StrategyExecutor = (
  candle,
  index,
  history,
  portfolioManager,
  params
) => {
  const sliceInterval = params.sliceInterval ?? 5; // Alle 5 Kerzen eine Tranche
  const maxSlices = params.maxSlices ?? 4;
  const takeProfitPercent = params.takeProfitPercent ?? 3.5;

  if (history.length < 5) return null;

  const currentPrice = candle.close;
  const p = portfolioManager.getPortfolio();
  const currentPos = p.positions[candle.symbol ?? 'BTC/USDT'];

  // Kauf-Tranche alle `sliceInterval` Kerzen
  if (index % sliceInterval === 0) {
    if (!currentPos || currentPos.amount <= 0 || (currentPos && currentPos.amount < maxSlices)) {
      return {
        action: 'BUY',
        symbol: candle.symbol ?? 'BTC/USDT',
        price: currentPrice,
        confidence: 75,
        reason: `TWAP Tranche #${Math.floor(index / sliceInterval) + 1}: Zeitgewichtete Akkumulation bei Kurs ${currentPrice}.`,
      };
    }
  }

  // Take-Profit für akkumulierte TWAP-Position
  if (currentPos && currentPos.amount > 0) {
    const pnlPct = ((currentPrice - currentPos.entryPrice) / currentPos.entryPrice) * 100;
    if (pnlPct >= takeProfitPercent) {
      return {
        action: 'SELL',
        symbol: candle.symbol ?? 'BTC/USDT',
        price: currentPrice,
        amount: currentPos.amount,
        confidence: 85,
        reason: `TWAP Profit Target (+${pnlPct.toFixed(2)}%) erreicht. Vollständige Glattstellung.`,
      };
    }
  }

  return null;
};

/**
 * VWAP (Volume-Weighted Average Price) Strategy
 * Institutioneller Benchmark-Algorithmus:
 * - Berechnet den volumengewichteten Durchschnittskurs (VWAP = Sum(P * V) / Sum(V)).
 * - Kauft mit institutionellem Rabatt, wenn der Kurs unter dem VWAP notiert (Value Buy).
 * - Verkauft, wenn der Kurs deutlich über den VWAP expandiert.
 */
export const executeVwapStrategy: StrategyExecutor = (
  candle,
  index,
  history,
  portfolioManager,
  params
) => {
  const windowBars = params.windowBars ?? 24;
  const discountThreshold = (params.discountPercent ?? 0.8) / 100;
  const premiumThreshold = (params.premiumPercent ?? 1.5) / 100;

  if (history.length < windowBars) return null;

  const slice = history.slice(-windowBars);
  let totalPV = 0;
  let totalV = 0;

  for (const c of slice) {
    const vol = c.volume > 0 ? c.volume : 1;
    const typicalPrice = (c.high + c.low + c.close) / 3;
    totalPV += typicalPrice * vol;
    totalV += vol;
  }

  const vwap = totalV > 0 ? totalPV / totalV : candle.close;
  const currentPrice = candle.close;
  const p = portfolioManager.getPortfolio();
  const currentPos = p.positions[candle.symbol ?? 'BTC/USDT'];

  // 1. Institutioneller Kauf unterhalb des VWAP (Discount)
  if (currentPrice <= vwap * (1 - discountThreshold) && (!currentPos || currentPos.amount <= 0)) {
    return {
      action: 'BUY',
      symbol: candle.symbol ?? 'BTC/USDT',
      price: currentPrice,
      confidence: 84,
      reason: `VWAP Value Buy: Kurs ${currentPrice} liegt ${(discountThreshold * 100).toFixed(1)}% unter VWAP (${vwap.toFixed(2)}).`,
    };
  }

  // 2. Verkauf mit Aufschlag über VWAP (Premium)
  if (currentPos && currentPos.amount > 0 && currentPrice >= vwap * (1 + premiumThreshold)) {
    return {
      action: 'SELL',
      symbol: candle.symbol ?? 'BTC/USDT',
      price: currentPrice,
      amount: currentPos.amount,
      confidence: 88,
      reason: `VWAP Premium Exit: Kurs ${currentPrice} liegt ${(premiumThreshold * 100).toFixed(1)}% über VWAP (${vwap.toFixed(2)}).`,
    };
  }

  return null;
};
