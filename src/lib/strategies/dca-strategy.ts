import { StrategyExecutor } from '../backtesting/hygiene-engine';
import { StrategySignal } from '../types/trading';

/**
 * DCA Bot (Dollar-Cost Averaging mit Take-Profit)
 * Kauft in festen Intervallen oder bei definierten Rücksetzern nach.
 * Schließt die Position vollständig oder teilweise, wenn das Profit-Ziel erreicht ist.
 */
export const executeDcaStrategy: StrategyExecutor = (
  candle,
  index,
  history,
  portfolioManager,
  params
) => {
  const intervalBars = params.intervalBars ?? 12; // Alle 12 Kerzen
  const takeProfitPercent = params.takeProfitPercent ?? 5.0; // 5% Ziel
  const dipBuyThresholdPercent = params.dipBuyThresholdPercent ?? 3.0; // Bei 3% Dip zusätzlich nachkaufen

  const currentPrice = candle.close;
  const p = portfolioManager.getPortfolio();
  const currentPos = p.positions[candle.symbol ?? 'BTC/USDT'];

  // 1. Take-Profit prüfen
  if (currentPos && currentPos.amount > 0) {
    const profitPct = ((currentPrice - currentPos.entryPrice) / currentPos.entryPrice) * 100;
    if (profitPct >= takeProfitPercent) {
      return {
        action: 'SELL',
        symbol: candle.symbol ?? 'BTC/USDT',
        price: currentPrice,
        amount: currentPos.amount,
        confidence: 0.95,
        reason: `DCA Take-Profit Ziel (+${profitPct.toFixed(1)}%) erreicht. Position glattstellen.`,
      };
    }
  }

  // 2. Dip-Kauf prüfen
  if (history.length >= 5) {
    const recentHigh = Math.max(...history.slice(-5).map((c) => c.high));
    const dipPct = ((recentHigh - currentPrice) / recentHigh) * 100;
    if (dipPct >= dipBuyThresholdPercent && p.cash > 200) {
      const amount = (p.cash * 0.1) / currentPrice;
      return {
        action: 'BUY',
        symbol: candle.symbol ?? 'BTC/USDT',
        price: currentPrice,
        amount,
        confidence: 0.8,
        reason: `DCA Dip-Kauf: Preis ist ${dipPct.toFixed(1)}% unter lokalem Hoch.`,
      };
    }
  }

  // 3. Zeitbasiertes DCA
  if (index % intervalBars === 0 && p.cash > 100) {
    const amount = (p.cash * 0.08) / currentPrice;
    return {
      action: 'BUY',
      symbol: candle.symbol ?? 'BTC/USDT',
      price: currentPrice,
      amount,
      confidence: 0.7,
      reason: `Reguläre DCA-Tranche (Intervall #${Math.floor(index / intervalBars)}).`,
    };
  }

  return null;
};
