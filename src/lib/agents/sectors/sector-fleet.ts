import { SectorAgentInfo, SectorType } from '../../types/sectors';
import { TradingAgentProtocolProfile } from '../protocols/types';

/**
 * Protokoll-Profile für die spezialisierten Sektor-Agenten
 */
export const SECTOR_PROFILES: Record<SectorType, TradingAgentProtocolProfile> = {
  CRYPTO: {
    id: 'SECTOR_CRYPTO',
    name: 'Krypto Sentinel Bot',
    badge: 'L1 & DeFi Momentum',
    description: 'Hochfrequente Markt- und Liquiditätsüberwachung für Bitcoin, Ethereum und Solana. Reagiert auf Spot-Inflows und On-Chain-Dynamik.',
    marketIntelligence: {
      lookbackCandles: 40,
      emaFastPeriod: 9,
      emaSlowPeriod: 21,
      rsiPeriod: 14,
      rsiOverbought: 72,
      rsiOversold: 28,
      volatilityAtrPeriod: 14,
      highVolThresholdPercent: 3.5,
    },
    alphaStrategy: {
      minConfluenceScore: 65,
      allowedStrategies: ['MOMENTUM_BREAKOUT', 'TURTLE_BREAKOUT', 'STRADDLE_VOLATILITY', 'DCA_ACCUMULATION', 'MEAN_REVERSION_GRID'],
      targetRiskRewardRatio: 2.2,
      stopLossAtrMultiplier: 1.8,
      takeProfitAtrMultiplier: 4.0,
    },
    riskGuardian: {
      maxRiskPerTradePercent: 1.5,
      maxDrawdownCircuitPercent: 6.0,
      maxPortfolioExposurePercent: 65.0,
      kellyFraction: 0.5,
      cooldownTicksAfterLoss: 3,
      allowShorting: true,
    },
    executionRouting: {
      defaultOrderType: 'MARKET',
      limitOffsetBps: 2,
      maxSlippageBps: 25,
      twapSlices: 1,
    },
    quantEvaluator: {
      hurdleRateAnnualized: 0.15,
      evaluationWindowTrades: 20,
      driftThresholdPercent: 12.0,
      cacheTtlTicks: 2,
    },
  },

  DEFENSE: {
    id: 'SECTOR_DEFENSE',
    name: 'Rüstungs & Geopolitik Bot',
    badge: 'Defense & Aerospace',
    description: 'Verteidigungsetats und geopolitische Absicherung (Rheinmetall, Lockheed Martin, Palantir). Hohe Kapitaldisziplin.',
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
      allowedStrategies: ['COLLAR_CYLINDER', 'CPPI_CAPITAL_FLOOR', 'VWAP_VALUE', 'TURTLE_BREAKOUT', 'MOMENTUM_BREAKOUT'],
      targetRiskRewardRatio: 2.6,
      stopLossAtrMultiplier: 1.4,
      takeProfitAtrMultiplier: 3.6,
    },
    riskGuardian: {
      maxRiskPerTradePercent: 0.8,
      maxDrawdownCircuitPercent: 3.0,
      maxPortfolioExposurePercent: 40.0,
      kellyFraction: 0.35,
      cooldownTicksAfterLoss: 5,
      allowShorting: false,
    },
    executionRouting: {
      defaultOrderType: 'LIMIT',
      limitOffsetBps: 4,
      maxSlippageBps: 10,
      twapSlices: 2,
    },
    quantEvaluator: {
      hurdleRateAnnualized: 0.08,
      evaluationWindowTrades: 15,
      driftThresholdPercent: 7.0,
      cacheTtlTicks: 4,
    },
  },

  AI_COMPUTE: {
    id: 'SECTOR_AI_COMPUTE',
    name: 'KI & Semiconductor Bot',
    badge: 'Hyperscale Compute',
    description: 'Hardware- und KI-Infrastruktur-Fokus (Nvidia, Microsoft, AMD, TSMC). Aggressives Momentum bei Ausbrüchen.',
    marketIntelligence: {
      lookbackCandles: 45,
      emaFastPeriod: 8,
      emaSlowPeriod: 20,
      rsiPeriod: 14,
      rsiOverbought: 70,
      rsiOversold: 30,
      volatilityAtrPeriod: 14,
      highVolThresholdPercent: 2.8,
    },
    alphaStrategy: {
      minConfluenceScore: 68,
      allowedStrategies: ['MOMENTUM_BREAKOUT', 'SUPERTREND_VOLATILITY', 'ORB_BREAKOUT', 'COLLAR_CYLINDER', 'MEAN_REVERSION_GRID'],
      targetRiskRewardRatio: 2.5,
      stopLossAtrMultiplier: 1.5,
      takeProfitAtrMultiplier: 3.75,
    },
    riskGuardian: {
      maxRiskPerTradePercent: 1.2,
      maxDrawdownCircuitPercent: 4.5,
      maxPortfolioExposurePercent: 55.0,
      kellyFraction: 0.45,
      cooldownTicksAfterLoss: 4,
      allowShorting: false,
    },
    executionRouting: {
      defaultOrderType: 'LIMIT',
      limitOffsetBps: 3,
      maxSlippageBps: 15,
      twapSlices: 1,
    },
    quantEvaluator: {
      hurdleRateAnnualized: 0.12,
      evaluationWindowTrades: 20,
      driftThresholdPercent: 10.0,
      cacheTtlTicks: 3,
    },
  },

  AUTOMOTIVE: {
    id: 'SECTOR_AUTOMOTIVE',
    name: 'Automobil & Mobility Bot',
    badge: 'EV & Legacy Mobility',
    description: 'Zyklische Automobil- und Elektromobilitäts-Werte (Tesla, BYD, BMW, Porsche). Nutzt Mean-Reversion in festen Bewertungsspannen.',
    marketIntelligence: {
      lookbackCandles: 55,
      emaFastPeriod: 10,
      emaSlowPeriod: 24,
      rsiPeriod: 14,
      rsiOverbought: 68,
      rsiOversold: 32,
      volatilityAtrPeriod: 14,
      highVolThresholdPercent: 2.5,
    },
    alphaStrategy: {
      minConfluenceScore: 70,
      allowedStrategies: ['BOLLINGER_ZSCORE', 'PAIRS_STATARB', 'MEAN_REVERSION_GRID', 'DCA_ACCUMULATION', 'COLLAR_CYLINDER'],
      targetRiskRewardRatio: 2.0,
      stopLossAtrMultiplier: 1.6,
      takeProfitAtrMultiplier: 3.2,
    },
    riskGuardian: {
      maxRiskPerTradePercent: 1.0,
      maxDrawdownCircuitPercent: 4.0,
      maxPortfolioExposurePercent: 45.0,
      kellyFraction: 0.4,
      cooldownTicksAfterLoss: 4,
      allowShorting: false,
    },
    executionRouting: {
      defaultOrderType: 'LIMIT',
      limitOffsetBps: 5,
      maxSlippageBps: 12,
      twapSlices: 2,
    },
    quantEvaluator: {
      hurdleRateAnnualized: 0.06,
      evaluationWindowTrades: 18,
      driftThresholdPercent: 8.0,
      cacheTtlTicks: 4,
    },
  },

  HUMANOID_ROBOTS: {
    id: 'SECTOR_HUMANOID_ROBOTS',
    name: 'Humanoid Robotics Bot',
    badge: 'Cybernetics & Automation',
    description: 'Langfristiges exponentielles Wachstum in humanoider Robotik und Industrieautomation (Optimus Zulieferer, Fanuc, ABB, Intuitive).',
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
      minConfluenceScore: 66,
      allowedStrategies: ['TURTLE_BREAKOUT', 'TWAP_EXECUTION', 'RSI_CONNORS_REVERSAL', 'MOMENTUM_BREAKOUT', 'DCA_ACCUMULATION'],
      targetRiskRewardRatio: 2.4,
      stopLossAtrMultiplier: 1.6,
      takeProfitAtrMultiplier: 3.84,
    },
    riskGuardian: {
      maxRiskPerTradePercent: 1.2,
      maxDrawdownCircuitPercent: 5.0,
      maxPortfolioExposurePercent: 50.0,
      kellyFraction: 0.4,
      cooldownTicksAfterLoss: 3,
      allowShorting: false,
    },
    executionRouting: {
      defaultOrderType: 'LIMIT',
      limitOffsetBps: 4,
      maxSlippageBps: 18,
      twapSlices: 1,
    },
    quantEvaluator: {
      hurdleRateAnnualized: 0.14,
      evaluationWindowTrades: 20,
      driftThresholdPercent: 11.0,
      cacheTtlTicks: 3,
    },
  },
};

