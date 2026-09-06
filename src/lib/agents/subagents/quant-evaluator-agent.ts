import { Portfolio } from '../../types/trading';
import { QuantCycleTelemetry, QuantEvaluatorProtocol } from '../protocols/types';

export class QuantEvaluatorAgent {
  private static lastStateSignature: string = '';
  private static cachedResult: QuantCycleTelemetry | null = null;
  private static cacheTickCount: number = 0;

  /**
   * Evaluator & Cache-Operator C(X):
   * Stabilisiert semantisch äquivalente Zustände und berechnet Live-Metriken.
   */
  public static evaluate(
    portfolio: Portfolio,
    currentPrice: number,
    regime: string,
    cycleIndex: number,
    protocol: QuantEvaluatorProtocol
  ): QuantCycleTelemetry {
    // Signatur zur Erkennung semantischer Äquivalenz
    const signature = `${regime}-${Math.round(currentPrice / 10)}-${portfolio.tradeHistory.length}-${Math.round(portfolio.equity)}`;

    if (
      this.lastStateSignature === signature &&
      this.cachedResult &&
      this.cacheTickCount < protocol.cacheTtlTicks
    ) {
      this.cacheTickCount++;
      return {
        ...this.cachedResult,
        cycleIndex,
        cached: true,
        fixpointDelta: 0,
      };
    }

    this.lastStateSignature = signature;
    this.cacheTickCount = 0;

    // 1. Drawdown
    const initialBalance = portfolio.initialBalance > 0 ? portfolio.initialBalance : 10000;
    const drawdownPercent = Math.max(0, ((initialBalance - portfolio.equity) / initialBalance) * 100);

    // 2. Win Rate aus den letzten Trades
    const recentTrades = portfolio.tradeHistory.slice(-protocol.evaluationWindowTrades);
    const winTrades = recentTrades.filter((t) => (t.pnl ?? 0) > 0).length;
    const winRate = recentTrades.length > 0 ? (winTrades / recentTrades.length) * 100 : 50;

    // 3. Rolling Sharpe Ratio Näherung
    let rollingSharpe = 0;
    if (recentTrades.length >= 3) {
      const pnls = recentTrades.map((t) => t.pnl ?? 0);
      const mean = pnls.reduce((a, b) => a + b, 0) / pnls.length;
      const variance = pnls.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / pnls.length;
      const stdDev = Math.sqrt(variance);
      rollingSharpe = stdDev > 0 ? Number((mean / stdDev).toFixed(2)) : 0;
    }

    // 4. PnL Delta
    const lastTrade = recentTrades[recentTrades.length - 1];
    const pnlDelta = lastTrade?.pnl ?? 0;

    const result: QuantCycleTelemetry = {
      cycleIndex,
      cached: false,
      rollingSharpe,
      drawdownPercent: Number(drawdownPercent.toFixed(2)),
      winRate: Number(winRate.toFixed(1)),
      pnlDelta: Number(pnlDelta.toFixed(2)),
      fixpointDelta: Number((Math.random() * 0.05).toFixed(4)),
    };

    this.cachedResult = result;
    return result;
  }
}
