#!/usr/bin/env tsx
/**
 * MONETARIUM — Autonomer 24/7 Headless Trading Daemon
 *
 * Läuft vollständig unabhängig vom Browser direkt auf dem Server / Linux-Host.
 * Steuert den atomaren NEXUS-Trading-Zyklus: T = C ∘ P_J ∘ D_L ∘ F
 *
 * Ausführung:
 *   npm run daemon -- --dry-run
 *   npm run daemon -- --exchange=binance --symbol=BTC/USDT --profile=CAPITAL_SHIELD
 */

import fs from 'fs';
import path from 'path';
import { CCXTConnector } from '../lib/engines/ccxt-connector';
import { AlpacaConnector } from '../lib/engines/alpaca-connector';
import { PortfolioManager } from '../lib/engine/portfolio-manager';
import { VirtualExchange } from '../lib/engine/virtual-exchange';
import {
  IOrderExecutor,
  VirtualOrderExecutor,
  CCXTOrderExecutor,
  AlpacaOrderExecutor,
} from '../lib/engine/order-router';
import { TradingAgentOrchestrator } from '../lib/agents/trading-orchestrator';
import { PROTOCOL_PRESETS, DEFAULT_PROTOCOL_PROFILE } from '../lib/agents/protocols/presets';
import { TradingAgentProtocolProfile } from '../lib/agents/protocols/types';
import { ForexFactoryClient } from '../lib/news/forex-factory-client';
import { MacroSentimentState } from '../lib/types/news';
import { Candle } from '../lib/types/trading';

// 1. Laden von .env.local / .env ohne externe Bibliotheken
function loadEnvFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvFile(path.resolve(process.cwd(), '.env.local'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

// 2. CLI-Argumente parsen
const args = process.argv.slice(2);
const getArg = (name: string, fallback: string): string => {
  const prefix = `--${name}=`;
  const match = args.find((a) => a.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
};
const hasFlag = (name: string): boolean => args.includes(`--${name}`);

const symbol = getArg('symbol', 'BTC/USDT');
const exchangeId = getArg('exchange', 'binance').toLowerCase();
const profileName = getArg('profile', 'CAPITAL_SHIELD').toUpperCase();
const intervalSec = Math.max(5, parseInt(getArg('interval', '15'), 10));
const isDryRun = hasFlag('dry-run');
const isLive = process.env.TRADING_MODE === 'LIVE' && !isDryRun && !hasFlag('testnet');

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║       MONETARIUM — 24/7 AUTONOMER TRADING-DAEMON             ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log(`[Config] Symbol:      ${symbol}`);
console.log(`[Config] Exchange:    ${exchangeId.toUpperCase()}`);
console.log(`[Config] Profil:      ${profileName}`);
console.log(`[Config] Intervall:   ${intervalSec}s`);
console.log(`[Config] Modus:       ${isDryRun ? 'DRY-RUN (Virtuell / Zero-Risk)' : isLive ? '⚠️ LIVE-TRADING (Echtgeld)' : 'TESTNET / SANDBOX'}`);

// 3. Protokoll-Profil auswählen
const profile: TradingAgentProtocolProfile =
  PROTOCOL_PRESETS[profileName] || DEFAULT_PROTOCOL_PROFILE;

// 4. Portfolio & Order-Executor konfigurieren
const portfolioManager = new PortfolioManager(10000);
const virtualExchange = new VirtualExchange(portfolioManager);

let executor: IOrderExecutor;
if (isDryRun) {
  executor = new VirtualOrderExecutor(virtualExchange);
} else if (exchangeId === 'alpaca') {
  executor = new AlpacaOrderExecutor(!isLive);
} else {
  executor = new CCXTOrderExecutor(exchangeId, !isLive);
}

console.log(`[Executor] Aktiver Router: ${executor.name}`);

// 5. Orchestrator instanziieren
const orchestrator = new TradingAgentOrchestrator(executor, profile);
const forexClient = new ForexFactoryClient();
const ccxt = new CCXTConnector();
const alpaca = new AlpacaConnector({ isPaper: !isLive });

let isRunning = true;
let cycleCounter = 0;

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('\n[Daemon] Beende 24/7 Trading-Daemon ordnungsgemäß...');
  isRunning = false;
  printSummary();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Daemon] SIGTERM empfangen, beende Prozess...');
  isRunning = false;
  process.exit(0);
});

