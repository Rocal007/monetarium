import { StrategyExecutor } from '../backtesting/hygiene-engine';
import { StrategyMetadata, StrategySignal } from '../types/trading';
import { SearchVisibilityEngine } from '../analytics/search-visibility-engine';

export const SEARCH_ATTENTION_METADATA: StrategyMetadata = {
  id: 'SEARCH_ATTENTION_MOMENTUM',
  name: 'Search Visibility & Attention Momentum',
  category: 'TREND',
  badge: 'SVI Alpha',
  description: 'Verknüpft Preisausbrüche mit Google Trends / Web Search Volume Index (SVI). Bestätigt echte Retail- und Mediennachfrage und filtert parabolische Blow-Off Tops.',
  formula: 'Signal = Breakout(Donchian/EMA) ⊙ ΔSVI(Search Volume Index) × (1 - Euphoria_Penalty)',
  defaultParams: {
    lookbackPeriod: 20,
    sviMinDelta: 15,          // Mindest-Zuwachs in 24h für Ausbruchs-Bestätigung (%)
    euphoriaCap: 88,          // SVI-Schwellenwert ab dem Überhitzung droht
    stopLossPercent: 2.5,
    takeProfitPercent: 6.0,
  },
  paramDefs: [
    { key: 'lookbackPeriod', label: 'Lookback Kerzen', defaultValue: 20, min: 10, max: 50, step: 5 },
    { key: 'sviMinDelta', label: 'Min. SVI Delta (%)', defaultValue: 15, min: 5, max: 50, step: 5 },
    { key: 'euphoriaCap', label: 'Euphorie-Cap (SVI)', defaultValue: 88, min: 70, max: 98, step: 2 },
    { key: 'stopLossPercent', label: 'Stop-Loss (%)', defaultValue: 2.5, min: 1, max: 10, step: 0.5 },
    { key: 'takeProfitPercent', label: 'Take-Profit (%)', defaultValue: 6.0, min: 2, max: 20, step: 1.0 },
  ],
};

/**
 * Quantitative Strategie: Search Visibility & Attention Momentum
 */
export const executeSearchAttentionStrategy: StrategyExecutor = (
  candle,
  index,
  history,
  portfolioManager,
  params
) => {
  const lookback = params.lookbackPeriod ?? 20;
  const sviMinDelta = params.sviMinDelta ?? 15;
  const euphoriaCap = params.euphoriaCap ?? 88;
  const stopLossPct = (params.stopLossPercent ?? 2.5) / 100;
  const takeProfitPct = (params.takeProfitPercent ?? 6.0) / 100;

  if (history.length < lookback + 2) return null;

  const symbol = candle.symbol || 'BTC/USDT';
  const currentPrice = candle.close;
  const portfolio = portfolioManager.getPortfolio();
  const currentPos = portfolio.positions[symbol];

  // 1. Technischer Ausbruch (Donchian High/Low der letzten N Kerzen)
  const windowCandles = history.slice(-lookback - 1, -1);
  const highestHigh = Math.max(...windowCandles.map((c) => c.high));
  const lowestLow = Math.min(...windowCandles.map((c) => c.low));

  // 2. Search Visibility & Attention Signale berechnen
  const searchMetrics = SearchVisibilityEngine.getMetrics(symbol, currentPrice, history);

  // Fall A: Bereits investiert -> Exit-Bedingungen prüfen
  if (currentPos && currentPos.amount > 0) {
    // 1. Take Profit
    if (currentPrice >= currentPos.entryPrice * (1 + takeProfitPct)) {
      return {
        action: 'SELL',
        symbol,
        price: currentPrice,
        amount: currentPos.amount,
        confidence: 90,
        reason: `Take-Profit erreicht (+${(takeProfitPct * 100).toFixed(1)}%). Gewinnsicherung.`,
        searchAttention: {
          svi: searchMetrics.svi,
          delta24h: searchMetrics.delta24h,
          regime: searchMetrics.regime,
          modifier: searchMetrics.confidenceModifier,
        },
      };
    }

    // 2. Stop Loss
    if (currentPrice <= currentPos.entryPrice * (1 - stopLossPct)) {
      return {
        action: 'SELL',
        symbol,
        price: currentPrice,
        amount: currentPos.amount,
        confidence: 95,
        reason: `Stop-Loss ausgelöst (-${(stopLossPct * 100).toFixed(1)}%). Reißleine aktiv.`,
        searchAttention: {
          svi: searchMetrics.svi,
          delta24h: searchMetrics.delta24h,
          regime: searchMetrics.regime,
          modifier: searchMetrics.confidenceModifier,
        },
      };
    }

    // 3. Search-Euphorie-Exit (Blow-off Top Detector)
    if (searchMetrics.svi >= euphoriaCap && searchMetrics.regime === 'EUPHORIA_OVERHEATED') {
      return {
        action: 'SELL',
        symbol,
        price: currentPrice,
        amount: currentPos.amount,
        confidence: 85,
        reason: `Blow-Off Top Warnung: Google Trends SVI bei ${searchMetrics.svi} (Retail Euphorie). Vorsorglicher Gewinnmitnahme-Ausstieg.`,
        searchAttention: {
          svi: searchMetrics.svi,
          delta24h: searchMetrics.delta24h,
          regime: searchMetrics.regime,
          modifier: searchMetrics.confidenceModifier,
        },
      };
    }

    // Weiter halten
    return null;
  }

  // Fall B: Nicht investiert -> Einstiegs-Bedingungen (Long Breakout mit Search-Bestätigung)
  const isUpwardBreakout = currentPrice > highestHigh;
  const hasSearchMomentum = searchMetrics.delta24h >= sviMinDelta;
  const isNotOverheated = searchMetrics.svi < euphoriaCap;

  if (isUpwardBreakout && hasSearchMomentum && isNotOverheated) {
    const tradeCapital = Math.min(portfolio.cash * 0.15, 1500); // 15% Cash max
    const baseAmount = tradeCapital / currentPrice;
    const adjustedAmount = baseAmount * searchMetrics.confidenceModifier;

    return {
      action: 'BUY',
      symbol,
      price: currentPrice,
      amount: adjustedAmount,
      confidence: Math.min(95, Math.round(75 + searchMetrics.delta24h * 0.5)),
      reason: `Ausbruch über ${highestHigh.toFixed(2)} bestätigt durch Google Trends SVI ${searchMetrics.svi} (+${searchMetrics.delta24h}% 24h). Regime: ${searchMetrics.regime}`,
      searchAttention: {
        svi: searchMetrics.svi,
        delta24h: searchMetrics.delta24h,
        regime: searchMetrics.regime,
        modifier: searchMetrics.confidenceModifier,
      },
    };
  }

  // Fall C: Stille Akkumulation (Früher Einstieg vor Preisausbruch)
  if (!currentPos && searchMetrics.regime === 'ACCUMULATION' && currentPrice >= (highestHigh + lowestLow) / 2) {
    const tradeCapital = Math.min(portfolio.cash * 0.10, 1000);
    const amount = (tradeCapital / currentPrice) * searchMetrics.confidenceModifier;

    return {
      action: 'BUY',
      symbol,
      price: currentPrice,
      amount,
      confidence: 72,
      reason: `Stille Akkumulation erkannt: Search Volume Index zieht vor dem Kursausbruch an (+${searchMetrics.delta24h}%). Frühes Allokations-Signal.`,
      searchAttention: {
        svi: searchMetrics.svi,
        delta24h: searchMetrics.delta24h,
        regime: searchMetrics.regime,
        modifier: searchMetrics.confidenceModifier,
      },
    };
  }

  return null;
};
