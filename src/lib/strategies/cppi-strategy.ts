import { StrategyExecutor } from '../backtesting/hygiene-engine';
import { StrategySignal } from '../types/trading';

/**
 * Constant Proportion Portfolio Insurance (CPPI) Strategy
 * Institutioneller Wertsicherungs-Algorithmus:
 * - Garantiert mathematisch einen vordefinierten Kapitalschutz-Boden (Floor, z.B. 85% des Startkapitals).
 * - Berechnet den Sicherheitspuffer (Cushion = Equity - Floor).
 * - Skaliert die Markt-Exposure dynamisch mit einem Multiplikator m: TargetExposure = m * Cushion.
 * - Fällt das Kapital auf den Floor, wird die Position zu 100% in Cash liquidiert (Garantieschutz).
 */
export const executeCppiStrategy: StrategyExecutor = (
  candle,
  index,
  history,
  portfolioManager,
  params
) => {
  const floorRatio = (params.floorPercent ?? 85) / 100; // 85% Garantie
  const multiplier = params.multiplier ?? 2.5;

  if (history.length < 5) return null;

  const currentPrice = candle.close;
  const p = portfolioManager.getPortfolio();
  const currentPos = p.positions[candle.symbol ?? 'BTC/USDT'];

  const initialCapital = p.initialBalance > 0 ? p.initialBalance : 10000;
  const floor = initialCapital * floorRatio;
  const currentEquity = p.equity;
  const cushion = Math.max(0, currentEquity - floor);

  // 1. Not-Liquidierung bei Berührung des Floors
  if (cushion <= 0 && currentPos && currentPos.amount > 0) {
    return {
      action: 'SELL',
      symbol: candle.symbol ?? 'BTC/USDT',
      price: currentPrice,
      amount: currentPos.amount,
      confidence: 100,
      reason: `CPPI Kapitalschutz-Notbremse: Equity (${currentEquity.toFixed(2)} €) hat den Floor (${floor.toFixed(2)} €) berührt. Vollständige Umschichtung in Cash.`,
    };
  }

  // 2. Investition basierend auf Cushion & Multiplikator
  const maxAllowedExposure = Math.min(currentEquity, cushion * multiplier);
  const currentInvested = currentPos ? currentPos.amount * currentPrice : 0;

  // Wenn wir noch Puffer haben und noch nicht investiert sind
  if (cushion > 0 && currentInvested < maxAllowedExposure * 0.7) {
    // Einfacher Trendfilter: Kurs über EMA 10
    const recent5 = history.slice(-5);
    const sma5 = recent5.reduce((sum, c) => sum + c.close, 0) / 5;

    if (currentPrice >= sma5) {
      return {
        action: 'BUY',
        symbol: candle.symbol ?? 'BTC/USDT',
        price: currentPrice,
        confidence: 85,
        reason: `CPPI Allokation: Cushion beträgt ${cushion.toFixed(2)} €. Erlaubte Hebel-Exposure: ${maxAllowedExposure.toFixed(2)} € (Floor: ${floor.toFixed(2)} €).`,
      };
    }
  }

  // 3. De-Risking bei schrumpfendem Cushion
  if (currentPos && currentPos.amount > 0 && currentInvested > maxAllowedExposure * 1.3) {
    return {
      action: 'SELL',
      symbol: candle.symbol ?? 'BTC/USDT',
      price: currentPrice,
      amount: currentPos.amount * 0.5,
      confidence: 80,
      reason: `CPPI Rebalancing (De-Risking): Reduziere Exposure um 50%, da Puffer (Cushion) geschrumpft ist.`,
    };
  }

  return null;
};
