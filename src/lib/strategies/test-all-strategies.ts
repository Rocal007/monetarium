import { getAllStrategies, getStrategyExecutor, getStrategyMetadata } from './strategy-registry';
import { generateRealisticCandles } from '../data/mock-feed';
import { PortfolioManager } from '../engine/portfolio-manager';
import { BacktestHygieneEngine } from '../backtesting/hygiene-engine';
import { StrategyType } from '../types/trading';

console.log('=== TEST RUNNER: 15 KLASSISCHE & INSTITUTIONELLE TRADE-ALGORITHMEN ===\n');

// 1. Registry Vollständigkeit prüfen
const allStrategies = getAllStrategies();
console.log(`1. Prüfe Strategy Registry: ${allStrategies.length} Algorithmen registriert.`);
if (allStrategies.length !== 15) {
  throw new Error(`Fehler: Erwartet 15 Strategien, gefunden: ${allStrategies.length}`);
}

const expectedIds: StrategyType[] = [
  'GRID',
  'DCA',
  'MOMENTUM',
  'TURTLE',
  'SUPERTREND',
  'ORB',
  'BOLLINGER_REVERSION',
  'RSI_CONNORS',
  'PAIRS_TRADING',
  'COLLAR_CYLINDER',
  'STRADDLE',
  'TWAP',
  'VWAP',
  'CPPI',
  'SEARCH_ATTENTION_MOMENTUM',
];

for (const id of expectedIds) {
  const meta = getStrategyMetadata(id);
  const executor = getStrategyExecutor(id);
  if (!meta || !executor) {
    throw new Error(`Fehlende Registrierung für ${id}`);
  }
  console.log(`   ✓ [${meta.category.padEnd(14)}] ${meta.id.padEnd(19)}: ${meta.name} (${meta.badge})`);
}
console.log('✅ Alle 14 Algorithmen erfolgreich in der Registry verifiziert.\n');

// 2. Testdaten generieren
const testCandles = generateRealisticCandles({
  symbol: 'BTC/USDT',
  startPrice: 60000,
  count: 120,
  volatility: 0.015,
  trend: 0.0004,
});

console.log('2. Teste Ausführung jedes Algorithmus auf Test-Kerzen:');
for (const id of expectedIds) {
  const executor = getStrategyExecutor(id);
  const meta = getStrategyMetadata(id);
  const pm = new PortfolioManager(10000);

  let signalsGenerated = 0;

  for (let i = 25; i < testCandles.length; i++) {
    const history = testCandles.slice(0, i + 1);
    const candle = testCandles[i];
    const signal = executor(candle, i, history, pm, meta.defaultParams);

    if (signal && signal.action !== 'HOLD') {
      signalsGenerated++;
      // Simuliere einfachen Kauf zur Positionshaltung
      if (signal.action === 'BUY') {
        const cost = 1000;
        const amount = cost / candle.close;
        try {
          pm.executeBuy('BTC/USDT', candle.close, amount, 1, `test-order-${i}`);
        } catch {
          // Cash-Erschöpfung ignorieren
        }
      } else if (signal.action === 'SELL') {
        const pos = pm.getPortfolio().positions['BTC/USDT'];
        if (pos && pos.amount > 0) {
          try {
            pm.executeSell('BTC/USDT', candle.close, pos.amount, 1, `test-order-${i}`);
          } catch {
            // Ignorieren
          }
        }
      }
    }
  }

  console.log(`   ✓ ${id.padEnd(19)} -> ${signalsGenerated} Signale generiert (Kauf/Verkauf/Exit).`);
}
console.log('✅ Alle 14 Algorithmen reagieren fehlerfrei auf Live-Kerzenticks.\n');

// 3. Backtesting-Hygiene Test auf ausgewählten neuen Algorithmen
console.log('3. Teste BacktestHygieneEngine für neue Kern-Strategien:');

const testBacktestList: StrategyType[] = [
  'TURTLE',
  'SUPERTREND',
  'BOLLINGER_REVERSION',
  'COLLAR_CYLINDER',
  'CPPI',
  'VWAP',
];

for (const stratId of testBacktestList) {
  const executor = getStrategyExecutor(stratId);
  const meta = getStrategyMetadata(stratId);

  const res = BacktestHygieneEngine.runBacktest(
    testCandles,
    {
      symbol: 'BTC/USDT',
      strategyName: stratId,
      initialCapital: 10000,
      inSampleRatio: 0.7,
      feeRate: 0.001,
      slippageRate: 0.0005,
      params: meta.defaultParams,
    },
    executor
  );

  console.log(
    `   ✓ ${stratId.padEnd(19)} | In-Sample Return: ${res.inSampleMetrics.totalReturnPercent}% | Out-of-Sample Return: ${res.outOfSampleMetrics.totalReturnPercent}% | Trades: ${res.trades.length} | Overfitting: [${res.overfittingVerdict}]`
  );
}

console.log('\n🎉 ALLE 14 KLASSISCHEN UND INSTITUTIONELLEN ALGORITHMEN ERFOLGREICH GETESTET!\n');
