import { EquityPoint, QuantMetrics, TradeLog } from '../types/trading';

/**
 * Berechnet professionelle quantitative Performance- und Risikokennzahlen
 * für Portfolios, Strategien und Backtests.
 */
export function calculateQuantMetrics(
  initialCapital: number,
  equityCurve: EquityPoint[],
  trades: TradeLog[],
  annualizationFactor: number = 365 // 365 für Krypto (24/7), 252 für Aktien
): QuantMetrics {
  if (equityCurve.length === 0) {
    return {
      totalReturn: 0,
      totalReturnPercent: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      maxDrawdown: 0,
      maxDrawdownPercent: 0,
      winRate: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      profitFactor: 0,
      avgTradePnL: 0,
      calmarRatio: 0,
    };
  }

  const finalEquity = equityCurve[equityCurve.length - 1].equity;
  const totalReturn = finalEquity - initialCapital;
  const totalReturnPercent = (totalReturn / initialCapital) * 100;

  // Periodenrenditen (z. B. stündlich oder täglich)
  const returns: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    const prev = equityCurve[i - 1].equity;
    const curr = equityCurve[i].equity;
    if (prev > 0) {
      returns.push((curr - prev) / prev);
    }
  }

  // Mittelwert & Standardabweichung
  const meanReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const variance =
    returns.length > 1
      ? returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (returns.length - 1)
      : 0;
  const stdDev = Math.sqrt(variance);

  // Downside Deviation für Sortino Ratio (nur negative Renditen)
  const downsideVariance =
    returns.length > 1
      ? returns.reduce((sum, r) => sum + (r < 0 ? Math.pow(r, 2) : 0), 0) / returns.length
      : 0;
  const downsideStdDev = Math.sqrt(downsideVariance);

  // Sharpe & Sortino (annualisiert)
  const scale = Math.sqrt(annualizationFactor);
  const sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * scale : 0;
  const sortinoRatio = downsideStdDev > 0 ? (meanReturn / downsideStdDev) * scale : 0;

  // Maximum Drawdown (MDD)
  let peak = initialCapital;
  let maxDrawdownAbs = 0;
  let maxDrawdownPct = 0;

  for (const pt of equityCurve) {
    if (pt.equity > peak) {
      peak = pt.equity;
    }
    const dd = peak - pt.equity;
    const ddPct = peak > 0 ? (dd / peak) * 100 : 0;
    if (dd > maxDrawdownAbs) maxDrawdownAbs = dd;
    if (ddPct > maxDrawdownPct) maxDrawdownPct = ddPct;
  }

  // Calmar Ratio: Return / MaxDrawdown
  const calmarRatio = maxDrawdownPct > 0 ? totalReturnPercent / maxDrawdownPct : 0;

  // Trade-Statistiken
  const closedTrades = trades.filter((t) => t.pnl !== undefined);
  const totalTrades = closedTrades.length;
  const winningTrades = closedTrades.filter((t) => (t.pnl ?? 0) > 0).length;
  const losingTrades = closedTrades.filter((t) => (t.pnl ?? 0) < 0).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  const grossProfits = closedTrades.reduce((acc, t) => (t.pnl && t.pnl > 0 ? acc + t.pnl : acc), 0);
  const grossLosses = Math.abs(
    closedTrades.reduce((acc, t) => (t.pnl && t.pnl < 0 ? acc + t.pnl : acc), 0)
  );
  const profitFactor = grossLosses > 0 ? grossProfits / grossLosses : grossProfits > 0 ? 999 : 0;

  const totalPnL = closedTrades.reduce((acc, t) => acc + (t.pnl ?? 0), 0);
  const avgTradePnL = totalTrades > 0 ? totalPnL / totalTrades : 0;

  return {
    totalReturn,
    totalReturnPercent,
    sharpeRatio: Number(sharpeRatio.toFixed(2)),
    sortinoRatio: Number(sortinoRatio.toFixed(2)),
    maxDrawdown: Number(maxDrawdownAbs.toFixed(2)),
    maxDrawdownPercent: Number(maxDrawdownPct.toFixed(2)),
    winRate: Number(winRate.toFixed(1)),
    totalTrades,
    winningTrades,
    losingTrades,
    profitFactor: Number(profitFactor.toFixed(2)),
    avgTradePnL: Number(avgTradePnL.toFixed(2)),
    calmarRatio: Number(calmarRatio.toFixed(2)),
  };
}

/**
 * Overfitting-Hygiene: Vergleicht In-Sample (IS) vs. Out-of-Sample (OOS) Metriken.
 * Ein massiver Einbruch der Sharpe-Ratio oder Rendite im OOS-Zeitraum deutet auf
 * Überanpassung (Curve-Fitting) hin.
 */
export function evaluateOverfitting(
  isMetrics: QuantMetrics,
  oosMetrics: QuantMetrics
): {
  score: number;
  verdict: 'STABLE' | 'MODERATE_RISK' | 'OVERFITTED';
  details: string;
} {
  // Wenn In-Sample phänomenal war, aber Out-of-Sample stark abfällt:
  const isSharpe = Math.max(0, isMetrics.sharpeRatio);
  const oosSharpe = Math.max(0, oosMetrics.sharpeRatio);

  let sharpeDecay = 0;
  if (isSharpe > 0.5) {
    sharpeDecay = Math.max(0, (isSharpe - oosSharpe) / isSharpe);
  }

  let returnDecay = 0;
  if (isMetrics.totalReturnPercent > 0) {
    returnDecay = Math.max(
      0,
      (isMetrics.totalReturnPercent - oosMetrics.totalReturnPercent) / Math.abs(isMetrics.totalReturnPercent)
    );
  }

  // Drawdown Ausweitung im OOS
  let ddExpansion = 0;
  if (isMetrics.maxDrawdownPercent > 0 && oosMetrics.maxDrawdownPercent > isMetrics.maxDrawdownPercent) {
    ddExpansion = Math.min(
      1,
      (oosMetrics.maxDrawdownPercent - isMetrics.maxDrawdownPercent) / isMetrics.maxDrawdownPercent
    );
  }

  const score = Math.min(1, Math.max(0, sharpeDecay * 0.5 + returnDecay * 0.3 + ddExpansion * 0.2));

  let verdict: 'STABLE' | 'MODERATE_RISK' | 'OVERFITTED' = 'STABLE';
  let details = 'Strategie generalisiert gut auf ungesehene Testdaten (Out-of-Sample).';

  if (score > 0.6 || (isMetrics.totalReturnPercent > 10 && oosMetrics.totalReturnPercent < -5)) {
    verdict = 'OVERFITTED';
    details =
      'WARNUNG: Signifikantes Overfitting! Strategie bricht im Out-of-Sample Test ein. Parameter reduzieren.';
  } else if (score > 0.3) {
    verdict = 'MODERATE_RISK';
    details = 'Leichte Leistungseinbußen auf Testdaten. Walk-Forward Analyse empfohlen.';
  }

  return {
    score: Number(score.toFixed(2)),
    verdict,
    details,
  };
}
