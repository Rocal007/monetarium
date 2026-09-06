import { Candle, OrderSide } from '../types/trading';

export interface AlpacaConfig {
  apiKey?: string;
  apiSecret?: string;
  isPaper?: boolean;
}

export interface AlpacaClock {
  timestamp: string;
  isOpen: boolean;
  nextOpen: string;
  nextClose: string;
}

export interface AlpacaAccount {
  id: string;
  status: string;
  currency: string;
  cash: number;
  portfolioValue: number;
  buyingPower: number;
  equity: number;
}

export interface AlpacaOrderResult {
  id: string;
  clientOrderId: string;
  symbol: string;
  qty: number;
  side: string;
  type: string;
  status: string;
  submittedAt: string;
}

/**
 * Alpaca Markets TradFi & Equities Adapter
 * Ermöglicht risikofreies Paper-Trading von US-Aktien (SPY, AAPL, MSFT, NVDA, TSLA).
 * Vollständig isomorph via Standard fetch.
 */
export class AlpacaConnector {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string;
  private dataUrl: string;
  private isMock: boolean;

  constructor(config: AlpacaConfig = {}) {
    this.apiKey = config.apiKey || process.env.ALPACA_API_KEY || '';
    this.apiSecret = config.apiSecret || process.env.ALPACA_API_SECRET || '';
    const isPaper = config.isPaper ?? true;
    this.baseUrl = isPaper
      ? 'https://paper-api.alpaca.markets'
      : 'https://api.alpaca.markets';
    this.dataUrl = 'https://data.alpaca.markets/v2';
    this.isMock = !this.apiKey || !this.apiSecret;
  }

  private getHeaders(): Record<string, string> {
    return {
      'APCA-API-KEY-ID': this.apiKey,
      'APCA-API-SECRET-KEY': this.apiSecret,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Prüft den Status der US-Börsen (NYSE/NASDAQ)
   */
  public async getClock(): Promise<AlpacaClock> {
    if (this.isMock) {
      const now = new Date();
      const hourUtc = now.getUTCHours();
      // US Börsenzeiten: 13:30 - 20:00 UTC (Mo-Fr)
      const day = now.getUTCDay();
      const isWeekday = day >= 1 && day <= 5;
      const isOpen = isWeekday && hourUtc >= 13 && hourUtc < 20;

      return {
        timestamp: now.toISOString(),
        isOpen,
        nextOpen: new Date(now.setHours(13, 30, 0, 0)).toISOString(),
        nextClose: new Date(now.setHours(20, 0, 0, 0)).toISOString(),
      };
    }

    try {
      const res = await fetch(`${this.baseUrl}/v2/clock`, {
        headers: this.getHeaders(),
      });
      if (!res.ok) throw new Error(`Alpaca Clock Error: ${res.statusText}`);
      const data = await res.json();
      return {
        timestamp: data.timestamp,
        isOpen: data.is_open,
        nextOpen: data.next_open,
        nextClose: data.next_close,
      };
    } catch {
      return this.getClock(); // Fallback auf Mock
    }
  }

  /**
   * Ruft Account-Metriken ab (Cash, Buying Power, Portfolio Value)
   */
  public async getAccount(): Promise<AlpacaAccount> {
    if (this.isMock) {
      return {
        id: 'alpaca-paper-demo',
        status: 'ACTIVE_PAPER_SIMULATION',
        currency: 'USD',
        cash: 100000.0,
        portfolioValue: 100000.0,
        buyingPower: 200000.0, // 2x Margin bei Alpaca Paper
        equity: 100000.0,
      };
    }

    const res = await fetch(`${this.baseUrl}/v2/account`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error(`Alpaca Account Error: ${res.statusText}`);
    const data = await res.json();
    return {
      id: data.id,
      status: data.status,
      currency: data.currency,
      cash: parseFloat(data.cash),
      portfolioValue: parseFloat(data.portfolio_value),
      buyingPower: parseFloat(data.buying_power),
      equity: parseFloat(data.equity),
    };
  }

  /**
   * Sendet eine Order an Alpaca Paper Trading
   */
  public async submitOrder(params: {
    symbol: string;
    qty: number;
    side: OrderSide;
    type?: 'market' | 'limit';
    limitPrice?: number;
    timeInForce?: 'day' | 'gtc';
  }): Promise<AlpacaOrderResult> {
    const symbol = params.symbol.toUpperCase().replace('/USDT', '').replace('USDT', '');

    if (this.isMock) {
      return {
        id: `alpaca-mock-${Date.now()}`,
        clientOrderId: `client-${Date.now()}`,
        symbol,
        qty: params.qty,
        side: params.side.toLowerCase(),
        type: params.type || 'market',
        status: 'accepted',
        submittedAt: new Date().toISOString(),
      };
    }

    const body: any = {
      symbol,
      qty: params.qty,
      side: params.side.toLowerCase(),
      type: params.type || 'market',
      time_in_force: params.timeInForce || 'day',
    };

    if (params.type === 'limit' && params.limitPrice) {
      body.limit_price = params.limitPrice;
    }

    const res = await fetch(`${this.baseUrl}/v2/orders`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(`Alpaca Order Error: ${err.message || res.statusText}`);
    }

    const data = await res.json();
    return {
      id: data.id,
      clientOrderId: data.client_order_id,
      symbol: data.symbol,
      qty: parseFloat(data.qty),
      side: data.side,
      type: data.type,
      status: data.status,
      submittedAt: data.submitted_at,
    };
  }

  /**
   * Lädt historische Bars für Aktien/ETFs
   */
  public async getStockBars(
    symbol: string = 'SPY',
    timeframe: string = '1Hour',
    limit: number = 100
  ): Promise<Candle[]> {
    const cleanSym = symbol.toUpperCase().replace('/USDT', '');
    if (this.isMock) {
      // Synthetische Aktien-Kerzen mit realistischer Range
      const candles: Candle[] = [];
      let p = cleanSym === 'AAPL' ? 220 : cleanSym === 'NVDA' ? 125 : 545; // SPY
      let time = Date.now() - limit * 3600 * 1000;

      for (let i = 0; i < limit; i++) {
        const delta = (Math.random() - 0.49) * (p * 0.008);
        const open = p;
        const close = open + delta;
        const high = Math.max(open, close) + Math.random() * (p * 0.003);
        const low = Math.min(open, close) - Math.random() * (p * 0.003);

        candles.push({
          timestamp: time,
          open: Number(open.toFixed(2)),
          high: Number(high.toFixed(2)),
          low: Number(low.toFixed(2)),
          close: Number(close.toFixed(2)),
          volume: Math.floor(50000 + Math.random() * 200000),
          symbol: cleanSym,
        });

        p = close;
        time += 3600 * 1000;
      }
      return candles;
    }

    try {
      const url = `${this.dataUrl}/stocks/${cleanSym}/bars?timeframe=${timeframe}&limit=${limit}`;
      const res = await fetch(url, { headers: this.getHeaders() });
      if (!res.ok) throw new Error(`Alpaca Data Error: ${res.statusText}`);

      const data = await res.json();
      const bars = data.bars || [];
      return bars.map((b: any) => ({
        timestamp: new Date(b.t).getTime(),
        open: b.o,
        high: b.h,
        low: b.l,
        close: b.c,
        volume: b.v,
        symbol: cleanSym,
      }));
    } catch {
      return this.getStockBars(symbol, timeframe, limit);
    }
  }
}
