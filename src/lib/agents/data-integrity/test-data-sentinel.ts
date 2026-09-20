import { dataIntegrityAgent } from '../subagents/data-integrity-agent';
import { Candle } from '../../types/trading';

async function runDataSentinelTests() {
  console.log('=== TEST RUNNER: DATA SENTINEL AGENT (D_real Operator) ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${msg}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // Test 1: Invariante 1 — Geometrische Konsistenz & Fehlerhafte Werte
  // -------------------------------------------------------------
  console.log('1. Test: Invariante 1 — Geometrische Inversion & Negative Preise...');
  const corruptCandles: Candle[] = [
    {
      timestamp: 1000,
      open: 100,
      high: 90, // Invertiert: High < Open!
      low: 110, // Invertiert: Low > Open!
      close: 95,
      volume: -5, // Negatives Volumen!
    },
    {
      timestamp: 2000,
      open: 0, // Ungültig: Open = 0
      high: 105,
      low: 95,
      close: -10, // Ungültig: Close negativ
      volume: 100,
    },
  ];

  const result1 = dataIntegrityAgent.validateAndSanitizeCandles(corruptCandles, 'TEST/SYM');
  assert(result1.sanitized.length === 2, 'Anzahl bereinigter Kerzen korrekt erhalten');
  assert(result1.report.anomaliesFound >= 4, `Mindestens 4 Anomalien erkannt (gefunden: ${result1.report.anomaliesFound})`);
  assert(result1.report.anomaliesFixed >= 4, `Alle Anomalien wurden repariert (behoben: ${result1.report.anomaliesFixed})`);
  
  // Geometrie prüfen
  const c0 = result1.sanitized[0];
  assert(c0.high >= Math.max(c0.open, c0.close), `Kerze 0: High (${c0.high}) >= max(O, C)`);
  assert(c0.low <= Math.min(c0.open, c0.close), `Kerze 0: Low (${c0.low}) <= min(O, C)`);
  assert(c0.volume >= 0, `Kerze 0: Volumen (${c0.volume}) >= 0`);

  const c1 = result1.sanitized[1];
  assert(c1.open > 0 && c1.close > 0, `Kerze 1: Nicht-positive Preise korrigiert (O=${c1.open}, C=${c1.close})`);

  // -------------------------------------------------------------
  // Test 2: Invariante 2 — Monotonie & Zeitachsen-Duplikate
  // -------------------------------------------------------------
  console.log('\n2. Test: Invariante 2 — Zeitachsen-Monotonie & Duplikat-Bereinigung...');
  const duplicateCandles: Candle[] = [
    { timestamp: 1000, open: 100, high: 105, low: 95, close: 102, volume: 50 },
    { timestamp: 1000, open: 102, high: 107, low: 98, close: 104, volume: 60 }, // Duplikat!
    { timestamp: 3000, open: 104, high: 108, low: 101, close: 106, volume: 70 },
    { timestamp: 2000, open: 103, high: 106, low: 99, close: 105, volume: 55 }, // Unsortiert!
  ];

  const result2 = dataIntegrityAgent.validateAndSanitizeCandles(duplicateCandles, 'TEST/SYM');
  assert(result2.sanitized.length === 3, 'Duplikate erfolgreich aussortiert (Länge 3)');
  assert(
    result2.sanitized[0].timestamp === 1000 &&
    result2.sanitized[1].timestamp === 2000 &&
    result2.sanitized[2].timestamp === 3000,
    'Zeitstempel strikt monoton steigend sortiert (1000, 2000, 3000)'
  );

  // -------------------------------------------------------------
  // Test 3: Invariante 3 — Bad-Tick & Flash-Spike Filter
  // -------------------------------------------------------------
  console.log('\n3. Test: Invariante 3 — Flash-Crash / Glitch Spike Filterung...');
  const spikeCandles: Candle[] = [
    { timestamp: 1000, open: 100, high: 102, low: 99, close: 100, volume: 100 },
    // Plötzlicher 50% Sprung ohne Volumen (vol = 0)
    { timestamp: 2000, open: 150, high: 155, low: 148, close: 150, volume: 0 },
  ];

  const result3 = dataIntegrityAgent.validateAndSanitizeCandles(spikeCandles, 'TEST/SYM');
  const smoothedClose = result3.sanitized[1].close;
  assert(smoothedClose < 120, `Glitch-Spike gedämpft von 150 auf ${smoothedClose} (< 120)`);
  assert(result3.report.anomalies.some(a => a.type === 'BAD_TICK_SPIKE'), 'BAD_TICK_SPIKE Anomalie erfasst');

  // -------------------------------------------------------------
  // Test 4: Reale Datenabfrage & Verifikations-Pipeline
  // -------------------------------------------------------------
  console.log('\n4. Test: Zentrale Verified-Pipeline (fetchVerifiedSymbolData)...');
  
  // A. Krypto Asset (BTC/USDT)
  const btcData = await dataIntegrityAgent.fetchVerifiedSymbolData('BTC/USDT', '1h', 30);
  assert(btcData.symbol === 'BTC/USDT', 'Symbol BTC/USDT aufgelöst');
  assert(btcData.candles.length > 0, `Kerzen geladen: ${btcData.candles.length}`);
  assert(btcData.currentPrice > 10000, `Realer / Verifizierter BTC Kurs plausibel: ${btcData.currentPrice} €`);
  assert(btcData.validationReport.integrityScore >= 90, `Integritäts-Score hoch: ${btcData.validationReport.integrityScore}%`);
  console.log(`   Verwendete Quelle für BTC/USDT: ${btcData.source} (Latenz: ${btcData.latencyMs}ms)`);

  // B. TradFi Asset (SPY)
  const spyData = await dataIntegrityAgent.fetchVerifiedSymbolData('SPY', '1Hour', 30);
  assert(spyData.symbol === 'SPY', 'Symbol SPY aufgelöst');
  assert(spyData.candles.length > 0, `TradFi Kerzen geladen: ${spyData.candles.length}`);
  assert(spyData.currentPrice > 100, `SPY Kurs plausibel: ${spyData.currentPrice} €`);
  console.log(`   Verwendete Quelle für SPY: ${spyData.source} (Latenz: ${spyData.latencyMs}ms)`);

  // -------------------------------------------------------------
  // Test 5: Provider-Health & Telemetrie
  // -------------------------------------------------------------
  console.log('\n5. Test: Telemetrie & Health-State...');
  const telemetry = await dataIntegrityAgent.pingAllProviders();
  assert(telemetry.status !== undefined, `Status definiert: ${telemetry.status}`);
  assert(telemetry.avgLatencyMs >= 0, `Ø Latenz gemessen: ${telemetry.avgLatencyMs}ms`);
  assert(Object.keys(telemetry.providers).length === 5, 'Alle 5 Datenquellen in Telemetrie vorhanden');
  assert(telemetry.recentAuditLog.length > 0, 'Audit-Log führt Ereignisse');

  console.log('\n=============================================================');
  console.log(`ERGEBNIS: ${passed} Tests bestanden, ${failed} Fehler.`);
  if (failed === 0) {
    console.log('🎉 DATA SENTINEL AGENT ARBEITET 100% FEHLERFREI & REGELKONFORM!');
  } else {
    process.exit(1);
  }
}

runDataSentinelTests().catch((err) => {
  console.error('Fataler Testfehler:', err);
  process.exit(1);
});
