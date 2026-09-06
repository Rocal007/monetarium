import { Portfolio } from '../../types/trading';
import { AlphaHypothesis, AlphaStrategyProtocol, PerceptionState } from '../protocols/types';

export class AlphaStrategyAgent {
  /**
   * Erzeugt eine strukturierte Handelshypothese basierend auf der Wahrnehmung
   * und den Schranken des AlphaStrategyProtocols.
   */
  public static evaluate(
    symbol: string,
    currentPrice: number,
    perception: PerceptionState,
    portfolio: Portfolio,
    protocol: AlphaStrategyProtocol
  ): AlphaHypothesis {
    const timestamp = Date.now();
    const id = `hyp-${timestamp}-${Math.floor(Math.random() * 1000)}`;
    const hasPosition = (portfolio.positions[symbol]?.amount ?? 0) > 0;

    // 0. Makro-Krisen-Schutz
    if (perception.crisisVetoActive || perception.macroSentiment === 'CRISIS') {
      return {
        id,
        timestamp,
        action: 'HOLD',
        symbol,
        proposedPrice: currentPrice,
        suggestedStopLoss: 0,
        suggestedTakeProfit: 0,
        confluenceScore: 10,
        strategyUsed: 'MACRO_CRISIS_SHIELD',
        rationale: `Akute Welt-Krisenmeldung aktiv (${perception.latestBreakingNews || 'Geopolitischer Schock'}). Alpha-Generator verweigert Kaufhypothesen.`,
      };
    }

    const newsBonus = perception.macroSentiment === 'BULLISH' ? 8 : perception.macroSentiment === 'BEARISH' ? -8 : 0;

    // 1. High Volatility Schutz
    if (perception.regime === 'HIGH_VOLATILITY') {
      return {
        id,
        timestamp,
        action: 'HOLD',
        symbol,
        proposedPrice: currentPrice,
        suggestedStopLoss: currentPrice * 0.95,
        suggestedTakeProfit: currentPrice * 1.05,
        confluenceScore: 20,
        strategyUsed: 'VOLATILITY_GUARD',
        rationale: 'Regime mit extrem hoher Volatilität. Hypothesen-Generierung pausiert zum Schutz vor Slippage.',
      };
    }

    // 2. Trendfolge (MOMENTUM_BREAKOUT)
    if (perception.regime === 'BULL_TREND' && protocol.allowedStrategies.includes('MOMENTUM_BREAKOUT')) {
      const rsiQuality = perception.rsi < 68 ? Math.max(0, 100 - Math.abs(60 - perception.rsi) * 2) : 40;
      const trendBonus = perception.trendStrength;
      const confluence = Math.max(0, Math.min(100, Math.round(trendBonus * 0.6 + rsiQuality * 0.4 + newsBonus)));

      if (confluence >= protocol.minConfluenceScore) {
        const atr = perception.atr > 0 ? perception.atr : currentPrice * 0.015;
        const sl = Number((currentPrice - atr * protocol.stopLossAtrMultiplier).toFixed(2));
        const tp = Number((currentPrice + atr * protocol.takeProfitAtrMultiplier).toFixed(2));

        return {
          id,
          timestamp,
          action: 'BUY',
          symbol,
          proposedPrice: currentPrice,
          suggestedStopLoss: sl,
          suggestedTakeProfit: tp,
          confluenceScore: confluence,
          strategyUsed: 'MOMENTUM_BREAKOUT',
          rationale: `Bullischer Ausbruch bestätigt: Confluence ${confluence}% (>= ${protocol.minConfluenceScore}%). Ziel-CRV: ${protocol.targetRiskRewardRatio}:1.`,
        };
      } else {
        return {
          id,
          timestamp,
          action: 'HOLD',
          symbol,
          proposedPrice: currentPrice,
          suggestedStopLoss: 0,
          suggestedTakeProfit: 0,
          confluenceScore: confluence,
          strategyUsed: 'MOMENTUM_BREAKOUT',
          rationale: `Bullische Tendenz, jedoch Confluence (${confluence}%) unter Protokoll-Schwelle (${protocol.minConfluenceScore}%).`,
        };
      }
    }

    // 3. Mean Reversion & Range (MEAN_REVERSION_GRID)
    if (perception.regime === 'RANGE_BOUND' && protocol.allowedStrategies.includes('MEAN_REVERSION_GRID')) {
      // Unterer Kanal -> Kauf-Kandidat
      if (perception.rsi <= 42) {
        const oversoldConfluence = Math.min(100, Math.round(50 + (45 - perception.rsi) * 3));
        if (oversoldConfluence >= protocol.minConfluenceScore) {
          const atr = perception.atr > 0 ? perception.atr : currentPrice * 0.012;
          const sl = Number((currentPrice - atr * protocol.stopLossAtrMultiplier).toFixed(2));
          const tp = Number((currentPrice + atr * protocol.takeProfitAtrMultiplier).toFixed(2));

          return {
            id,
            timestamp,
            action: 'BUY',
            symbol,
            proposedPrice: currentPrice,
            suggestedStopLoss: sl,
            suggestedTakeProfit: tp,
            confluenceScore: oversoldConfluence,
            strategyUsed: 'MEAN_REVERSION_GRID',
            rationale: `Mean-Reversion Boden-Hypothese: RSI bei ${perception.rsi} (überverkauft). Confluence ${oversoldConfluence}%.`,
          };
        }
      }

      // Oberer Kanal -> Verkauf / Gewinnmitnahme
      if (perception.rsi >= 58 && hasPosition) {
        const overboughtConfluence = Math.min(100, Math.round(50 + (perception.rsi - 55) * 3));
        return {
          id,
          timestamp,
          action: 'SELL',
          symbol,
          proposedPrice: currentPrice,
          suggestedStopLoss: 0,
          suggestedTakeProfit: 0,
          confluenceScore: overboughtConfluence,
          strategyUsed: 'MEAN_REVERSION_GRID',
          rationale: `Mean-Reversion Decken-Signal: RSI bei ${perception.rsi} (überkauft). Gewinnmitnahme für Bestandsposition empfohlen.`,
        };
      }
    }

    // 4. Abwärtstrend (BEAR_TREND) -> Risikoreduktion falls Position vorhanden
    if (perception.regime === 'BEAR_TREND') {
      if (hasPosition) {
        return {
          id,
          timestamp,
          action: 'SELL',
          symbol,
          proposedPrice: currentPrice,
          suggestedStopLoss: 0,
          suggestedTakeProfit: 0,
          confluenceScore: 80,
          strategyUsed: 'BEAR_TREND_DEFENSE',
          rationale: `Bestätigter Bären-Trend (EMA Fast < Slow). Glattstellung der Position zur Verlustvermeidung.`,
        };
      }
      return {
        id,
        timestamp,
        action: 'HOLD',
        symbol,
        proposedPrice: currentPrice,
        suggestedStopLoss: 0,
        suggestedTakeProfit: 0,
        confluenceScore: 10,
        strategyUsed: 'CAPITAL_PRESERVATION',
        rationale: 'Abwärtstrend aktiv. Protokoll verbietet Long-Einstiege in fallende Kurse.',
      };
    }

    // 5. Konsolidierung & DCA
    if (perception.regime === 'CONSOLIDATION' && protocol.allowedStrategies.includes('DCA_ACCUMULATION')) {
      const confluence = 60;
      if (confluence >= protocol.minConfluenceScore) {
        return {
          id,
          timestamp,
          action: 'BUY',
          symbol,
          proposedPrice: currentPrice,
          suggestedStopLoss: Number((currentPrice * 0.96).toFixed(2)),
          suggestedTakeProfit: Number((currentPrice * 1.05).toFixed(2)),
          confluenceScore: confluence,
          strategyUsed: 'DCA_ACCUMULATION',
          rationale: `Konsolidierungs-DCA: Stabile Akkumulation im ruhigen Marktsegment.`,
        };
      }
    }

    // Default neutral
    return {
      id,
      timestamp,
      action: 'HOLD',
      symbol,
      proposedPrice: currentPrice,
      suggestedStopLoss: 0,
      suggestedTakeProfit: 0,
      confluenceScore: 30,
      strategyUsed: 'NEUTRAL_OBSERVATION',
      rationale: 'Kein eindeutiges Signal unter den aktuellen Protokoll-Bedingungen. Marktbeobachtung aktiv.',
    };
  }
}
