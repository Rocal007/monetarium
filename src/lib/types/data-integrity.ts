import { Candle } from './trading';

export type DataSourceId = 
  | 'BINANCE_REST'
  | 'ALPACA_REST'
  | 'CCXT_PROXY'
  | 'FOREX_FACTORY'
  | 'RESILIENT_MIRROR';

export type ProviderHealthState = 'OPTIMAL' | 'DEGRADED' | 'FAILOVER' | 'OFFLINE';

export interface ProviderTelemetry {
  id: DataSourceId;
  name: string;
  category: 'CRYPTO' | 'EQUITY' | 'MACRO_NEWS' | 'UNIVERSAL';
  state: ProviderHealthState;
  pingMs: number;
  lastSuccessTimestamp: number;
  errorCount: number;
  successCount: number;
  activeEndpoint: string;
  lastErrorReason?: string;
}

export type AnomalyType = 
  | 'INVERTED_HIGHLOW'
  | 'GAP_DETECTED'
  | 'DUPLICATE_TIMESTAMP'
  | 'BAD_TICK_SPIKE'
  | 'NON_POSITIVE_PRICE'
  | 'NEGATIVE_VOLUME';

export interface DataAnomaly {
  type: AnomalyType;
  timestamp: number;
  description: string;
  fixed: boolean;
}

export interface ValidationReport {
  isValid: boolean;
  totalCandlesChecked: number;
  anomaliesFound: number;
  anomaliesFixed: number;
  integrityScore: number; // 0.0 - 100.0%
  anomalies: DataAnomaly[];
}

export interface VerifiedSymbolData {
  symbol: string;
  source: DataSourceId;
  candles: Candle[];
  currentPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  validationReport: ValidationReport;
  latencyMs: number;
  isLive: boolean;
  timestamp: number;
}

export interface DataSentinelOverallState {
  status: 'OPTIMAL' | 'DEGRADED' | 'FAILOVER' | 'CRITICAL';
  overallScore: number;
  avgLatencyMs: number;
  providers: Record<DataSourceId, ProviderTelemetry>;
  recentAuditLog: Array<{
    timestamp: number;
    message: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  }>;
}
