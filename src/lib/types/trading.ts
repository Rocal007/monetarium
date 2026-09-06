export type OrderSide = 'BUY' | 'SELL';
export type OrderType = 'MARKET' | 'LIMIT' | 'STOP_LOSS' | 'TAKE_PROFIT';
export type OrderStatus = 'PENDING' | 'FILLED' | 'CANCELLED' | 'REJECTED';

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  symbol?: string;
}

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price?: number;
  amount: number;
  stopPrice?: number;
  status: OrderStatus;
  filledPrice?: number;
  fee: number;
  slippage: number;
  timestamp: number;
}

export interface Position {
  id: string;
  symbol: string;
  side: OrderSide;
  entryPrice: number;
  currentPrice: number;
  amount: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  realizedPnL: number;
  stopLoss?: number;
  takeProfit?: number;
  timestamp: number;
}

export interface TradeLog {
  id: string;
  orderId: string;
  symbol: string;
  side: OrderSide;
  price: number;
  amount: number;
  fee: number;
  pnl?: number;
  timestamp: number;
}

export interface Portfolio {
  cash: number;
  initialBalance: number;
  equity: number;
  realizedPnL: number;
  unrealizedPnL: number;
  positions: Record<string, Position>;
  tradeHistory: TradeLog[];
}

export interface QuantMetrics {
  totalReturn: number;
  totalReturnPercent: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  profitFactor: number;
  avgTradePnL: number;
  calmarRatio: number;
}

export interface BacktestConfig {
  symbol: string;
  strategyName: string;
  initialCapital: number;
  inSampleRatio: number; // e.g. 0.70 for 70% In-Sample, 30% Out-of-Sample
  feeRate: number;      // e.g. 0.001 for 0.1%
  slippageRate: number; // e.g. 0.0005 for 0.05%
  params: Record<string, number>;
}

export interface EquityPoint {
  time: number;
  equity: number;
  drawdown: number;
}

export interface BacktestResult {
  config: BacktestConfig;
  inSampleMetrics: QuantMetrics;
  outOfSampleMetrics: QuantMetrics;
  fullMetrics: QuantMetrics;
  inSampleEquity: EquityPoint[];
  outOfSampleEquity: EquityPoint[];
  trades: TradeLog[];
  overfittingScore: number; // 0 to 1 (0 = perfect generalization, 1 = extreme overfitting)
  overfittingVerdict: 'STABLE' | 'MODERATE_RISK' | 'OVERFITTED';
}

export type StrategyType = 'GRID' | 'DCA' | 'MOMENTUM';

export interface StrategySignal {
  action: 'BUY' | 'SELL' | 'HOLD';
  symbol: string;
  price: number;
  amount?: number;
  confidence: number;
  reason: string;
}
