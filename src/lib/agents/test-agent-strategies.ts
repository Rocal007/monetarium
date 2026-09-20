import { AlphaStrategyAgent } from './subagents/alpha-strategy-agent';
import { MarketRegime, PerceptionState } from './protocols/types';
import { PortfolioManager } from '../engine/portfolio-manager';
import { VirtualExchange } from '../engine/virtual-exchange';
import { TradingAgentOrchestrator } from './trading-orchestrator';
import { SECTOR_PROFILES } from './sectors/sector-fleet';
import { PROTOCOL_PRESETS } from './protocols/presets';
import { Candle } from '../types/trading';

console.log('=== TEST RUNNER: AGENT-INTEGRATION DER 14 STRATEGIEN ===\n');

const pm = new PortfolioManager(10000);
const ex = new VirtualExchange(pm);
const orchestrator = new TradingAgentOrchestrator(ex);

const basePerception: PerceptionState = {
  timestamp: Date.now(),
  regime: 'BULL_TREND',
  rsi: 55,
  emaFast: 65000,
  emaSlow: 63000,
  atr: 800,
  atrPercent: 1.2,
  trendStrength: 75,
  summary: 'Starker Aufwärtstrend über allen gleitenden Durchschnitten.',
};

// 1. Test: Bull-Trend Hypothesen mit Turtle & SuperTrend
console.log('1. Test: AlphaStrategyAgent im BULL_TREND...');
const turtleHyp = AlphaStrategyAgent.evaluate(
  'BTC/USDT',
  65200,
  basePerception,
  pm.getPortfolio(),
  {
    minConfluenceScore: 60,
    allowedStrategies: ['TURTLE_BREAKOUT'],
    targetRiskRewardRatio: 2.2,
    stopLossAtrMultiplier: 1.8,
    takeProfitAtrMultiplier: 4.0,
  }
);
console.log(`   Strategie: ${turtleHyp.strategyUsed} | Aktion: ${turtleHyp.action} | Confluence: ${turtleHyp.confluenceScore}%`);
console.log(`   Rationale: ${turtleHyp.rationale}`);
if (turtleHyp.strategyUsed !== 'TURTLE_BREAKOUT' || turtleHyp.action !== 'BUY') {
  throw new Error('Test 1 fehlgeschlagen: Turtle Breakout nicht ausgelöst!');
}
console.log('✅ Test 1 (BULL_TREND -> Turtle Breakout) bestanden.\n');

// 2. Test: Range-Bound Hypothese mit Bollinger Z-Score & Zylinder-Option
console.log('2. Test: AlphaStrategyAgent im RANGE_BOUND...');
const rangePerception: PerceptionState = {
  ...basePerception,
  regime: 'RANGE_BOUND',
  rsi: 38,
  trendStrength: 20,
};

const bollingerHyp = AlphaStrategyAgent.evaluate(
  'BTC/USDT',
  62000,
  rangePerception,
  pm.getPortfolio(),
  {
    minConfluenceScore: 60,
    allowedStrategies: ['BOLLINGER_ZSCORE'],
    targetRiskRewardRatio: 2.0,
    stopLossAtrMultiplier: 1.5,
    takeProfitAtrMultiplier: 3.0,
  }
);
console.log(`   Strategie: ${bollingerHyp.strategyUsed} | Aktion: ${bollingerHyp.action} | Confluence: ${bollingerHyp.confluenceScore}%`);
if (bollingerHyp.strategyUsed !== 'BOLLINGER_ZSCORE' || bollingerHyp.action !== 'BUY') {
  throw new Error('Test 2 fehlgeschlagen: Bollinger Z-Score nicht ausgelöst!');
}

const collarHyp = AlphaStrategyAgent.evaluate(
  'BTC/USDT',
  62000,
  rangePerception,
  pm.getPortfolio(),
  {
    minConfluenceScore: 60,
    allowedStrategies: ['COLLAR_CYLINDER'],
    targetRiskRewardRatio: 2.0,
    stopLossAtrMultiplier: 1.5,
    takeProfitAtrMultiplier: 3.0,
  }
);
console.log(`   Strategie: ${collarHyp.strategyUsed} | Aktion: ${collarHyp.action} | SL: ${collarHyp.suggestedStopLoss} | TP: ${collarHyp.suggestedTakeProfit}`);
if (collarHyp.strategyUsed !== 'COLLAR_CYLINDER' || collarHyp.action !== 'BUY') {
  throw new Error('Test 2 fehlgeschlagen: Zylinder-Option nicht ausgelöst!');
}
console.log('✅ Test 2 (RANGE_BOUND -> Bollinger & Zylinder-Collar) bestanden.\n');

