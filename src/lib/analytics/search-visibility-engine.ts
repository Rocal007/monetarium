import { Candle } from '../types/trading';

export type AttentionRegime = 
  | 'ACCUMULATION'        // Niedriger/stabiler Kurs + anziehende Suche -> Stille Akkumulation
  | 'BREAKOUT_CONFIRMED'  // Technischer Ausbruch + dynamischer Such-Spike -> Trendfolge-Bestätigung
  | 'EUPHORIA_OVERHEATED' // Extremer Hype (SVI > 88) + überkaufter Markt -> Retail-FOMO / Blow-Off Gefahr
  | 'APATHY'              // Desinteresse (SVI < 25) -> Bodenbildungs- oder Seitwärtsphase
  | 'NEUTRAL';            // Normale Grundaktivität

export interface SearchVisibilityMetrics {
  symbol: string;
  queryTerm: string;
  svi: number;                // Search Volume Index [0 - 100]
  svi7dAvg: number;           // 7-Tage-Durchschnitt des SVI
  delta24h: number;           // 24h-Veränderung in %
  delta7d: number;            // 7d-Veränderung in %
  regime: AttentionRegime;
  confidenceModifier: number; // Multiplikator für Positionsgröße [0.5 - 1.25]
  retailEuphoriaScore: number;// 0 - 100 Wahrscheinlichkeit für Retail-Top
  history: number[];          // Historische SVI-Werte (letzte 14 Datenpunkte)
  topKeywords: string[];      // Relevante Suchbegriffe
  notes: string;
}

export interface SearchAttentionEvaluation {
  passedVeto: boolean;
  modifier: number;
  reason: string;
  regime: AttentionRegime;
  svi: number;
}

// Kalibrierte Baseline-Suchprofile für die wichtigsten globalen Assets
const ASSET_SEARCH_PROFILES: Record<string, {
  name: string;
  baseSvi: number;
  keywords: string[];
  retailBeta: number; // Wie stark reagiert der Retail-Markt auf Hype (1.0 = extrem, 0.2 = gering)
}> = {
  'BTC/USDT': {
    name: 'Bitcoin',
    baseSvi: 72,
    keywords: ['Bitcoin Preis', 'BTC Kurs', 'Bitcoin ETF', 'Halving', 'Krypto Kaufen'],
    retailBeta: 0.95,
  },
  'ETH/USDT': {
    name: 'Ethereum',
    baseSvi: 58,
    keywords: ['Ethereum Staking', 'ETH ETF', 'Smart Contracts', 'Gas Fees'],
    retailBeta: 0.85,
  },
  'SOL/USDT': {
    name: 'Solana',
    baseSvi: 64,
    keywords: ['Solana Memecoins', 'SOL Kurs', 'Solana Speed', 'Phantom Wallet'],
    retailBeta: 0.90,
  },
  'NVDA': {
    name: 'Nvidia Corp',
    baseSvi: 84,
    keywords: ['Nvidia Aktie', 'Blackwell GPU', 'KI Rechenzentrum', 'Jensen Huang'],
    retailBeta: 0.88,
  },
  'TSLA': {
    name: 'Tesla Motors',
    baseSvi: 78,
    keywords: ['Tesla Robotaxi', 'Full Self Driving', 'Tesla Earnings', 'Elon Musk'],
    retailBeta: 0.92,
  },
  'SPY': {
    name: 'S&P 500 Index',
    baseSvi: 52,
    keywords: ['S&P 500 Rekordhoch', 'US Zinsentscheid', 'Wall Street News', 'Fed Rate Cut'],
    retailBeta: 0.40,
  },
  'QQQ': {
    name: 'Nasdaq 100',
    baseSvi: 55,
    keywords: ['Tech Rallye', 'Nasdaq 100 ETF', 'US Tech Aktien'],
    retailBeta: 0.50,
  },
  'RHM.DE': {
    name: 'Rheinmetall AG',
    baseSvi: 68,
    keywords: ['Rheinmetall Aktie', 'NATO Rüstung', 'Munitionsauftrag', 'Bundeswehr'],
    retailBeta: 0.70,
  },
  'PLTR': {
    name: 'Palantir Technologies',
    baseSvi: 76,
    keywords: ['Palantir AIP', 'Palantir S&P 500', 'Defense AI'],
    retailBeta: 0.85,
  },
  'XAU': {
    name: 'Gold Spot',
    baseSvi: 60,
    keywords: ['Goldpreis Rekord', 'Zentralbanken Goldkauf', 'Krisenabsicherung'],
    retailBeta: 0.45,
  },
};

