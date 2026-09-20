import { Candle, OrderSide, OrderType, Portfolio, TradeLog } from '../../types/trading';

/**
 * Mögliche Marktregimes, identifiziert durch den Perception Scout
 */
export type MarketRegime = 
  | 'BULL_TREND'
  | 'BEAR_TREND'
  | 'RANGE_BOUND'
  | 'HIGH_VOLATILITY'
  | 'CONSOLIDATION';

/**
 * 1. Protokoll für Market Intelligence & Perception Scout
 */
export interface MarketIntelligenceProtocol {
  lookbackCandles: number;
  emaFastPeriod: number;
  emaSlowPeriod: number;
  rsiPeriod: number;
  rsiOverbought: number;
  rsiOversold: number;
  volatilityAtrPeriod: number;
  highVolThresholdPercent: number; // e.g. 2.5% ATR/Price
}

export type AlphaStrategyName =
  | 'MOMENTUM_BREAKOUT'
  | 'TURTLE_BREAKOUT'
  | 'SUPERTREND_VOLATILITY'
  | 'ORB_BREAKOUT'
  | 'MEAN_REVERSION_GRID'
  | 'BOLLINGER_ZSCORE'
  | 'RSI_CONNORS_REVERSAL'
  | 'PAIRS_STATARB'
  | 'DCA_ACCUMULATION'
  | 'COLLAR_CYLINDER'
  | 'STRADDLE_VOLATILITY'
  | 'TWAP_EXECUTION'
  | 'VWAP_VALUE'
  | 'CPPI_CAPITAL_FLOOR'
  | 'SEARCH_ATTENTION_MOMENTUM';

/**
 * 2. Protokoll für Alpha Hypothesis & Signal Generator
 */
export interface AlphaStrategyProtocol {
  minConfluenceScore: number; // 0 to 100
  allowedStrategies: AlphaStrategyName[];
  targetRiskRewardRatio: number; // e.g. 2.0 (2:1)
  stopLossAtrMultiplier: number; // e.g. 1.5
  takeProfitAtrMultiplier: number; // e.g. 3.0
}

/**
 * 3. Protokoll für Risk & Compliance Guardian (Judikative P_J)
 */
export interface RiskGuardianProtocol {
  maxRiskPerTradePercent: number; // e.g. 1.0 for 1% of equity
  maxDrawdownCircuitPercent: number; // e.g. 5.0 for 5% halt
  maxPortfolioExposurePercent: number; // e.g. 60.0 for 60% invested
  kellyFraction: number; // e.g. 0.5 (Half Kelly sizing)
  cooldownTicksAfterLoss: number; // ticks to wait after stop out
  allowShorting: boolean;
}

/**
 * 4. Protokoll für Execution & Routing Officer
 */
export interface ExecutionRoutingProtocol {
  defaultOrderType: 'MARKET' | 'LIMIT';
  limitOffsetBps: number; // e.g. 5 bps
  maxSlippageBps: number; // e.g. 20 bps
  twapSlices: number;
}

/**
 * 5. Protokoll für Quant Telemetry & State Evaluator (Cache C)
 */
export interface QuantEvaluatorProtocol {
  hurdleRateAnnualized: number; // e.g. 0.05
  evaluationWindowTrades: number; // e.g. 20
  driftThresholdPercent: number; // e.g. 10%
  cacheTtlTicks: number;
}

/**
 * Zusammenhängendes Protokoll-Profil (Das Protokoll IST der Agent)
 */
export interface TradingAgentProtocolProfile {
  id: string;
  name: string;
  badge: string;
  description: string;
  marketIntelligence: MarketIntelligenceProtocol;
  alphaStrategy: AlphaStrategyProtocol;
  riskGuardian: RiskGuardianProtocol;
  executionRouting: ExecutionRoutingProtocol;
  quantEvaluator: QuantEvaluatorProtocol;
}

// -------------------------------------------------------------
// Subagent Outputs & DTOs
// -------------------------------------------------------------

export interface PerceptionState {
  timestamp: number;
  regime: MarketRegime;
  rsi: number;
  emaFast: number;
  emaSlow: number;
  atr: number;
  atrPercent: number;
  trendStrength: number; // 0-100
  summary: string;
  macroSentiment?: 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'CRISIS';
  macroSentimentScore?: number; // -100 to +100
  latestBreakingNews?: string;
  crisisVetoActive?: boolean;
  globalMarket?: {
    riskRegime: 'RISK_ON' | 'RISK_OFF' | 'VOLATILITY_EXPANSION' | 'NEUTRAL';
    sentimentScore: number;
    vixLevel: number;
    sp500Change: number;
    confluenceMultiplier: number;
    summary?: string;
  };
  searchVisibility?: {
    svi: number;
    delta24h: number;
    regime: string;
    confidenceModifier: number;
    retailEuphoriaScore: number;
  };
}

export interface AlphaHypothesis {
  id: string;
  timestamp: number;
  action: 'BUY' | 'SELL' | 'HOLD';
  symbol: string;
  proposedPrice: number;
  suggestedStopLoss: number;
  suggestedTakeProfit: number;
  confluenceScore: number; // 0-100
  strategyUsed: string;
  rationale: string;
  searchAttention?: {
    svi: number;
    delta24h: number;
    regime: string;
    modifier: number;
  };
}

export interface RiskValidationProof {
  passed: boolean;
  approvedAmount: number;
  riskPerTradeEuro: number;
  circuitBreakerActive: boolean;
  vetoReason?: string;
  proofScore: number; // 1 = Proof OK, 0 = Rejected
  invariantsChecked: {
    drawdownOk: boolean;
    exposureOk: boolean;
    riskSizeOk: boolean;
    cooldownOk: boolean;
    macroNewsOk?: boolean;
    searchEuphoriaOk?: boolean;
  };
}

export interface ExecutionDecision {
  orderId?: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  amount: number;
  expectedPrice: number;
  executedPrice?: number;
  slippageBps: number;
  status: 'EXECUTED' | 'SKIPPED' | 'REJECTED';
  notes: string;
}

export interface QuantCycleTelemetry {
  cycleIndex: number;
  cached: boolean;
  rollingSharpe: number;
  drawdownPercent: number;
  winRate: number;
  pnlDelta: number;
  fixpointDelta: number; // semantic delta
}

/**
 * Vollständiger Audit-Record eines NEXUS-Orchestrator-Takts
 */
export interface OrchestratorCycleRecord {
  id: string;
  cycleIndex: number;
  timestamp: number;
  symbol: string;
  price: number;
  profileId: string;
  perception: PerceptionState;
  hypothesis: AlphaHypothesis;
  riskProof: RiskValidationProof;
  execution: ExecutionDecision;
  telemetry: QuantCycleTelemetry;
}
