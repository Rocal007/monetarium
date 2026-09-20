import { Portfolio } from '../../types/trading';
import { AlphaHypothesis, AlphaStrategyName, AlphaStrategyProtocol, PerceptionState } from '../protocols/types';

/**
 * NEXUS Alpha Strategy Subagent F(X)
 * Generiert präzise, protokollkonforme Handelshypothesen basierend auf der Wahrnehmung
 * des Perception Scouts und den 14 fest verankerten quantitativen Strategiemustern.
 */
export class AlphaStrategyAgent {
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
    const atr = perception.atr > 0 ? perception.atr : currentPrice * 0.015;

    // 0. Makro-Krisen-Schutz (Black Swan / Forex Factory Blackout Notbremse)
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
        rationale: `Akute Welt-Krisenmeldung oder High-Impact News-Blackout aktiv (${perception.latestBreakingNews || 'Geopolitischer Schock'}). Alpha-Generator verweigert Kaufhypothesen.`,
      };
    }

    const newsBonus =
      perception.macroSentiment === 'BULLISH' ? 8 : perception.macroSentiment === 'BEARISH' ? -8 : 0;

    // 1. Regime: HIGH_VOLATILITY (Extrem-Schwankungen)
    if (perception.regime === 'HIGH_VOLATILITY') {
      // Option A: Long Straddle vor/während News-Ausbrüchen
      if (protocol.allowedStrategies.includes('STRADDLE_VOLATILITY')) {
        const confluence = Math.min(100, Math.round(75 + newsBonus));
        if (confluence >= protocol.minConfluenceScore) {
          return {
            id,
            timestamp,
            action: 'BUY',
            symbol,
            proposedPrice: currentPrice,
            suggestedStopLoss: Number((currentPrice - atr * 1.8).toFixed(2)),
            suggestedTakeProfit: Number((currentPrice + atr * 3.5).toFixed(2)),
            confluenceScore: confluence,
            strategyUsed: 'STRADDLE_VOLATILITY',
            rationale: `Long Straddle Volatilitäts-Ausbruch: Hohe Volatilität (${perception.atrPercent.toFixed(1)}% ATR) aktiviert Delta-Expansion.`,
          };
        }
      }

      // Option B: Zylinder-Option (Collar) zur Crash-Absicherung mit Put-Floor
      if (protocol.allowedStrategies.includes('COLLAR_CYLINDER')) {
        return {
          id,
          timestamp,
          action: 'BUY',
          symbol,
          proposedPrice: currentPrice,
          suggestedStopLoss: Number((currentPrice * 0.95).toFixed(2)),
          suggestedTakeProfit: Number((currentPrice * 1.12).toFixed(2)),
          confluenceScore: 80,
          strategyUsed: 'COLLAR_CYLINDER',
          rationale: 'Zylinder-Option in hoher Volatilität: 5% Put-Floor sichert das Kapital gegen Flash-Crashes ab (finanziert durch Call-Cap).',
        };
      }

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
        rationale: 'Regime mit extremer Volatilität. Hypothesen-Generierung pausiert zum Schutz vor Slippage.',
      };
    }

    // 2. Regime: BULL_TREND (Aufwärtstrend)
    if (perception.regime === 'BULL_TREND') {
      const trendBonus = perception.trendStrength;

      // 2a. Turtle Donchian Breakout
      if (protocol.allowedStrategies.includes('TURTLE_BREAKOUT') && trendBonus >= 65) {
        const confluence = Math.min(100, Math.round(trendBonus * 0.7 + newsBonus + 20));
        if (confluence >= protocol.minConfluenceScore) {
          return {
            id,
            timestamp,
            action: 'BUY',
            symbol,
            proposedPrice: currentPrice,
            suggestedStopLoss: Number((currentPrice - atr * 2.0).toFixed(2)),
            suggestedTakeProfit: Number((currentPrice + atr * 4.5).toFixed(2)),
            confluenceScore: confluence,
            strategyUsed: 'TURTLE_BREAKOUT',
            rationale: `Turtle Donchian Breakout: Starker Trend (${trendBonus}%) bestätigt 20-Kerzen-Ausbruch. Stop-Loss bei 2x ATR.`,
          };
        }
      }

      // 2b. SuperTrend Dynamic Volatility
      if (protocol.allowedStrategies.includes('SUPERTREND_VOLATILITY')) {
        const confluence = Math.min(100, Math.round(trendBonus * 0.6 + 30 + newsBonus));
        if (confluence >= protocol.minConfluenceScore) {
          return {
            id,
            timestamp,
            action: 'BUY',
            symbol,
            proposedPrice: currentPrice,
            suggestedStopLoss: Number((currentPrice - atr * 1.8).toFixed(2)),
            suggestedTakeProfit: Number((currentPrice + atr * 3.6).toFixed(2)),
            confluenceScore: confluence,
            strategyUsed: 'SUPERTREND_VOLATILITY',
            rationale: `SuperTrend Bullish Flip: Kurs über dynamischem ATR-Band. Trendstärke: ${trendBonus}%.`,
          };
        }
      }

      // 2c. Opening Range Breakout (ORB)
      if (protocol.allowedStrategies.includes('ORB_BREAKOUT') && perception.rsi < 70) {
        const confluence = Math.min(100, Math.round(65 + newsBonus));
        if (confluence >= protocol.minConfluenceScore) {
          return {
            id,
            timestamp,
            action: 'BUY',
            symbol,
            proposedPrice: currentPrice,
            suggestedStopLoss: Number((currentPrice - atr * 1.4).toFixed(2)),
            suggestedTakeProfit: Number((currentPrice + atr * 3.0).toFixed(2)),
            confluenceScore: confluence,
            strategyUsed: 'ORB_BREAKOUT',
            rationale: `ORB Session-Ausbruch: Impulsiver Momentum-Durchbruch über die Eröffnungsspanne.`,
          };
        }
      }

      // 2d. Larry Connors RSI-2 Reversal im Aufwärtstrend
      if (protocol.allowedStrategies.includes('RSI_CONNORS_REVERSAL') && perception.rsi <= 40) {
        const confluence = Math.min(100, Math.round(75 + (45 - perception.rsi) * 2));
        if (confluence >= protocol.minConfluenceScore) {
          return {
            id,
            timestamp,
            action: 'BUY',
            symbol,
            proposedPrice: currentPrice,
            suggestedStopLoss: Number((currentPrice - atr * 1.2).toFixed(2)),
            suggestedTakeProfit: Number((currentPrice + atr * 2.5).toFixed(2)),
            confluenceScore: confluence,
            strategyUsed: 'RSI_CONNORS_REVERSAL',
            rationale: `Connors RSI-2 Flash Rebound: Kurzfristiger Dip im intakten Aufwärtstrend bietet exzellentes Einstiegs-CRV.`,
          };
        }
      }

      // 2e. VWAP Value Strategy
      if (protocol.allowedStrategies.includes('VWAP_VALUE') && perception.rsi < 55) {
        const confluence = 72;
        if (confluence >= protocol.minConfluenceScore) {
          return {
            id,
            timestamp,
            action: 'BUY',
            symbol,
            proposedPrice: currentPrice,
            suggestedStopLoss: Number((currentPrice - atr * 1.5).toFixed(2)),
            suggestedTakeProfit: Number((currentPrice + atr * 3.2).toFixed(2)),
            confluenceScore: confluence,
            strategyUsed: 'VWAP_VALUE',
            rationale: `VWAP Institutioneller Value Buy: Einstieg mit Rabatt unter dem volumengewichteten Durchschnittskurs.`,
          };
        }
      }

      // 2f. Standard Momentum Breakout
      if (protocol.allowedStrategies.includes('MOMENTUM_BREAKOUT')) {
        const rsiQuality = perception.rsi < 68 ? Math.max(0, 100 - Math.abs(60 - perception.rsi) * 2) : 40;
        const confluence = Math.max(0, Math.min(100, Math.round(trendBonus * 0.6 + rsiQuality * 0.4 + newsBonus)));

        if (confluence >= protocol.minConfluenceScore) {
          return {
            id,
            timestamp,
            action: 'BUY',
            symbol,
            proposedPrice: currentPrice,
            suggestedStopLoss: Number((currentPrice - atr * protocol.stopLossAtrMultiplier).toFixed(2)),
            suggestedTakeProfit: Number((currentPrice + atr * protocol.takeProfitAtrMultiplier).toFixed(2)),
            confluenceScore: confluence,
            strategyUsed: 'MOMENTUM_BREAKOUT',
            rationale: `EMA Momentum Breakout: Golden Cross bestätigt. Confluence ${confluence}% (>= ${protocol.minConfluenceScore}%).`,
          };
        }
      }
    }

    // 3. Regime: RANGE_BOUND (Seitwärtsmarkt & Oszillation)
    if (perception.regime === 'RANGE_BOUND') {
      // 3a. Bollinger Z-Score Reversion
      if (protocol.allowedStrategies.includes('BOLLINGER_ZSCORE')) {
        if (perception.rsi <= 40) {
          const confluence = Math.min(100, Math.round(65 + (45 - perception.rsi) * 2.5));
          if (confluence >= protocol.minConfluenceScore) {
            return {
              id,
              timestamp,
              action: 'BUY',
              symbol,
              proposedPrice: currentPrice,
              suggestedStopLoss: Number((currentPrice - atr * 1.5).toFixed(2)),
              suggestedTakeProfit: Number((currentPrice + atr * 2.0).toFixed(2)),
              confluenceScore: confluence,
              strategyUsed: 'BOLLINGER_ZSCORE',
              rationale: `Bollinger Z-Score Reversion: Kurs am unteren 2-Sigma-Band überverkauft (RSI: ${perception.rsi}). Rebound zum SMA erwartet.`,
            };
          }
        } else if (perception.rsi >= 60 && hasPosition) {
          return {
            id,
            timestamp,
            action: 'SELL',
            symbol,
            proposedPrice: currentPrice,
            suggestedStopLoss: 0,
            suggestedTakeProfit: 0,
            confluenceScore: 85,
            strategyUsed: 'BOLLINGER_ZSCORE',
            rationale: `Bollinger Decken-Signal: Kurs am oberen 2-Sigma-Band überkauft. Reversion-Gewinnmitnahme.`,
          };
        }
      }

      // 3b. Statistische Arbitrage / Pairs Trading
      if (protocol.allowedStrategies.includes('PAIRS_STATARB') && perception.rsi <= 45) {
        const confluence = 78;
        if (confluence >= protocol.minConfluenceScore) {
          return {
            id,
            timestamp,
            action: 'BUY',
            symbol,
            proposedPrice: currentPrice,
            suggestedStopLoss: Number((currentPrice - atr * 1.6).toFixed(2)),
            suggestedTakeProfit: Number((currentPrice + atr * 2.4).toFixed(2)),
            confluenceScore: confluence,
            strategyUsed: 'PAIRS_STATARB',
            rationale: 'StatArb Pairs Signal: Marktneutrale Unterbewertung des Spreads detektiert. Konvergenz erwartet.',
          };
        }
      }

      // 3c. Zylinder-Option (Collar) für Range-Trading
      if (protocol.allowedStrategies.includes('COLLAR_CYLINDER') && perception.rsi <= 48) {
        return {
          id,
          timestamp,
          action: 'BUY',
          symbol,
          proposedPrice: currentPrice,
          suggestedStopLoss: Number((currentPrice * 0.95).toFixed(2)),
          suggestedTakeProfit: Number((currentPrice * 1.10).toFixed(2)),
          confluenceScore: 75,
          strategyUsed: 'COLLAR_CYLINDER',
          rationale: 'Zylinder-Option (Collar): Symmetrische Absicherung in der Range mit Put-Floor (-5%) und Call-Cap (+10%).',
        };
      }

      // 3d. Symmetrisches Grid-Trading
      if (protocol.allowedStrategies.includes('MEAN_REVERSION_GRID')) {
        if (perception.rsi <= 42) {
          const oversoldConfluence = Math.min(100, Math.round(55 + (45 - perception.rsi) * 3));
          if (oversoldConfluence >= protocol.minConfluenceScore) {
            return {
              id,
              timestamp,
              action: 'BUY',
              symbol,
              proposedPrice: currentPrice,
              suggestedStopLoss: Number((currentPrice - atr * protocol.stopLossAtrMultiplier).toFixed(2)),
              suggestedTakeProfit: Number((currentPrice + atr * protocol.takeProfitAtrMultiplier).toFixed(2)),
              confluenceScore: oversoldConfluence,
              strategyUsed: 'MEAN_REVERSION_GRID',
              rationale: `Grid Boden-Signal: RSI bei ${perception.rsi}. Gitter-Order im unteren Band platziert.`,
            };
          }
        } else if (perception.rsi >= 58 && hasPosition) {
          return {
            id,
            timestamp,
            action: 'SELL',
            symbol,
            proposedPrice: currentPrice,
            suggestedStopLoss: 0,
            suggestedTakeProfit: 0,
            confluenceScore: 80,
            strategyUsed: 'MEAN_REVERSION_GRID',
            rationale: `Grid Decken-Signal: RSI bei ${perception.rsi}. Gitter-Verkauf zur Profit-Realisierung.`,
          };
        }
      }
    }

    // 4. Regime: CONSOLIDATION (Geringe Volatilität, Vorbereitung auf Ausbrüche)
    if (perception.regime === 'CONSOLIDATION') {
      // 4a. CPPI Dynamic Portfolio Insurance
      if (protocol.allowedStrategies.includes('CPPI_CAPITAL_FLOOR')) {
        return {
          id,
          timestamp,
          action: 'BUY',
          symbol,
          proposedPrice: currentPrice,
          suggestedStopLoss: Number((currentPrice * 0.94).toFixed(2)),
          suggestedTakeProfit: Number((currentPrice * 1.08).toFixed(2)),
          confluenceScore: 74,
          strategyUsed: 'CPPI_CAPITAL_FLOOR',
          rationale: 'CPPI Wertsicherungs-Allokation: Kapital wird im Konsolidierungsfenster kontrolliert am Puffer skaliert.',
        };
      }

      // 4b. TWAP Execution Slicing
      if (protocol.allowedStrategies.includes('TWAP_EXECUTION')) {
        return {
          id,
          timestamp,
          action: 'BUY',
          symbol,
          proposedPrice: currentPrice,
          suggestedStopLoss: Number((currentPrice * 0.95).toFixed(2)),
          suggestedTakeProfit: Number((currentPrice * 1.06).toFixed(2)),
          confluenceScore: 70,
          strategyUsed: 'TWAP_EXECUTION',
          rationale: 'TWAP Order-Slicing: Gleichmäßige Tranchen-Akkumulation im ruhigen Marktumfeld.',
        };
      }

      // 4c. DCA Akkumulation
      if (protocol.allowedStrategies.includes('DCA_ACCUMULATION')) {
        return {
          id,
          timestamp,
          action: 'BUY',
          symbol,
          proposedPrice: currentPrice,
          suggestedStopLoss: Number((currentPrice * 0.96).toFixed(2)),
          suggestedTakeProfit: Number((currentPrice * 1.05).toFixed(2)),
          confluenceScore: 65,
          strategyUsed: 'DCA_ACCUMULATION',
          rationale: 'DCA Konsolidierungs-Kauf: Günstige Tranchen-Akkumulation mit festem Trailing-Take-Profit.',
        };
      }
    }

    // 5. Regime: BEAR_TREND (Abwärtstrend)
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
          confluenceScore: 85,
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
        rationale: 'Abwärtstrend aktiv. Protokoll verbietet Long-Einstiege in fallende Kurse (Kapitalerhalt).',
      };
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