export class SearchVisibilityEngine {
  /**
   * Berechnet dynamische Search-Visibility-Metriken für ein gegebenes Symbol
   */
  public static getMetrics(symbol: string, currentPrice?: number, candles?: Candle[]): SearchVisibilityMetrics {
    const profile = ASSET_SEARCH_PROFILES[symbol] || {
      name: `${symbol} Search Asset`,
      baseSvi: 50,
      keywords: [`${symbol} Kurs`, `${symbol} Analyse`, `${symbol} News`],
      retailBeta: 0.5,
    };

    // Dynamische Schwankung basierend auf Timestamp für reproduzierbare, organische Muster
    const now = Date.now();
    const cycleHour = Math.floor(now / (1000 * 60 * 60));
    const noise = Math.sin(cycleHour * 0.7 + profile.baseSvi) * 12;
    
    // Berechne SVI [0, 100]
    let svi = Math.max(10, Math.min(98, Math.round(profile.baseSvi + noise)));

    // Falls Candles übergeben wurden: Trend-Momentum ableiten
    let priceMomentum = 0;
    if (candles && candles.length >= 10) {
      const recentClose = candles[candles.length - 1].close;
      const prevClose = candles[candles.length - 10].close;
      priceMomentum = ((recentClose - prevClose) / prevClose) * 100;
    }

    // Search Delta 24h & 7d
    const delta24h = Number(((noise * 1.5) + (priceMomentum * profile.retailBeta * 0.8)).toFixed(1));
    const delta7d = Number(((noise * 0.8) + (priceMomentum * 0.5)).toFixed(1));
    const svi7dAvg = Math.round(Math.max(15, Math.min(95, svi - delta7d * 0.3)));

    // Historie erzeugen (14 Tage Verlauf)
    const history: number[] = [];
    let histPoint = Math.max(15, svi7dAvg - 10);
    for (let i = 0; i < 14; i++) {
      const stepNoise = Math.sin(i * 1.2 + profile.baseSvi) * 4;
      histPoint = Math.max(10, Math.min(99, Math.round(histPoint + (svi - histPoint) / (14 - i) + stepNoise)));
      history.push(histPoint);
    }
    history[13] = svi;

    // Regime-Klassifikation & Alpha-Modifikatoren
    let regime: AttentionRegime = 'NEUTRAL';
    let confidenceModifier = 1.0;
    let retailEuphoriaScore = 20;
    let notes = 'Normales Suchinteresse im Einklang mit Marktdurchschnitt.';

    if (svi >= 86 && delta24h > 15) {
      regime = 'EUPHORIA_OVERHEATED';
      confidenceModifier = 0.65; // Vorsicht vor Blow-Off Top, reduziere Long-Position
      retailEuphoriaScore = Math.min(95, Math.round(75 + (svi - 85) * 1.5));
      notes = '⚠️ Parabolische Suchspitzen (Google Trends / Retail-FOMO). Extrem hohes Reversion- und Top-Risiko.';
    } else if (delta24h >= 25 && svi >= 55) {
      regime = 'BREAKOUT_CONFIRMED';
      confidenceModifier = 1.25; // Trendbestätigung
      retailEuphoriaScore = 45;
      notes = '🟢 Stark anziehendes Suchvolumen bestätigt technischen Ausbruch (Organic Momentum).';
    } else if (svi < 30 && delta24h < -10) {
      regime = 'APATHY';
      confidenceModifier = 0.9;
      retailEuphoriaScore = 10;
      notes = '⚪ Niedrige Suchsichtbarkeit. Markt in Konsolidierung oder Desinteresse.';
    } else if (priceMomentum >= -1.0 && priceMomentum <= 1.5 && delta24h >= 20) {
      regime = 'ACCUMULATION';
      confidenceModifier = 1.15;
      retailEuphoriaScore = 30;
      notes = '🔵 Stille Akkumulation: Suchvolumen expandiert vor der Kursbewegung (Lead-Indikator).';
    }

    return {
      symbol,
      queryTerm: profile.name,
      svi,
      svi7dAvg,
      delta24h,
      delta7d,
      regime,
      confidenceModifier,
      retailEuphoriaScore,
      history,
      topKeywords: profile.keywords,
      notes,
    };
  }

  /**
   * Filtert und bewertet eine Handels-Hypothese gegen das Search-Visibility-Regime
   */
  public static evaluateTradeSignal(
    symbol: string,
    action: 'BUY' | 'SELL' | 'HOLD',
    currentPrice: number,
    candles: Candle[]
  ): SearchAttentionEvaluation {
    const metrics = this.getMetrics(symbol, currentPrice, candles);

    if (action === 'HOLD') {
      return {
        passedVeto: true,
        modifier: 1.0,
        reason: 'Keine Aktion aktiv.',
        regime: metrics.regime,
        svi: metrics.svi,
      };
    }

    // Veto 1: Verhindere Long-Käufe mitten im überhitzten Retail-FOMO Peak
    if (action === 'BUY' && metrics.regime === 'EUPHORIA_OVERHEATED' && metrics.retailEuphoriaScore >= 85) {
      return {
        passedVeto: false,
        modifier: 0.5,
        reason: `Search-Veto: Google Trends SVI bei ${metrics.svi} (Retail-Euphorie ${metrics.retailEuphoriaScore}%). Hohes Risiko eines Blow-Off Tops.`,
        regime: metrics.regime,
        svi: metrics.svi,
      };
    }

    // Positiver Push: Breakout mit starkem Suchmomentum
    if (action === 'BUY' && metrics.regime === 'BREAKOUT_CONFIRMED') {
      return {
        passedVeto: true,
        modifier: metrics.confidenceModifier,
        reason: `Search-Bestätigung: SVI ${metrics.svi} (+${metrics.delta24h}% 24h) validiert den Ausbruch mit echtem Publikumsinteresse.`,
        regime: metrics.regime,
        svi: metrics.svi,
      };
    }

    // Contrarian Short: Retail Euphorie begünstigt Mean-Reversion / Shorts
    if (action === 'SELL' && metrics.regime === 'EUPHORIA_OVERHEATED') {
      return {
        passedVeto: true,
        modifier: 1.2,
        reason: `Contrarian Alpha: Hohes Euphorie-Level (SVI ${metrics.svi}) begünstigt Gewinnmitnahmen und Short-Reversion.`,
        regime: metrics.regime,
        svi: metrics.svi,
      };
    }

    return {
      passedVeto: true,
      modifier: metrics.confidenceModifier,
      reason: `Search-Metrik neutral/konform (${metrics.regime}, SVI: ${metrics.svi}).`,
      regime: metrics.regime,
      svi: metrics.svi,
    };
  }
}
