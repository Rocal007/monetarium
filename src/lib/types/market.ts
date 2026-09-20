export type MarketAssetCategory = 
  | 'INDEX' 
  | 'COMMODITY' 
  | 'YIELD' 
  | 'EQUITY' 
  | 'CRYPTO' 
  | 'FOREX';

export type GlobalRiskRegime = 
  | 'RISK_ON' 
  | 'RISK_OFF' 
  | 'VOLATILITY_EXPANSION' 
  | 'NEUTRAL';

export interface GlobalMarketItem {
  symbol: string;
  displaySymbol: string;
  name: string;
  category: MarketAssetCategory;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  sparkline: number[];
  status: 'UP' | 'DOWN' | 'FLAT';
  engine: 'ALPACA_EQUITY' | 'CCXT_CRYPTO' | 'SIMULATED_PAPER';
}

export interface GlobalMarketState {
  timestamp: number;
  riskRegime: GlobalRiskRegime;
  sentimentScore: number; // -100 (Extremes Risk-Off) bis +100 (Euphorie / Risk-On)
  vixLevel: number;
  vixChange: number;
  sp500Price: number;
  sp500Change: number;
  nasdaqChange: number;
  daxChange: number;
  us10yYield: number;
  goldChange: number;
  oilChange: number;
  advanceDeclineRatio: number; // z.B. 1.8 = 1.8x mehr steigende als fallende Titel
  items: GlobalMarketItem[];
  summary: string;
}

export type MarketMoverType = 
  | 'GAIN' 
  | 'LOSS' 
  | 'UNUSUAL_VOLUME' 
  | '52W_BREAKOUT';

export interface MarketMover {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume: string;
  volumeRatio: number; // z.B. 3.2 = 3.2x des 20-Tage-Durchschnitts
  type: MarketMoverType;
  assetClass: 'EQUITY' | 'CRYPTO' | 'COMMODITY';
  sector: string;
  catalyst: string;
  sparkline: number[];
}

export interface GICSSectorPerformance {
  id: string;
  name: string;
  etfSymbol: string;
  changePercent24h: number;
  momentum: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  leadingStock: string;
  description: string;
}

export interface GlobalMarketScreenerData {
  timestamp: number;
  gainers: MarketMover[];
  losers: MarketMover[];
  unusualVolume: MarketMover[];
  breakouts: MarketMover[];
  sectors: GICSSectorPerformance[];
}
