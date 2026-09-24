import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { Portfolio, Position, TradeLog } from '../types/trading';
import { OrchestratorCycleRecord } from '../agents/protocols/types';

export interface SQLiteStoreConfig {
  dbPath?: string;
  inMemory?: boolean;
}

export class SQLiteStateStore {
  private db: DatabaseSync;
  private dbPath: string;

  constructor(config: SQLiteStoreConfig = {}) {
    if (config.inMemory) {
      this.dbPath = ':memory:';
      this.db = new DatabaseSync(':memory:');
    } else {
      const isVercel = Boolean(process.env.VERCEL);
      const defaultPath = isVercel
        ? path.resolve('/tmp', 'monetarium.db')
        : path.resolve(process.cwd(), 'data', 'monetarium.db');
      this.dbPath = config.dbPath ? path.resolve(config.dbPath) : defaultPath;

      try {
        const dir = path.dirname(this.dbPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        this.db = new DatabaseSync(this.dbPath);
      } catch (fsErr: any) {
        console.warn(`[SQLite] Dateisystem nicht beschreibbar (${fsErr?.message}). Fallback auf In-Memory.`);
        this.dbPath = ':memory:';
        this.db = new DatabaseSync(':memory:');
      }
    }

    this.initSchema();
  }

  public getDbPath(): string {
    return this.dbPath;
  }

  private initSchema(): void {
    // 1. Pragmas für Robustheit & Performance
    this.db.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA synchronous = NORMAL;
    `);

    // 2. Portfolio-Stammdaten (Snapshot)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS portfolio_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        cash REAL NOT NULL,
        initial_balance REAL NOT NULL,
        equity REAL NOT NULL,
        realized_pnl REAL NOT NULL,
        unrealized_pnl REAL NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // 3. Offene Positionen
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS positions (
        symbol TEXT PRIMARY KEY,
        id TEXT NOT NULL,
        side TEXT NOT NULL,
        entry_price REAL NOT NULL,
        current_price REAL NOT NULL,
        amount REAL NOT NULL,
        unrealized_pnl REAL NOT NULL,
        unrealized_pnl_percent REAL NOT NULL,
        realized_pnl REAL NOT NULL,
        stop_loss REAL,
        take_profit REAL,
        timestamp INTEGER NOT NULL
      );
    `);

    // 4. Lückenlose Trade-Historie
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS trades (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        symbol TEXT NOT NULL,
        side TEXT NOT NULL,
        price REAL NOT NULL,
        amount REAL NOT NULL,
        fee REAL NOT NULL,
        pnl REAL,
        timestamp INTEGER NOT NULL
      );
    `);

    // 5. Orchestrator Audit Trail (NEXUS T-Zyklen)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_cycles (
        id TEXT PRIMARY KEY,
        cycle_index INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        symbol TEXT NOT NULL,
        price REAL NOT NULL,
        profile_id TEXT NOT NULL,
        regime TEXT,
        strategy TEXT,
        action TEXT,
        risk_passed INTEGER NOT NULL,
        execution_status TEXT,
        raw_json TEXT NOT NULL
      );
    `);
  }

  /**
   * Speichert den aktuellen Zustand des Portfolios atomar
   */
  public savePortfolio(portfolio: Portfolio): void {
    const now = Date.now();

    // 1. Snapshot speichern
    const upsertPortfolio = this.db.prepare(`
      INSERT INTO portfolio_state (id, cash, initial_balance, equity, realized_pnl, unrealized_pnl, updated_at)
      VALUES (1, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        cash = excluded.cash,
        initial_balance = excluded.initial_balance,
        equity = excluded.equity,
        realized_pnl = excluded.realized_pnl,
        unrealized_pnl = excluded.unrealized_pnl,
        updated_at = excluded.updated_at;
    `);

    upsertPortfolio.run(
      portfolio.cash,
      portfolio.initialBalance,
      portfolio.equity,
      portfolio.realizedPnL,
      portfolio.unrealizedPnL,
      now
    );

    // 2. Offene Positionen synchronisieren (aktuelle durch neue ersetzen)
    this.db.exec('DELETE FROM positions;');

    const insertPosition = this.db.prepare(`
      INSERT INTO positions (
        symbol, id, side, entry_price, current_price, amount,
        unrealized_pnl, unrealized_pnl_percent, realized_pnl,
        stop_loss, take_profit, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    for (const [symbol, pos] of Object.entries(portfolio.positions)) {
      insertPosition.run(
        symbol,
        pos.id,
        pos.side,
        pos.entryPrice,
        pos.currentPrice,
        pos.amount,
        pos.unrealizedPnL,
        pos.unrealizedPnLPercent,
        pos.realizedPnL,
        pos.stopLoss ?? null,
        pos.takeProfit ?? null,
        pos.timestamp
      );
    }

    // 3. Trade-Historie anfügen (idempotent via INSERT OR IGNORE)
    const insertTrade = this.db.prepare(`
      INSERT OR IGNORE INTO trades (id, order_id, symbol, side, price, amount, fee, pnl, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    for (const trade of portfolio.tradeHistory) {
      insertTrade.run(
        trade.id,
        trade.orderId,
        trade.symbol,
        trade.side,
        trade.price,
        trade.amount,
        trade.fee,
        trade.pnl ?? null,
        trade.timestamp
      );
    }
  }

  /**
   * Lädt den persistierten Portfoliozustand aus der Datenbank
   */
  public loadPortfolio(): Portfolio | null {
    const stateQuery = this.db.prepare('SELECT * FROM portfolio_state WHERE id = 1 LIMIT 1;');
    const stateRow = stateQuery.get() as any;

    if (!stateRow) {
      return null;
    }

    // Positionen laden
    const posQuery = this.db.prepare('SELECT * FROM positions ORDER BY timestamp ASC;');
    const posRows = posQuery.all() as any[];
    const positions: Record<string, Position> = {};

    for (const row of posRows) {
      positions[row.symbol] = {
        id: row.id,
        symbol: row.symbol,
        side: row.side,
        entryPrice: Number(row.entry_price),
        currentPrice: Number(row.current_price),
        amount: Number(row.amount),
        unrealizedPnL: Number(row.unrealized_pnl),
        unrealizedPnLPercent: Number(row.unrealized_pnl_percent),
        realizedPnL: Number(row.realized_pnl),
        stopLoss: row.stop_loss !== null ? Number(row.stop_loss) : undefined,
        takeProfit: row.take_profit !== null ? Number(row.take_profit) : undefined,
        timestamp: Number(row.timestamp),
      };
    }

    // Trade-Historie laden
    const tradeQuery = this.db.prepare('SELECT * FROM trades ORDER BY timestamp ASC;');
    const tradeRows = tradeQuery.all() as any[];
    const tradeHistory: TradeLog[] = tradeRows.map((r: any) => ({
      id: r.id,
      orderId: r.order_id,
      symbol: r.symbol,
      side: r.side,
      price: Number(r.price),
      amount: Number(r.amount),
      fee: Number(r.fee),
      pnl: r.pnl !== null ? Number(r.pnl) : undefined,
      timestamp: Number(r.timestamp),
    }));

    return {
      cash: Number(stateRow.cash),
      initialBalance: Number(stateRow.initial_balance),
      equity: Number(stateRow.equity),
      realizedPnL: Number(stateRow.realized_pnl),
      unrealizedPnL: Number(stateRow.unrealized_pnl),
      positions,
      tradeHistory,
    };
  }

  /**
   * Erfasst einen einzelnen ausgeführten Trade
   */
  public recordTrade(trade: TradeLog): void {
    const insert = this.db.prepare(`
      INSERT OR REPLACE INTO trades (id, order_id, symbol, side, price, amount, fee, pnl, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);
    insert.run(
      trade.id,
      trade.orderId,
      trade.symbol,
      trade.side,
      trade.price,
      trade.amount,
      trade.fee,
      trade.pnl ?? null,
      trade.timestamp
    );
  }

  /**
   * Protokolliert einen vollständigen Orchestrator-Audit-Zyklus
   */
  public recordCycle(record: OrchestratorCycleRecord): void {
    const insert = this.db.prepare(`
      INSERT OR REPLACE INTO audit_cycles (
        id, cycle_index, timestamp, symbol, price, profile_id,
        regime, strategy, action, risk_passed, execution_status, raw_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    insert.run(
      record.id,
      record.cycleIndex,
      record.timestamp,
      record.symbol,
      record.price,
      record.profileId,
      record.perception.regime,
      record.hypothesis.strategyUsed,
      record.hypothesis.action,
      record.riskProof.passed ? 1 : 0,
      record.execution.status,
      JSON.stringify(record)
    );
  }

  /**
   * Liefert die letzten ausgeführten Trades
   */
  public getTradeHistory(limit: number = 50): TradeLog[] {
    const query = this.db.prepare('SELECT * FROM trades ORDER BY timestamp DESC LIMIT ?;');
    const rows = query.all(limit) as any[];
    return rows.map((r: any) => ({
      id: r.id,
      orderId: r.order_id,
      symbol: r.symbol,
      side: r.side,
      price: Number(r.price),
      amount: Number(r.amount),
      fee: Number(r.fee),
      pnl: r.pnl !== null ? Number(r.pnl) : undefined,
      timestamp: Number(r.timestamp),
    })).reverse();
  }

  /**
   * Liefert die letzten Audit-Zyklen
   */
  public getRecentCycles(limit: number = 50): OrchestratorCycleRecord[] {
    const query = this.db.prepare('SELECT raw_json FROM audit_cycles ORDER BY timestamp DESC LIMIT ?;');
    const rows = query.all(limit) as any[];
    return rows.map((r: any) => JSON.parse(r.raw_json)).reverse();
  }

  /**
   * Setzt den Portfolio-Zustand auf Startkapital zurück
   */
  public resetState(initialCapital: number = 10000): void {
    this.db.exec(`
      DELETE FROM portfolio_state;
      DELETE FROM positions;
      DELETE FROM trades;
      DELETE FROM audit_cycles;
    `);

    const now = Date.now();
    const insert = this.db.prepare(`
      INSERT INTO portfolio_state (id, cash, initial_balance, equity, realized_pnl, unrealized_pnl, updated_at)
      VALUES (1, ?, ?, ?, 0, 0, ?);
    `);
    insert.run(initialCapital, initialCapital, initialCapital, now);
  }

  /**
   * Schließt die Datenbankverbindung ordnungsgemäß
   */
  public close(): void {
    try {
      this.db.close();
      if (sharedStoreInstance === this) {
        sharedStoreInstance = null;
      }
    } catch {
      // Bereits geschlossen
    }
  }
}

let sharedStoreInstance: SQLiteStateStore | null = null;

/**
 * Liefert eine wiederverwendbare geteilte Instanz des SQLiteStateStore für API-Routen,
 * um redundante Tabellenprüfungen und Disk-Lock-Konflikte zu vermeiden.
 */
export function getSharedSQLiteStore(config?: SQLiteStoreConfig): SQLiteStateStore {
  if (!sharedStoreInstance) {
    sharedStoreInstance = new SQLiteStateStore(config);
  }
  return sharedStoreInstance;
}

