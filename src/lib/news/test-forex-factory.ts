import { ForexFactoryClient } from './forex-factory-client';
import { TradingAgentOrchestrator } from '../agents/trading-orchestrator';
import { PortfolioManager } from '../engine/portfolio-manager';
import { VirtualExchange } from '../engine/virtual-exchange';
import { Candle } from '../types/trading';

async function runTests() {
  console.log('=== FOREX FACTORY DATA SOURCE TEST RUNNER ===\n');

  const client = new ForexFactoryClient();

  // Test 1: Live Fetch von Fair Economy CDN
  console.log('1. Test: Live Fetch vom Fair Economy CDN...');
  const start = Date.now();
  const calendar = await client.fetchCalendar();
  const elapsed = Date.now() - start;

  console.log(`   Status: Geladen in ${elapsed}ms`);
  console.log(`   Events gesamt: ${calendar.events.length}`);
  console.log(`   High Impact Events: ${calendar.highImpactCount}`);
  console.log(`   Medium Impact Events: ${calendar.mediumImpactCount}`);
  console.log(`   Low Impact Events: ${calendar.lowImpactCount}`);
  console.log(`   Nächstes High Impact Event: ${calendar.nextHighImpactEvent ? calendar.nextHighImpactEvent.title : 'Keines'}`);
  console.log(`   Cached: ${calendar.cached}`);

  if (calendar.events.length === 0) {
    throw new Error('Test 1 fehlgeschlagen: Keine Events geladen!');
  }
  console.log('✅ Test 1 erfolgreich.\n');

  // Test 2: In-Memory Caching Prüfung
  console.log('2. Test: In-Memory Cache (TTL: 60s)...');
  const cachedCall = await client.fetchCalendar();
  console.log(`   Cached Flag: ${cachedCall.cached}`);
  if (!cachedCall.cached) {
    throw new Error('Test 2 fehlgeschlagen: Cache wurde nicht wiederverwendet!');
  }
  console.log('✅ Test 2 erfolgreich.\n');

  // Test 3: Filterung nach High-Impact & USD
  console.log('3. Test: Filterung nach High-Impact und Währung USD...');
  const usdHigh = await client.fetchCalendar({ minImpact: 'High', country: 'USD' });
  console.log(`   Gefilterte Events: ${usdHigh.events.length}`);
  for (const ev of usdHigh.events.slice(0, 3)) {
    console.log(`   - [${ev.country}] ${ev.title} (${ev.impact}) Forecast: ${ev.forecast || '-'} Prev: ${ev.previous || '-'}`);
    if (ev.impact !== 'High' || ev.country !== 'USD') {
      throw new Error(`Filter-Verletzung: ${JSON.stringify(ev)}`);
    }
  }
  console.log('✅ Test 3 erfolgreich.\n');

  // Test 4: Konvertierung in MacroSentimentState
  console.log('4. Test: Konvertierung in Monetarium MacroSentimentState...');
  const macroState = client.convertToMacroSentimentState(calendar);
  console.log(`   Provider: ${macroState.activeProvider}`);
  console.log(`   Overall Sentiment: ${macroState.overallSentiment}`);
  console.log(`   Sentiment Score: ${macroState.sentimentScore}`);
  console.log(`   Blackout aktiv: ${macroState.isBlackoutActive}`);
  console.log(`   Generierte Artikel/Items: ${macroState.articles.length}`);
  if (macroState.articles.length === 0) {
    throw new Error('Test 4 fehlgeschlagen: Keine Artikel generiert!');
  }
  console.log('✅ Test 4 erfolgreich.\n');

  // Test 5: Judikativer Blackout Circuit Breaker Test
  console.log('5. Test: Judikative Notbremse im TradingAgentOrchestrator...');
  const simulatedBlackoutState = {
    ...macroState,
    isBlackoutActive: true,
    blackoutReason: '🔴 HIGH-IMPACT NEWS IN 8 MIN: [USD] FOMC Rate Decision',
  };

  const pm = new PortfolioManager(10000);
  const ex = new VirtualExchange(pm);
  const orchestrator = new TradingAgentOrchestrator(ex);

  const sampleCandles: Candle[] = [
    { timestamp: Date.now() - 3600000, open: 60000, high: 60500, low: 59900, close: 60400, volume: 100 },
    { timestamp: Date.now(), open: 60400, high: 61000, low: 60300, close: 60800, volume: 150 },
  ];

  const cycleRecord = orchestrator.executeCycle(
    'BTC/USDT',
    60800,
    sampleCandles,
    pm.getPortfolio(),
    simulatedBlackoutState
  );

  console.log(`   Risk Proof Passed: ${cycleRecord.riskProof.passed}`);
  console.log(`   Circuit Breaker Active: ${cycleRecord.riskProof.circuitBreakerActive}`);
  console.log(`   Veto Grund: ${cycleRecord.riskProof.vetoReason}`);

  if (cycleRecord.riskProof.passed) {
    throw new Error('Test 5 fehlgeschlagen: Risikobeweis hätte abgelehnt werden müssen!');
  }
  if (!cycleRecord.riskProof.circuitBreakerActive) {
    throw new Error('Test 5 fehlgeschlagen: Circuit Breaker hätte auslösen müssen!');
  }
  console.log('✅ Test 5 erfolgreich (Judikative Notbremse greift zuverlässig).\n');

  console.log('🎉 ALLE 5 FOREX FACTORY INTEGRATIONSTESTS ERFOLGREICH BESTANDEN!\n');
}

runTests().catch((err) => {
  console.error('❌ Test-Fehler:', err);
  process.exit(1);
});
