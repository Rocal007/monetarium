import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/engines/ccxt?exchange=binance&symbol=BTC/USDT&type=ticker
 * Server-Side CCXT Proxy: Hält die schwere CCXT-Bibliothek 100% serverseitig
 * und liefert saubere JSON-Daten an den Client, ohne den Browser-Bundle zu belasten.
 */
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
