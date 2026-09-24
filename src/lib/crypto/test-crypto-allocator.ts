import { PortfolioManager } from '../engine/portfolio-manager';
import { VirtualExchange } from '../engine/virtual-exchange';
import { 
  CRYPTO_STRATEGIES, 
  generateCryptoBasketPlan, 
  executeCryptoBasket,
  evaluateAutonomousCryptoDecision
} from './crypto-allocator';
import { CryptoStrategyProfile } from '../types/crypto-allocator';

function testCryptoAllocator() {
  console.log('=== TEST: Krypto Allokations- und Auto-Invest-Engine ===\n');

  const strategies: CryptoStrategyProfile[] = [
    'CORE_BLUECHIP',
    'SMART_MOMENTUM',
    'ATTENTION_ALPHA',
    'DIP_ACCUMULATOR',
  ];

  const initialCash = 10000;
  const testBudget = 2500;

  for (const strat of strategies) {
    console.log(`\n--- Prüfe Strategie: ${strat} (${CRYPTO_STRATEGIES[strat].name}) ---`);
    const plan = generateCryptoBasketPlan({
      budget: testBudget,
      availableCash: initialCash,
      strategy: strat,
    });

    console.log(`Budget: ${plan.totalBudget} €, Allokiert: ${plan.totalAllocated} €, Gebühren: ~${plan.totalFees} €`);
    console.log(`Ausführbar: ${plan.isExecutable ? 'JA' : 'NEIN'}`);

    if (!plan.isExecutable) {
      throw new Error(`Plan für ${strat} sollte ausführbar sein! Fehler: ${plan.validationError}`);
    }

    const totalWeight = plan.allocations.reduce((acc, cur) => acc + cur.weightPercent, 0);
    console.log(`Summe der Gewichte: ${totalWeight}%`);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error(`Gewichtssumme ungleich 100% für ${strat}: ${totalWeight}%`);
    }

    for (const item of plan.allocations) {
      console.log(`  > ${item.symbol} (${item.weightPercent}%): ${item.allocatedEur} € -> ${item.amount} Tokens @ ${item.price} € [Score: ${item.confluenceScore}] - ${item.rationale}`);
      if (item.amount <= 0) {
        throw new Error(`Ungültige Menge für ${item.symbol}: ${item.amount}`);
      }
    }
  }

  // Teste reale Ausführung in VirtualExchange
  console.log('\n--- Prüfe reale Order-Ausführung im Portfolio ---');
  const portfolioManager = new PortfolioManager(initialCash);
  const virtualExchange = new VirtualExchange(portfolioManager);

  const testPlan = generateCryptoBasketPlan({
    budget: 2000,
    availableCash: portfolioManager.getPortfolio().cash,
    strategy: 'SMART_MOMENTUM',
  });

  const execResult = executeCryptoBasket(testPlan, virtualExchange);
  console.log(`Ausführung erfolgreich: ${execResult.success}`);
  console.log(`Investiert: ${execResult.totalInvested} €, Gebühren: ${execResult.totalFees} €`);
  console.log(`Ausgeführte Orders: ${execResult.executedOrders.length}`);

  for (const ord of execResult.executedOrders) {
    console.log(`  Order: ${ord.orderId} | Symbol: ${ord.symbol} | Menge: ${ord.amount} | Kurs: ${ord.price} € | Status: ${ord.status}`);
  }

  const updatedPf = portfolioManager.getPortfolio();
  console.log(`Verbleibendes Bargeld: ${updatedPf.cash.toFixed(2)} € (Start: ${initialCash} €)`);
  console.log(`Positionen im Portfolio:`, Object.keys(updatedPf.positions));

  if (!execResult.success) {
    throw new Error('Order-Ausführung fehlgeschlagen!');
  }
  if (updatedPf.cash >= initialCash) {
    throw new Error('Bargeld wurde nicht ordnungsgemäß abgezogen!');
  }
  if (Object.keys(updatedPf.positions).length !== testPlan.allocations.length) {
    throw new Error('Nicht alle Positionen im Portfolio eröffnet!');
  }

  // Teste Vollautonome KI-Entscheidung (keine Nutzer-Auswahl nötig)
  console.log('\n--- Prüfe VOLLAUTONOME KI-Entscheidung (Keine Nutzerauswahl nötig) ---');
  const autonomousDecision = evaluateAutonomousCryptoDecision({
    availableCash: initialCash,
    vixPrice: 15.2,
    macroRegime: 'RISK_ON',
  });

  console.log(`Autonom gewähltes Regime: ${autonomousDecision.assessment.marketRegime}`);
  console.log(`Autonom gewählte Strategie: ${autonomousDecision.assessment.selectedStrategy}`);
  console.log(`Begründung der KI: ${autonomousDecision.assessment.rationale}`);
  console.log(`Autonom allokiertes Budget: ${autonomousDecision.plan.totalBudget} € (${autonomousDecision.assessment.recommendedBudgetPercent}% Cash)`);
  console.log(`Ausgewählte Tokens (${autonomousDecision.plan.allocations.length}):`);
  for (const it of autonomousDecision.plan.allocations) {
    console.log(`   - ${it.symbol} (${it.weightPercent}%): ${it.allocatedEur} € -> ${it.amount} Tokens`);
  }

  if (autonomousDecision.plan.allocations.length === 0) {
    throw new Error('Autonome Entscheidung hat keine Tokens ausgewählt!');
  }

  console.log('\n✅ ALLE TESTS ERFOLGREICH BESTANDEN!');
}

testCryptoAllocator();
