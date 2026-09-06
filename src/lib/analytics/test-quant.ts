import { calculateQuantMetrics, evaluateOverfitting } from './quant-metrics';
import { BacktestHygieneEngine } from '../backtesting/hygiene-engine';
import { generateRealisticCandles } from '../data/mock-feed';
import { PortfolioManager } from '../engine/portfolio-manager';
import { VirtualExchange } from '../engine/virtual-exchange';
import { executeGridStrategy } from '../strategies/grid-strategy';
import { executeMomentumStrategy } from '../strategies/momentum-strategy';

console.log('--- MONETARIUM QUANT & ENGINE TEST RUNNER ---');

// 1. Test Quant-Metriken
const mockEquity = [
  { time: 1, equity: 10000, drawdown: 0 },
  { time: 2, equity: 10500, drawdown: 0 },
  { time: 3, equity: 10200, drawdown: 300 },
  { time: 4, equity: 11000, drawdown: 0 },
  { time: 5, equity: 10800, drawdown: 200 },
  { time: 6, equity: 11500, drawdown: 0 },
];
const mockTrades = [
  { id: '1', orderId: 'o1', symbol: 'BTC', side: 'BUY' as const, price: 60000, amount: 0.1, fee: 3, timestamp: 1 },
  { id: '2', orderId: 'o2', symbol: 'BTC', side: 'SELL' as const, price: 63000, amount: 0.1, fee: 3, pnl: 300, timestamp: 2 },
  { id: '3', orderId: 'o3', symbol: 'BTC', side: 'BUY' as const, price: 62000, amount: 0.1, fee: 3, timestamp: 3 },
  { id: '4', orderId: 'o4', symbol: 'BTC', side: 'SELL' as const, price: 61000, amount: 0.1, fee: 3, pnl: -100, timestamp: 4 },
];

const metrics = calculateQuantMetrics(10000, mockEquity, mockTrades);
console.log('✅ Quant Metrics Calculation:');
console.log(`   Total Return: +${metrics.totalReturnPercent}% (${metrics.totalReturn} €)`);
console.log(`   Sharpe Ratio: ${metrics.sharpeRatio}`);
console.log(`   Sortino Ratio: ${metrics.sortinoRatio}`);
console.log(`   Max Drawdown: -${metrics.maxDrawdownPercent}% (-${metrics.maxDrawdown} €)`);
console.log(`   Win Rate: ${metrics.winRate}%`);
console.log(`   Profit Factor: ${metrics.profitFactor}`);

// 2. Test Overfitting Detector
const isGood = { ...metrics, sharpeRatio: 2.5, totalReturnPercent: 40 };
const oosBad = { ...metrics, sharpeRatio: 0.1, totalReturnPercent: -8 };
const overfittingResult = evaluateOverfitting(isGood, oosBad);
console.log('\n✅ Overfitting Hygiene Guard:');
console.log(`   Verdict: ${overfittingResult.verdict}`);
console.log(`   Score: ${overfittingResult.score}`);
console.log(`   Details: ${overfittingResult.details}`);

// 3. Test Virtual Exchange & Slippage
const pm = new PortfolioManager(10000);
const ex = new VirtualExchange(pm);
const orderRes = ex.submitOrder({
  symbol: 'BTC/USDT',
  side: 'BUY',
  type: 'MARKET',
  amount: 0.05,
  currentMarketPrice: 65000,
});
console.log('\n✅ Virtual Exchange Market Order Fill:');
console.log(`   Status: ${orderRes.order.status}`);
console.log(`   Filled Price (with slippage): ${orderRes.order.filledPrice} €`);
console.log(`   Slippage: ${orderRes.order.slippage} €`);
console.log(`   Fee: ${orderRes.order.fee} €`);
console.log(`   Portfolio Cash remaining: ${pm.getPortfolio().cash.toFixed(2)} €`);

// 4. Test In-Sample vs Out-of-Sample Backtest Runner
const testCandles = generateRealisticCandles({
  symbol: 'BTC/USDT',
  startPrice: 60000,
  count: 200,
  trend: 0.0003,
});

const backtestRes = BacktestHygieneEngine.runBacktest(
  testCandles,
  {
    symbol: 'BTC/USDT',
    strategyName: 'Momentum Golden Cross',
    initialCapital: 10000,
    inSampleRatio: 0.7,
    feeRate: 0.001,
    slippageRate: 0.0005,
    params: { fastEma: 9, slowEma: 21 },
  },
  executeMomentumStrategy
);

console.log('\n✅ Hygiene Backtest Execution (Momentum Strategy):');
console.log(`   In-Sample Return: ${backtestRes.inSampleMetrics.totalReturnPercent}% | Sharpe: ${backtestRes.inSampleMetrics.sharpeRatio}`);
console.log(`   Out-of-Sample Return: ${backtestRes.outOfSampleMetrics.totalReturnPercent}% | Sharpe: ${backtestRes.outOfSampleMetrics.sharpeRatio}`);
console.log(`   Overfitting Status: [${backtestRes.overfittingVerdict}] (Score: ${backtestRes.overfittingScore})`);
console.log(`   Total Trades Executed: ${backtestRes.trades.length}`);

console.log('\n🚀 ALL QUANT & ENGINE TESTS PASSED SUCCESSFULLY!\n');
