import { 
  GICSSectorPerformance, 
  GlobalMarketItem, 
  GlobalMarketScreenerData, 
  GlobalMarketState, 
  GlobalRiskRegime, 
  MarketAssetCategory, 
  MarketMover 
} from '../types/market';
import { Candle } from '../types/trading';
import { generateRealisticCandles } from './mock-feed';

export interface ResolvedAsset {
  symbol: string;
  name: string;
  basePrice: number;
  category: MarketAssetCategory;
  engine: 'ALPACA_EQUITY' | 'CCXT_CRYPTO' | 'SIMULATED_PAPER';
}

/**
 * Bekanntes Referenzuniversum des globalen Börsenmarkts
 */
export const POPULAR_GLOBAL_ASSETS: Record<string, ResolvedAsset> = {
  // US Leit-ETFs & Indizes
  'SPY': { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', basePrice: 565.4, category: 'INDEX', engine: 'ALPACA_EQUITY' },
  'QQQ': { symbol: 'QQQ', name: 'Invesco QQQ Trust (Nasdaq 100)', basePrice: 485.2, category: 'INDEX', engine: 'ALPACA_EQUITY' },
  'DIA': { symbol: 'DIA', name: 'SPDR Dow Jones Industrial Average', basePrice: 418.6, category: 'INDEX', engine: 'ALPACA_EQUITY' },
  'IWM': { symbol: 'IWM', name: 'iShares Russell 2000 ETF', basePrice: 220.8, category: 'INDEX', engine: 'ALPACA_EQUITY' },

  // GICS Sektor ETFs
  'XLK': { symbol: 'XLK', name: 'Technology Select Sector SPDR', basePrice: 225.4, category: 'INDEX', engine: 'ALPACA_EQUITY' },
  'XLC': { symbol: 'XLC', name: 'Communication Services Select SPDR', basePrice: 88.6, category: 'INDEX', engine: 'ALPACA_EQUITY' },
  'XLY': { symbol: 'XLY', name: 'Consumer Discretionary SPDR', basePrice: 195.2, category: 'INDEX', engine: 'ALPACA_EQUITY' },
  'XLI': { symbol: 'XLI', name: 'Industrial Select Sector SPDR', basePrice: 132.8, category: 'INDEX', engine: 'ALPACA_EQUITY' },
  'XLF': { symbol: 'XLF', name: 'Financial Select Sector SPDR', basePrice: 44.5, category: 'INDEX', engine: 'ALPACA_EQUITY' },
  'XLV': { symbol: 'XLV', name: 'Health Care Select Sector SPDR', basePrice: 152.0, category: 'INDEX', engine: 'ALPACA_EQUITY' },
  'XLB': { symbol: 'XLB', name: 'Materials Select Sector SPDR', basePrice: 92.4, category: 'INDEX', engine: 'ALPACA_EQUITY' },
  'XLP': { symbol: 'XLP', name: 'Consumer Staples Select SPDR', basePrice: 79.5, category: 'INDEX', engine: 'ALPACA_EQUITY' },
  'XLRE': { symbol: 'XLRE', name: 'Real Estate Select Sector SPDR', basePrice: 42.8, category: 'INDEX', engine: 'ALPACA_EQUITY' },
  'XLE': { symbol: 'XLE', name: 'Energy Select Sector SPDR', basePrice: 88.0, category: 'INDEX', engine: 'ALPACA_EQUITY' },
  'XLU': { symbol: 'XLU', name: 'Utilities Select Sector SPDR', basePrice: 73.2, category: 'INDEX', engine: 'ALPACA_EQUITY' },

  // US Megacap Tech & KI
  'NVDA': { symbol: 'NVDA', name: 'Nvidia Corporation', basePrice: 125.0, category: 'EQUITY', engine: 'ALPACA_EQUITY' },
  'AAPL': { symbol: 'AAPL', name: 'Apple Inc.', basePrice: 228.5, category: 'EQUITY', engine: 'ALPACA_EQUITY' },
  'MSFT': { symbol: 'MSFT', name: 'Microsoft Corporation', basePrice: 432.0, category: 'EQUITY', engine: 'ALPACA_EQUITY' },
  'GOOGL': { symbol: 'GOOGL', name: 'Alphabet Inc. (Google)', basePrice: 165.0, category: 'EQUITY', engine: 'ALPACA_EQUITY' },
  'AMZN': { symbol: 'AMZN', name: 'Amazon.com Inc.', basePrice: 188.0, category: 'EQUITY', engine: 'ALPACA_EQUITY' },
  'META': { symbol: 'META', name: 'Meta Platforms Inc.', basePrice: 560.0, category: 'EQUITY', engine: 'ALPACA_EQUITY' },
  'TSLA': { symbol: 'TSLA', name: 'Tesla Motors Inc.', basePrice: 242.0, category: 'EQUITY', engine: 'ALPACA_EQUITY' },
  'AMD': { symbol: 'AMD', name: 'Advanced Micro Devices', basePrice: 154.0, category: 'EQUITY', engine: 'ALPACA_EQUITY' },
  'SMCI': { symbol: 'SMCI', name: 'Super Micro Computer', basePrice: 44.5, category: 'EQUITY', engine: 'ALPACA_EQUITY' },
  'ARM': { symbol: 'ARM', name: 'Arm Holdings plc', basePrice: 146.5, category: 'EQUITY', engine: 'ALPACA_EQUITY' },
  'INTC': { symbol: 'INTC', name: 'Intel Corporation', basePrice: 19.8, category: 'EQUITY', engine: 'ALPACA_EQUITY' },

  // Europäische Bluechips & Defense
  'RHM.DE': { symbol: 'RHM.DE', name: 'Rheinmetall AG', basePrice: 520.0, category: 'EQUITY', engine: 'ALPACA_EQUITY' },
  'SAP.DE': { symbol: 'SAP.DE', name: 'SAP SE', basePrice: 202.0, category: 'EQUITY', engine: 'ALPACA_EQUITY' },
  'BMW.DE': { symbol: 'BMW.DE', name: 'BMW Group', basePrice: 84.5, category: 'EQUITY', engine: 'ALPACA_EQUITY' },
  'ASML': { symbol: 'ASML', name: 'ASML Holding NV', basePrice: 790.0, category: 'EQUITY', engine: 'ALPACA_EQUITY' },
  'DAX': { symbol: 'DAX', name: 'DAX 40 Index', basePrice: 18680.0, category: 'INDEX', engine: 'SIMULATED_PAPER' },

  // Global Leaders
  'NVO': { symbol: 'NVO', name: 'Novo Nordisk A/S', basePrice: 122.0, category: 'EQUITY', engine: 'ALPACA_EQUITY' },
  'TSM': { symbol: 'TSM', name: 'Taiwan Semiconductor', basePrice: 178.5, category: 'EQUITY', engine: 'ALPACA_EQUITY' },
  'LMT': { symbol: 'LMT', name: 'Lockheed Martin Corp', basePrice: 465.0, category: 'EQUITY', engine: 'ALPACA_EQUITY' },
  'PLTR': { symbol: 'PLTR', name: 'Palantir Technologies', basePrice: 32.5, category: 'EQUITY', engine: 'ALPACA_EQUITY' },

  // Rohstoffe & Makro
  'GLD': { symbol: 'GLD', name: 'SPDR Gold Shares', basePrice: 238.0, category: 'COMMODITY', engine: 'ALPACA_EQUITY' },
  'USO': { symbol: 'USO', name: 'United States Oil Fund', basePrice: 73.0, category: 'COMMODITY', engine: 'ALPACA_EQUITY' },
  'VIX': { symbol: 'VIX', name: 'CBOE Volatility Index', basePrice: 15.8, category: 'INDEX', engine: 'SIMULATED_PAPER' },

  // Krypto
  'BTC/USDT': { symbol: 'BTC/USDT', name: 'Bitcoin Spot', basePrice: 64500.0, category: 'CRYPTO', engine: 'CCXT_CRYPTO' },
  'ETH/USDT': { symbol: 'ETH/USDT', name: 'Ethereum Spot', basePrice: 3450.0, category: 'CRYPTO', engine: 'CCXT_CRYPTO' },
  'SOL/USDT': { symbol: 'SOL/USDT', name: 'Solana Spot', basePrice: 145.0, category: 'CRYPTO', engine: 'CCXT_CRYPTO' },
  'SUI/USDT': { symbol: 'SUI/USDT', name: 'Sui Network', basePrice: 1.62, category: 'CRYPTO', engine: 'CCXT_CRYPTO' },
};

/**
 * Löst jedes beliebige Symbol des weltweiten Börsenmarktes auf
 */
export function resolveGlobalSymbol(input: string): ResolvedAsset {
  const clean = input.trim().toUpperCase();

  // Direkter Match
  if (POPULAR_GLOBAL_ASSETS[clean]) {
    return POPULAR_GLOBAL_ASSETS[clean];
  }

  // Symbol mit /USDT oder Krypto-Erkennung
  if (clean.includes('/USDT') || clean.endsWith('USDT')) {
    const formatted = clean.includes('/') ? clean : `${clean.replace('USDT', '')}/USDT`;
    return {
      symbol: formatted,
      name: `${formatted.split('/')[0]} Crypto Token`,
      basePrice: 50.0,
      category: 'CRYPTO',
      engine: 'CCXT_CRYPTO',
    };
  }

  // Indizes / Makro
  if (clean === '^GSPC' || clean === 'S&P 500' || clean === 'SPX') {
    return POPULAR_GLOBAL_ASSETS['SPY'];
  }
  if (clean === '^IXIC' || clean === 'NASDAQ' || clean === 'NDX') {
    return POPULAR_GLOBAL_ASSETS['QQQ'];
  }

  // Generische TradFi-Aktie
  return {
    symbol: clean,
    name: `${clean} Global Asset`,
    basePrice: 100.0,
    category: 'EQUITY',
    engine: 'ALPACA_EQUITY',
  };
}

/**
 * Erzeugt dynamische Sparklines für Ticker
 */
function createSparkline(base: number, changePct: number): number[] {
  const points: number[] = [];
  let p = base * (1 - changePct / 100);
  const step = (base - p) / 8;
  for (let i = 0; i < 9; i++) {
    // Deterministische Wellenform verhindert Hydration-Mismatches zwischen Server & Client
    const wave = Math.sin(i * 1.25) * (base * 0.0018);
    points.push(Number((p + wave).toFixed(2)));
    p += step;
  }
  points.push(base);
  return points;
}

/**
 * Liefert den aktuellen Gesamtstatus des Weltbörsenmarkts (Indizes, VIX, Rohstoffe, Zinsen)
 */
export function fetchGlobalMarketOverview(): GlobalMarketState {
  const timestamp = Date.now();

  const sp500Price = 5662.4;
  const sp500Change = 0.54;

  const nasdaqPrice = 19880.2;
  const nasdaqChange = 0.88;

  const daxPrice = 18712.5;
  const daxChange = 0.35;

  const dowPrice = 41920.0;
  const dowChange = -0.15;

  const vixLevel = 15.65;
  const vixChange = -3.2;

  const us10yYield = 3.96;
  const goldPrice = 2584.2;
  const goldChange = 0.62;

  const oilPrice = 72.8;
  const oilChange = -0.45;

  const btcPrice = 64850.0;
  const btcChange = 2.45;

  let riskRegime: GlobalRiskRegime = 'NEUTRAL';
  let sentimentScore = 35;

  if (vixLevel >= 25.0) {
    riskRegime = 'VOLATILITY_EXPANSION';
    sentimentScore = -65;
  } else if (sp500Change > 0.2 && vixLevel < 19.0 && vixChange <= 0) {
    riskRegime = 'RISK_ON';
    sentimentScore = 68;
  } else if (sp500Change < -0.5 || vixLevel > 21.0) {
    riskRegime = 'RISK_OFF';
    sentimentScore = -45;
  }

  const items: GlobalMarketItem[] = [
    {
      symbol: '^GSPC',
      displaySymbol: 'S&P 500',
      name: 'US Large Cap Index',
      category: 'INDEX',
      price: sp500Price,
      change24h: 30.4,
      changePercent24h: sp500Change,
      high24h: 5670.0,
      low24h: 5635.0,
      sparkline: createSparkline(sp500Price, sp500Change),
      status: sp500Change >= 0 ? 'UP' : 'DOWN',
      engine: 'ALPACA_EQUITY',
    },
    {
      symbol: '^IXIC',
      displaySymbol: 'NASDAQ 100',
      name: 'Tech Benchmark',
      category: 'INDEX',
      price: nasdaqPrice,
      change24h: 172.5,
      changePercent24h: nasdaqChange,
      high24h: 19920.0,
      low24h: 19710.0,
      sparkline: createSparkline(nasdaqPrice, nasdaqChange),
      status: nasdaqChange >= 0 ? 'UP' : 'DOWN',
      engine: 'ALPACA_EQUITY',
    },
    {
      symbol: '^GDAXI',
      displaySymbol: 'DAX 40',
      name: 'Deutscher Leitindex',
      category: 'INDEX',
      price: daxPrice,
      change24h: 65.2,
      changePercent24h: daxChange,
      high24h: 18740.0,
      low24h: 18630.0,
      sparkline: createSparkline(daxPrice, daxChange),
      status: daxChange >= 0 ? 'UP' : 'DOWN',
      engine: 'SIMULATED_PAPER',
    },
    {
      symbol: '^DJI',
      displaySymbol: 'DOW JONES',
      name: 'Industrial Average',
      category: 'INDEX',
      price: dowPrice,
      change24h: -62.0,
      changePercent24h: dowChange,
      high24h: 42010.0,
      low24h: 41850.0,
      sparkline: createSparkline(dowPrice, dowChange),
      status: dowChange >= 0 ? 'UP' : 'DOWN',
      engine: 'ALPACA_EQUITY',
    },
    {
      symbol: '^VIX',
      displaySymbol: 'CBOE VIX',
      name: 'Volatilitäts-Furcht-Index',
      category: 'INDEX',
      price: vixLevel,
      change24h: -0.52,
      changePercent24h: vixChange,
      high24h: 16.8,
      low24h: 15.4,
      sparkline: createSparkline(vixLevel, vixChange),
      status: vixChange <= 0 ? 'UP' : 'DOWN',
      engine: 'SIMULATED_PAPER',
    },
    {
      symbol: '^TNX',
      displaySymbol: 'US 10Y YIELD',
      name: '10-Jahres Staatsanleihe',
      category: 'YIELD',
      price: us10yYield,
      change24h: -0.02,
      changePercent24h: -0.5,
      high24h: 4.01,
      low24h: 3.94,
      sparkline: createSparkline(us10yYield, -0.5),
      status: 'FLAT',
      engine: 'SIMULATED_PAPER',
    },
    {
      symbol: 'XAU/USD',
      displaySymbol: 'GOLD SPOT',
      name: 'Gold Unze (USD)',
      category: 'COMMODITY',
      price: goldPrice,
      change24h: 15.8,
      changePercent24h: goldChange,
      high24h: 2590.0,
      low24h: 2568.0,
      sparkline: createSparkline(goldPrice, goldChange),
      status: goldChange >= 0 ? 'UP' : 'DOWN',
      engine: 'SIMULATED_PAPER',
    },
    {
      symbol: 'CL=F',
      displaySymbol: 'WTI CRUDE',
      name: 'Rohöl Barrel (USD)',
      category: 'COMMODITY',
      price: oilPrice,
      change24h: -0.33,
      changePercent24h: oilChange,
      high24h: 73.6,
      low24h: 72.1,
      sparkline: createSparkline(oilPrice, oilChange),
      status: oilChange >= 0 ? 'UP' : 'DOWN',
      engine: 'SIMULATED_PAPER',
    },
    {
      symbol: 'BTC/USDT',
      displaySymbol: 'BITCOIN',
      name: 'Krypto-Leitwährung',
      category: 'CRYPTO',
      price: btcPrice,
      change24h: 1550.0,
      changePercent24h: btcChange,
      high24h: 65200.0,
      low24h: 63100.0,
      sparkline: createSparkline(btcPrice, btcChange),
      status: btcChange >= 0 ? 'UP' : 'DOWN',
      engine: 'CCXT_CRYPTO',
    },
  ];

  const summary = riskRegime === 'RISK_ON'
    ? 'Gesamtbörsenmarkt im Risk-On Modus: S&P 500 und Nasdaq stabil positiv, VIX unter 18. Günstiges Makro-Klima für Trend- und Momentum-Strategien.'
    : riskRegime === 'VOLATILITY_EXPANSION'
    ? 'Achtung: Volatilitäts-Spike im Gesamtbörsenmarkt (VIX >= 25). Hohe Reibungsgefahr und Flucht in Defensivwerte.'
    : riskRegime === 'RISK_OFF'
    ? 'Gesamtbörsenmarkt im Risk-Off Modus: Leitindizes unter Druck. Restriktive Risikoallokation aktiv.'
    : 'Gesamtbörsenmarkt in neutraler Konsolidierung: Gemischte Sektor-Performance, moderate Volatilität.';

  return {
    timestamp,
    riskRegime,
    sentimentScore,
    vixLevel,
    vixChange,
    sp500Price,
    sp500Change,
    nasdaqChange,
    daxChange,
    us10yYield,
    goldChange,
    oilChange,
    advanceDeclineRatio: 1.65,
    items,
    summary,
  };
}

/**
 * Liefert die weltweiten Marktbewegungen (Top Gewinner, Verlierer, Ungewöhnliches Volumen, 52W-Ausbrüche & 11 Sektoren)
 */
export function fetchGlobalMarketScreenerData(): GlobalMarketScreenerData {
  const timestamp = Date.now();

  const gainers: MarketMover[] = [
    {
      symbol: 'SMCI',
      name: 'Super Micro Computer',
      price: 44.50,
      change24h: 7.02,
      changePercent24h: 18.42,
      volume: '48.2M',
      volumeRatio: 4.2,
      type: 'GAIN',
      assetClass: 'EQUITY',
      sector: 'Information Technology',
      catalyst: 'Hyperscale KI-Server Großauftrag & Vorab-Zahlen',
      sparkline: createSparkline(44.50, 18.42),
    },
    {
      symbol: 'PLTR',
      name: 'Palantir Technologies',
      price: 33.20,
      change24h: 3.75,
      changePercent24h: 12.75,
      volume: '88.5M',
      volumeRatio: 3.8,
      type: 'GAIN',
      assetClass: 'EQUITY',
      sector: 'Defense / Enterprise AI',
      catalyst: 'NATO & US Army AIP Plattformvertrag erweitert',
      sparkline: createSparkline(33.20, 12.75),
    },
    {
      symbol: 'ARM',
      name: 'Arm Holdings plc',
      price: 146.50,
      change24h: 13.80,
      changePercent24h: 10.40,
      volume: '31.4M',
      volumeRatio: 2.7,
      type: 'GAIN',
      assetClass: 'EQUITY',
      sector: 'Semiconductors',
      catalyst: 'v9 Architektur-Lizenzgebühren über Plan',
      sparkline: createSparkline(146.50, 10.40),
    },
    {
      symbol: 'RHM.DE',
      name: 'Rheinmetall AG',
      price: 532.00,
      change24h: 41.20,
      changePercent24h: 8.39,
      volume: '1.2M',
      volumeRatio: 2.5,
      type: 'GAIN',
      assetClass: 'EQUITY',
      sector: 'Defense & Security',
      catalyst: 'Europäischer Artillerie-Munitions-Rahmenvertrag',
      sparkline: createSparkline(532.00, 8.39),
    },
    {
      symbol: 'SUI/USDT',
      name: 'Sui Network',
      price: 1.62,
      change24h: 0.21,
      changePercent24h: 15.20,
      volume: '340M',
      volumeRatio: 3.1,
      type: 'GAIN',
      assetClass: 'CRYPTO',
      sector: 'L1 Blockchain',
      catalyst: 'DeFi TVL All-Time-High & Spot Inflow',
      sparkline: createSparkline(1.62, 15.20),
    },
    {
      symbol: 'TSM',
      name: 'Taiwan Semiconductor',
      price: 178.50,
      change24h: 11.40,
      changePercent24h: 6.82,
      volume: '22.8M',
      volumeRatio: 2.1,
      type: 'GAIN',
      assetClass: 'EQUITY',
      sector: 'Semiconductor Foundry',
      catalyst: '2nm Kapazität für 2025 vollständig ausgebucht',
      sparkline: createSparkline(178.50, 6.82),
    },
  ];

  const losers: MarketMover[] = [
    {
      symbol: 'INTC',
      name: 'Intel Corporation',
      price: 19.80,
      change24h: -1.62,
      changePercent24h: -7.56,
      volume: '95.2M',
      volumeRatio: 3.5,
      type: 'LOSS',
      assetClass: 'EQUITY',
      sector: 'Semiconductors',
      catalyst: 'Foundry-Marge schwächer als Guidance',
      sparkline: createSparkline(19.80, -7.56),
    },
    {
      symbol: 'NVO',
      name: 'Novo Nordisk A/S',
      price: 122.00,
      change24h: -6.95,
      changePercent24h: -5.39,
      volume: '14.2M',
      volumeRatio: 2.2,
      type: 'LOSS',
      assetClass: 'EQUITY',
      sector: 'Health Care / Pharma',
      catalyst: 'Engpässe bei GLP-1 Injektor-Produktionsstätten',
      sparkline: createSparkline(122.00, -5.39),
    },
    {
      symbol: 'BYD',
      name: 'BYD Company',
      price: 30.80,
      change24h: -1.58,
      changePercent24h: -4.88,
      volume: '18.4M',
      volumeRatio: 1.9,
      type: 'LOSS',
      assetClass: 'EQUITY',
      sector: 'Consumer Discretionary / EV',
      catalyst: 'EU-Zollkonflikt belastet Auslandsabsatz',
      sparkline: createSparkline(30.80, -4.88),
    },
    {
      symbol: 'XLE',
      name: 'Energy Select SPDR',
      price: 88.00,
      change24h: -2.10,
      changePercent24h: -2.33,
      volume: '19.8M',
      volumeRatio: 1.8,
      type: 'LOSS',
      assetClass: 'EQUITY',
      sector: 'Energy',
      catalyst: 'Rohöl-Schwäche und Nachfragesorgen',
      sparkline: createSparkline(88.00, -2.33),
    },
  ];

  const unusualVolume: MarketMover[] = [
    {
      symbol: 'TSLA',
      name: 'Tesla Motors Inc',
      price: 244.50,
      change24h: 10.75,
      changePercent24h: 4.60,
      volume: '128.4M',
      volumeRatio: 3.4,
      type: 'UNUSUAL_VOLUME',
      assetClass: 'EQUITY',
      sector: 'Consumer Discretionary',
      catalyst: 'Institutionelle Block-Käufe vor Robotaxi-Event',
      sparkline: createSparkline(244.50, 4.60),
    },
    {
      symbol: 'PLTR',
      name: 'Palantir Technologies',
      price: 33.20,
      change24h: 3.75,
      changePercent24h: 12.75,
      volume: '88.5M',
      volumeRatio: 3.8,
      type: 'UNUSUAL_VOLUME',
      assetClass: 'EQUITY',
      sector: 'Enterprise Software',
      catalyst: 'Extremer Call-Optionen-Inflow über 35$-Strike',
      sparkline: createSparkline(33.20, 12.75),
    },
    {
      symbol: 'AMD',
      name: 'Advanced Micro Devices',
      price: 156.20,
      change24h: 6.30,
      changePercent24h: 4.20,
      volume: '64.2M',
      volumeRatio: 2.8,
      type: 'UNUSUAL_VOLUME',
      assetClass: 'EQUITY',
      sector: 'Semiconductors',
      catalyst: 'Großvolumige Umschichtungen aus Legacy-Chips',
      sparkline: createSparkline(156.20, 4.20),
    },
    {
      symbol: 'GLD',
      name: 'SPDR Gold Shares',
      price: 238.50,
      change24h: 1.65,
      changePercent24h: 0.70,
      volume: '18.5M',
      volumeRatio: 2.6,
      type: 'UNUSUAL_VOLUME',
      assetClass: 'COMMODITY',
      sector: 'Precious Metals',
      catalyst: 'Zentralbank-Nachkäufe und ETF-Zuflüsse',
      sparkline: createSparkline(238.50, 0.70),
    },
  ];

  const breakouts: MarketMover[] = [
    {
      symbol: 'NVDA',
      name: 'Nvidia Corporation',
      price: 126.80,
      change24h: 4.15,
      changePercent24h: 3.38,
      volume: '72.1M',
      volumeRatio: 2.1,
      type: '52W_BREAKOUT',
      assetClass: 'EQUITY',
      sector: 'Information Technology',
      catalyst: 'Re-Test des All-Time-Highs mit hoher Konfluenz',
      sparkline: createSparkline(126.80, 3.38),
    },
    {
      symbol: 'META',
      name: 'Meta Platforms',
      price: 568.20,
      change24h: 15.40,
      changePercent24h: 2.78,
      volume: '18.6M',
      volumeRatio: 2.3,
      type: '52W_BREAKOUT',
      assetClass: 'EQUITY',
      sector: 'Communication Services',
      catalyst: 'Neues Allzeithoch getrieben durch KI-Werbekonversion',
      sparkline: createSparkline(568.20, 2.78),
    },
    {
      symbol: 'RHM.DE',
      name: 'Rheinmetall AG',
      price: 532.00,
      change24h: 41.20,
      changePercent24h: 8.39,
      volume: '1.2M',
      volumeRatio: 2.5,
      type: '52W_BREAKOUT',
      assetClass: 'EQUITY',
      sector: 'Defense',
      catalyst: 'Mehrjahreshoch nach Überschreiten des 520€-Widerstands',
      sparkline: createSparkline(532.00, 8.39),
    },
    {
      symbol: 'GLD',
      name: 'SPDR Gold Shares',
      price: 238.50,
      change24h: 1.65,
      changePercent24h: 0.70,
      volume: '18.5M',
      volumeRatio: 2.6,
      type: '52W_BREAKOUT',
      assetClass: 'COMMODITY',
      sector: 'Commodities',
      catalyst: 'Historisches Rekordhoch bei Gold-Futures',
      sparkline: createSparkline(238.50, 0.70),
    },
  ];

  const sectors: GICSSectorPerformance[] = [
    {
      id: 'tech',
      name: 'Information Technology',
      etfSymbol: 'XLK',
      changePercent24h: 1.42,
      momentum: 'BULLISH',
      leadingStock: 'NVDA, MSFT, AAPL',
      description: 'Halbleiter, Cloud, Software & KI-Infrastruktur führen den Markt an.',
    },
    {
      id: 'comm',
      name: 'Communication Services',
      etfSymbol: 'XLC',
      changePercent24h: 1.15,
      momentum: 'BULLISH',
      leadingStock: 'META, GOOGL, NFLX',
      description: 'Starke Dynamik durch digitale Werbeerlöse und Streaming-Abonnements.',
    },
    {
      id: 'disc',
      name: 'Consumer Discretionary',
      etfSymbol: 'XLY',
      changePercent24h: 0.85,
      momentum: 'BULLISH',
      leadingStock: 'TSLA, AMZN',
      description: 'Zyklischer Konsum profitiert von solider Konsumentenstimmung.',
    },
    {
      id: 'ind',
      name: 'Industrials',
      etfSymbol: 'XLI',
      changePercent24h: 0.45,
      momentum: 'NEUTRAL',
      leadingStock: 'CAT, GE, RHM',
      description: 'Solide Nachfrage nach Investitionsgütern und Verteidigungsmaterial.',
    },
    {
      id: 'fin',
      name: 'Financials',
      etfSymbol: 'XLF',
      changePercent24h: 0.32,
      momentum: 'NEUTRAL',
      leadingStock: 'JPM, BLK, GS',
      description: 'Nettozinsmargen stabil; moderate Kreditwachstumsraten.',
    },
    {
      id: 'health',
      name: 'Health Care',
      etfSymbol: 'XLV',
      changePercent24h: -0.15,
      momentum: 'NEUTRAL',
      leadingStock: 'LLY, UNH, NVO',
      description: 'Selektive Bewegungen; Abkühlung nach starken Vormonaten.',
    },
    {
      id: 'mat',
      name: 'Materials',
      etfSymbol: 'XLB',
      changePercent24h: -0.22,
      momentum: 'NEUTRAL',
      leadingStock: 'LIN, SHW',
      description: 'Chemie und Grundstoffe seitwärts im globalen Industriezyklus.',
    },
    {
      id: 'staples',
      name: 'Consumer Staples',
      etfSymbol: 'XLP',
      changePercent24h: -0.40,
      momentum: 'BEARISH',
      leadingStock: 'PG, KO, WMT',
      description: 'Kapital rotiert aus Defensivtiteln in risikoreichere Wachstumswerte.',
    },
    {
      id: 're',
      name: 'Real Estate',
      etfSymbol: 'XLRE',
      changePercent24h: -0.65,
      momentum: 'BEARISH',
      leadingStock: 'PLD, AMT',
      description: 'Zinssensitiv; moderate Korrektur bei anziehenden Renditen.',
    },
    {
      id: 'energy',
      name: 'Energy',
      etfSymbol: 'XLE',
      changePercent24h: -0.92,
      momentum: 'BEARISH',
      leadingStock: 'XOM, CVX',
      description: 'Ölpreis-Konsolidierung dämpft Explorations- und Raffinerie-Margen.',
    },
    {
      id: 'util',
      name: 'Utilities',
      etfSymbol: 'XLU',
      changePercent24h: -1.10,
      momentum: 'BEARISH',
      leadingStock: 'NEE, SO',
      description: 'Klassische Anleihen-Proxy-Werte unter Druck bei Zinsstabilität.',
    },
  ];

  return {
    timestamp,
    gainers,
    losers,
    unusualVolume,
    breakouts,
    sectors,
  };
}

/**
 * Liefert Zeithorizont-Konfigurationen für Candlestick-Generierung
 */
export function getTimeframeIntervalConfig(timeframe: string = '1h'): { intervalMs: number; count: number; vol: number; trend: number } {
  const tf = timeframe.trim();
  switch (tf) {
    case '1m':
      return { intervalMs: 60 * 1000, count: 100, vol: 0.003, trend: 0.00005 };
    case '15m':
      return { intervalMs: 15 * 60 * 1000, count: 100, vol: 0.007, trend: 0.0001 };
    case '1h':
      return { intervalMs: 3600 * 1000, count: 100, vol: 0.015, trend: 0.0003 };
    case '4h':
      return { intervalMs: 4 * 3600 * 1000, count: 100, vol: 0.022, trend: 0.0005 };
    case '1d':
      return { intervalMs: 24 * 3600 * 1000, count: 90, vol: 0.030, trend: 0.0008 };
    case '1W':
    case '1w':
      return { intervalMs: 7 * 24 * 3600 * 1000, count: 52, vol: 0.040, trend: 0.0012 }; // 52 Wochen
    case '1M':
      return { intervalMs: 30 * 24 * 3600 * 1000, count: 48, vol: 0.055, trend: 0.0020 }; // 48 Monate (4 Jahre)
    case '1Q':
      return { intervalMs: 90 * 24 * 3600 * 1000, count: 40, vol: 0.075, trend: 0.0028 }; // 40 Quartale (10 Jahre)
    case '1Y':
    case '1y':
      return { intervalMs: 7 * 24 * 3600 * 1000, count: 52, vol: 0.038, trend: 0.0015 }; // 1 Jahr via 52 Wochenkerzen
    case '5Y':
    case '5y':
      return { intervalMs: 30 * 24 * 3600 * 1000, count: 60, vol: 0.050, trend: 0.0025 }; // 5 Jahre via 60 Monatskerzen
    case '10Y':
    case '10y':
      return { intervalMs: 30 * 24 * 3600 * 1000, count: 120, vol: 0.060, trend: 0.0030 }; // 10 Jahre via 120 Monatskerzen
    default:
      return { intervalMs: 3600 * 1000, count: 100, vol: 0.015, trend: 0.0003 };
  }
}

/**
 * Lädt oder generiert konsistente Kerzen für jedes weltweite Symbol unter Berücksichtigung des Zeithorizonts
 */
export function loadUniversalCandles(
  symbol: string,
  basePrice: number,
  count: number = 100,
  timeframe: string = '1h'
): Candle[] {
  const config = getTimeframeIntervalConfig(timeframe);
  const candleCount = count || config.count;
  const isCrypto = symbol.includes('USDT') || symbol.includes('BTC') || symbol.includes('ETH');
  const isVix = symbol.includes('VIX');

  const vol = isCrypto ? config.vol * 1.5 : isVix ? 0.045 : config.vol;
  const trend = isVix ? 0.0 : config.trend;

  // Geschätzter Startkurs vor der Drift, damit der Endkurs nahe basePrice liegt
  const expectedReturn = Math.pow(1 + trend, candleCount);
  const estimatedStartPrice = Math.max(1, Number((basePrice / expectedReturn).toFixed(2)));

  return generateRealisticCandles({
    symbol,
    startPrice: estimatedStartPrice,
    count: candleCount,
    intervalMs: config.intervalMs,
    volatility: vol,
    trend,
  });
}

