import { OrderSide, OrderType, TradeLog } from './trading';

export type CryptoStrategyProfile =
  | 'CORE_BLUECHIP'
  | 'SMART_MOMENTUM'
  | 'ATTENTION_ALPHA'
  | 'DIP_ACCUMULATOR';

export interface CryptoStrategyMeta {
  id: CryptoStrategyProfile;
  name: string;
  tagline: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'SPECULATIVE';
  expectedVolatility: string;
  rebalanceFrequency: string;
  description: string;
  benchmark: string;
  targetAssets: string[];
}

export interface CryptoAllocationItem {
  symbol: string;
  name: string;
  price: number;
  weightPercent: number;
  allocatedEur: number;
  amount: number;
  confluenceScore: number;
  rationale: string;
  trendSignal: 'BULLISH' | 'NEUTRAL' | 'ACCUMULATING';
  change24h: number;
  estimatedFee: number;
  estimatedSlippage: number;
}

export interface AutonomousMarketAssessment {
  marketRegime: 'RISK_ON' | 'RISK_OFF' | 'DIP_OPPORTUNITY' | 'HIGH_VOLATILITY';
  selectedStrategy: CryptoStrategyProfile;
  rationale: string;
  confidenceScore: number;
  macroConfluence: string;
  recommendedBudgetPercent: number;
}

export interface CryptoBasketPlan {
  strategy: CryptoStrategyProfile;
  strategyMeta: CryptoStrategyMeta;
  totalBudget: number;
  availableCash: number;
  allocations: CryptoAllocationItem[];
  totalAllocated: number;
  totalFees: number;
  totalSlippage: number;
  timestamp: number;
  isExecutable: boolean;
  validationError?: string;
  assessment?: AutonomousMarketAssessment;
}

export interface CryptoOrderExecution {
  symbol: string;
  orderId: string;
  side: OrderSide;
  type: OrderType;
  amount: number;
  price: number;
  totalCost: number;
  fee: number;
  slippage: number;
  status: 'FILLED' | 'REJECTED';
  tradeLog?: TradeLog;
  error?: string;
}

export interface CryptoBasketExecutionResult {
  success: boolean;
  strategy: CryptoStrategyProfile;
  totalInvested: number;
  totalFees: number;
  executedOrders: CryptoOrderExecution[];
  timestamp: number;
  portfolioCashRemaining: number;
  portfolioEquity: number;
}
