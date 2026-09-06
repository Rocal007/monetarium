import { Candle } from '../types/trading';

export interface CryptoTicker {
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

/**
 * Ruft Live-Kerzen von der öffentlichen Binance REST API ab.
 * Funktioniert 100% ohne API-Key und browser-isomorph.
 * Falls die API nicht erreichbar ist (CORS oder Offline), wird auf einen stabilen Fallback zurückgegriffen.
 */
export async function fetchLiveCryptoCandles(
  symbol: string = 'BTCUSDT',
  interval: string = '1h',
  limit: number = 100
): Promise<Candle[]> {
  try {
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      throw new Error(`Binance API Error: ${res.statusText}`);
    }

    const rawData = await res.json();
    if (!Array.isArray(rawData)) {
      throw new Error('Ungültiges Datenformat von Binance');
    }

    return rawData.map((item: (string | number)[]) => ({
      timestamp: Number(item[0]),
      open: Number(parseFloat(String(item[1])).toFixed(2)),
      high: Number(parseFloat(String(item[2])).toFixed(2)),
      low: Number(parseFloat(String(item[3])).toFixed(2)),
      close: Number(parseFloat(String(item[4])).toFixed(2)),
      volume: Number(parseFloat(String(item[5])).toFixed(2)),
    }));
  } catch (err) {
    console.warn(`Fallback auf synthetische Daten für ${symbol}:`, err);
    return [];
  }
}

/**
 * Ruft 24h Ticker-Statistiken ab.
 */
export async function fetchCryptoTicker(symbol: string = 'BTCUSDT'): Promise<CryptoTicker | null> {
  try {
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol.toUpperCase()}`;
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) return null;

    const data = await res.json();
    return {
      symbol: data.symbol,
      price: parseFloat(data.lastPrice),
      change24h: parseFloat(data.priceChangePercent),
      high24h: parseFloat(data.highPrice),
      low24h: parseFloat(data.lowPrice),
      volume24h: parseFloat(data.volume),
    };
  } catch {
    return null;
  }
}

/**
 * Parser für TradingView Webhook Alerts.
 * Verarbeitet eingehende JSON-Signale aus Pine-Script.
 */
export interface TradingViewWebhookPayload {
  passphrase?: string;
  action: 'BUY' | 'SELL' | 'CLOSE';
  symbol: string;
  price?: number;
  amount?: number;
  orderType?: 'MARKET' | 'LIMIT';
  stopLoss?: number;
  takeProfit?: number;
  message?: string;
}

export function parseTradingViewAlert(rawBody: string | Record<string, unknown>): TradingViewWebhookPayload | null {
  try {
    const payload = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
    if (!payload.action || !payload.symbol) {
      return null;
    }
    return {
      passphrase: payload.passphrase,
      action: payload.action.toUpperCase() as 'BUY' | 'SELL' | 'CLOSE',
      symbol: String(payload.symbol).toUpperCase(),
      price: payload.price ? Number(payload.price) : undefined,
      amount: payload.amount ? Number(payload.amount) : undefined,
      orderType: payload.orderType ? payload.orderType.toUpperCase() : 'MARKET',
      stopLoss: payload.stopLoss ? Number(payload.stopLoss) : undefined,
      takeProfit: payload.takeProfit ? Number(payload.takeProfit) : undefined,
      message: payload.message ? String(payload.message) : undefined,
    };
  } catch {
    return null;
  }
}
