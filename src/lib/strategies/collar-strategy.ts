import { StrategyExecutor } from '../backtesting/hygiene-engine';
import { StrategySignal } from '../types/trading';

/**
 * Zylinder-Option (Collar / Risk Reversal / Fence) Strategy
 * Institutionelle Derivate-Struktur:
 * - 1. Long Basiswert (Aktie/Krypto)
 * - 2. Long OTM Put (Floor): Schützt das Portfolio vor Crashs unter dem Strike-Preis (z.B. -5%).
 * - 3. Short OTM Call (Cap): Begrenzt den Gewinn nach oben (z.B. +12%), finanziert jedoch die Put-Prämie vollständig ("Zero-Cost Collar").
 * 
 * Risikoprofil: Streng symmetrisch gedeckelt (Max Loss = Floor-Distanz, Max Profit = Cap-Distanz).
 */
export const executeCollarCylinderStrategy: StrategyExecutor = (
  candle,
  index,
  history,
  portfolioManager,
  params
) => {
  const floorPercent = params.floorPercent ?? 5.0; // Max. Verlust z.B. 5%
  const capPercent = params.capPercent ?? 12.0;   // Max. Gewinn z.B. 12%
  const rebalanceBars = params.rebalanceBars ?? 20;

  if (history.length < 5) return null;

  const currentPrice = candle.close;
  const p = portfolioManager.getPortfolio();
  const currentPos = p.positions[candle.symbol ?? 'BTC/USDT'];

  // 1. Neuer Zylinder-Einstieg (Long + Zero-Cost Collar Anlage)
  if (!currentPos || currentPos.amount <= 0) {
    const putFloorPrice = currentPrice * (1 - floorPercent / 100);
    const callCapPrice = currentPrice * (1 + capPercent / 100);

    return {
      action: 'BUY',
      symbol: candle.symbol ?? 'BTC/USDT',
      price: currentPrice,
      confidence: 90,
      reason: `Zylinder-Option (Collar) aktiviert: Long Entry ${currentPrice} €. Put-Floor (Stop): ${putFloorPrice.toFixed(2)} € (-${floorPercent}%), Call-Cap (Take Profit): ${callCapPrice.toFixed(2)} € (+${capPercent}%). Zero-Cost Prämie neutral.`,
    };
  }

  // 2. Bestehende Zylinder-Struktur prüfen
  if (currentPos && currentPos.amount > 0) {
    const entryPrice = currentPos.entryPrice;
    const putFloorPrice = entryPrice * (1 - floorPercent / 100);
    const callCapPrice = entryPrice * (1 + capPercent / 100);

    // Fall A: Put-Floor ausgelöst (Crash-Schutz greift)
    if (currentPrice <= putFloorPrice) {
      return {
        action: 'SELL',
        symbol: candle.symbol ?? 'BTC/USDT',
        price: currentPrice,
        amount: currentPos.amount,
        confidence: 95,
        reason: `Zylinder Put-Floor gegriffen: Kurs ${currentPrice} <= ${putFloorPrice.toFixed(2)} €. Kapital vor weiterem Absturz geschützt.`,
      };
    }

    // Fall B: Call-Cap erreicht (Gewinnmitnahme / Andienung)
    if (currentPrice >= callCapPrice) {
      return {
        action: 'SELL',
        symbol: candle.symbol ?? 'BTC/USDT',
        price: currentPrice,
        amount: currentPos.amount,
        confidence: 95,
        reason: `Zylinder Call-Cap erreicht: Kurs ${currentPrice} >= ${callCapPrice.toFixed(2)} €. Maximaler Zielgewinn von +${capPercent}% realisiert.`,
      };
    }

    // Fall C: Zeitwert-Ablauf nach Verfallsdauer (z.B. 20 Kerzen)
    if (index % rebalanceBars === 0 && index > 0) {
      const pnlPct = ((currentPrice - entryPrice) / entryPrice) * 100;
      if (pnlPct > 2.0) {
        return {
          action: 'SELL',
          symbol: candle.symbol ?? 'BTC/USDT',
          price: currentPrice,
          amount: currentPos.amount,
          confidence: 80,
          reason: `Zylinder Roll-Over / Laufzeit-Ende: Gewinn von +${pnlPct.toFixed(2)}% realisiert. Struktur wird neu aufgesetzt.`,
        };
      }
    }
  }

  return null;
};
