import { StrategyExecutor } from '../backtesting/hygiene-engine';
import { StrategyCategory, StrategyMetadata, StrategyType } from '../types/trading';
import { executeDcaStrategy } from './dca-strategy';
import { executeGridStrategy } from './grid-strategy';
import { executeMomentumStrategy } from './momentum-strategy';
import { executeTurtleStrategy } from './turtle-strategy';
import { executeSupertrendStrategy } from './supertrend-strategy';
import { executeOrbStrategy } from './orb-strategy';
import { executeBollingerStrategy } from './bollinger-strategy';
import { executeRsiConnorsStrategy } from './rsi-connors-strategy';
import { executePairsTradingStrategy } from './pairs-strategy';
import { executeCollarCylinderStrategy } from './collar-strategy';
import { executeStraddleStrategy } from './straddle-strategy';
import { executeTwapStrategy, executeVwapStrategy } from './execution-twap-vwap';
import { executeCppiStrategy } from './cppi-strategy';
import { executeSearchAttentionStrategy, SEARCH_ATTENTION_METADATA } from './search-attention-strategy';

export interface StrategyRegistryEntry {
  metadata: StrategyMetadata;
  executor: StrategyExecutor;
}

export const STRATEGY_REGISTRY: Record<StrategyType, StrategyRegistryEntry> = {
  // 1. Trend & Momentum
  MOMENTUM: {
    metadata: {
      id: 'MOMENTUM',
      name: 'EMA Momentum Breakout',
      category: 'TREND',
      badge: 'Golden Cross',
      description: 'Trendfolge-System basierend auf schnellem und langsamem EMA mit RSI-Dynamikfilter.',
      formula: 'EMA(9) > EMA(21) ∧ RSI ∈ [35, 70]',
      defaultParams: { fastEma: 9, slowEma: 21, rsiOverbought: 70 },
      paramDefs: [
        { key: 'fastEma', label: 'Fast EMA', defaultValue: 9, min: 3, max: 50 },
        { key: 'slowEma', label: 'Slow EMA', defaultValue: 21, min: 10, max: 200 },
        { key: 'rsiOverbought', label: 'RSI Filter Max', defaultValue: 70, min: 50, max: 90 },
      ],
    },
    executor: executeMomentumStrategy,
  },
  TURTLE: {
    metadata: {
      id: 'TURTLE',
      name: 'Turtle Donchian Breakout',
      category: 'TREND',
      badge: 'Turtle System 1',
      description: 'Klassisches Richard Dennis Ausbruchssystem: Kauf bei 20-Kerzen-Hoch, Ausstieg bei 10-Kerzen-Tief oder 2x ATR.',
      formula: 'Close > Max(High, 20) | Exit < Min(Low, 10)',
      defaultParams: { entryPeriod: 20, exitPeriod: 10, atrPeriod: 14 },
      paramDefs: [
        { key: 'entryPeriod', label: 'Entry Period (Bars)', defaultValue: 20, min: 5, max: 100 },
        { key: 'exitPeriod', label: 'Exit Period (Bars)', defaultValue: 10, min: 3, max: 50 },
        { key: 'atrPeriod', label: 'ATR Period', defaultValue: 14, min: 5, max: 30 },
      ],
    },
    executor: executeTurtleStrategy,
  },
  SUPERTREND: {
    metadata: {
      id: 'SUPERTREND',
      name: 'SuperTrend Dynamic Volatility',
      category: 'TREND',
      badge: 'ATR Trailing',
      description: 'Robuster Trendfolge-Algorithmus, der Volatilitätsbänder um den Medianpreis spannt und Phasenwechsel anzeigt.',
      formula: 'Median ± (Multiplier × ATR)',
      defaultParams: { atrPeriod: 10, multiplier: 3.0 },
      paramDefs: [
        { key: 'atrPeriod', label: 'ATR Period', defaultValue: 10, min: 5, max: 50 },
        { key: 'multiplier', label: 'ATR Multiplier', defaultValue: 3.0, min: 1.0, max: 6.0, step: 0.1 },
      ],
    },
    executor: executeSupertrendStrategy,
  },
  ORB: {
    metadata: {
      id: 'ORB',
      name: 'Opening Range Breakout (ORB)',
      category: 'TREND',
      badge: 'Session Open',
      description: 'Institutioneller Intraday-Ausbruchsalgorithmus aus der Eröffnungsspanne der ersten N Kerzen.',
      formula: 'Close > High(OpeningRange) × (1 + Buffer)',
      defaultParams: { rangeBars: 15, bufferPercent: 0.1 },
      paramDefs: [
        { key: 'rangeBars', label: 'Opening Bars', defaultValue: 15, min: 5, max: 60 },
        { key: 'bufferPercent', label: 'Buffer (%)', defaultValue: 0.1, min: 0.0, max: 1.0, step: 0.05 },
      ],
    },
    executor: executeOrbStrategy,
  },

  // 2. Mean Reversion & Arbitrage
  GRID: {
    metadata: {
      id: 'GRID',
      name: 'Mean-Reversion Grid Bot',
      category: 'MEAN_REVERSION',
      badge: 'Pionex Gitter',
      description: 'Symmetrisches Gitter-Handelssystem zur Ernte von Volatilität in Seitwärtsmärkten.',
      formula: 'ΔG = (Upper - Lower) / N',
      defaultParams: { lowerBound: 55000, upperBound: 72000, gridCount: 12 },
      paramDefs: [
        { key: 'lowerBound', label: 'Untere Grenze (€)', defaultValue: 55000, min: 1000 },
        { key: 'upperBound', label: 'Obere Grenze (€)', defaultValue: 72000, min: 2000 },
        { key: 'gridCount', label: 'Gitterlinien', defaultValue: 12, min: 4, max: 50 },
      ],
    },
    executor: executeGridStrategy,
  },
  BOLLINGER_REVERSION: {
    metadata: {
      id: 'BOLLINGER_REVERSION',
      name: 'Bollinger Z-Score Reversion',
      category: 'MEAN_REVERSION',
      badge: '2-Sigma Rebound',
      description: 'Statistischer Reversions-Algorithmus: Kauft bei Überdehnung unter das 2-Sigma-Band und schließt am Mittelwert.',
      formula: 'Z = (Price - SMA) / σ ≤ -2.0',
      defaultParams: { period: 20, stdDev: 2.0 },
      paramDefs: [
        { key: 'period', label: 'SMA Period', defaultValue: 20, min: 10, max: 100 },
        { key: 'stdDev', label: 'Sigma Multiplier', defaultValue: 2.0, min: 1.0, max: 3.5, step: 0.1 },
      ],
    },
    executor: executeBollingerStrategy,
  },
  RSI_CONNORS: {
    metadata: {
      id: 'RSI_CONNORS',
      name: 'Larry Connors RSI-2',
      category: 'MEAN_REVERSION',
      badge: 'Flash Rebound',
      description: 'Ultraschneller Reversal-Algorithmus im Aufwärtstrend: Kauft extreme 2-Kerzen-Überverkäufe (RSI < 10).',
      formula: 'Close > SMA(50) ∧ RSI(2) < 10',
      defaultParams: { trendSma: 50, exitSma: 5, oversoldThreshold: 10, overboughtThreshold: 85 },
      paramDefs: [
        { key: 'trendSma', label: 'Trend SMA', defaultValue: 50, min: 20, max: 200 },
        { key: 'exitSma', label: 'Exit SMA', defaultValue: 5, min: 2, max: 20 },
        { key: 'oversoldThreshold', label: 'RSI(2) Oversold', defaultValue: 10, min: 2, max: 25 },
      ],
    },
    executor: executeRsiConnorsStrategy,
  },
  PAIRS_TRADING: {
    metadata: {
      id: 'PAIRS_TRADING',
      name: 'Statistische Arbitrage (Pairs)',
      category: 'MEAN_REVERSION',
      badge: 'Marktneutral',
      description: 'Marktneutraler Spread-Trading-Algorithmus: Handelt statistische Konvergenzen kointegrierter Preisanomalien.',
      formula: 'Spread = P_A - β P_B | Z ≤ -2.0',
      defaultParams: { lookbackPeriod: 30, entryZScore: 2.0 },
      paramDefs: [
        { key: 'lookbackPeriod', label: 'Lookback (Bars)', defaultValue: 30, min: 15, max: 100 },
        { key: 'entryZScore', label: 'Entry Z-Score', defaultValue: 2.0, min: 1.0, max: 3.5, step: 0.1 },
      ],
    },
    executor: executePairsTradingStrategy,
  },
  DCA: {
    metadata: {
      id: 'DCA',
      name: 'Dollar-Cost Averaging (DCA)',
      category: 'MEAN_REVERSION',
      badge: 'Intervall-Akkumulation',
      description: 'Kontinuierlicher Bestandsaufbau in festen Zeitintervallen mit Trailing-Take-Profit.',
      formula: 'Akkumulation alle N Kerzen + Take-Profit Target',
      defaultParams: { intervalBars: 10, takeProfitPercent: 4.5 },
      paramDefs: [
        { key: 'intervalBars', label: 'Kauf-Intervall (Bars)', defaultValue: 10, min: 1, max: 50 },
        { key: 'takeProfitPercent', label: 'Take Profit (%)', defaultValue: 4.5, min: 1.0, max: 20.0, step: 0.5 },
      ],
    },
    executor: executeDcaStrategy,
  },

  // 3. Optionen & Derivate
  COLLAR_CYLINDER: {
    metadata: {
      id: 'COLLAR_CYLINDER',
      name: 'Zylinder-Option (Collar / Fence)',
      category: 'OPTIONS',
      badge: 'Zero-Cost Collar',
      description: 'Synthetische Zylinder-Option: Long Asset + gekaufter Put-Floor (-5%) finanziert durch verkauften Call-Cap (+12%).',
      formula: 'Long S + Long Put(K_floor) + Short Call(K_cap)',
      defaultParams: { floorPercent: 5.0, capPercent: 12.0, rebalanceBars: 20 },
      paramDefs: [
        { key: 'floorPercent', label: 'Put Floor / Max Loss (%)', defaultValue: 5.0, min: 2.0, max: 15.0, step: 0.5 },
        { key: 'capPercent', label: 'Call Cap / Max Profit (%)', defaultValue: 12.0, min: 5.0, max: 30.0, step: 1.0 },
        { key: 'rebalanceBars', label: 'Laufzeit / Roll-Over (Bars)', defaultValue: 20, min: 5, max: 60 },
      ],
    },
    executor: executeCollarCylinderStrategy,
  },
  STRADDLE: {
    metadata: {
      id: 'STRADDLE',
      name: 'Long Straddle Volatility Breakout',
      category: 'OPTIONS',
      badge: 'News-Spike Delta',
      description: 'Volatilitäts-Algorithmus: Kauft synthetisch Call & Put vor High-Impact News (NFP/CPI) und profitiert von massiven Ausbrüchen.',
      formula: 'Long Call(K) + Long Put(K) | ΔPrice > 1.8 × ATR',
      defaultParams: { atrPeriod: 14, breakoutThreshold: 1.8, targetProfitAtr: 3.5 },
      paramDefs: [
        { key: 'atrPeriod', label: 'ATR Period', defaultValue: 14, min: 5, max: 30 },
        { key: 'breakoutThreshold', label: 'Ausbruchs-Schwelle (x ATR)', defaultValue: 1.8, min: 1.0, max: 4.0, step: 0.1 },
        { key: 'targetProfitAtr', label: 'Zielgewinn (x ATR)', defaultValue: 3.5, min: 2.0, max: 8.0, step: 0.5 },
      ],
    },
    executor: executeStraddleStrategy,
  },

  // 4. Execution & Portfolioschutz
  TWAP: {
    metadata: {
      id: 'TWAP',
      name: 'TWAP Execution Slicing',
      category: 'EXECUTION_RISK',
      badge: 'Time-Weighted',
      description: 'Institutionelles Order-Slicing: Teilt das Volumen in zeitgleiche Tranchen zur Vermeidung von Markteinfluss.',
      formula: 'OrderSize / N_slices über Zeitfenster T',
      defaultParams: { sliceInterval: 5, maxSlices: 4, takeProfitPercent: 3.5 },
      paramDefs: [
        { key: 'sliceInterval', label: 'Tranchen-Intervall (Bars)', defaultValue: 5, min: 2, max: 20 },
        { key: 'maxSlices', label: 'Max. Tranchen', defaultValue: 4, min: 2, max: 10 },
        { key: 'takeProfitPercent', label: 'Zielgewinn (%)', defaultValue: 3.5, min: 1.0, max: 15.0, step: 0.5 },
      ],
    },
    executor: executeTwapStrategy,
  },
  VWAP: {
    metadata: {
      id: 'VWAP',
      name: 'VWAP Value & Execution Strategy',
      category: 'EXECUTION_RISK',
      badge: 'Volume-Weighted',
      description: 'Volumengewichteter Ausführungs- und Value-Algorithmus: Kauft mit Rabatt unter dem VWAP und nimmt Profit bei Expansion.',
      formula: 'VWAP = Σ(Price × Volume) / Σ(Volume)',
      defaultParams: { windowBars: 24, discountPercent: 0.8, premiumPercent: 1.5 },
      paramDefs: [
        { key: 'windowBars', label: 'VWAP Fenster (Bars)', defaultValue: 24, min: 10, max: 100 },
        { key: 'discountPercent', label: 'Kauf-Rabatt (%)', defaultValue: 0.8, min: 0.2, max: 3.0, step: 0.1 },
        { key: 'premiumPercent', label: 'Verkaufs-Aufschlag (%)', defaultValue: 1.5, min: 0.5, max: 5.0, step: 0.1 },
      ],
    },
    executor: executeVwapStrategy,
  },
  CPPI: {
    metadata: {
      id: 'CPPI',
      name: 'CPPI Dynamic Portfolio Insurance',
      category: 'EXECUTION_RISK',
      badge: 'Kapitalschutz-Floor',
      description: 'Constant Proportion Portfolio Insurance: Garantiert mathematisch ein Mindestkapitalniveau und skaliert den Hebel am Puffer (Cushion).',
      formula: 'Exposure = Multiplier × (Equity - Floor)',
      defaultParams: { floorPercent: 85, multiplier: 2.5 },
      paramDefs: [
        { key: 'floorPercent', label: 'Garantie-Boden / Floor (%)', defaultValue: 85, min: 70, max: 95 },
        { key: 'multiplier', label: 'Hebel-Multiplikator m', defaultValue: 2.5, min: 1.0, max: 5.0, step: 0.1 },
      ],
    },
    executor: executeCppiStrategy,
  },
  SEARCH_ATTENTION_MOMENTUM: {
    metadata: SEARCH_ATTENTION_METADATA,
    executor: executeSearchAttentionStrategy,
  },
};

export function getStrategyExecutor(type: StrategyType): StrategyExecutor {
  return STRATEGY_REGISTRY[type]?.executor ?? STRATEGY_REGISTRY.MOMENTUM.executor;
}

export function getStrategyMetadata(type: StrategyType): StrategyMetadata {
  return STRATEGY_REGISTRY[type]?.metadata ?? STRATEGY_REGISTRY.MOMENTUM.metadata;
}

export function getAllStrategies(): StrategyMetadata[] {
  return Object.values(STRATEGY_REGISTRY).map((entry) => entry.metadata);
}

export function getStrategiesByCategory(category: StrategyCategory): StrategyMetadata[] {
  return getAllStrategies().filter((s) => s.category === category);
}
