import { getSharedSQLiteStore } from '../lib/storage/sqlite-state-store';
import { PortfolioManager } from '../lib/engine/portfolio-manager';
import { VirtualExchange } from '../lib/engine/virtual-exchange';
import { generateOmniMarketPlan, executeOmniMarketBasket } from '../lib/engine/omni-market-allocator';

async function runOmniMarketInvestment() {
  console.log('================================================================');
  console.log('🏛️  MONETARIUM — OMNI-MARKET & SEKTOR-FLOTTEN INVESTMENT ENGINE');
  console.log('    Gesamtbörsenmarkt-Mandat & 5 Branchen-Subagenten');
  console.log('================================================================\n');

  const store = getSharedSQLiteStore();
  let currentPortfolio = store.loadPortfolio();

  if (!currentPortfolio || currentPortfolio.cash < 5000) {
    console.log('Initialisiere sauberes Startportfolio mit 10.000 €...');
    store.resetState(10000);
    currentPortfolio = store.loadPortfolio()!;
  }

  console.log(`Vorhandenes virtuelles Guthaben: ${currentPortfolio.cash.toFixed(2)} € (Equity: ${currentPortfolio.equity.toFixed(2)} €)`);

  const portfolioManager = new PortfolioManager(currentPortfolio);
  const virtualExchange = new VirtualExchange(portfolioManager);

  // 80% des Kapitals investieren, 20% als taktischen Cash-Puffer halten
  const plan = generateOmniMarketPlan({
    availableCash: currentPortfolio.cash,
    targetBudgetPercent: 80,
  });

  console.log(`\nZielbudget: ${plan.totalBudget.toLocaleString('de-DE')} € (Cash-Puffer: ${plan.cashReserve.toLocaleString('de-DE')} €)`);
  console.log(`Allokierte Positionen: ${plan.items.length} Assets über alle Weltmärkte & Sektoren:\n`);

  for (const item of plan.items) {
    console.log(`  • [${item.sector || item.category}] ${item.symbol.padEnd(10)} (${item.weightPercent}%): ${item.allocatedEur.toFixed(0)} € -> ${item.amount} @ ${item.price.toFixed(2)} € | ${item.rationale}`);
  }

  console.log('\nFühre Orders in der Börsen-Engine aus...');
  const result = executeOmniMarketBasket(plan, virtualExchange);

  const updatedPortfolio = portfolioManager.getPortfolio();
  result.portfolioCashRemaining = updatedPortfolio.cash;
  result.portfolioEquity = updatedPortfolio.equity;

  // Speichere Zustand in SQLite
  store.savePortfolio(updatedPortfolio);

  console.log('\n================================================================');
  console.log(`✅ AUSFÜHRUNG ERFOLGREICH: ${result.executedOrders.length} ORDERS PLATZIERT`);
  console.log('================================================================');
  console.log(`Gesamt investiert:      ${result.totalInvested.toFixed(2)} €`);
  console.log(`Geschätzte Gebühren:    ${result.totalFees.toFixed(2)} €`);
  console.log(`Verbleibender Cash:     ${updatedPortfolio.cash.toFixed(2)} €`);
  console.log(`Gesamt-Portfoliowert:   ${updatedPortfolio.equity.toFixed(2)} €`);
  console.log(`Aktive Positionen:      ${Object.keys(updatedPortfolio.positions).length}`);
  console.log('================================================================\n');

  console.log('Übersicht der eingebuchten Positionen:');
  for (const [sym, pos] of Object.entries(updatedPortfolio.positions)) {
    console.log(`  ✓ ${sym.padEnd(10)}: ${pos.amount.toString().padStart(8)} Stk. | Einstand: ${pos.entryPrice.toFixed(2)} € | Wert: ${(pos.amount * pos.currentPrice).toFixed(2)} €`);
  }
}

runOmniMarketInvestment().catch(console.error);
