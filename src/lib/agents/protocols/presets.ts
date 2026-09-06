import { TradingAgentProtocolProfile } from './types';
import { SECTOR_PROFILES } from '../sectors/sector-fleet';

export const PROTOCOL_PRESETS: Record<string, TradingAgentProtocolProfile> = {
  ...SECTOR_PROFILES,
  CAPITAL_SHIELD: {
    id: 'CAPITAL_SHIELD',
    name: 'Capital Shield (Defensiv)',
    badge: 'Max Preservation',
    description: 'Priorisiert kompromisslosen Kapitalschutz. 0.5% Risiko je Trade, harter 2.0% Circuit-Breaker, nur Trades mit hoher Confluence (>=75%).',
    marketIntelligence: {
      lookbackCandles: 60,
      emaFastPeriod: 12,
      emaSlowPeriod: 26,
      rsiPeriod: 14,
      rsiOverbought: 75,
      rsiOversold: 25,
      volatilityAtrPeriod: 14,
      highVolThresholdPercent: 2.0,
    },
    alphaStrategy: {
      minConfluenceScore: 75,
      allowedStrategies: ['MOMENTUM_BREAKOUT', 'DCA_ACCUMULATION'],
      targetRiskRewardRatio: 2.5,
      stopLossAtrMultiplier: 1.5,
      takeProfitAtrMultiplier: 3.75,
    },
    riskGuardian: {
      maxRiskPerTradePercent: 0.5,
      maxDrawdownCircuitPercent: 2.0,
      maxPortfolioExposurePercent: 35.0,
      kellyFraction: 0.3,
      cooldownTicksAfterLoss: 5,
      allowShorting: false,
    },
    executionRouting: {
      defaultOrderType: 'LIMIT',
      limitOffsetBps: 3,
      maxSlippageBps: 10,
      twapSlices: 1,
    },
    quantEvaluator: {
      hurdleRateAnnualized: 0.04,
      evaluationWindowTrades: 15,
      driftThresholdPercent: 8.0,
      cacheTtlTicks: 3,
    },
  },

  BALANCED_ALPHA: {
    id: 'BALANCED_ALPHA',
    name: 'Balanced Institutional Alpha',
    badge: 'Multi-Regime',
    description: 'Ausgewogenes Regime-Switching. Trendfolge bei Trendmärkten, Mean-Reversion in Seitwärtsphasen. 1.2% Risiko je Trade, 5% Circuit-Breaker.',
    marketIntelligence: {
      lookbackCandles: 50,
      emaFastPeriod: 9,
      emaSlowPeriod: 21,
      rsiPeriod: 14,
      rsiOverbought: 70,
      rsiOversold: 30,
      volatilityAtrPeriod: 14,
      highVolThresholdPercent: 3.0,
    },
    alphaStrategy: {
      minConfluenceScore: 65,
      allowedStrategies: ['MOMENTUM_BREAKOUT', 'MEAN_REVERSION_GRID', 'DCA_ACCUMULATION'],
      targetRiskRewardRatio: 2.0,
      stopLossAtrMultiplier: 1.8,
      takeProfitAtrMultiplier: 3.6,
    },
    riskGuardian: {
      maxRiskPerTradePercent: 1.2,
      maxDrawdownCircuitPercent: 5.0,
      maxPortfolioExposurePercent: 60.0,
      kellyFraction: 0.5,
      cooldownTicksAfterLoss: 3,
      allowShorting: false,
    },
    executionRouting: {
      defaultOrderType: 'MARKET',
      limitOffsetBps: 5,
      maxSlippageBps: 20,
      twapSlices: 1,
    },
    quantEvaluator: {
      hurdleRateAnnualized: 0.08,
      evaluationWindowTrades: 25,
      driftThresholdPercent: 12.0,
      cacheTtlTicks: 2,
    },
  },

  HIGH_VELOCITY_GRID: {
    id: 'HIGH_VELOCITY_GRID',
    name: 'High-Velocity Grid & Volatility',
    badge: 'Range Hunter',
    description: 'Aggressive Erfassung von Mikro-Swings in Konsolidierungen und Range-Märkten. Höhere Frequenz, engmaschige Netze, 2.0% Risiko, 8% Circuit-Breaker.',
    marketIntelligence: {
      lookbackCandles: 30,
      emaFastPeriod: 7,
      emaSlowPeriod: 14,
      rsiPeriod: 9,
      rsiOverbought: 65,
      rsiOversold: 35,
      volatilityAtrPeriod: 10,
      highVolThresholdPercent: 4.5,
    },
    alphaStrategy: {
      minConfluenceScore: 55,
      allowedStrategies: ['MEAN_REVERSION_GRID', 'MOMENTUM_BREAKOUT'],
      targetRiskRewardRatio: 1.5,
      stopLossAtrMultiplier: 1.2,
      takeProfitAtrMultiplier: 1.8,
    },
    riskGuardian: {
      maxRiskPerTradePercent: 2.0,
      maxDrawdownCircuitPercent: 8.0,
      maxPortfolioExposurePercent: 80.0,
      kellyFraction: 0.7,
      cooldownTicksAfterLoss: 1,
      allowShorting: false,
    },
    executionRouting: {
      defaultOrderType: 'LIMIT',
      limitOffsetBps: 2,
      maxSlippageBps: 30,
      twapSlices: 2,
    },
    quantEvaluator: {
      hurdleRateAnnualized: 0.12,
      evaluationWindowTrades: 30,
      driftThresholdPercent: 15.0,
      cacheTtlTicks: 1,
    },
  },
};

export const DEFAULT_PROTOCOL_PROFILE = PROTOCOL_PRESETS.BALANCED_ALPHA;
