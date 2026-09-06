import { calculateQuantMetrics, evaluateOverfitting } from '../analytics/quant-metrics';
import { PortfolioManager } from '../engine/portfolio-manager';
import { VirtualExchange } from '../engine/virtual-exchange';
import { BacktestConfig, BacktestResult, Candle, EquityPoint, StrategySignal } from '../types/trading';

export type StrategyExecutor = (
  candle: Candle,
  index: number,
  history: Candle[],
  portfolio: PortfolioManager,
  params: Record<string, number>
) => StrategySignal | null;

/**
 * Backtesting Hygiene Engine
 * Teilt historische Daten in In-Sample (Trainingsphase) und Out-of-Sample (Blind-Test) auf.
 * Verhindert Overfitting und berechnet separate Performance- und Risikokennzahlen.
 */
export class BacktestHygieneEngine {
  /**
   * Führt einen hygienischen Backtest durch.
   */
  public static runBacktest(
    candles: Candle[],
    config: BacktestConfig,
    strategy: StrategyExecutor
  ): BacktestResult {
    if (candles.length < 50) {
      throw new Error('Mindestens 50 historische Kerzen erforderlich für valide statistische Tests.');
    }

    // 1. Daten strikt partitionieren
    const splitIndex = Math.floor(candles.length * config.inSampleRatio);
    const inSampleCandles = candles.slice(0, splitIndex);
    const outOfSampleCandles = candles.slice(splitIndex);

    // 2. In-Sample Phase durchlaufen
    const isPortfolio = new PortfolioManager(config.initialCapital);
    const isExchange = new VirtualExchange(isPortfolio, {
      makerFeeRate: config.feeRate / 2,
      takerFeeRate: config.feeRate,
    });

    const inSampleEquity: EquityPoint[] = [];

    for (let i = 0; i < inSampleCandles.length; i++) {
      const candle = inSampleCandles[i];
      const history = inSampleCandles.slice(0, i + 1);

      // Pending Orders abarbeiten
      isExchange.processTick(config.symbol, candle.high, candle.low, candle.close);

      // Strategie-Signal abrufen
      const signal = strategy(candle, i, history, isPortfolio, config.params);
      if (signal && signal.action !== 'HOLD') {
        const orderSide = signal.action;
        const amount = signal.amount ?? (isPortfolio.getPortfolio().cash * 0.2) / candle.close;

        if (amount > 0) {
          try {
            isExchange.submitOrder({
              symbol: config.symbol,
              side: orderSide,
              type: 'MARKET',
              amount,
              currentMarketPrice: candle.close,
            });
          } catch {
            // Ignorieren falls nicht genügend Kapital/Position vorhanden
          }
        }
      }

      const p = isPortfolio.getPortfolio();
      inSampleEquity.push({
        time: candle.timestamp,
        equity: p.equity,
        drawdown: Math.max(0, p.initialBalance - p.equity),
      });
    }

    const isMetrics = calculateQuantMetrics(
      config.initialCapital,
      inSampleEquity,
      isPortfolio.getPortfolio().tradeHistory
    );

    // 3. Out-of-Sample Phase durchlaufen (Ungesehene Testdaten!)
    // Startet mit dem gleichen initialen Kapital, um die Strategie isoliert zu bewerten
    const oosPortfolio = new PortfolioManager(config.initialCapital);
    const oosExchange = new VirtualExchange(oosPortfolio, {
      makerFeeRate: config.feeRate / 2,
      takerFeeRate: config.feeRate,
    });

    const outOfSampleEquity: EquityPoint[] = [];

    for (let i = 0; i < outOfSampleCandles.length; i++) {
      const candle = outOfSampleCandles[i];
      // Das Modell sieht historische Daten bis zu diesem Punkt (inklusive In-Sample Historie für Indikatoren)
      const fullHistoryUntilNow = [...inSampleCandles, ...outOfSampleCandles.slice(0, i + 1)];

      oosExchange.processTick(config.symbol, candle.high, candle.low, candle.close);

      const signal = strategy(
        candle,
        inSampleCandles.length + i,
        fullHistoryUntilNow,
        oosPortfolio,
        config.params
      );

      if (signal && signal.action !== 'HOLD') {
        const orderSide = signal.action;
        const amount = signal.amount ?? (oosPortfolio.getPortfolio().cash * 0.2) / candle.close;

        if (amount > 0) {
          try {
            oosExchange.submitOrder({
              symbol: config.symbol,
              side: orderSide,
              type: 'MARKET',
              amount,
              currentMarketPrice: candle.close,
            });
          } catch {
            // Ignorieren falls nicht genügend Kapital/Position
          }
        }
      }

      const p = oosPortfolio.getPortfolio();
      outOfSampleEquity.push({
        time: candle.timestamp,
        equity: p.equity,
        drawdown: Math.max(0, p.initialBalance - p.equity),
      });
    }

    const oosMetrics = calculateQuantMetrics(
      config.initialCapital,
      outOfSampleEquity,
      oosPortfolio.getPortfolio().tradeHistory
    );

    // 4. Overfitting-Hygiene-Prüfung
    const overfittingCheck = evaluateOverfitting(isMetrics, oosMetrics);

    const allTrades = [
      ...isPortfolio.getPortfolio().tradeHistory,
      ...oosPortfolio.getPortfolio().tradeHistory,
    ];

    const fullEquity = [...inSampleEquity, ...outOfSampleEquity];
    const fullMetrics = calculateQuantMetrics(config.initialCapital, fullEquity, allTrades);

    return {
      config,
      inSampleMetrics: isMetrics,
      outOfSampleMetrics: oosMetrics,
      fullMetrics,
      inSampleEquity,
      outOfSampleEquity,
      trades: allTrades,
      overfittingScore: overfittingCheck.score,
      overfittingVerdict: overfittingCheck.verdict,
    };
  }
}
