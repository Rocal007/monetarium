import { NextRequest, NextResponse } from 'next/server';
import { getSharedSQLiteStore } from '@/lib/storage/sqlite-state-store';

export const dynamic = 'force-dynamic';

/**
 * Serverseitige Portfolio-Persistenz-API (REST):
 * Ermöglicht dem Web-Terminal und Webhooks den Zugriff auf die lokale SQLite-Datenbank.
 */
export async function GET(req: NextRequest) {
  try {
    const store = getSharedSQLiteStore();
    const portfolio = store.loadPortfolio();
    const recentTrades = store.getTradeHistory(20);
    const recentCycles = store.getRecentCycles(10);

    return NextResponse.json({
      success: true,
      hasPersistedState: portfolio !== null,
      portfolio: portfolio || {
        cash: 10000,
        initialBalance: 10000,
        equity: 10000,
        realizedPnL: 0,
        unrealizedPnL: 0,
        positions: {},
        tradeHistory: [],
      },
      recentTrades,
      recentCycles,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Fehler beim Laden des Portfolio-Zustands' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const store = getSharedSQLiteStore();

    if (body.reset) {
      const initialCapital = Number(body.initialCapital) || 10000;
      store.resetState(initialCapital);
      return NextResponse.json({
        success: true,
        message: `Portfolio-Zustand auf ${initialCapital} € zurückgesetzt.`,
      });
    }

    if (body.portfolio) {
      store.savePortfolio(body.portfolio);
      return NextResponse.json({
        success: true,
        message: 'Portfolio-Zustand erfolgreich in SQLite gespeichert.',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Keine gültigen Portfolio-Daten übergeben' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Fehler beim Speichern des Portfolio-Zustands' },
      { status: 500 }
    );
  }
}
