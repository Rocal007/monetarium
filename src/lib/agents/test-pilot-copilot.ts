import { VirtualExchange } from '../engine/virtual-exchange';
import { PortfolioManager } from '../engine/portfolio-manager';
import { TradingAgentOrchestrator } from './trading-orchestrator';
import { DEFAULT_PROTOCOL_PROFILE } from './protocols/presets';
import { Candle } from '../types/trading';

function generateTrendingCandles(basePrice: number, count: number): Candle[] {
  const candles: Candle[] = [];
  let price = basePrice;
  const now = Date.now() - count * 3600000;

  for (let i = 0; i < count; i++) {
    const change = price * 0.005; // Aufwärtstrend
    const open = price;
    const close = price + change;
    const high = close + price * 0.002;
    const low = open - price * 0.002;
    candles.push({
      timestamp: now + i * 3600000,
      open,
      high,
      low,
      close,
      volume: 100 + i * 5,
    });
    price = close;
  }
  return candles;
}

async function runTests() {
  console.log('=== TEST RUNNER: PILOT & COPILOT BETRIEBSMODI ===\n');

  const pm = new PortfolioManager(10000);
  const vx = new VirtualExchange(pm);
  const orchestrator = new TradingAgentOrchestrator(vx, DEFAULT_PROTOCOL_PROFILE);

  const candles = generateTrendingCandles(60000, 30);
  const lastPrice = candles[candles.length - 1].close;

  // 1. TEST: COPILOT MODUS (Standard: Ich entscheide mit)
  console.log('1. Test: COPILOT-Modus...');
  orchestrator.setOperatingMode('COPILOT');
  if (orchestrator.getOperatingMode() !== 'COPILOT') {
    throw new Error('Fehler: Modus sollte COPILOT sein.');
  }

  const copilotRecord = orchestrator.executeCycle(
    'BTC/USDT',
    lastPrice,
    candles,
    pm.getPortfolio()
  );

  console.log(`   Signal: ${copilotRecord.hypothesis.action} (${copilotRecord.hypothesis.strategyUsed})`);
  console.log(`   Judikative Proof: ${copilotRecord.riskProof.passed ? 'PASSED' : 'REJECTED'}`);
  console.log(`   Execution Status: ${copilotRecord.execution.status}`);

  if (copilotRecord.hypothesis.action !== 'HOLD' && copilotRecord.riskProof.passed) {
    if (copilotRecord.execution.status !== 'PENDING_APPROVAL') {
      throw new Error(`Erwartet: PENDING_APPROVAL im Copilot-Modus, aber erhalten: ${copilotRecord.execution.status}`);
    }
    if (!copilotRecord.execution.proposal) {
      throw new Error('Erwartet: Copilot-Proposal vorhanden');
    }
    if (orchestrator.getPendingProposal() === null) {
      throw new Error('Erwartet: Pending Proposal im Orchestrator gespeichert');
    }

    // Prüfen, dass noch keine Position gebucht wurde (Nutzer hat noch nicht entschieden)
    const positionsBefore = Object.keys(pm.getPortfolio().positions).length;
    if (positionsBefore !== 0) {
      throw new Error('Fehler: Position wurde vor Freigabe gebucht!');
    }
    console.log('   ✓ Keine automatische Order ausgeführt (Wartet auf Freigabe)');

    // Jetzt Bestätigen (Nutzer entscheidet sich für Ausführung)
    console.log('   Freigabe durch Nutzer ausführen (approvePendingProposal)...');
    const approvalDecision = orchestrator.approvePendingProposal(lastPrice);
    if (!approvalDecision || approvalDecision.status !== 'EXECUTED') {
      throw new Error('Fehler bei manueller Freigabe');
    }
    const positionsAfter = Object.keys(pm.getPortfolio().positions).length;
    if (positionsAfter === 0) {
      throw new Error('Fehler: Position wurde nach Freigabe nicht gebucht!');
    }
    console.log(`   ✓ Position erfolgreich nach Nutzer-Entscheidung eingebucht! Menge: ${pm.getPortfolio().positions['BTC/USDT']?.amount}`);
  }
  console.log('✅ Test 1 (COPILOT-Modus mit Mitentscheidung) bestanden.\n');

  // 2. TEST: PILOT MODUS (Vollautomatik: Ich entscheide nicht mit)
  console.log('2. Test: PILOT-Modus...');
  orchestrator.setOperatingMode('PILOT');
  if (orchestrator.getOperatingMode() !== 'PILOT') {
    throw new Error('Fehler: Modus sollte PILOT sein.');
  }

  // Portfolio zurücksetzen für sauberen Test
  pm.reset(10000);
  vx.reset();

  const pilotRecord = orchestrator.executeCycle(
    'BTC/USDT',
    lastPrice,
    candles,
    pm.getPortfolio()
  );

  console.log(`   Signal: ${pilotRecord.hypothesis.action} (${pilotRecord.hypothesis.strategyUsed})`);
  console.log(`   Judikative Proof: ${pilotRecord.riskProof.passed ? 'PASSED' : 'REJECTED'}`);
  console.log(`   Execution Status: ${pilotRecord.execution.status}`);

  if (pilotRecord.hypothesis.action !== 'HOLD' && pilotRecord.riskProof.passed) {
    if (pilotRecord.execution.status !== 'EXECUTED') {
      throw new Error(`Erwartet: EXECUTED im Pilot-Modus, aber erhalten: ${pilotRecord.execution.status}`);
    }
    const pilotPositions = Object.keys(pm.getPortfolio().positions).length;
    if (pilotPositions === 0) {
      throw new Error('Fehler: Position wurde im Pilot-Modus nicht sofort autonom eingebucht!');
    }
    console.log(`   ✓ Order autonom ohne Rückfrage platziert! Holding: ${pm.getPortfolio().positions['BTC/USDT']?.amount}`);
  }
  console.log('✅ Test 2 (PILOT-Modus ohne Mitentscheidung) bestanden.\n');

  // 3. TEST: ABLEHNEN EINES VORSCHLAGS IM COPILOT MODUS
  console.log('3. Test: Ablehnen eines Vorschlags im COPILOT-Modus...');
  pm.reset(10000);
  vx.reset();
  orchestrator.setOperatingMode('COPILOT');

  orchestrator.executeCycle('BTC/USDT', lastPrice, candles, pm.getPortfolio());
  if (orchestrator.getPendingProposal()) {
    console.log('   Vorschlag liegt vor. Nutzer verwirft den Vorschlag (rejectPendingProposal)...');
    orchestrator.rejectPendingProposal('Test: Nicht marktreif');
    if (orchestrator.getPendingProposal() !== null) {
      throw new Error('Fehler: Pending Proposal sollte nach Verwerfen null sein.');
    }
    const rejectedPositions = Object.keys(pm.getPortfolio().positions).length;
    if (rejectedPositions !== 0) {
      throw new Error('Fehler: Es darf keine Position nach Verwerfen existieren!');
    }
    console.log('   ✓ Vorschlag sauber verworfen, Portfolio-Guthaben unberührt.');
  }
  console.log('✅ Test 3 (Verwerfen im Copilot-Modus) bestanden.\n');

  // 4. TEST: AUTOPILOT STAKE-KONFIGURATION (Einsatz einstellen & Start drücken)
  console.log('4. Test: AUTOPILOT STAKE-KONFIGURATION (z.B. 250 € fester Einsatz)...');
  pm.reset(10000);
  vx.reset();
  orchestrator.setOperatingMode('PILOT');
  orchestrator.setAutopilotStakeConfig({ stakeType: 'FIXED_EUR', stakeValue: 250 });

  const stakeRecord = orchestrator.executeCycle('BTC/USDT', lastPrice, candles, pm.getPortfolio());
  if (stakeRecord.hypothesis.action !== 'HOLD' && stakeRecord.riskProof.passed) {
    const allocatedEur = stakeRecord.riskProof.approvedAmount * lastPrice;
    console.log(`   Soll-Einsatz: 250.00 €, Ist-Allokation: ${allocatedEur.toFixed(2)} € (${stakeRecord.riskProof.approvedAmount} BTC)`);
    if (Math.abs(allocatedEur - 250) > 2) {
      throw new Error(`Fehler bei Autopilot Stake: Erwartet ca. 250 €, aber erhalten: ${allocatedEur.toFixed(2)} €`);
    }
    if (stakeRecord.execution.status !== 'EXECUTED') {
      throw new Error(`Erwartet: EXECUTED nach Autopilot Start, aber erhalten: ${stakeRecord.execution.status}`);
    }
    console.log('   ✓ Autopilot hat autonom exakt den eingestellten Einsatz von 250 € platziert!');
  }

  // 4b. Test mit Prozentualem Einsatz (z.B. 5% von 10.000 € = 500 €)
  console.log('   4b: Test mit prozentualem Einsatz (5% von Cash)...');
  pm.reset(10000);
  vx.reset();
  orchestrator.setAutopilotStakeConfig({ stakeType: 'PERCENT_CASH', stakeValue: 5 });
  const percentRecord = orchestrator.executeCycle('BTC/USDT', lastPrice, candles, pm.getPortfolio());
  if (percentRecord.hypothesis.action !== 'HOLD' && percentRecord.riskProof.passed) {
    const allocatedEur = percentRecord.riskProof.approvedAmount * lastPrice;
    console.log(`   Soll-Einsatz: 500.00 € (5%), Ist-Allokation: ${allocatedEur.toFixed(2)} € (${percentRecord.riskProof.approvedAmount} BTC)`);
    if (Math.abs(allocatedEur - 500) > 2) {
      throw new Error(`Fehler bei prozentualem Autopilot Stake: Erwartet ca. 500 €, aber erhalten: ${allocatedEur.toFixed(2)} €`);
    }
    console.log('   ✓ Prozentualer Einsatz (5%) exakt eingehalten!');
  }
  console.log('✅ Test 4 (Autopilot Stake-Einstellung) bestanden.\n');

  console.log('🎉 ALLE PILOT, COPILOT & AUTOPILOT-STAKE INTEGRATIONSTESTS ERFOLGREICH BESTANDEN!');
}

runTests().catch((err) => {
  console.error('❌ Test fehlgeschlagen:', err);
  process.exit(1);
});
