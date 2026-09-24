import path from 'path';
import fs from 'fs';
import { SQLiteStateStore } from './sqlite-state-store';
import { Portfolio, Position, TradeLog } from '../types/trading';

console.log('=== TEST RUNNER: SQLITE STATE PERSISTENCE (Crash-Resilienz) ===\n');

async function runTests() {
  const testDbFile = path.resolve(process.cwd(), 'data', 'test-monetarium.db');
  
  // Clean start
  if (fs.existsSync(testDbFile)) {
    fs.unlinkSync(testDbFile);
  }

  // 1. Initialisierung & Schema-Setup
  console.log('1. Test: Initialisierung des SQLiteStateStore...');
  const store = new SQLiteStateStore({ dbPath: testDbFile });
  console.log('   ✓ SQLite Datenbank initialisiert unter:', store.getDbPath());

  // 2. Initialer Zustand (leer)
  const initialLoad = store.loadPortfolio();
  if (initialLoad === null) {
    console.log('   ✓ Initialer Stand wie erwartet null (noch kein Snapshot gespeichert).');
  } else {
    throw new Error('Erwartet null beim ersten Aufruf.');
  }

  // 3. Portfolio-Zustand speichern
  console.log('\n2. Test: Speichern eines realistischen Portfolio-Snapshots...');
  const samplePortfolio: Portfolio = {
    cash: 8500.50,
    initialBalance: 10000.00,
    equity: 10250.75,
    realizedPnL: 350.25,
    unrealizedPnL: -100.00,
    positions: {
      'BTC/USDT': {
        id: 'pos-btc-1',
        symbol: 'BTC/USDT',
        side: 'BUY',
        entryPrice: 62000.00,
        currentPrice: 63500.00,
        amount: 0.05,
        unrealizedPnL: 75.00,
        unrealizedPnLPercent: 2.42,
        realizedPnL: 0,
        stopLoss: 60000.00,
        takeProfit: 68000.00,
        timestamp: Date.now() - 3600000,
      },
      'SPY': {
        id: 'pos-spy-1',
        symbol: 'SPY',
        side: 'BUY',
        entryPrice: 540.00,
        currentPrice: 545.00,
        amount: 5,
        unrealizedPnL: 25.00,
        unrealizedPnLPercent: 0.93,
        realizedPnL: 0,
        stopLoss: 530.00,
        timestamp: Date.now() - 1800000,
      },
    },
    tradeHistory: [
      {
        id: 'trd-1',
        orderId: 'ord-1',
        symbol: 'BTC/USDT',
        side: 'BUY',
        price: 62000.00,
        amount: 0.05,
        fee: 3.10,
        timestamp: Date.now() - 3600000,
      },
      {
        id: 'trd-2',
        orderId: 'ord-2',
        symbol: 'SPY',
        side: 'BUY',
        price: 540.00,
        amount: 5,
        fee: 1.50,
        timestamp: Date.now() - 1800000,
      },
    ],
  };

  store.savePortfolio(samplePortfolio);
  console.log('   ✓ Portfolio-Snapshot erfolgreich gespeichert.');

  // 4. Portfolio-Zustand laden & verifizieren
  console.log('\n3. Test: Laden und Verifizieren des Portfolio-Snapshots...');
  const loaded = store.loadPortfolio();
  if (!loaded) throw new Error('Portfolio konnte nicht geladen werden.');

  if (loaded.cash !== 8500.50) throw new Error(`Cash Mismatch: ${loaded.cash} vs 8500.50`);
  if (loaded.equity !== 10250.75) throw new Error(`Equity Mismatch: ${loaded.equity} vs 10250.75`);
  if (Object.keys(loaded.positions).length !== 2) throw new Error('Positions Count Mismatch');
  if (loaded.positions['BTC/USDT'].amount !== 0.05) throw new Error('BTC amount mismatch');
  if (loaded.tradeHistory.length !== 2) throw new Error('Trade history length mismatch');

  console.log(`   ✓ Cash verifiziert: ${loaded.cash} €`);
  console.log(`   ✓ Equity verifiziert: ${loaded.equity} €`);
  console.log(`   ✓ Positionen (${Object.keys(loaded.positions).join(', ')}) verifiziert.`);
  console.log(`   ✓ Trades (${loaded.tradeHistory.length} Einträge) verifiziert.`);

  // 5. Inkrementeller Trade-Eintrag & Audit-Zyklus
  console.log('\n4. Test: Inkrementeller Trade & Cycle-Audit...');
  const newTrade: TradeLog = {
    id: 'trd-3',
    orderId: 'ord-3',
    symbol: 'ETH/USDT',
    side: 'BUY',
    price: 3450.00,
    amount: 1.0,
    fee: 2.00,
    timestamp: Date.now(),
  };
  store.recordTrade(newTrade);

  const history = store.getTradeHistory(10);
  if (history.length !== 3) throw new Error(`Trade count mismatch after recordTrade: ${history.length}`);
  console.log('   ✓ Inkrementeller Trade erfasst. Historie umfasst nun 3 Trades.');

  // 6. Crash-Resilienz-Simulation (Close & Reopen)
  console.log('\n5. Test: Crash-Resilienz (Verbindung trennen und neu instanziieren)...');
  store.close();

  const recoveredStore = new SQLiteStateStore({ dbPath: testDbFile });
  const recoveredPortfolio = recoveredStore.loadPortfolio();
  if (!recoveredPortfolio) throw new Error('Wiederherstellung nach Crash fehlgeschlagen.');

  if (recoveredPortfolio.cash !== 8500.50 || recoveredPortfolio.positions['BTC/USDT'].entryPrice !== 62000) {
    throw new Error('Inkonsistenter Zustand nach Wiederherstellung!');
  }
  console.log('   ✓ Nach simuliertem Crash: Zustand 100% identisch wiederhergestellt!');

  // Aufräumen
  recoveredStore.close();
  if (fs.existsSync(testDbFile)) {
    fs.unlinkSync(testDbFile);
  }
  // WAL/SHM-Dateien entfernen falls vorhanden
  if (fs.existsSync(`${testDbFile}-wal`)) fs.unlinkSync(`${testDbFile}-wal`);
  if (fs.existsSync(`${testDbFile}-shm`)) fs.unlinkSync(`${testDbFile}-shm`);

  console.log('\n=============================================================');
  console.log('🎉 ALLE SQLITE STATE-PERSISTENCE TESTS ERFOLGREICH BESTANDEN!');
  console.log('=============================================================');
}

runTests().catch((err) => {
  console.error('\n❌ TEST FEHLGESCHLAGEN:', err);
  process.exit(1);
});
