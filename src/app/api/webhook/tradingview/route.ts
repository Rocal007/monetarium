import { NextRequest, NextResponse } from 'next/server';
import { calculateSlippage } from '../../../../lib/engine/slippage-model';
import { calculateTradeFee } from '../../../../lib/engine/fee-structure';
import { parseTradingViewAlert } from '../../../../lib/data/crypto-feed';

// In-Memory Speicher für Webhook-Historie
const webhookHistory: Array<{
  id: string;
  timestamp: number;
  payload: any;
  status: 'EXECUTED' | 'REJECTED';
  fillPrice?: number;
  slippage?: number;
  fee?: number;
  error?: string;
}> = [];

/**
 * POST /api/webhook/tradingview
 * Empfängt Pine-Script Alerts aus TradingView und führt sie mit
 * realistischer Slippage- und Gebührensimulation aus.
 */
export async function POST(req: NextRequest) {
  try {
    const rawText = await req.text();
    let body: any;
    try {
      body = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Ungültiges JSON im Webhook-Body' },
        { status: 400 }
      );
    }

    const alert = parseTradingViewAlert(body);
    if (!alert) {
      return NextResponse.json(
        { success: false, error: 'Fehlende Pflichtfelder: "action" und "symbol" erforderlich' },
        { status: 422 }
      );
    }

    // Optionaler Passphrase-Check
    const expectedPassphrase = process.env.TRADINGVIEW_PASSPHRASE;
    if (expectedPassphrase && alert.passphrase !== expectedPassphrase) {
      return NextResponse.json(
        { success: false, error: 'Ungültige Passphrase / Nicht autorisiert' },
        { status: 401 }
      );
    }

    // Preis- und Slippage-Simulation
    const currentPrice = alert.price ?? 64500;
    const amount = alert.amount ?? 0.05;
    const side = alert.action === 'BUY' ? 'BUY' : 'SELL';

    const { executionPrice, slippageAmount } = calculateSlippage(
      currentPrice,
      side,
      amount,
      0.015
    );

    const fee = calculateTradeFee(amount, executionPrice, true);

    const executionLog = {
      id: `wh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: Date.now(),
      payload: alert,
      status: 'EXECUTED' as const,
      fillPrice: executionPrice,
      slippage: slippageAmount,
      fee,
    };

    webhookHistory.unshift(executionLog);
    if (webhookHistory.length > 50) webhookHistory.pop();

    return NextResponse.json({
      success: true,
      message: `TradingView ${alert.action}-Order für ${alert.symbol} erfolgreich simuliert`,
      execution: {
        orderId: executionLog.id,
        symbol: alert.symbol,
        action: alert.action,
        requestedPrice: currentPrice,
        executionPrice,
        slippage: slippageAmount,
        fee,
        amount,
        stopLoss: alert.stopLoss,
        takeProfit: alert.takeProfit,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Interner Server-Fehler beim Verarbeiten des Webhooks' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhook/tradingview
 * Liefert Dokumentation, den Status des Webhook-Receivers und die letzten 20 empfangenen Signale.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ACTIVE',
    service: 'Monetarium TradingView Webhook Engine',
    endpoint: '/api/webhook/tradingview',
    instructions: {
      tradingViewAlertSetup: {
        webhookUrl: 'https://deine-domain.de/api/webhook/tradingview (oder ngrok/localhost)',
        messageTemplate: JSON.stringify(
          {
            action: '{{strategy.order.action}}',
            symbol: '{{ticker}}',
            price: '{{close}}',
            amount: 0.1,
            passphrase: 'optional-geheim-token',
            stopLoss: 62000,
            takeProfit: 68000,
          },
          null,
          2
        ),
      },
    },
    recentWebhooks: webhookHistory.slice(0, 20),
  });
}