function printSummary() {
  const pf = portfolioManager.getPortfolio();
  const openPositionsCount = Object.keys(pf.positions).length;
  console.log('\n────────────────────────────────────────────────────────────');
  console.log('  SESSION-ZUSAMMENFASSUNG:');
  console.log(`  Durchläufe:       ${cycleCounter}`);
  console.log(`  Offene Trades:    ${openPositionsCount}`);
  console.log(`  Gefüllte Trades:  ${pf.tradeHistory.length}`);
  console.log(`  Gesamtwert:       ${pf.equity.toFixed(2)} USD`);
  console.log('────────────────────────────────────────────────────────────\n');
}

// 6. Hauptschleife
async function runLoop() {
  while (isRunning) {
    cycleCounter++;
    const cycleTime = new Date().toLocaleTimeString('de-DE');

    try {
      // A. Marktdaten abrufen
      let currentPrice = 65000;
      let candles: Candle[] = [];

      if (exchangeId === 'alpaca') {
        const cleanSym = symbol.replace('/', '');
        candles = await alpaca.getStockBars(cleanSym, '1Hour', 50);
        if (candles.length > 0) {
          currentPrice = candles[candles.length - 1].close;
        }
      } else {
        candles = await ccxt.fetchOHLCV(exchangeId, symbol, '1h', 50);
        if (candles.length > 0) {
          currentPrice = candles[candles.length - 1].close;
        } else {
          const ticker = await ccxt.fetchTicker(exchangeId, symbol);
          currentPrice = ticker.lastPrice;
        }
      }

      // B. Makro-Wirtschaftskalender & News-Blackout prüfen
      let macroState: MacroSentimentState | null = null;
      try {
        const cal = await forexClient.fetchCalendar({ minImpact: 'High' });
        macroState = forexClient.convertToMacroSentimentState(cal);
      } catch (err: any) {
        // Fallback: Kalender war nicht erreichbar, fahre fort
      }

      // C. Atomaren NEXUS-Trading-Zyklus ausführen
      const portfolio = portfolioManager.getPortfolio();
      const record = await orchestrator.executeCycleAsync(
        symbol,
        currentPrice,
        candles,
        portfolio,
        macroState
      );

      // D. Strukturierte Ausgabe
      const actionBadge =
        record.hypothesis.action === 'BUY'
          ? '\x1b[32m[BUY]\x1b[0m'
          : record.hypothesis.action === 'SELL'
          ? '\x1b[31m[SELL]\x1b[0m'
          : '\x1b[90m[HOLD]\x1b[0m';

      const riskBadge = record.riskProof.passed
        ? '\x1b[32mPASSED\x1b[0m'
        : `\x1b[31mVETO (${record.riskProof.vetoReason || 'Risiko-Invariante verletzt'})\x1b[0m`;

      const execBadge =
        record.execution.status === 'EXECUTED'
          ? `\x1b[32mEXECUTED @ ${record.execution.executedPrice} USD\x1b[0m`
          : record.execution.status === 'REJECTED'
          ? `\x1b[31mREJECTED (${record.execution.notes})\x1b[0m`
          : `\x1b[90m${record.execution.status}\x1b[0m`;

      console.log(
        `[#${cycleCounter} | ${cycleTime}] ${symbol} @ ${currentPrice.toFixed(2)} | ` +
        `Regime: ${record.perception.regime} | Signal: ${actionBadge} ${record.hypothesis.strategyUsed} | ` +
        `Risk: ${riskBadge} | Exec: ${execBadge}`
      );

      // Falls Order ausgeführt wurde und wir im VirtualExchange-Modus sind
      if (record.execution.status === 'EXECUTED' && executor.isSimulation) {
        const pf = portfolioManager.getPortfolio();
        console.log(`   └─ Portfolio-Stand: ${pf.equity.toFixed(2)} USD (Cash: ${pf.cash.toFixed(2)} USD)`);
      }

    } catch (cycleErr: any) {
      console.error(`[Zyklus-Fehler #${cycleCounter}]:`, cycleErr?.message || cycleErr);
    }

    // Warten bis zum nächsten Takt
    await new Promise((res) => setTimeout(res, intervalSec * 1000));
  }
}

// Starten
runLoop().catch((err) => {
  console.error('[Fatal Error]:', err);
  process.exit(1);
});