// 3. Test: High Volatility mit Long Straddle
console.log('3. Test: AlphaStrategyAgent in HIGH_VOLATILITY...');
const highVolPerception: PerceptionState = {
  ...basePerception,
  regime: 'HIGH_VOLATILITY',
  atr: 2500,
  atrPercent: 4.0,
};

const straddleHyp = AlphaStrategyAgent.evaluate(
  'BTC/USDT',
  63000,
  highVolPerception,
  pm.getPortfolio(),
  {
    minConfluenceScore: 60,
    allowedStrategies: ['STRADDLE_VOLATILITY'],
    targetRiskRewardRatio: 2.0,
    stopLossAtrMultiplier: 1.5,
    takeProfitAtrMultiplier: 3.0,
  }
);
console.log(`   Strategie: ${straddleHyp.strategyUsed} | Aktion: ${straddleHyp.action} | Confluence: ${straddleHyp.confluenceScore}%`);
if (straddleHyp.strategyUsed !== 'STRADDLE_VOLATILITY' || straddleHyp.action !== 'BUY') {
  throw new Error('Test 3 fehlgeschlagen: Straddle Volatility nicht ausgelöst!');
}
console.log('✅ Test 3 (HIGH_VOLATILITY -> Straddle Breakout) bestanden.\n');

// 4. Test: Konsolidierung mit CPPI & TWAP
console.log('4. Test: AlphaStrategyAgent in CONSOLIDATION...');
const consolPerception: PerceptionState = {
  ...basePerception,
  regime: 'CONSOLIDATION',
  trendStrength: 15,
};

const cppiHyp = AlphaStrategyAgent.evaluate(
  'BTC/USDT',
  61000,
  consolPerception,
  pm.getPortfolio(),
  {
    minConfluenceScore: 60,
    allowedStrategies: ['CPPI_CAPITAL_FLOOR'],
    targetRiskRewardRatio: 2.0,
    stopLossAtrMultiplier: 1.5,
    takeProfitAtrMultiplier: 3.0,
  }
);
console.log(`   Strategie: ${cppiHyp.strategyUsed} | Aktion: ${cppiHyp.action} | Confluence: ${cppiHyp.confluenceScore}%`);
if (cppiHyp.strategyUsed !== 'CPPI_CAPITAL_FLOOR' || cppiHyp.action !== 'BUY') {
  throw new Error('Test 4 fehlgeschlagen: CPPI Capital Floor nicht ausgelöst!');
}
console.log('✅ Test 4 (CONSOLIDATION -> CPPI Floor) bestanden.\n');

// 5. Test: Vollständiger TradingAgentOrchestrator Zyklus über alle 5 Sektor-Profile
console.log('5. Test: TradingAgentOrchestrator Zyklus für alle 5 Sektor-Bots...');
const mockCandles: Candle[] = [
  { timestamp: Date.now() - 7200000, open: 62000, high: 62500, low: 61800, close: 62400, volume: 100 },
  { timestamp: Date.now() - 3600000, open: 62400, high: 63200, low: 62200, close: 63000, volume: 140 },
  { timestamp: Date.now(), open: 63000, high: 64100, low: 62900, close: 63800, volume: 180 },
];

const sectorKeys = Object.keys(SECTOR_PROFILES) as (keyof typeof SECTOR_PROFILES)[];
for (const sectorKey of sectorKeys) {
  const profile = SECTOR_PROFILES[sectorKey];
  orchestrator.setProfile(profile);

  const cycle = orchestrator.executeCycle(
    'BTC/USDT',
    63800,
    mockCandles,
    pm.getPortfolio()
  );

  console.log(
    `   ✓ Sektor: ${profile.name.padEnd(26)} | Strategie: ${cycle.hypothesis.strategyUsed.padEnd(20)} | Aktion: ${cycle.hypothesis.action.padEnd(4)} | Risk Passed: ${cycle.riskProof.passed}`
  );
}

console.log('\n🎉 ALLE MULTI-AGENTEN INTEGRATIONSTESTS ERFOLGREICH BESTANDEN!\n');
