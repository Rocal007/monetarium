import { Candle } from '../../types/trading';
import { MarketIntelligenceProtocol, MarketRegime, PerceptionState } from '../protocols/types';
import { GlobalMarketState } from '../../types/market';

export class MarketIntelligenceAgent {
  /**
   * Analysiert den Kerzenverlauf unter strikter Befolgung des MarketIntelligenceProtocols
   * und bettet das Einzelsignal in den Gesamtbörsenmarkt (Global Market Confluence) ein.
   */
  public static analyze(
    candles: Candle[],
    protocol: MarketIntelligenceProtocol,
    globalMarket?: GlobalMarketState | null
  ): PerceptionState {
    const timestamp = Date.now();

    if (!candles || candles.length < 5) {
      return {
        timestamp,
        regime: 'CONSOLIDATION',
        rsi: 50,
        emaFast: 0,
        emaSlow: 0,
        atr: 0,
        atrPercent: 0,
        trendStrength: 0,
        summary: 'Ungenügende Kerzendaten für fundierte Marktanalyse.',
      };
    }

    const windowCandles = candles.slice(-protocol.lookbackCandles);
    const closes = windowCandles.map((c) => c.close);
    const currentPrice = closes[closes.length - 1];

    // 1. EMA Berechnungen
    const emaFast = this.calculateEMA(closes, protocol.emaFastPeriod);
    const emaSlow = this.calculateEMA(closes, protocol.emaSlowPeriod);

    // 2. RSI Berechnung
    const rsi = this.calculateRSI(closes, protocol.rsiPeriod);

    // 3. ATR Berechnung (Average True Range)
    const atr = this.calculateATR(windowCandles, protocol.volatilityAtrPeriod);
    const atrPercent = currentPrice > 0 ? (atr / currentPrice) * 100 : 0;

    // 4. Trendstärke (0 - 100)
    const diffPct = emaSlow > 0 ? Math.abs((emaFast - emaSlow) / emaSlow) * 100 : 0;
    const rsiDeviation = Math.abs(rsi - 50) * 2;
    const trendStrength = Math.min(100, Math.round(diffPct * 20 + rsiDeviation * 0.5));

    // 5. Regime-Klassifikation
    let regime: MarketRegime = 'RANGE_BOUND';
    let summary = '';

    if (atrPercent >= protocol.highVolThresholdPercent) {
      regime = 'HIGH_VOLATILITY';
      summary = `Hohe Volatilität erkannt (ATR: ${atrPercent.toFixed(2)}% >= Limit ${protocol.highVolThresholdPercent}%). Erhöhte Reibungsgefahr.`;
    } else if (emaFast > emaSlow * 1.0015 && rsi >= 50) {
      regime = 'BULL_TREND';
      summary = `Aufwärtstrend bestätigt: Fast EMA (${emaFast.toFixed(1)}) über Slow EMA (${emaSlow.toFixed(1)}), RSI bei ${rsi.toFixed(1)}.`;
    } else if (emaFast < emaSlow * 0.9985 && rsi <= 50) {
      regime = 'BEAR_TREND';
      summary = `Abwärtstrend aktiv: Fast EMA (${emaFast.toFixed(1)}) unter Slow EMA (${emaSlow.toFixed(1)}), RSI bei ${rsi.toFixed(1)}.`;
    } else if (atrPercent < 0.6 && trendStrength < 25) {
      regime = 'CONSOLIDATION';
      summary = `Enge Konsolidierung / Stagnation. Trendstärke gering (${trendStrength}/100), ATR bei ${atrPercent.toFixed(2)}%.`;
    } else {
      regime = 'RANGE_BOUND';
      summary = `Seitwärts-Oszillation im Mean-Reversion-Kanal. Oszillation um EMA-Mittelwert.`;
    }

    // 6. Gesamtbörsenmarkt-Konfluenz (Intermarket Macro-Integration)
    let confluenceMultiplier = 1.0;
    let globalMarketPayload: PerceptionState['globalMarket'] = undefined;

    if (globalMarket) {
      if (globalMarket.riskRegime === 'VOLATILITY_EXPANSION' || globalMarket.vixLevel >= 25.0) {
        confluenceMultiplier = 0.6;
        summary += ` [Gesamtmarkt-Warnung: Hohe Volatilität im Weltmarkt, VIX bei ${globalMarket.vixLevel.toFixed(1)}]`;
      } else if (globalMarket.riskRegime === 'RISK_OFF') {
        confluenceMultiplier = 0.75;
        if (regime === 'BULL_TREND') {
          summary += ` [Makro-Gegenwind: Gesamtmarkt im Risk-Off Modus, S&P 500: ${globalMarket.sp500Change.toFixed(2)}%]`;
        }
      } else if (globalMarket.riskRegime === 'RISK_ON') {
        confluenceMultiplier = 1.25;
        if (regime === 'BULL_TREND') {
          summary += ` [Makro-Rückenwind: Gesamtmarkt im Risk-On Modus, S&P 500: +${globalMarket.sp500Change.toFixed(2)}%, VIX bei ${globalMarket.vixLevel.toFixed(1)}]`;
        }
      }

      globalMarketPayload = {
        riskRegime: globalMarket.riskRegime,
        sentimentScore: globalMarket.sentimentScore,
        vixLevel: globalMarket.vixLevel,
        sp500Change: globalMarket.sp500Change,
        confluenceMultiplier,
        summary: globalMarket.summary,
      };
    }

    return {
      timestamp,
      regime,
      rsi: Number(rsi.toFixed(1)),
      emaFast: Number(emaFast.toFixed(2)),
      emaSlow: Number(emaSlow.toFixed(2)),
      atr: Number(atr.toFixed(2)),
      atrPercent: Number(atrPercent.toFixed(2)),
      trendStrength: Math.min(100, Math.round(trendStrength * confluenceMultiplier)),
      summary,
      globalMarket: globalMarketPayload,
    };
  }

  private static calculateEMA(values: number[], period: number): number {
    if (values.length === 0) return 0;
    const k = 2 / (period + 1);
    let ema = values[0];
    for (let i = 1; i < values.length; i++) {
      ema = values[i] * k + ema * (1 - k);
    }
    return ema;
  }

  private static calculateRSI(values: number[], period: number): number {
    if (values.length <= period) return 50;
    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const diff = values[i] - values[i - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < values.length; i++) {
      const diff = values[i] - values[i - 1];
      if (diff >= 0) {
        avgGain = (avgGain * (period - 1) + diff) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) - diff) / period;
      }
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  private static calculateATR(candles: Candle[], period: number): number {
    if (candles.length < 2) return 0;
    const trs: number[] = [];

    for (let i = 1; i < candles.length; i++) {
      const current = candles[i];
      const prev = candles[i - 1];
      const hl = current.high - current.low;
      const hc = Math.abs(current.high - prev.close);
      const lc = Math.abs(current.low - prev.close);
      trs.push(Math.max(hl, hc, lc));
    }

    const recent = trs.slice(-period);
    const sum = recent.reduce((acc, v) => acc + v, 0);
    return recent.length > 0 ? sum / recent.length : 0;
  }
}