/**
 * Definition der 5 Sektor-Agenten mit ihren Asset-Universen und News-Treibern
 */
export const SECTOR_FLEET: Record<SectorType, SectorAgentInfo> = {
  CRYPTO: {
    id: 'crypto-sentinel',
    name: 'Krypto Sentinel Bot',
    badge: 'L1 & DeFi',
    sector: 'CRYPTO',
    description: 'Autonomer Krypto-Scout für Bitcoin, Ethereum und Solana mit Fokus auf ETF-Liquidität und Volatilität.',
    universe: [
      { symbol: 'BTC/USDT', name: 'Bitcoin', basePrice: 64500, engine: 'CCXT_CRYPTO' },
      { symbol: 'ETH/USDT', name: 'Ethereum', basePrice: 3450, engine: 'CCXT_CRYPTO' },
      { symbol: 'SOL/USDT', name: 'Solana', basePrice: 145, engine: 'CCXT_CRYPTO' },
    ],
    focusNewsCategory: 'CRYPTO_REGULATION',
    sentimentSensitivity: 1.6,
    colorTheme: 'emerald',
    profileId: 'SECTOR_CRYPTO',
    convictionScore: 84,
    status: 'ACTIVE',
  },

  DEFENSE: {
    id: 'defense-scout',
    name: 'Rüstungs & Geopolitik Bot',
    badge: 'Defense & Aerospace',
    sector: 'DEFENSE',
    description: 'Spezialisiert auf europäische und US-Verteidigungswerte (Rheinmetall, Lockheed, Palantir).',
    universe: [
      { symbol: 'RHM.DE', name: 'Rheinmetall AG', basePrice: 520, engine: 'ALPACA_EQUITY' },
      { symbol: 'LMT', name: 'Lockheed Martin', basePrice: 460, engine: 'ALPACA_EQUITY' },
      { symbol: 'PLTR', name: 'Palantir Defense', basePrice: 28.5, engine: 'ALPACA_EQUITY' },
    ],
    focusNewsCategory: 'GEOPOLITICS',
    sentimentSensitivity: 1.8,
    colorTheme: 'rose',
    profileId: 'SECTOR_DEFENSE',
    convictionScore: 78,
    status: 'STANDBY',
  },

  AI_COMPUTE: {
    id: 'ai-chips-bot',
    name: 'KI & Semiconductor Bot',
    badge: 'Hyperscale Compute',
    sector: 'AI_COMPUTE',
    description: 'Monetarisierung des KI-Infrastruktur-Booms (Nvidia, Microsoft, AMD, TSMC).',
    universe: [
      { symbol: 'NVDA', name: 'Nvidia Corp', basePrice: 125, engine: 'ALPACA_EQUITY' },
      { symbol: 'MSFT', name: 'Microsoft Cloud', basePrice: 430, engine: 'ALPACA_EQUITY' },
      { symbol: 'AMD', name: 'Advanced Micro Devices', basePrice: 155, engine: 'ALPACA_EQUITY' },
      { symbol: 'TSM', name: 'TSMC Semiconductor', basePrice: 170, engine: 'ALPACA_EQUITY' },
    ],
    focusNewsCategory: 'TECH_EARNINGS',
    sentimentSensitivity: 1.5,
    colorTheme: 'indigo',
    profileId: 'SECTOR_AI_COMPUTE',
    convictionScore: 91,
    status: 'STANDBY',
  },

  AUTOMOTIVE: {
    id: 'automotive-mobility',
    name: 'Automobil & Mobility Bot',
    badge: 'EV & Mobility',
    sector: 'AUTOMOTIVE',
    description: 'Zyklische Automobil- und Elektromobilitäts-Titel (Tesla, BYD, BMW, Porsche).',
    universe: [
      { symbol: 'TSLA', name: 'Tesla Motors', basePrice: 240, engine: 'ALPACA_EQUITY' },
      { symbol: 'BYD', name: 'BYD Company', basePrice: 32, engine: 'ALPACA_EQUITY' },
      { symbol: 'BMW.DE', name: 'BMW Group', basePrice: 85, engine: 'ALPACA_EQUITY' },
    ],
    focusNewsCategory: 'MACRO_ECONOMY',
    sentimentSensitivity: 1.2,
    colorTheme: 'amber',
    profileId: 'SECTOR_AUTOMOTIVE',
    convictionScore: 72,
    status: 'STANDBY',
  },

  HUMANOID_ROBOTS: {
    id: 'humanoid-robotics',
    name: 'Humanoid Robotics Bot',
    badge: 'Cybernetics',
    sector: 'HUMANOID_ROBOTS',
    description: 'Automatisierung und humanoide Robotik (Optimus Lieferkette, Fanuc, ABB, Intuitive Surgical).',
    universe: [
      { symbol: 'ABB', name: 'ABB Robotics', basePrice: 48, engine: 'ALPACA_EQUITY' },
      { symbol: 'FANUY', name: 'Fanuc Robotics', basePrice: 16.5, engine: 'ALPACA_EQUITY' },
      { symbol: 'ISRG', name: 'Intuitive Surgical', basePrice: 440, engine: 'ALPACA_EQUITY' },
    ],
    focusNewsCategory: 'TECH_EARNINGS',
    sentimentSensitivity: 1.4,
    colorTheme: 'purple',
    profileId: 'SECTOR_HUMANOID_ROBOTS',
    convictionScore: 82,
    status: 'STANDBY',
  },
};

export function getAllSectorAgents(): SectorAgentInfo[] {
  return Object.values(SECTOR_FLEET);
}

export function getSectorAgent(sector: SectorType): SectorAgentInfo {
  return SECTOR_FLEET[sector];
}

export function getSectorProfile(sector: SectorType): TradingAgentProtocolProfile {
  return SECTOR_PROFILES[sector];
}
