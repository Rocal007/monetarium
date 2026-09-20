import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Server-Side CCXT Proxy:
 * Hält die schwere CCXT-Bibliothek 100% serverseitig und isoliert sensible API-Keys vor dem Client.
 */

// 1. GET: Öffentliche Marktdaten (Ticker, OHLCV-Kerzen)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const exchangeId = searchParams.get('exchange') || 'binance';
  const symbol = searchParams.get('symbol') || 'BTC/USDT';
  const type = searchParams.get('type') || 'ticker';

  try {
    const ccxt: any = await import('ccxt');
    if (!ccxt[exchangeId]) {
      return NextResponse.json(
        { success: false, error: `Börse ${exchangeId} wird nicht von CCXT unterstützt` },
        { status: 400 }
      );
    }

    const ExchangeClass = ccxt[exchangeId];
    const instance = new ExchangeClass({ enableRateLimit: true });

    if (type === 'ticker') {
      const ticker = await instance.fetchTicker(symbol);
      return NextResponse.json({
        success: true,
        exchange: exchangeId,
        symbol,
        data: {
          lastPrice: ticker.last ?? 0,
          bid: ticker.bid ?? ticker.last ?? 0,
          ask: ticker.ask ?? ticker.last ?? 0,
          high24h: ticker.high ?? ticker.last ?? 0,
          low24h: ticker.low ?? ticker.last ?? 0,
          volume24h: ticker.baseVolume ?? 0,
          change24h: ticker.percentage ?? 0,
        },
      });
    }

    if (type === 'ohlcv') {
      const timeframe = searchParams.get('timeframe') || '1h';
      const limit = parseInt(searchParams.get('limit') || '100', 10);
      const ohlcv = await instance.fetchOHLCV(symbol, timeframe, undefined, limit);
      const candles = ohlcv.map((bar: any[]) => ({
        timestamp: bar[0],
        open: bar[1],
        high: bar[2],
        low: bar[3],
        close: bar[4],
        volume: bar[5],
        symbol,
      }));
      return NextResponse.json({ success: true, exchange: exchangeId, symbol, candles });
    }

    return NextResponse.json({ success: false, error: 'Unbekannter Typ' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'CCXT Server Error' },
      { status: 500 }
    );
  }
}

// 2. POST: Reale & Testnet Order-Ausführung an Krypto-Börsen
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      exchangeId = 'binance',
      symbol = 'BTC/USDT',
      type = 'market',
      side = 'buy',
      amount,
      price,
      credentials,
    } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Ungültige Positionsgröße (amount muss > 0 sein)' },
        { status: 400 }
      );
    }

    const ccxt: any = await import('ccxt');
    if (!ccxt[exchangeId]) {
      return NextResponse.json(
        { success: false, error: `Börse ${exchangeId} wird nicht unterstützt` },
        { status: 400 }
      );
    }

    // Credentials hierarchisch auflösen: Request-Payload > Server-Env-Vars
    const envPrefix = exchangeId.toUpperCase();
    const apiKey = credentials?.apiKey || process.env[`${envPrefix}_API_KEY`] || process.env.CCXT_API_KEY;
    const secret = credentials?.secret || process.env[`${envPrefix}_API_SECRET`] || process.env.CCXT_API_SECRET;
    const password = credentials?.password || process.env[`${envPrefix}_PASSWORD`];
    
    // Standardmäßig Sandbox/Testnet, außer explizit LIVE gefordert
    const isSandbox =
      credentials?.sandbox !== undefined
        ? Boolean(credentials.sandbox)
        : process.env.TRADING_MODE !== 'LIVE';

    if (!apiKey || !secret) {
      return NextResponse.json(
        {
          success: false,
          error: `Keine API-Credentials für ${exchangeId} gefunden. Bitte ${envPrefix}_API_KEY und ${envPrefix}_API_SECRET in .env.local konfigurieren.`,
          requiresConfiguration: true,
        },
        { status: 401 }
      );
    }

    const ExchangeClass = ccxt[exchangeId];
    const instance = new ExchangeClass({
      apiKey,
      secret,
      password,
      enableRateLimit: true,
      options: {
        defaultType: 'spot',
      },
    });

    if (isSandbox && typeof instance.setSandboxMode === 'function') {
      instance.setSandboxMode(true);
    }

    const cleanSide = String(side).toLowerCase();
    const cleanType = String(type).toLowerCase();

    // Order an Börse übermitteln
    const order = await instance.createOrder(
      symbol,
      cleanType,
      cleanSide,
      amount,
      cleanType === 'limit' ? price : undefined
    );

    return NextResponse.json({
      success: true,
      orderId: order.id,
      symbol: order.symbol || symbol,
      side: order.side || cleanSide,
      type: order.type || cleanType,
      amount: order.amount || amount,
      price: order.price || order.average || price,
      status: order.status || 'submitted',
      isSandbox,
      timestamp: order.timestamp || Date.now(),
      raw: order,
    });
  } catch (err: any) {
    console.error('[CCXT POST Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Fehler bei der Börsen-Orderausführung',
        errorType: err?.name || 'ExchangeError',
      },
      { status: 500 }
    );
  }
}
